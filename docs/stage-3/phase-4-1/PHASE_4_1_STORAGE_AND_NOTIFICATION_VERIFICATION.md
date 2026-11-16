# STAGE 3 PHASE 4.1 — STORAGE & NOTIFICATION VERIFICATION (SECTIONS 9–10 & TEST 9)

**Status:** **REGRESSION / CONTRACT VERIFIED; LIVE DB-COMMITTED EVENT & SIGNED-URL E2E BLOCKED BY DBA TRIGGER DEFECT**

---

## 1. Storage & Signed URL Architecture Audit (`StorageService` Reuse)

Verified in [learning-activities.routes.ts](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/learning-activities/learning-activities.routes.ts) and [learning-activities.service.ts](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/learning-activities/learning-activities.service.ts):

- Reuses `uploadMultipleMiddleware` + `validateFileBufferSignature` + `StorageService.uploadFile` / `StorageService.deleteFile` / `StorageService.getSignedUrl` (zero duplicate storage providers).
- Private bucket (`DEFAULT_SUBMISSION_BUCKET = env.SUPABASE_ADMISSION_DOCUMENTS_BUCKET || 'admission-documents'`), unique path (`learning-activities/${orgId}/${activityId}/${studentId}/attempt-${nextAttemptNumber}/${uuid}-${safeName}`), max `5` files per attempt (`MAX_SUBMISSION_FILES`), max `10 MB` (`MAX_SUBMISSION_FILE_BYTES`).
- Compensating cleanup via `Promise.allSettled(uploadedObjects.map(obj => StorageService.deleteFile(...)))` runs in `catch` if database persistence fails.
- Short-lived signed URLs (`expiresInSeconds: 600`) gated per role/ownership (`getSubmissionFileDownloadUrl`); raw `storage_path` and credentials are omitted from DTOs, notification payloads, and WebSocket events.
- **Live Storage Upload & Download E2E (`learning-activities.spec.ts` Steps 4–5):** **NOT REACHED / BLOCKED (DBA APPROVAL REQUIRED)**.

---

## 2. Notification & Realtime WebSocket Verification

- Registered all 6 event types in [notification.realtime.ts](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/notifications/realtime/notification.realtime.ts#L22-L27):
  `learning_activity.published`, `learning_activity.updated`, `learning_activity.closed`, `learning_submission.created`, `learning_submission.reviewed`, `learning_submission.resubmission_requested`.
- **Verified Live:**
  - `learning-activities.spec.ts` Step 1 established 3 authenticated WebSocket connections (`/ws/notifications`) for Teacher, Student, and Parent prior to Step 2 trigger failure.
  - Regression suites [notification.service.spec.ts](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/notifications/tests/notification.service.spec.ts) and [e2e-realtime.spec.ts](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/notifications/tests/e2e-realtime.spec.ts) passed (`Exit 0`).
- **Blocked Pending DBA Trigger Fix:** Live dispatch of the 6 learning events and Test 9 (notification delivery failure non-rollback resilience) in `learning-activities.spec.ts` Steps 3–7 remain **NOT REACHED / BLOCKED (DBA APPROVAL REQUIRED)**.
