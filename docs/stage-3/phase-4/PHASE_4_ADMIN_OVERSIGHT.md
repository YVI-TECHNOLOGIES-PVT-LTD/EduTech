# Stage 3, Phase 4 — Admin Oversight (`/app/admin/learning-activities`)

- **Component**: `apps/web_app/src/modules/learning-activities/pages/AdminLearningActivitiesPage.tsx`
- **Route & Guard**: `admin/learning-activities` (`guardType: 'admin'`, `permission: 'admin.dashboard.view'`), exposed via `ADMIN_NAVIGATION` (`adm_learning_activities`), keeping `adm_academic_group` at its verified 11 submenus.
- **Capabilities**:
  - Institution-wide KPIs (`total_activities`, `published_count`, `overdue_published_count`, `total_submissions`, `pending_reviews_count`, `late_submissions_count`).
  - Filtering by academic year, section, activity type, status, and search query.
  - Authorized "Close Overdue" bulk closure trigger scoped strictly to `org_id`.
  - Read-only inspection modal displaying activity instructions, student submissions, file downloads, and audit history.
