# Stage 3, Phase 4 — Frozen Database Alignment & Blocker Report

## 1. Frozen Database Baseline

- **Governing Schema File**: `apps/backend/prisma/schema.prisma`
- **SHA-256 Checksum**: `73d98492b3a7f2cbfd9348de94a0373ef530be966d6d00c3a4008bc0974d6c39` (`445,174` bytes)
- **DDL / Migration Policy**: Zero changes performed on `schema.prisma`, PostgreSQL tables, triggers, functions, or RLS policies.

## 2. Verified Physical S3.2 PostgreSQL Objects

| Table                                         | Enums                                                                                               | Key Constraints & Triggers                                                                                                                                                                                                          |
| :-------------------------------------------- | :-------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public.learning_activities`                  | `s32_activity_type` (`homework`, `project`), `s32_activity_status` (`draft`, `published`, `closed`) | `ck_s32_activity_due_after_assigned`, `ck_s32_activity_grading`, `ck_s32_activity_late_until`, `ck_s32_activity_published_timestamp`, `trg_s32_validate_activity`, `trg_s32_audit_activity`, `trg_s32_activity_updated_at`          |
| `public.learning_activity_audit_history`      | —                                                                                                   | FK `(org_id, activity_id)` `ON DELETE RESTRICT`                                                                                                                                                                                     |
| `public.learning_activity_submissions`        | `s32_submission_status` (`submitted`, `under_review`, `resubmission_requested`, `reviewed`)         | Sequential `attempt_number` unique per `(activity_id, student_id)`, `trg_s32_validate_submission`, `trg_s32_submission_content_deferred`, `trg_s32_prevent_submission_mutation` (blocks `DELETE`; only `submission_status` mutable) |
| `public.learning_activity_submission_files`   | —                                                                                                   | `ck_s32_file_size` (`1..10485760` bytes), unique `(storage_bucket, storage_path)`, `trg_s32_validate_submission_file` (max 5 files/attempt), `trg_s32_submission_file_content_deferred`                                             |
| `public.learning_activity_submission_reviews` | `s32_review_decision` (`reviewed`, `resubmission_requested`)                                        | `ck_s32_review_marks_nonnegative`, `ck_s32_review_resubmit_deadline`, `trg_s32_validate_review`, `trg_s32_apply_review_decision`, `trg_s32_prevent_review_mutation` (append-only RLS)                                               |

## 3. Capabilities Unsupported by Frozen Schema (Documented Recommendations Only)

1. **Direct Teacher Attachments on `learning_activities`**: No `learning_activity_files` table or attachment URL column exists on `learning_activities`. Teachers can link an optional Stage 2 `lesson_plan_id` or manage Stage 2 `learning_resources` instead.
2. **Rubric-Based Grading for S3.2 Activities**: `assessment_rubrics` belongs exclusively to `S3.5` (`assessments`), with no foreign key to `learning_activities`. Numerical grading (`maximum_marks` / `obtained_marks`) and free-text `feedback` are supported.
3. **Digital Student Submissions for `homework`**: Intentionally blocked at the DB trigger layer (`s32_validate_submission`, `s32_validate_submission_file`, `s32_validate_review`). Only `project` activities accept digital submissions, files, and reviews.

## 4. CRITICAL P0 FROZEN DATABASE BLOCKER DISCOVERED (`s32_validate_activity()`)

During live PostgreSQL execution of `POST /api/v1/learning-activities/teacher/activities`, PostgreSQL raised error **`42703` (`column s.org_id does not exist`)** from `BEFORE INSERT OR UPDATE` trigger function **`public.s32_validate_activity()`**:

- **Root Cause**: Line 125 of `public.s32_validate_activity()` selects `s.org_id` from `public.sections s`. In PostgreSQL (`information_schema.columns`) and `apps/backend/prisma/schema.prisma`, `public.sections` has **no `org_id` column** — tenant ownership lives on `public.academic_years` (`ay.org_id`), joined via `sections.academic_year_grade_id -> academic_year_grades.academic_year_id -> academic_years.org_id`.
- **Impact Under Database Freeze**:
  - **Every `INSERT` or `UPDATE` on `public.learning_activities` fails** in PostgreSQL (`0` existing rows in `learning_activities`).
  - Downstream inserts into `learning_activity_submissions`, `learning_activity_submission_files`, and `learning_activity_submission_reviews` are also blocked in live PostgreSQL until `public.s32_validate_activity()` is repaired by an authorized DBA.
- **Application Surface Behavior**: `translatePgLearningError()` explicitly maps PostgreSQL `42703` (`column s.org_id does not exist`) to HTTP **`503 SERVICE UNAVAILABLE`** (`code: 'DATABASE_TRIGGER_DEFECT'`) without masking or bypassing the trigger.

### Required External DBA Change Request (Out of Freeze Scope — Not Executed)

```sql
-- Fix SELECT inside public.s32_validate_activity():
SELECT f.section_id, f.academic_year_grade_subject_id, f.staff_id,
       f.is_active, f.effective_from, f.effective_to,
       ay.org_id, s.academic_year_grade_id,
       aygs.academic_year_grade_id AS subject_grade_id
  INTO v_assignment
FROM public.section_subject_faculty_assignments f
JOIN public.sections s ON s.section_id = f.section_id
JOIN public.academic_year_grades ayg ON ayg.academic_year_grade_id = s.academic_year_grade_id
JOIN public.academic_years ay ON ay.academic_year_id = ayg.academic_year_id
JOIN public.academic_year_grade_subjects aygs
  ON aygs.academic_year_grade_subject_id = f.academic_year_grade_subject_id
WHERE f.faculty_assignment_id = NEW.faculty_assignment_id;
```
