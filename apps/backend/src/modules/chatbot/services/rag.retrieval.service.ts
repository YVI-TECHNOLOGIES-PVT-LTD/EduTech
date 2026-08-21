import { GoogleGenAI } from '@google/genai';
import { ChatbotVectorRepository, RetrievedChunk } from '../repositories/chatbot.vector.repository';

export interface RagRetrievalResult {
  query: string;
  tenantOrgId: string;
  retrievedChunks: RetrievedChunk[];
  groundedContext: string;
  hasSufficientContext: boolean;
  topSimilarity: number;
}

export class RagRetrievalService {
  private static aiClient: GoogleGenAI | null = null;

  private static getAiClient(): GoogleGenAI {
    if (!this.aiClient) {
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

      if (!apiKey) {
        throw new Error('[RAG Retrieval] GEMINI_API_KEY is not defined.');
      }
      this.aiClient = new GoogleGenAI({ apiKey });
    }
    return this.aiClient;
  }

  /**
   * Helper to execute an async operation with an explicit timeout.
   */
  private static async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    operationName: string,
  ): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(
          new Error(`[RAG Retrieval] Operation '${operationName}' timed out after ${timeoutMs}ms.`),
        );
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timer!);
    }
  }

  /**
   * Generates a 3072-dimensional embedding using gemini-embedding-001.
   */
  static async generateQueryEmbedding(queryText: string): Promise<number[]> {
    const ai = this.getAiClient();
    const embedPromise = ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: queryText.trim(),
    });

    const embedRes = await this.withTimeout(
      embedPromise,
      10000,
      'generateQueryEmbedding (gemini-embedding-001)',
    );

    const values = embedRes.embeddings && embedRes.embeddings[0]?.values;
    if (!values || !Array.isArray(values)) {
      throw new Error('[RAG Retrieval] Failed to generate embedding from gemini-embedding-001.');
    }

    if (values.length !== 3072) {
      throw new Error(
        `[RAG Retrieval] Embedding dimension mismatch. Expected 3072, received ${values.length}.`,
      );
    }

    return values;
  }

  /**
   * Executes a tenant-scoped pgvector similarity search and constructs grounded context.
   *
   * @param tenantOrgId - Organization ID strictly resolved from tenant middleware
   * @param queryText - Raw user question
   * @param options - Search configuration (limit: max chunks, minSimilarity: threshold)
   */
  static async retrieveGroundedContext(
    tenantOrgId: string,
    queryText: string,
    options?: {
      limit?: number;
      minSimilarity?: number;
    },
  ): Promise<RagRetrievalResult> {
    if (!tenantOrgId || typeof tenantOrgId !== 'string') {
      throw new Error('[RAG Retrieval] tenantOrgId is required for tenant-isolated retrieval.');
    }

    const limit = options?.limit ?? 4;
    const minSimilarity = options?.minSimilarity ?? 0.35;

    // 1. Generate 3072-dim embedding for user query
    const queryEmbedding = await this.generateQueryEmbedding(queryText);

    // 2. Perform tenant-scoped vector search (SQL enforced: WHERE org_id = $tenantOrgId)
    const chunks = await ChatbotVectorRepository.searchSimilarChunks(
      tenantOrgId,
      queryEmbedding,
      limit,
      minSimilarity,
    );

    const topSimilarity = chunks.length > 0 ? chunks[0].similarity : 0.0;
    const hasSufficientContext = chunks.length > 0 && topSimilarity >= 0.4;

    // 3. Assemble grounded context string
    let groundedContext = '';
    if (chunks.length > 0) {
      groundedContext = chunks
        .map((chunk, idx) => {
          const sec = chunk.metadata?.section_heading || 'General Information';
          const page = chunk.metadata?.page_number ? ` (Page ${chunk.metadata.page_number})` : '';
          return `--- Knowledge Source #${idx + 1}: ${sec}${page} ---\n${chunk.content}`;
        })
        .join('\n\n');
    }

    return {
      query: queryText,
      tenantOrgId,
      retrievedChunks: chunks,
      groundedContext,
      hasSufficientContext,
      topSimilarity,
    };
  }
}
