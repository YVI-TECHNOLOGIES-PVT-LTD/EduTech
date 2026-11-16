# EduTrack ERP — Stage 2 Parent Portal Implementation Report

## 1. Executive Summary

The EduTrack ERP Parent Portal has been implemented end-to-end as a dedicated, child-centric academic portal strictly segregated from the Admin, Teacher, and Student portals. All Stage-2 academic capabilities supported by the frozen PostgreSQL schema (`apps/backend/prisma/schema.prisma`) are integrated end-to-end across backend policies, repositories, services, controllers, RTK Query endpoints, Redux state, sidebar navigation, route guards, and responsive React pages.

---

## 2. Database Freeze & Schema Governance Compliance

All governance requirements were strictly upheld:

- **Zero DDL or Schema Modifications**: `apps/backend/prisma/schema.prisma` has zero diffs. No tables, columns, indexes, constraints, triggers, views, SQL scripts, or migrations were created, altered, or generated.
- **Verified Read Sources Only**: Backend queries operate strictly against existing Stage-1/Stage-2 tables present in `apps/backend/prisma/schema.prisma`:
  - Identity & Guardian Linkage: `organizations`, `users`, `parents`, `student_parents`, `students`
  - Academic Placement & Faculty: `academic_years`, `academic_year_grades`, `grades`, `sections`, `student_enrollments`, `staff`, `section_subject_faculty_assignments`
  - Timetable & Bell Schedules: `timetable_versions` (`status = 'published'`), `timetable_entries`, `bell_schedules`, `bell_schedule_days`, `bell_schedule_periods`, `classrooms`
  - Subjects & Curriculum: `academic_year_grade_subjects`, `subjects`, `subject_categories`, `subject_selection_groups`, `subject_selection_group_options`, `curriculum_plans` (`status = 'published'`), `curriculum_plan_units`, `curriculum_learning_outcomes`, `academic_year_curriculum_mappings`, `curriculum_frameworks`, `curriculum_framework_versions`
  - Digital Resource Library: `learning_resources` (`resource_status = 'published'`), `learning_resource_grades`, `learning_resource_subjects`, `learning_resource_shares`, `learning_resource_share_sections`, `learning_resource_share_recipients`, `resource_categories`
  - Academic Calendar & Notifications: `academic_calendars` (`status = 'published'`), `academic_calendar_working_days`, `academic_terms`, `academic_calendar_entries`, `academic_calendar_entry_grades`, `notifications`

---

## 3. Pre-Existing Audit Findings & Hardening Applied

1. **Removed Fabricated Academic Metrics**:
   - `apps/backend/src/modules/dashboard/services/parent-overview.service.ts` previously returned hardcoded `attendance: [{ attendance_percentage: 95 }]` and `exam_stats: [{ percentage: 88 }]`; replaced with empty arrays (`attendance: []`, `exam_stats: []`).
   - `apps/web_app/src/modules/student/pages/MyChildren.tsx` previously fell back to `?? 95`, `?? 88`, `'22 Days'`, `'1 Day'`, `'0 Days'`, `'Grade A+ (Exemplary)'`, and `'CBSE Standards'`; replaced with real data checks and unsupported-metric messaging.
   - Refactored `apps/web_app/src/modules/dashboard/pages/ParentDashboard.tsx` to derive metrics strictly from verified linked children, enrollments, published timetable classes, upcoming calendar entries, published resources, and real notification counts.
2. **Closed Claimed-Parent Email Hijack Vector**:
   - `apps/backend/src/modules/communication/services/HelpdeskService.ts` (`getParentChildren`) and `ParentPortalRepository.resolveAuthorizedParentRecords` restrict email fallback strictly to unclaimed guardian rows (`user_id IS NULL`), blocking account spoofing when a parent row is already bound to another `user_id`.
3. **Upgraded Student Timetable Endpoint Security & Data Resolution**:
   - `apps/backend/src/modules/student-management/services/student-academics.service.ts` previously returned empty `[]` arrays for today and weekly timetables and allowed broad role access. Updated `getTodayTimetable` and `getWeekTimetable` to enforce student self-ownership (`student.user_id === user.id`) or verified parent linkage via `ParentPortalService.assertAndResolveChild`, returning published timetable slots merged with configured bell breaks/lunch.
4. **Fixed Broken/Placeholder Parent Frontend Routes**:
   - `apps/web_app/src/config/route_registry.tsx` previously pointed `parent/notifications` to `<MyApplications />`; replaced with `<ParentNotificationsPage />`.
   - `apps/web_app/src/config/navigation.ts` expanded `POST_ADMISSION_PARENT_NAVIGATION` cleanly with the complete Parent Portal groups while preserving `Fees & Payments` (`/app/fees/my`) and `Admissions Desk` (`/app/admissions/my`).
   - Legacy `/app/parent/my-child` redirects cleanly to `/app/parent/children` (`<Navigate to="/app/parent/children" replace />`) to avoid broken bookmarks without duplicating active components.
   - `apps/web_app/src/components/shell/ProfileMenu.tsx` routes parents to `/app/parent/profile` and `/app/parent/settings`.

