# STAGE 3 PHASE 4.1 — SUBMISSION E2E VERIFICATION (TEST 5)

**Status:** **BLOCKED — DBA APPROVAL REQUIRED**
Live student submission execution requires a persisted `published` `'project'` row in `public.learning_activities`, which cannot be created while `public.s32_validate_activity()` references non-existent `s.org_id` (`42703`).

---

## 1. Audited Implementation & Live PG Trigger Contract

Code & PostgreSQL inspection confirmed every safeguard remains intact:

- **Application Entry (`learning-activities.routes.ts` & `learning-activities.service.ts`):**
  - `POST /api/v1/learning-activities/student/activities/:activityId/submit` runs `LearningActivitiesPolicy.requireStudentRole()`, multipart ingestion via `uploadMultipleMiddleware`, and `LearningActivitiesService.submitStudentProjectAttempt`.
  - Requires active `student_id`, `enrollment_id`, and `section_id`; rejects empty note+file payloads (`400`), enforces `MAX_SUBMISSION_FILES = 5` and `1B..10MB` (`MAX_SUBMISSION_FILE_BYTES = 10485760`), runs `validateFileBufferSignature(file)`, and validates eligibility (`checkStudentPreSubmissionState`, `project`-only rule) **before** invoking `StorageService.uploadFile`.
  - Persists `learning_activity_submissions` + `learning_activity_submission_files` atomically inside `prisma.$transaction`, with compensating `StorageService.deleteFile` cleanup on error.
- **PostgreSQL Submission Triggers Verified Live (`pg_proc`):**
  - `s32_validate_submission()`: locks activity row `FOR UPDATE`, rejects offline `homework`, validates active enrollment in `student_enrollments`, enforces sequential `attempt_number`, enforces teacher-authorized `resubmission_requested` for `attempt_number > 1`, and computes `is_late`.
  - `s32_validate_submission_file()`: locks submission row `FOR UPDATE OF s`, enforces `'project'` type and maximum 5 files per attempt.
  - `s32_check_submission_has_content()` / `s32_deferred_check_submission_content()`: verifies text or >=1 file on commit.
  - `s32_prevent_submission_mutation()`: blocks `DELETE` and content mutation; allows only `submission_status` updates.

---

## 2. Live Execution Status

- Live student read endpoints (`GET /v1/learning-activities/student/overview` & `GET /v1/learning-activities/student/activities`): **PASSED (`200`)** in `learning-activities-security-and-reads.spec.ts`.
- Strict live write test (Attempt 1 PDF upload + submission metadata in `learning-activities.spec.ts` Step 4): **NOT REACHED / BLOCKED** by Step 2 failure (`503 DATABASE_TRIGGER_DEFECT`).
