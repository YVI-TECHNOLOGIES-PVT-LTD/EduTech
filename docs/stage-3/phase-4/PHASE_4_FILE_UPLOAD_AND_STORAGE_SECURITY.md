# Stage 3, Phase 4 — File Upload & Storage Security

1. **Multipart Ingestion (`learning-activities.routes.ts`)**:
   - Reuses `uploadMultipleMiddleware` (`apps/backend/src/middlewares/upload.middleware.ts`) accepting max 5 files under field `files`, max 10MB each (`ck_s32_file_size`), extension + MIME allowlist (`PDF`, `JPEG`, `PNG`, `WEBP`).
2. **Pre-Flight Eligibility & Magic-Byte Validation (`learning-activities.service.ts`)**:
   - Validates file byte signatures via `validateFileBufferSignature(file)` before storage upload.
   - Verifies activity type (`project` only), activity status (`published` or active late window), sequential attempt gate, and active section enrollment **before** writing binaries to private storage so rejected submissions never leak orphaned storage objects.
3. **Atomic Transaction & Compensating Cleanup**:
   - Uploads files to private Supabase bucket under `learning-activities/${orgId}/${activityId}/${studentId}/attempt-${attempt}/${uuid}-${safeName}`.
   - Inserts `learning_activity_submissions` and `learning_activity_submission_files` in the same `prisma.$transaction` so `trg_s32_submission_content_deferred` evaluates with all files present on commit.
   - If the database transaction fails for any reason, `StorageService.deleteFile` deletes all newly uploaded objects before rethrowing.
4. **Role & Ownership-Verified Signed URLs**:
   - Raw `storage_path` and `storage_bucket` values are never serialized in list/detail DTOs, notifications, or WebSocket events.
   - Dedicated download endpoints (`/teacher/files/:fileId/download`, `/student/files/:fileId/download`, `/parent/children/:childId/files/:fileId/download`, `/admin/files/:fileId/download`) enforce tenant, role, and ownership checks before calling `StorageService.getSignedUrl(..., 600)`.
