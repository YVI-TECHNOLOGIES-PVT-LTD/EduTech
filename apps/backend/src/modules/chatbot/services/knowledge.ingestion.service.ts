import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import { GoogleGenAI } from '@google/genai';
const { PDFParse } = require('pdf-parse');

export interface DocumentChunkItem {
  chunkIndex: number;
  content: string;
  embedding: number[];
  metadata: {
    document_name: string;
    page_number: number;
    section_number: number | null;
    section_heading: string;
    char_length: number;
  };
}

export interface IngestionResult {
  success: boolean;
  documentName: string;
  orgId: string;
  chunksGenerated: number;
  chunksInserted: number;
  embeddingDimension: number;
  minChunkIndex: number;
  maxChunkIndex: number;
  sampleMetadata: Array<Record<string, any>>;
}

/**
 * Section-aware chunking for institutional knowledge base documents.
 */
function chunkDocumentText(
  rawText: string,
  documentName: string,
): Array<{
  content: string;
  metadata: {
    document_name: string;
    page_number: number;
    section_number: number | null;
    section_heading: string;
    char_length: number;
  };
}> {
  const rawPages = rawText
    .split(/--\s*\d+\s*of\s*12\s*--/i)
    .map((p) => p.trim())
    .filter(Boolean);
  const chunks: Array<{
    content: string;
    metadata: {
      document_name: string;
      page_number: number;
      section_number: number | null;
      section_heading: string;
      char_length: number;
    };
  }> = [];

  for (let pageIdx = 0; pageIdx < rawPages.length; pageIdx++) {
    const pageNum = pageIdx + 1;
    let pageText = rawPages[pageIdx];
    pageText = pageText
      .replace(
        /EduTrack Chatbot Knowledge Base\s*•\s*v6\s*•\s*Generic School Brochure Page\s*\d+/gi,
        '',
      )
      .trim();

    // Split on numbered section headers e.g. "1. Important Data Notice", "21. Generic Fees — Demo"
    const sectionRegex = /(?:^|\n)(?=\d+\.\s+[A-Z])/g;
    const rawSections = pageText
      .split(sectionRegex)
      .map((s) => s.trim())
      .filter(Boolean);

    for (const secText of rawSections) {
      const headingMatch = secText.match(/^(\d+)\.\s+([^\n]+)/);
      const sectionNum = headingMatch ? parseInt(headingMatch[1], 10) : null;
      const sectionHeading = headingMatch
        ? headingMatch[2].trim()
        : pageNum === 1
          ? 'Title & Overview'
          : 'General Information';

      if (secText.length <= 850) {
        chunks.push({
          content: secText,
          metadata: {
            document_name: documentName,
            page_number: pageNum,
            section_number: sectionNum,
            section_heading: sectionHeading,
            char_length: secText.length,
          },
        });
      } else {
        // Sub-chunk longer sections by paragraph/FAQ items
        const paragraphs = secText
          .split(/\n\s*\n/)
          .map((p) => p.trim())
          .filter(Boolean);
        let currentChunk = '';

        for (const p of paragraphs) {
          if ((currentChunk + '\n\n' + p).length <= 800) {
            currentChunk = currentChunk ? currentChunk + '\n\n' + p : p;
          } else {
            if (currentChunk) {
              chunks.push({
                content: currentChunk,
                metadata: {
                  document_name: documentName,
                  page_number: pageNum,
                  section_number: sectionNum,
                  section_heading: sectionHeading,
                  char_length: currentChunk.length,
                },
              });
              // 100-character overlap
              const words = currentChunk.split(' ');
              const overlap = words.slice(-15).join(' ');
              currentChunk = overlap + '\n\n' + p;
            } else {
              chunks.push({
                content: p.substring(0, 800),
                metadata: {
                  document_name: documentName,
                  page_number: pageNum,
                  section_number: sectionNum,
                  section_heading: sectionHeading,
                  char_length: Math.min(p.length, 800),
                },
              });
              currentChunk = p.substring(700);
            }
          }
        }
        if (currentChunk.trim().length > 30) {
          chunks.push({
            content: currentChunk.trim(),
            metadata: {
              document_name: documentName,
              page_number: pageNum,
              section_number: sectionNum,
              section_heading: sectionHeading,
              char_length: currentChunk.trim().length,
            },
          });
        }
      }
    }
  }

  return chunks;
}

/**
 * Ingests an institutional PDF into public.document_chunks for a specific organization.
 */
