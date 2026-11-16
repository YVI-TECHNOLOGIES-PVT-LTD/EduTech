# EduTrack ERP — Stage 3 Phase 3: Backend Architecture & Implementation

> **Module:** [`apps/backend/src/modules/classroom/`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/classroom/index.ts)  
> **Mount Prefix:** `/api/v1/classroom` _(and alias `/api/classroom`)_ in [`apps/backend/src/routes.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/routes.ts)

---

## 1. Module File Inventory

| Component                | Path                                                                                                                                                                                                                                                                   | Responsibility                                                                                                                                                                                                    |
| :----------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Types & Error Hierarchy  | [`classroom.types.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/classroom/classroom.types.ts)                                                                                                                                           | Domain unions matching PG enums, `ClassroomEventType`, HTTP error classes (`400`, `403`, `404`, `409`), and DTO contracts.                                                                                        |
| Validation Schemas       | [`classroom.validation.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/classroom/classroom.validation.ts)                                                                                                                                 | Zod schemas (`uuidSchema`, real calendar date check, `HH:mm[:ss]` normalization, `http/https` meeting URL guard, delivery mode mutual rules, `<= 31`-day bulk generation window).                                 |
| Authorization Policies   | [`classroom.policy.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/classroom/classroom.policy.ts)                                                                                                                                         | Role-gated Express middleware (`requireTeacherRole`, `requireAdminRole`, `requireStudentRole`, `requireParentRole`) using `getEffectiveRoles` and `ParentPortalPolicy`.                                           |
| Parameterized Repository | [`classroom.repository.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/classroom/classroom.repository.ts)                                                                                                                                 | Tenant-scoped SQL queries and `$transaction` mutations directly on `classroom_sessions`, `classroom_session_attendance`, `classroom_session_audit_history`, and `s31_generate_classroom_sessions_for_date_range`. |
| Domain Service           | [`classroom.service.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/classroom/classroom.service.ts)                                                                                                                                       | Lifecycle state machine, conflict checks, idempotent join & transition handling, PG trigger error translation, and non-blocking WS + notification dispatch.                                                       |
| Controller & Routes      | [`classroom.controller.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/classroom/classroom.controller.ts), [`classroom.routes.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/classroom/classroom.routes.ts) | Strict role-namespaced endpoints under `/teacher`, `/admin`, `/student`, and `/parent`.                                                                                                                           |

---

## 2. Complete HTTP API Contract (`/api/v1/classroom`)

### 2.1 Teacher Endpoints (`/teacher/*`, `ClassroomPolicy.requireTeacherRole()`)

| Method  | Route                                        | Description                                                                                                                                                        |
| :------ | :------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`   | `/teacher/overview`                          | Assigned classes, live/today/upcoming/completed KPIs, active rooms, owned lesson plans, and academic years.                                                        |
| `GET`   | `/teacher/classes`                           | Active section-subject assignments (`section_subject_faculty_assignments`) for the logged-in staff user.                                                           |
| `GET`   | `/teacher/sessions`                          | Paginated, filtered (`view`, `status`, `delivery_mode`, `teaching_approach`, `section_id`, `subject_id`, `date_from`, `date_to`, `search`) teacher-owned sessions. |
| `POST`  | `/teacher/sessions`                          | Create a manual session after verifying faculty ownership, classroom tenant scope, optional lesson-plan ownership, and overlap conflicts.                          |
| `GET`   | `/teacher/sessions/:sessionId`               | Session DTO plus enrolled student roster and live/historical attendance records.                                                                                   |
| `PATCH` | `/teacher/sessions/:sessionId`               | Update `scheduled` session metadata with full delivery-mode & overlap re-validation.                                                                               |
| `POST`  | `/teacher/sessions/:sessionId/start`         | Transition `scheduled -> in_progress` (`actual_start_at = NOW()`), idempotent on repeat.                                                                           |
| `POST`  | `/teacher/sessions/:sessionId/complete`      | Transition `in_progress -> completed` (`actual_end_at = NOW()`), idempotent on repeat.                                                                             |
| `POST`  | `/teacher/sessions/:sessionId/cancel`        | Transition `scheduled -> cancelled`, idempotent on repeat.                                                                                                         |
| `POST`  | `/teacher/sessions/:sessionId/not-conducted` | Transition `scheduled -> not_conducted` with required non-blank `not_conducted_reason`.                                                                            |
| `PUT`   | `/teacher/sessions/:sessionId/attendance`    | Batch upsert (`ON CONFLICT (session_id, student_id)`) attendance rows while `in_progress`.                                                                         |
| `GET`   | `/teacher/sessions/:sessionId/audit`         | Read PG trigger audit history (`classroom_session_audit_history`) for the owned session and its attendance rows.                                                   |

### 2.2 Admin Oversight Endpoints (`/admin/*`, `ClassroomPolicy.requireAdminRole()`)

| Method | Route                              | Description                                                                                                       |
| :----- | :--------------------------------- | :---------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/admin/academic-years`            | Institution academic years with published timetable availability indicators.                                      |
| `POST` | `/admin/sessions/generate`         | Invokes PostgreSQL `s31_generate_classroom_sessions_for_date_range(...)` idempotently (`<= 31` days per request). |
| `GET`  | `/admin/sessions`                  | Institution-wide read-only oversight view of classroom sessions across teachers/grades/sections.                  |
| `GET`  | `/admin/sessions/:sessionId/audit` | Full audit history for any classroom session inside the verified tenant organization.                             |

### 2.3 Student Endpoints (`/student/*`, `ClassroomPolicy.requireStudentRole()`)

| Method | Route                               | Description                                                                                                                                     |
| :----- | :---------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/student/overview`                 | Active enrollment metadata, next live/upcoming sessions, and server-computed attendance summary.                                                |
| `GET`  | `/student/classes`                  | Enrolled subjects & assigned teachers for the student's active section.                                                                         |
| `GET`  | `/student/sessions`                 | Section-scoped sessions; masks `meeting_url` until `session_status === 'in_progress'` and computes `can_join` + `join_reason`.                  |
| `GET`  | `/student/sessions/:sessionId`      | Session detail (verifies section enrollment on `session_date`) with conditional `meeting_url` exposure.                                         |
| `POST` | `/student/sessions/:sessionId/join` | Idempotently marks `present` (`online`) attendance (`recorded_by = assigned teacher's user_id`) and returns `meeting_url` + `already_recorded`. |
| `GET`  | `/student/attendance`               | Server-computed attendance KPI summary and paginated attendance history.                                                                        |

### 2.4 Parent Read-Only Endpoints (`/parent/*`, `ClassroomPolicy.requireParentRole()`)

| Method | Route                                  | Description                                                                                                                               |
| :----- | :------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/parent/children/:childId/overview`   | Read-only overview of linked child's attendance summary and upcoming sessions (`ParentPortalPolicy` + `student_parents` ownership check). |
| `GET`  | `/parent/children/:childId/sessions`   | Read-only session schedule (`meeting_url` always `null`; `can_join` always `false`).                                                      |
| `GET`  | `/parent/children/:childId/attendance` | Read-only server-computed attendance summary and session-by-session attendance history.                                                   |

---

## 3. PostgreSQL Constraint Translation

[`translatePgClassroomError`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/classroom/classroom.service.ts#L28-L64) maps raw PostgreSQL trigger/CHECK/unique exceptions into deterministic HTTP status codes (`400`, `403`, `409`) so database invariants remain the final safety net without exposing raw driver errors to clients.