---

## 4. Backend Architecture & API Endpoints

### Security & RBAC Layer

- **Policy**: [`ParentPortalPolicy`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/parent-management/policies/parent-portal.policy.ts) and [`extractParentSessionContext`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/parent-management/policies/parent-portal.policy.ts)
  - Allows only `PARENT`, `GUARDIAN`, and `ENROLLED_PARENT`.
  - Rejects `ADMIN`, `SUPERADMIN`, `TEACHER`, `FACULTY`, `STAFF`, and `STUDENT` (without a parent role) with `403 FORBIDDEN`.
  - Rejects missing session `userId` or `orgId` with `401 UNAUTHORIZED`.
  - Ignores client-supplied `org_id` overrides in query/body parameters.
- **Repository**: [`ParentPortalRepository`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/parent-management/repositories/parent-portal.repository.ts)
- **Service**: [`ParentPortalService`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/parent-management/services/parent-portal.service.ts)
  - Enforces strict child IDOR protection in `assertAndResolveChild` (`400 INVALID_CHILD_ID`, `404 CHILD_NOT_FOUND` for missing/foreign-tenant child, `403 ParentForbiddenError` for unlinked child in same tenant).
- **Controller**: [`ParentPortalController`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/parent-management/controllers/parent-portal.controller.ts)
- **Routes**: [`parent-portal.routes.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/parent-management/routes/parent-portal.routes.ts), mounted at `/v1/parent` and `/parent` in [`routes.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/routes.ts) after `/parent/students` so existing `CommunicationController.getChildrenForParent` stays intact.

### Registered Endpoints (`/v1/parent/*` & `/parent/*`)

| Method | Path                                                | Purpose                                                                                                                                                            |
| ------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET`  | `/dashboard/overview`                               | Consolidated parent header context, all linked children, real metrics, and selected child Stage-2 preview                                                          |
| `GET`  | `/children`                                         | All linked children (`student_parents`) with signed photo URLs and active enrollment/class teacher context                                                         |
| `GET`  | `/children/:childId`                                | Full profile, enrollment history, class teacher, and section subject teachers                                                                                      |
| `GET`  | `/children/:childId/timetable/today`                | Published timetable for weekday merged with bell schedule break/lunch periods and time-based status (`ongoing`, `upcoming`, `completed`, `break`, `lunch`, `free`) |
| `GET`  | `/children/:childId/timetable/weekly`               | Published weekly matrix across configured working days with co-teachers and classrooms                                                                             |
| `GET`  | `/children/:childId/subjects`                       | Grade/year subjects, categories, selection groups, periods, and assigned section teachers                                                                          |
| `GET`  | `/children/:childId/curriculum`                     | Published curriculum plans, units, learning outcomes, and board/framework metadata (read-only)                                                                     |
| `GET`  | `/children/:childId/academic-progress`              | Schedule-derived syllabus timeline pacing (`planned_start_date`/`planned_end_date`) plus explicit unsupported student-tracking flags                               |
| `GET`  | `/children/:childId/resources`                      | Published, grade/section/student-shared resources with filters and pagination                                                                                      |
| `GET`  | `/children/:childId/resources/:resourceId/preview`  | Authorized short-lived signed preview URL                                                                                                                          |
| `GET`  | `/children/:childId/resources/:resourceId/download` | Authorized download URL enforcing `allow_download` share/resource policy                                                                                           |
| `GET`  | `/children/:childId/calendar`                       | Published academic calendar terms, working days, holidays, vacations, and grade-scoped/school-wide events                                                          |

---

## 5. Frontend Navigation, State & Pages

### Navigation Structure (`POST_ADMISSION_PARENT_NAVIGATION`)

Implemented in [`navigation.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/config/navigation.ts) and registered with `guardType: 'parent'` in [`route_registry.tsx`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/config/route_registry.tsx):

- **MAIN MENU**:
  1. Dashboard (`/app/parent/dashboard`) -> [`ParentDashboard.tsx`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/dashboard/pages/ParentDashboard.tsx)
  2. My Children (`/app/parent/children`) -> [`ParentChildrenPage.tsx`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/parent/pages/ParentChildrenPage.tsx)
  3. Timetable (`/app/parent/timetable`) -> [`ParentTimetablePage.tsx`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/parent/pages/ParentTimetablePage.tsx)
  4. Academic Progress (`/app/parent/academic-progress`) -> [`ParentAcademicProgressPage.tsx`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/parent/pages/ParentAcademicProgressPage.tsx)
  5. Subjects & Curriculum (`/app/parent/subjects`) -> [`ParentSubjectsCurriculumPage.tsx`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/parent/pages/ParentSubjectsCurriculumPage.tsx)
  6. Learning Resources (`/app/parent/learning-resources`) -> [`ParentLearningResourcesPage.tsx`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/parent/pages/ParentLearningResourcesPage.tsx)
  7. Academic Calendar (`/app/parent/academic-calendar`) -> [`ParentAcademicCalendarPage.tsx`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/parent/pages/ParentAcademicCalendarPage.tsx)