export async function ingestKnowledgeDocument(
  pdfPath: string,
  orgId: string,
  options?: {
    apiKey?: string;
    connectionString?: string;
  },
): Promise<IngestionResult> {
  if (!orgId || typeof orgId !== 'string') {
    throw new Error(
      '[Ingestion Error] An explicit orgId must be provided for multi-tenant isolation.',
    );
  }

  if (!fs.existsSync(pdfPath)) {
    throw new Error(`[Ingestion Error] PDF file not found at path: ${pdfPath}`);
  }

  const documentName = path.basename(pdfPath);
  const apiKey = options?.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

  if (!apiKey) {
    throw new Error('[Ingestion Error] GEMINI_API_KEY is not defined in environment variables.');
  }

  console.log(`[Ingestion] Reading PDF: ${documentName} for orgId: ${orgId}...`);
  const fileBuffer = fs.readFileSync(pdfPath);
  const uint8 = new Uint8Array(fileBuffer);

  const parser = new PDFParse(uint8);
  await parser.load();
  const textResult = await parser.getText();
  const fullText = textResult.text || '';

  if (!fullText || fullText.trim().length === 0) {
    throw new Error('[Ingestion Error] No text could be extracted from the PDF.');
  }

  console.log(`[Ingestion] Extracted ${fullText.length} characters. Chunking...`);
  const rawChunks = chunkDocumentText(fullText, documentName);
  console.log(`[Ingestion] Generated ${rawChunks.length} section-aware chunks.`);

  console.log(
    '[Ingestion] Initializing Google GenAI client for embeddings (gemini-embedding-001)...',
  );
  const ai = new GoogleGenAI({ apiKey });

  const chunkItems: DocumentChunkItem[] = [];
  const EXPECTED_DIMENSION = 3072;

  for (let i = 0; i < rawChunks.length; i++) {
    const chunk = rawChunks[i];
    const embedRes = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: chunk.content,
    });

    const values = embedRes.embeddings && embedRes.embeddings[0]?.values;
    if (!values || !Array.isArray(values)) {
      throw new Error(`[Ingestion Error] Failed to generate embedding for chunk index ${i}`);
    }

    if (values.length !== EXPECTED_DIMENSION) {
      throw new Error(
        `[Ingestion Error] Embedding dimension mismatch at chunk ${i}. Expected ${EXPECTED_DIMENSION}, received ${values.length}. Aborting insertion.`,
      );
    }

    chunkItems.push({
      chunkIndex: i,
      content: chunk.content,
      embedding: values,
      metadata: chunk.metadata,
    });
  }

  console.log(
    `[Ingestion] All ${chunkItems.length} embeddings verified at ${EXPECTED_DIMENSION} dimensions.`,
  );

  const connectionString =
    options?.connectionString || process.env.DIRECT_URL || process.env.DATABASE_URL;
  const client = new Client({ connectionString });
  await client.connect();

  try {
    // 1. Delete existing chunks for this document ONLY for the specified organization (multi-tenant safe)
    console.log(
      `[Ingestion] Clearing prior chunks for org_id: ${orgId}, document: ${documentName}...`,
    );
    await client.query(
      'DELETE FROM public.document_chunks WHERE org_id = $1::uuid AND document_name = $2',
      [orgId, documentName],
    );

    // 2. Insert new chunks with vector embeddings
    console.log(`[Ingestion] Inserting ${chunkItems.length} chunks into public.document_chunks...`);
    for (const chunk of chunkItems) {
      const embeddingVectorString = `[${chunk.embedding.join(',')}]`;
      await client.query(
        `INSERT INTO public.document_chunks (
          chunk_id,
          org_id,
          document_name,
          chunk_index,
          content,
          embedding,
          metadata,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          $1::uuid,
          $2,
          $3,
          $4,
          $5::vector,
          $6::jsonb,
          now(),
          now()
        )`,
        [
          orgId,
          documentName,
          chunk.chunkIndex,
          chunk.content,
          embeddingVectorString,
          JSON.stringify(chunk.metadata),
        ],
      );
    }

    console.log('[Ingestion] Ingestion completed successfully.');

    return {
      success: true,
      documentName,
      orgId,
      chunksGenerated: rawChunks.length,
      chunksInserted: chunkItems.length,
      embeddingDimension: EXPECTED_DIMENSION,
      minChunkIndex: 0,
      maxChunkIndex: chunkItems.length - 1,
      sampleMetadata: chunkItems.slice(0, 3).map((c) => c.metadata),
    };
  } finally {
    await client.end();
  }
}
