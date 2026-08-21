-- ============================================================================
-- CHATBOT RAG KNOWLEDGE BASE — PGVECTOR & DOCUMENT CHUNKS
-- ============================================================================

-- 1. Enable pgvector extension (idempotent)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create document_chunks table for multi-tenant RAG knowledge base
CREATE TABLE IF NOT EXISTS public.document_chunks (
    chunk_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    org_id UUID NOT NULL
        REFERENCES public.organizations(org_id)
        ON DELETE CASCADE,

    document_name VARCHAR(255) NOT NULL,

    chunk_index INT NOT NULL,

    content TEXT NOT NULL,

    embedding vector(3072),

    metadata JSONB NULL,

    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT uq_document_chunks_org_doc_index UNIQUE (org_id, document_name, chunk_index)
);

-- 3. Tenant Isolation Index
CREATE INDEX IF NOT EXISTS ix_document_chunks_org
ON public.document_chunks (org_id);
