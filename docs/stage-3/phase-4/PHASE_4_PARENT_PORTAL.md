# Stage 3, Phase 4 — Parent Portal (`/app/parent/learning-activities`)

- **Component**: `apps/web_app/src/modules/learning-activities/pages/ParentLearningActivitiesPage.tsx`
- **Route & Guard**: `parent/learning-activities` (`guardType: 'parent'`), exposed via `POST_ADMISSION_PARENT_NAVIGATION` (`parent_learning_activities`).
- **Capabilities**:
  - Strictly read-only child monitoring reusing `useParentSelectedChild`, `ParentChildSelectorBar`, and parent loading/error/empty states.
  - Child-scoped overview metrics and activity list (homework & project tasks assigned to the linked child's active section).
  - Selected activity detail panel displaying due dates, submission attempts, obtained marks, teacher feedback, and linked-child file downloads.
  - Zero parent mutation controls and strict server-side `student_parents` verification (`403` for unlinked children).
