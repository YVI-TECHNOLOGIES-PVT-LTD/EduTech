-- ============================================================================
-- Migration: 12_feed_post_attachments.sql
-- Module: Communication (Feeds & Announcements)
-- Description: Creates the feed_post_attachments table for multi-image feed posts
--              with partial unique index, check constraints, foreign keys, and RLS.
-- Notice: PROPOSED MIGRATION — DO NOT EXECUTE AGAINST FROZEN PRODUCTION DATABASE
-- Status: Proposed (Expands Communication tables from 19 to 20, Total schema from 148 to 149)
-- ============================================================================

-- 1. Create feed_post_attachments table
CREATE TABLE IF NOT EXISTS public.feed_post_attachments (
    attachment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    feed_post_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    storage_path VARCHAR(1000) NOT NULL,
    mime_type VARCHAR(150) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    display_order INT NOT NULL DEFAULT 1,
    caption VARCHAR(255),
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    removed_at TIMESTAMPTZ,
    removed_by UUID,
    removal_reason TEXT,

    -- Foreign Keys
    CONSTRAINT fk_feed_post_attachments_post 
        FOREIGN KEY (org_id, feed_post_id) 
        REFERENCES public.feed_posts(org_id, feed_post_id) 
        ON DELETE CASCADE 
        ON UPDATE NO ACTION,

    CONSTRAINT fk_feed_post_attachments_uploader 
        FOREIGN KEY (org_id, uploaded_by) 
        REFERENCES public.users(org_id, user_id) 
        ON UPDATE NO ACTION,

    CONSTRAINT fk_feed_post_attachments_removed_by 
        FOREIGN KEY (org_id, removed_by) 
        REFERENCES public.users(org_id, user_id) 
        ON UPDATE NO ACTION,

    -- Check Constraints
    CONSTRAINT chk_feed_post_attachments_display_order 
        CHECK (display_order > 0),

    CONSTRAINT chk_feed_post_attachments_file_size 
        CHECK (file_size_bytes > 0 AND file_size_bytes <= 10485760), -- Max 10 MB

    CONSTRAINT chk_feed_post_attachments_mime_type 
        CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp'))
);

-- Comments on table and columns
COMMENT ON TABLE public.feed_post_attachments IS 
    'Stores metadata for images attached to communication feed announcements.';
COMMENT ON COLUMN public.feed_post_attachments.storage_path IS 
    'Private Supabase Storage relative path in communication-feeds bucket.';
COMMENT ON COLUMN public.feed_post_attachments.display_order IS 
    'Order of attachment display (1..5) among active attachments of the post.';

-- 2. Indexes
-- Partial Unique Index: Ensures unique display order strictly among ACTIVE attachments per post
-- This partial index allows historical display_order retention on soft-deleted (removed_at IS NOT NULL) rows.
CREATE UNIQUE INDEX IF NOT EXISTS uq_feed_post_attachments_active_order 
    ON public.feed_post_attachments (org_id, feed_post_id, display_order) 
    WHERE removed_at IS NULL;

-- Fast lookups by feed_post_id and uploader
CREATE INDEX IF NOT EXISTS idx_feed_post_attachments_post 
    ON public.feed_post_attachments (org_id, feed_post_id);

CREATE INDEX IF NOT EXISTS idx_feed_post_attachments_uploader 
    ON public.feed_post_attachments (org_id, uploaded_by);

-- 3. Row Level Security (RLS)
ALTER TABLE public.feed_post_attachments ENABLE ROW LEVEL SECURITY;

-- SELECT policy: Organization isolation + Post visibility compliance
-- A user can view active attachments if they belong to the organization and have visibility
-- to the parent feed post (author, staff/management, or targeted published audience).
CREATE POLICY p_feed_post_attachments_select ON public.feed_post_attachments
    FOR SELECT
    USING (
        org_id = public.current_org_id()
        AND (
            -- Authors and institutional staff/management can view all attachments including removed ones
            uploaded_by = auth.uid()
            OR public.is_org_staff(org_id, auth.uid())
            OR (
                -- Non-staff (parents/students) can only view active attachments of visible published posts
                removed_at IS NULL
                AND EXISTS (
                    SELECT 1 FROM public.feed_posts fp
                    WHERE fp.org_id = feed_post_attachments.org_id
                      AND fp.feed_post_id = feed_post_attachments.feed_post_id
                      AND fp.status = 'published'
                      AND fp.removed_at IS NULL
                )
            )
        )
    );

-- INSERT policy: Only post author or authorized institutional staff/management
CREATE POLICY p_feed_post_attachments_insert ON public.feed_post_attachments
    FOR INSERT
    WITH CHECK (
        org_id = public.current_org_id()
        AND uploaded_by = auth.uid()
        AND (
            public.is_org_staff(org_id, auth.uid())
            OR EXISTS (
                SELECT 1 FROM public.feed_posts fp
                WHERE fp.org_id = feed_post_attachments.org_id
                  AND fp.feed_post_id = feed_post_attachments.feed_post_id
                  AND fp.author_user_id = auth.uid()
                  AND fp.status != 'removed'
            )
        )
    );

-- UPDATE policy: Only post author or institutional staff/management
CREATE POLICY p_feed_post_attachments_update ON public.feed_post_attachments
    FOR UPDATE
    USING (
        org_id = public.current_org_id()
        AND (
            public.is_org_staff(org_id, auth.uid())
            OR EXISTS (
                SELECT 1 FROM public.feed_posts fp
                WHERE fp.org_id = feed_post_attachments.org_id
                  AND fp.feed_post_id = feed_post_attachments.feed_post_id
                  AND fp.author_user_id = auth.uid()
            )
        )
    );

-- DELETE policy: Soft delete preferred, but restrict hard delete to institutional management
CREATE POLICY p_feed_post_attachments_delete ON public.feed_post_attachments
    FOR DELETE
    USING (
        org_id = public.current_org_id()
        AND public.is_org_admin(org_id, auth.uid())
    );
