-- ============================================================================
-- Migration: 13_feed_storage_bucket_and_policies.sql
-- Module: Communication (Feeds & Announcements)
-- Description: Configures the private Supabase Storage bucket 'communication-feeds'
--              and establishes storage RLS policies.
-- Notice: PROPOSED MIGRATION — DO NOT EXECUTE DIRECTLY WITHOUT MIGRATION DRIFT REVIEW
-- Status: Proposed Storage Configuration
-- ============================================================================

-- 1. Create or configure private storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'communication-feeds',
    'communication-feeds',
    false, -- Strictly PRIVATE: objects require signed URLs or authenticated RLS access
    10485760, -- 10 MB per file limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[];

-- 2. Storage Objects RLS Policies for 'communication-feeds'
-- Storage path structure: organizations/{org_id}/feeds/{feed_post_id}/{filename}

-- SELECT policy: Enforces organization isolation & visibility
-- Storage objects can be downloaded if the requesting user belongs to the target organization
-- and is authorized to view the post. (Note: Most downloads use short-lived backend-generated signed URLs).
CREATE POLICY "communication_feeds_select_policy" ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'communication-feeds'
        AND (
            -- Extract org_id from path: organizations/{org_id}/feeds/...
            (storage.foldername(name))[1] = 'organizations'
            AND (storage.foldername(name))[2]::uuid = public.current_org_id()
            AND (
                -- Authors or institutional staff can read feed images
                public.is_org_staff(public.current_org_id(), auth.uid())
                OR EXISTS (
                    SELECT 1 FROM public.feed_posts fp
                    WHERE fp.org_id = public.current_org_id()
                      AND fp.feed_post_id = (storage.foldername(name))[4]::uuid
                      AND fp.status = 'published'
                      AND fp.removed_at IS NULL
                )
            )
        )
    );

-- INSERT policy: Restrict uploads to authorized staff or post authors
CREATE POLICY "communication_feeds_insert_policy" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'communication-feeds'
        AND (storage.foldername(name))[1] = 'organizations'
        AND (storage.foldername(name))[2]::uuid = public.current_org_id()
        AND (
            public.is_org_staff(public.current_org_id(), auth.uid())
            OR EXISTS (
                SELECT 1 FROM public.feed_posts fp
                WHERE fp.org_id = public.current_org_id()
                  AND fp.feed_post_id = (storage.foldername(name))[4]::uuid
                  AND fp.author_user_id = auth.uid()
                  AND fp.status != 'removed'
            )
        )
    );

-- UPDATE policy: Storage objects are immutable once written; updates are prohibited
CREATE POLICY "communication_feeds_update_policy" ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (false);

-- DELETE policy: Only org administration or post author can purge storage objects
CREATE POLICY "communication_feeds_delete_policy" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'communication-feeds'
        AND (storage.foldername(name))[1] = 'organizations'
        AND (storage.foldername(name))[2]::uuid = public.current_org_id()
        AND (
            public.is_org_admin(public.current_org_id(), auth.uid())
            OR EXISTS (
                SELECT 1 FROM public.feed_posts fp
                WHERE fp.org_id = public.current_org_id()
                  AND fp.feed_post_id = (storage.foldername(name))[4]::uuid
                  AND fp.author_user_id = auth.uid()
            )
        )
    );