- **STUDENT INFORMATION**: 8. Documents Centre (`/app/parent/documents`) -> `ParentDocumentCenterPage` (preserved) 9. Notifications (`/app/parent/notifications`) -> [`ParentNotificationsPage.tsx`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/parent/pages/ParentNotificationsPage.tsx) 10. Communication (`/app/parent/communication`) -> [`ParentCommunicationPage.tsx`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/parent/pages/ParentCommunicationPage.tsx)
- **FINANCE & ADMISSIONS (Preserved)**:
  - Fees & Payments (`/app/fees/my`) -> `MyFees`
  - Admissions Desk (`/app/admissions/my`) -> `MyApplications`
- **ACCOUNT**: 11. My Profile (`/app/parent/profile`) -> `Profile` 12. Settings (`/app/parent/settings`) -> [`ParentSettingsPage.tsx`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/parent/pages/ParentSettingsPage.tsx)

### Shared Multi-Child Context & State Layer

- **Redux Slice**: [`parentPortalSlice.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/shared/store/parentPortalSlice.ts) stores `selectedChildId` and resets to `null` on `logout`.
- **RTK Query API**: [`parentPortal.api.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/shared/api/parentPortal.api.ts) consuming `ENDPOINTS.PARENT_PORTAL` in [`endpoints.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/shared/api/endpoints.ts).
- **Hook & Shared UI**: [`useParentSelectedChild.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/parent/hooks/useParentSelectedChild.ts), [`ParentChildSelectorBar.tsx`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/parent/components/ParentChildSelectorBar.tsx), [`ParentStates.tsx`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/parent/components/ParentStates.tsx), [`ParentTimetableWidgets.tsx`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/parent/components/ParentTimetableWidgets.tsx).

---

## 6. Explicit Unsupported Capabilities (Documented Due to Frozen DB)

Because the finalized PostgreSQL database is frozen, the following Stage-1+ features do not have supporting persistence tables/columns and display explicit unsupported notices instead of fabricated data:

1. **Attendance Percentages & Daily Logs**: Omitted from metrics and clearly marked unsupported until attendance persistence tables exist.
2. **Examination Marks, Results & Report Cards**: Omitted from dashboard metrics and marked unsupported on the Academic Progress view.
3. **Verified Topic Completion & Assignment/Homework Grading**: Academic Progress renders read-only syllabus timeline pacing based strictly on `curriculum_plan_units.planned_start_date` and `planned_end_date` with explicit notice distinguishing schedule pacing from unstored student completion records.
4. **Per-Student Elective Enrollments**: Subject selection groups configured for a grade are disclosed transparently; individual student elective picks are not assumed.
5. **Server-Synced Notification Channel Preferences**: Parent Settings manages local browser theme/density/locale/accessibility settings and clearly discloses that server-side SMS/Email/Push channel opt-ins require dedicated preference tables outside the frozen schema.

---

## 7. Verification Summary

| Check                                       | Result                             | Notes                                                                                                                                                                           |
| ------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm --filter @edutrack/api run typecheck` | Pass (`tsc --noEmit`)              | Zero TypeScript errors across backend                                                                                                                                           |
| `pnpm --filter @edutrack/web run typecheck` | Pass (`tsc --noEmit`)              | Zero TypeScript errors across frontend                                                                                                                                          |
| `parent-portal.spec.ts`                     | 14 passed, 0 failed                | RBAC, session extraction, timetable slots, multi-child IDOR, resource download restriction, curriculum pacing, live PostgreSQL anti-hijack & zero fake data                     |
| `parent-overview.spec.ts`                   | 12 passed, 0 failed                | Security, anti-hijack, multi-tenant isolation & placement contracts                                                                                                             |
| `academic-phase9.spec.ts`                   | 47 passed, 0 failed                | No regression to Admin, Teacher, or Super Admin Stage-2 RBAC                                                                                                                    |
| `run-parent-navigation-tests.mjs`           | 6/6 checks passed                  | Sidebar structure, unique routes/guards, Redux child switch/logout, active highlights, breadcrumbs, SSR page rendering & non-parent role isolation                              |
| `run-navigation-tests.mjs`                  | 12/12 checks passed                | Zero regression to Academic Management navigation & role boundaries                                                                                                             |
| `parent-idor-authorization.spec.ts`         | Failed pre-existing DB setup check | Failed at pre-existing line 62 (`No academic year found in Org A for testing`) due to current dev database seed state; parent IDOR paths are covered in `parent-portal.spec.ts` |
