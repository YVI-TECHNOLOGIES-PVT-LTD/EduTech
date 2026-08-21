import prisma from '../../../lib/prismaClient';

export interface RetrievedChunk {
  chunk_id: string;
  document_name: string;
  chunk_index: number;
  content: string;
  metadata: Record<string, any> | null;
  similarity: number;
}

export class ChatbotVectorRepository {
  /**
   * Performs a tenant-isolated pgvector cosine similarity search over public.document_chunks.
   *
   * @param tenantOrgId - Strictly resolved organization ID from authentication/tenant middleware
   * @param queryEmbedding - 3072-dimensional vector embedding from gemini-embedding-001
   * @param limit - Maximum number of relevant chunks to retrieve (default: 5)
   * @param minSimilarity - Minimum cosine similarity threshold (default: 0.3)
   */
  static async searchSimilarChunks(
    tenantOrgId: string,
    queryEmbedding: number[],
    limit: number = 5,
    minSimilarity: number = 0.0,
  ): Promise<RetrievedChunk[]> {
    if (!tenantOrgId || typeof tenantOrgId !== 'string') {
      throw new Error(
        '[Vector Repository] Valid tenantOrgId is required for tenant-scoped vector search.',
      );
    }

    if (!Array.isArray(queryEmbedding) || queryEmbedding.length !== 3072) {
      throw new Error(
        `[Vector Repository] Invalid query embedding. Expected 3072 dimensions, received ${queryEmbedding?.length ?? 0}.`,
      );
    }

    const vectorString = `[${queryEmbedding.join(',')}]`;

    // Parameterized raw query using Prisma.$queryRaw
    const rows = await prisma.$queryRaw<
      Array<{
        chunk_id: string;
        document_name: string;
        chunk_index: number;
        content: string;
        metadata: Record<string, any> | null;
        similarity: number;
      }>
    >`
      SELECT 
        chunk_id,
        document_name,
        chunk_index,
        content,
        metadata,
        (1 - (embedding <=> ${vectorString}::vector))::float8 AS similarity
      FROM public.document_chunks
      WHERE org_id = ${tenantOrgId}::uuid
        AND (1 - (embedding <=> ${vectorString}::vector)) >= ${minSimilarity}
      ORDER BY embedding <=> ${vectorString}::vector ASC
      LIMIT ${limit};
    `;

    return rows.map((r) => ({
      chunk_id: r.chunk_id,
      document_name: r.document_name,
      chunk_index: r.chunk_index,
      content: r.content,
      metadata: r.metadata,
      similarity: Number(r.similarity),
    }));
  }

  /**
   * Counts available knowledge base chunks for a tenant.
   */
  static async countChunksForTenant(tenantOrgId: string): Promise<number> {
    const result = await prisma.document_chunks.count({
      where: { org_id: tenantOrgId },
    });
    return result;
  }
}
