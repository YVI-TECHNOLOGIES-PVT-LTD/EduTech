# Stage 3, Phase 4 — Teacher Portal (`/app/teacher/learning-activities`)

- **Component**: `apps/web_app/src/modules/learning-activities/pages/TeacherLearningActivitiesPage.tsx`
- **Route & Guard**: `teacher/learning-activities` (`guardType: 'teacher'`), exposed via `TEACHER_NAVIGATION` (`t_learning_activities`).
- **Capabilities**:
  - Overview KPIs (Total Activities, Published, Drafts, Pending Reviews, Resubmissions Requested).
  - Create & edit homework (offline) and project (digital) activities mapped to the teacher's active `section_subject_faculty_assignments` and optional `lesson_plans`, with configurable numerical grading (`maximum_marks`) and late submission window.
  - Lifecycle transitions: Draft -> Publish, Close, Extend Late Window, and Close Due Activities.
  - Submissions & Evaluation tab: inspect student attempt text, securely download student attachments, start review (`under_review`), record `reviewed` marks & feedback, or request resubmission (`resubmission_requested` with future deadline).
  - Audit trail modal inspecting `learning_activity_audit_history`.
