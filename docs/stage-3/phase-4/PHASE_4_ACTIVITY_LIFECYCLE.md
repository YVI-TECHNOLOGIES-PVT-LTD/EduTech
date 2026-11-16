# STAGE 3 PHASE 4 — LEARNING ACTIVITY LIFECYCLE & SUBMISSION ENGINE

**Status:** Backend Lifecycle Implemented; Live DB Persistence Blocked by Frozen PG Trigger Defect (`s32_validate_activity`)
**Frozen Schema:** `apps/backend/prisma/schema.prisma` (SHA-256 `73d98492b3a7f2cbfd9348de94a0373ef530be966d6d00c3a4008bc0974d6c39`)

---

## 1. Activity Types & State Transitions

Defined in `apps/backend/src/modules/learning-activities/learning-activities.types.ts` and validated by `learning-activities.validation.ts`:

- **Activity Types (`s32_activity_type`):** `'homework' | 'project'`
  - **Homework:** Assigned for offline/classroom completion; student submissions and teacher review submissions are blocked by application guard and PG rules (`'Submission reviews are only permitted for project activities.'`).
  - **Project:** Supports online multi-attempt student submissions (`text_content` and/or multipart file attachments) and teacher evaluations.
- **Activity Lifecycle States (`s32_activity_status`):**
  1. `draft` — Initial default when `publish_immediately` is `false`. Visible only to the creator teacher (and admin oversight), blocked for students (`403` `'Draft activities are not visible to students.'`), cannot be closed directly (`409` `'Draft activities must be published before closing.'`).
  2. `published` — Visible to enrolled students in the target `section_id` and their linked parents. Triggers `learning_activity.published` notification + realtime event to enrolled students and linked parents.
  3. `closed` — Prevents new submissions; reached via explicit `POST /v1/learning-activities/teacher/activities/:activityId/close` (with optional `closure_reason` max 1000 chars) or bulk deadline expiration `close-due` (teacher-owned or admin-wide org scope).

---

## 2. Date & Late Submission Rules

Enforced via Zod in `createActivitySchema` / `updateActivitySchema` and service logic (`LearningActivitiesService`):

- `due_at` must be strictly after `assigned_at` (`dueMs <= assignedMs` -> `400`).
- Optional `late_submission_authorized_until`, if provided, must be strictly after `due_at` (`lateMs <= dueMs` -> `400`).
- Teachers can adjust `late_submission_authorized_until` post-creation via `POST /v1/learning-activities/teacher/activities/:activityId/extend-late` (dispatches `learning_activity.updated` when status is not `draft`).

---

## 3. Student Submission Pipeline (`submitStudentProjectAttempt`)

Endpoint: `POST /api/v1/learning-activities/student/activities/:activityId/submit` (`handleMultipartUpload` -> `uploadMultipleMiddleware`)

1. Resolves active `student_id`, `enrollment_id`, and `section_id` for the authenticated user inside `orgId`. Missing student or active section enrollment returns `403`.
2. Requires either non-empty `text_content` (max `50,000` chars) OR at least one attachment file (`400` otherwise).
3. Enforces per-attempt file count bound (`MAX_SUBMISSION_FILES = 5`) and per-file byte bound (`1B` to `MAX_SUBMISSION_FILE_BYTES = 10 MB`).
4. Runs magic-byte buffer verification via `validateFileBufferSignature(file)` before checking/uploading to storage.
5. Runs `checkStudentPreSubmissionState` before touching Supabase Storage (`DEFAULT_SUBMISSION_BUCKET` defaulting to `'admission-documents'`) so rejected submissions (wrong section `404`, `draft` `403`, offline-only `homework`, closed/past deadline without authorization, etc.) do not upload orphan objects.
6. Maps PG `42703` (`column s.org_id does not exist` from `public.s32_validate_activity()`) to HTTP `503 DATABASE_TRIGGER_DEFECT` without leaking raw SQL internals.

---

## 4. Known External Database Blocker Affecting Write Flows

Every `INSERT` or `UPDATE` against `public.learning_activities` (including `createTeacherActivity`, `updateTeacherActivity`, `publishTeacherActivity`, `closeTeacherActivity`, `extendTeacherLateSubmission`, and downstream `submitStudentProjectAttempt` / `reviewSubmission` rows referencing `activity_id`) fires PG trigger function `public.s32_validate_activity()`, which queries `s.org_id` on `public.sections s` — a column that does not exist in PostgreSQL (`sections` resolves tenant via `academic_year_grades -> academic_years.org_id`). Because `apps/backend/prisma/schema.prisma` and PostgreSQL triggers/functions are frozen under Stage 3 governance, application write paths cannot bypass this trigger and surface `503 DATABASE_TRIGGER_DEFECT` until an external DBA deploys a corrected trigger definition.
