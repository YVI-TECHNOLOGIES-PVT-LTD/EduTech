# EduTrack ERP — Stage 3 Phase 3: Student Portal Implementation

> **Student Route:** `/app/student/classroom` ([`StudentClassroomPage.tsx`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/classroom/pages/StudentClassroomPage.tsx))  
> **Dashboard Link:** [`StudentDashboard.tsx`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/dashboard/pages/StudentDashboard.tsx)  
> **Shared Badges & KPIs:** [`ClassroomBadges.tsx`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/classroom/components/ClassroomBadges.tsx)

---

## 1. Navigation & Role Guard

- [`route_registry.tsx`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/config/route_registry.tsx) mounts `/app/student/classroom` with `allowedRoles: ['STUDENT']`.
- [`navigation.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/config/navigation.ts) defines `STUDENT_NAVIGATION` (`/app/student/dashboard` and `/app/student/classroom`) and updates `getNavigationForUser()` so logged-in students see a dedicated sidebar menu.
- [`StudentDashboard.tsx`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/dashboard/pages/StudentDashboard.tsx) routes its primary quick action directly to `/app/student/classroom`.

---

## 2. Student Portal Features

1. **Overview & KPI Cards (`AttendanceSummaryCards`):**
   - Displays server-computed attendance percentage, total sessions, conducted sessions, present/late/absent/excused breakdown, and active section metadata (`useGetStudentClassroomOverviewQuery`).
2. **Sessions Tab (`useGetStudentClassroomSessionsQuery`):**
   - Filterable by `all`, `live`, `upcoming`, `past`, delivery mode, and subject/teacher search.
   - Displays shared [`SessionStatusBadge`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/classroom/components/ClassroomBadges.tsx), [`DeliveryModeBadge`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/classroom/components/ClassroomBadges.tsx), [`TeachingApproachBadge`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/classroom/components/ClassroomBadges.tsx), physical classroom code/name, topics covered, and the student's own recorded attendance badge.
   - **Conditional Join Button:** Active only when `can_join === true` (`session_status === 'in_progress'` and `delivery_mode` in `['online', 'hybrid']` with valid link). Clicking **Join Online Class** calls `useJoinStudentClassroomSessionMutation`, records idempotent online attendance on the server, opens the returned `meeting_url`, and refreshes attendance KPIs immediately.
   - Before a session goes live (or for physical/completed sessions), `meeting_url` is redacted (`null`) on the server and a descriptive status notice is displayed instead.
3. **Attendance History Tab (`useGetStudentClassroomAttendanceQuery`):**
   - Renders paginated attendance history across all conducted sessions in the student's section.
4. **Enrolled Subjects & Faculty Tab:**
   - Displays active subjects and assigned teachers from `overview.classes`.
