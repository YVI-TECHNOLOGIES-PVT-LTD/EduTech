# STAGE 3 PHASE 4.1 — EVALUATION & RESUBMISSION VERIFICATION (TESTS 6–7)

**Status:** **BLOCKED — DBA APPROVAL REQUIRED**
Live evaluation (`POST /teacher/submissions/:submissionId/start-review`, `POST /teacher/submissions/:submissionId/reviews`) and Attempt 2 resubmission testing require persisted project activities and student submissions in PostgreSQL, which are blocked by `public.s32_validate_activity()` (`42703: column s.org_id does not exist`).

---

## 1. Audited Application & PostgreSQL Review Safeguards

1. **Application Service & Validation (`learning-activities.service.ts`, `learning-activities.validation.ts`):**
   - `listTeacherSubmissions` (`/teacher/submissions`), `startSubmissionReview` (`/teacher/submissions/:submissionId/start-review`), and `reviewSubmission` (`/teacher/submissions/:submissionId/reviews`) enforce `created_by_staff_id === staff.staff_id`, `'project'`-only reviews, `obtained_marks <= maximum_marks` (and disabled marks check when `grading_enabled === false`), and mandatory future `resubmission_allowed_until` when `review_decision === 'resubmission_requested'`.
   - Emits `learning_submission.reviewed` or `learning_submission.resubmission_requested` notifications to the student and linked parents.
2. **PostgreSQL Evaluation Triggers Verified Live (`pg_proc`):**
   - `s32_validate_review()`: enforces organization match, `'project'` activity type, assigned teacher identity (`reviewed_by_staff_id = created_by_staff_id`), grading bounds, and future `resubmission_allowed_until` when requesting resubmission.
   - `s32_apply_review_decision()`: updates parent `learning_activity_submissions.submission_status` to `'resubmission_requested'` or `'reviewed'`.
   - `s32_prevent_review_mutation()`: blocks `DELETE` and makes `review_id`, `org_id`, `submission_id`, `reviewed_by_staff_id`, and `reviewed_at` immutable.

---

## 2. Live Execution Status

- Teacher submissions list read (`GET /v1/learning-activities/teacher/submissions`): **PASSED (`200`)** (empty list with `0` rows).
- Parent child overview & activities read (`GET /v1/learning-activities/parent/children/:childId/overview`, `/activities`): **PASSED (`200`)** for linked parent (`14 passed, 0 failed` also in `parent-portal.spec.ts`).
- Live teacher review creation, marks persistence, Attempt 2 resubmission, and parent mark/feedback visibility with real records (`learning-activities.spec.ts` Steps 4–5): **NOT REACHED / BLOCKED (DBA APPROVAL REQUIRED)**.
