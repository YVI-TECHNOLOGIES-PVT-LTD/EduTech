# EduTrack ERP — Stage 3 Phase 3: Teacher Portal & Admin Oversight Implementation

> **Teacher Route:** `/app/teacher/classroom` ([`TeacherClassroomPage.tsx`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/classroom/pages/TeacherClassroomPage.tsx))  
> **Admin Oversight Route:** `/app/admin/classroom` ([`AdminClassroomPage.tsx`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/classroom/pages/AdminClassroomPage.tsx))  
> **API Client:** [`classroom.api.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/shared/api/classroom.api.ts)

---

## 1. Teacher Portal (`/app/teacher/classroom`)

### 1.1 Access Control & Navigation

- Guarded in [`route_registry.tsx`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/config/route_registry.tsx) (`allowedRoles: ['TEACHER', 'FACULTY']`).
- Exposed in `TEACHER_NAVIGATION` in [`navigation.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/config/navigation.ts) as **Hybrid Classroom**.

### 1.2 Capabilities Implemented

1. **KPI Summary Cards:** Displays active assigned classes count, live sessions count, today's sessions count, and upcoming scheduled sessions count backed by `useGetTeacherClassroomOverviewQuery`.
2. **Schedule & Session Creation Modal/Panel:**
   - Selects from the teacher's active `section_subject_faculty_assignments`, optional owned `lesson_plans` filtered by offering, delivery mode (`physical`, `online`, `hybrid`), teaching approach (`traditional`, `flipped`), physical `classroom_id`, and `http(s)://` meeting link.
   - Surfaces real `409 SESSION_SCHEDULE_CONFLICT` and Zod validation feedback inline via toast & error banners.
3. **Session List & Filters:** View tabs (`all`, `live`, `upcoming`, `today`, `past`), status filter, delivery mode filter, keyword search, and pagination.
4. **Live Session & Attendance Workspace:**
   - Start session (`scheduled -> in_progress`), Complete session (`in_progress -> completed`), Cancel session, or mark Not Conducted (requiring non-blank reason).
   - Displays enrolled section roster (`ClassroomRosterStudentDto[]`) with per-student attendance status buttons (`present`, `late`, `absent`, `excused`), participation mode toggle (`physical` / `online` for hybrid, locked cleanly for physical/online), remarks input, and batch `Save Attendance` (`useMarkTeacherClassroomAttendanceMutation`).
   - Locks editing/attendance controls cleanly once a session reaches `completed`, `cancelled`, or `not_conducted`.
5. **Immutable Audit Trail Tab:** Renders `classroom_session_audit_history` entries (`INSERT`/`UPDATE` before/after values, actor name, timestamp) via `useGetTeacherSessionAuditQuery`.

---

## 2. Institutional Admin Oversight (`/app/admin/classroom`)

- Guarded in [`route_registry.tsx`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/config/route_registry.tsx) (`allowedRoles: ['ADMIN', 'ORG_ADMIN', 'SUPER_ADMIN', 'SUPERADMIN', 'PRINCIPAL', 'HOI']`).
- Placed in `ADMIN_NAVIGATION` (`adm_classroom`) cleanly as a top-level item (preserving the exact 11-item Stage 2 `adm_academic_group` navigation contract).
- Provides:
  - Academic year selector (prioritizing academic years with published timetables).
  - Date-range Timetable Session Generation form (`useGenerateAdminClassroomSessionsMutation`) invoking `POST /api/v1/classroom/admin/sessions/generate`.
  - Read-only school-wide session oversight table showing delivery mode, teaching approach, status, teacher, section, and server attendance summary counters.
