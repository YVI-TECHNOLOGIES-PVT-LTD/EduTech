# Stage 3, Phase 4 — Student Portal (`/app/student/learning-activities`)

- **Component**: `apps/web_app/src/modules/learning-activities/pages/StudentLearningActivitiesPage.tsx`
- **Route & Guard**: `student/learning-activities` (`permission: 'student.dashboard.view'`), exposed via `STUDENT_NAVIGATION` (`stu_learning_activities`).
- **Capabilities**:
  - Student KPI strip (Total Assigned, Pending Projects, Submitted, Resubmissions Needed, Reviewed).
  - View filters (`all`, `pending`, `submitted`, `resubmission_requested`, `reviewed`), type filter (`homework` | `project`), and search.
  - Honest task-type UX: `homework` activities clearly explain offline completion with no digital upload form; `project` activities render the attempt submission composer when `can_submit === true` (text notes + up to 5 PDF/JPG/PNG/WEBP files <= 10MB via `FormData`) and display the exact lock reason when blocked.
  - Full attempt history panel displaying marks, teacher feedback, late tags, and authenticated file downloads.
