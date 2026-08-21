const path = require('path');
const fs = require('fs');
const { Client } = require('pg');
const { GoogleGenAI } = require('@google/genai');
const { PDFParse } = require('pdf-parse');
require('dotenv').config();

const TARGET_ORG_ID = '624efc1b-4144-43a4-90b8-552d945cbef7'; // Greenwood School, Delhi
const PDF_REL_PATH =
  '../../../docs/chatbot/EduTrack_Chatbot_Knowledge_Base_v6_DPS_Inspired_Generic_School.pdf';
const PDF_PATH = path.resolve(__dirname, PDF_REL_PATH);
const DOCUMENT_NAME = path.basename(PDF_PATH);
const EXPECTED_DIMENSION = 3072;

function chunkDocumentText(rawText, documentName) {
  const rawPages = rawText
    .split(/--\s*\d+\s*of\s*12\s*--/i)
    .map((p) => p.trim())
    .filter(Boolean);
  const chunks = [];

  for (let pageIdx = 0; pageIdx < rawPages.length; pageIdx++) {
    const pageNum = pageIdx + 1;
    let pageText = rawPages[pageIdx];
    pageText = pageText
      .replace(
        /EduTrack Chatbot Knowledge Base\s*•\s*v6\s*•\s*Generic School Brochure Page\s*\d+/gi,
        '',
      )
      .trim();

    // Split on numbered section headers
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

async function run() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

  if (!apiKey) {
    throw new Error(
      '[Ingestion Script] GEMINI_API_KEY or GOOGLE_API_KEY environment variable is required.',
    );
  }
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

  console.log(`[Step 1] Loading PDF from: ${PDF_PATH}`);
  const fileBuffer = fs.readFileSync(PDF_PATH);
  const parser = new PDFParse(new Uint8Array(fileBuffer));
  await parser.load();
  const textResult = await parser.getText();
  const fullText = textResult.text || '';
  console.log(`[Step 1] Extracted ${fullText.length} characters.`);

  console.log('[Step 2] Chunking text with section awareness...');
  const chunks = chunkDocumentText(fullText, DOCUMENT_NAME);
  console.log(`[Step 2] Created ${chunks.length} chunks.`);

  console.log('[Step 3] Initializing Google GenAI client...');
  const ai = new GoogleGenAI({ apiKey });
  const chunkItems = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    process.stdout.write(`\r[Step 3] Generating embedding ${i + 1}/${chunks.length}...`);
    const embedRes = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: chunk.content,
    });

    const values = embedRes.embeddings && embedRes.embeddings[0]?.values;
    if (!values || values.length !== EXPECTED_DIMENSION) {
      throw new Error(
        `Embedding generation error at chunk ${i}: dimension is ${values ? values.length : 'undefined'}`,
      );
    }

    chunkItems.push({
      chunkIndex: i,
      content: chunk.content,
      embedding: values,
      metadata: chunk.metadata,
    });
  }
  console.log(`\n[Step 3] All ${chunkItems.length} embeddings generated successfully.`);

  console.log('[Step 4] Connecting to PostgreSQL database...');
  const client = new Client({ connectionString });
  await client.connect();

  console.log(
    `[Step 4] Clearing previous chunks for org_id: ${TARGET_ORG_ID}, doc: ${DOCUMENT_NAME}...`,
  );
  await client.query(
    'DELETE FROM public.document_chunks WHERE org_id = $1::uuid AND document_name = $2',
    [TARGET_ORG_ID, DOCUMENT_NAME],
  );

  console.log(`[Step 4] Inserting ${chunkItems.length} document chunks...`);
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
        TARGET_ORG_ID,
        DOCUMENT_NAME,
        chunk.chunkIndex,
        chunk.content,
        embeddingVectorString,
        JSON.stringify(chunk.metadata),
      ],
    );
  }
  console.log('[Step 4] Insert complete.');

  console.log('\n==================================================');
  console.log('INGESTION VERIFICATION CHECKS');
  console.log('==================================================');

  // 1 & 2 & 3. Counts
  const totalCountRes = await client.query(
    'SELECT count(*)::int as total FROM public.document_chunks',
  );
  const orgCountRes = await client.query(
    'SELECT count(*)::int as total FROM public.document_chunks WHERE org_id = $1::uuid',
    [TARGET_ORG_ID],
  );
  const otherOrgsRes = await client.query(
    'SELECT count(*)::int as total FROM public.document_chunks WHERE org_id != $1::uuid',
    [TARGET_ORG_ID],
  );

  console.log('1. Number of chunks generated:', chunks.length);
  console.log('2. Number of chunks inserted:', chunkItems.length);
  console.log('3. Number of chunks for Greenwood org:', orgCountRes.rows[0].total);
  console.log('   Total chunks in table across all orgs:', totalCountRes.rows[0].total);
  console.log('   Chunks belonging to other orgs (untouched):', otherOrgsRes.rows[0].total);

  // 4 & 5. Min & Max chunk_index
  const minMaxRes = await client.query(
    'SELECT min(chunk_index) as min_idx, max(chunk_index) as max_idx FROM public.document_chunks WHERE org_id = $1::uuid',
    [TARGET_ORG_ID],
  );
  console.log('4. Minimum chunk_index:', minMaxRes.rows[0].min_idx);
  console.log('5. Maximum chunk_index:', minMaxRes.rows[0].max_idx);

  // 6. Chunks with NULL embedding
  const nullEmbRes = await client.query(
    'SELECT count(*)::int as null_count FROM public.document_chunks WHERE embedding IS NULL',
  );
  console.log('6. Number of chunks with NULL embedding:', nullEmbRes.rows[0].null_count);

  // 7. Non-3072 dimensional embeddings
  // vector_dims(embedding) checks dimension
  const dimRes = await client.query(
    'SELECT count(*)::int as non_3072 FROM public.document_chunks WHERE vector_dims(embedding) != 3072',
  );
  console.log('7. Number of chunks with non-3072 dimensions:', dimRes.rows[0].non_3072);

  // 8. Sample metadata from 2-3 chunks
  const sampleRes = await client.query(
    'SELECT chunk_index, metadata FROM public.document_chunks WHERE org_id = $1::uuid ORDER BY chunk_index ASC LIMIT 3',
    [TARGET_ORG_ID],
  );
  console.log('8. Sample metadata from 3 chunks:');
  sampleRes.rows.forEach((r) =>
    console.log(`   [Chunk ${r.chunk_index}]`, JSON.stringify(r.metadata)),
  );

  // 9. Similarity Test Query
  console.log('\n==================================================');
  console.log('TEST SIMILARITY SEARCH: "How can I apply for admission?"');
  console.log('==================================================');
  const queryText = 'How can I apply for admission?';
  const qEmbedRes = await ai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: queryText,
  });
  const qValues = qEmbedRes.embeddings[0].values;
  const qVectorString = `[${qValues.join(',')}]`;

  const simRes = await client.query(
    `
    SELECT 
      chunk_index,
      document_name,
      metadata->>'section_heading' as heading,
      metadata->>'page_number' as page,
      1 - (embedding <=> $1::vector) as similarity,
      content
    FROM public.document_chunks
    WHERE org_id = $2::uuid
    ORDER BY embedding <=> $1::vector
    LIMIT 3
  `,
    [qVectorString, TARGET_ORG_ID],
  );

  simRes.rows.forEach((r, idx) => {
    console.log(
      `\nTop Match #${idx + 1}: [Chunk ${r.chunk_index}] (Similarity: ${(r.similarity * 100).toFixed(2)}%)`,
    );
    console.log(`Page ${r.page} | Section: ${r.heading}`);
    console.log(`Preview: "${r.content.substring(0, 200).replace(/\n/g, ' ')}..."`);
  });

  await client.end();
}

run().catch((err) => {
  console.error('\nExecution Failed:', err);
  process.exit(1);
});
