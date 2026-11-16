# STAGE 3 PHASE 4 — EVALUATION, MARKS & TEACHER FEEDBACK

**Status:** Implemented Across Backend & Web Portals; End-to-End DB Write Verification Blocked by Frozen `s32_validate_activity` Trigger
**Frozen Schema:** `apps/backend/prisma/schema.prisma` (SHA-256 `73d98492b3a7f2cbfd9348de94a0373ef530be966d6d00c3a4008bc0974d6c39`)

---

## 1. Grading Configuration on Activities

- `grading_enabled` (`boolean`, default `false`)
- `maximum_marks` (`number | null`):
  - Required and strictly `> 0` (`max 10000`) when `grading_enabled = true`.
  - Must be omitted/`null` when `grading_enabled = false` (`createActivitySchema` and `updateActivitySchema` / service checks enforce this).

---

## 2. Teacher Evaluation Workflow

Routes mounted under `/api/v1/learning-activities/teacher`:

1. **`GET /submissions`** (`LearningActivitiesController.listTeacherSubmissions`)
   - Lists student attempts scoped to activities owned by the resolved teacher's `staff_id` within `org_id`.
   - Supports filters: `activity_id`, `submission_status` (`submitted | under_review | resubmission_requested | reviewed`), `is_late`, `search`, `page`, `limit` (`max 100`).
2. **`POST /submissions/:submissionId/start-review`** (`startSubmissionReview`)
   - Verifies submission belongs to `orgId` (`404` otherwise) and `submission.created_by_staff_id === staff.staff_id` (`403` otherwise).
   - Transitions submission status into `under_review`.
3. **`POST /submissions/:submissionId/reviews`** (`reviewSubmission`)
   - Validated via `createTeacherReviewSchema`:
     - `review_decision`: `'reviewed' | 'resubmission_requested'`
     - `obtained_marks`: optional/nullable numeric (`0` to `10000`)
     - `feedback`: optional/nullable string (max `10000` chars)
     - `resubmission_allowed_until`: ISO datetime, **required** and strictly in the future when `review_decision === 'resubmission_requested'`; forbidden (`400`) when `review_decision === 'reviewed'`.
   - Service business guards in `LearningActivitiesService.reviewSubmission`:
     - Rejects (`403`) if reviewer `staff_id !== submission.created_by_staff_id`.
     - Rejects (`400`) if `submission.activity_type !== 'project'` (`'Submission reviews are only permitted for project activities.'`).
     - Rejects (`400`) if `obtained_marks` is provided while `grading_enabled === false`.
     - Rejects (`400`) if `obtained_marks > submission.maximum_marks`.
   - Persists `learning_activity_submission_reviews` row inside `prisma.$transaction`, then emits non-blocking notification + WebSocket events (`learning_submission.reviewed` or `learning_submission.resubmission_requested`) to the student and linked parents.

---

## 3. Visibility Across Portals

- **Teacher Portal (`TeacherLearningActivitiesPage.tsx`):** Full review queue drawer/form to start review, enter `obtained_marks` (bounded by `maximum_marks` when graded), write `feedback`, and either finalize as `reviewed` or request resubmission with `resubmission_allowed_until`.
- **Student Portal (`StudentLearningActivitiesPage.tsx`):** Displays attempt history, review decision badge, `obtained_marks / maximum_marks`, teacher `feedback`, and unlocked Attempt 2+ submission UI when `resubmission_requested`.
- **Parent Portal (`ParentLearningActivitiesPage.tsx`):** Strict read-only view scoped to the selected linked child (`GET /v1/learning-activities/parent/children/:childId/activities/:activityId`), surfacing submission attempts, marks, feedback, and authorized file downloads.
