# EduTrack ERP — Stage 3 Phase 3: Database & Feature Audit (`S3.1` Hybrid Classroom)

> **Module:** Stage 3 `S3.1` — Hybrid Classroom Delivery (`classroom`)  
> **Schema Freeze Status:** **ENFORCED** ([`apps/backend/prisma/schema.prisma`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/prisma/schema.prisma) unmodified; SHA-256 `73d98492b3a7f2cbfd9348de94a0373ef530be966d6d00c3a4008bc0974d6c39`)  
> **Persistence Mode:** Parameterized PostgreSQL SQL via `prisma.$queryRawUnsafe` / `$executeRawUnsafe` inside `$transaction` (since the generated `@prisma/client` DMMF remains at `109` Stage 1/2 models and `39` Stage 3 models including the `S3.1` classroom tables are unmapped due to 3 frozen pre-existing `P1012` relation errors documented in Phase 2).

---

## 1. Pre-Implementation Repository & Schema Verification

Before writing any code, the repository and PostgreSQL catalog were audited for Stage `S3.1` artifacts:

1. **No Duplicate Classroom Implementation Existed:** Only physical room directory CRUD (`/academics/classrooms` -> `classrooms` table) and Stage 2 timetable/teacher-context/parent-portal read APIs existed prior to Phase 3.
2. **Reuse of Existing Core Infrastructure:**
   - **Teacher Assignment Context:** Reuses `section_subject_faculty_assignments`, `staff`, `academic_years`, `academic_year_grades`, `academic_year_grade_subjects`, `sections`, `grades`, `subjects`, `lesson_plans`, `curriculum_plan_units`, `curriculum_plans`, and `classrooms`.
   - **Student & Parent Links:** Reuses `students`, `student_enrollments`, `parents`, and `student_parents`.
   - **Authentication & Multi-Tenancy:** Mounts behind global [`authenticate`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/routes.ts), [`checkLoginApproval`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/routes.ts), and [`resolveTenantMiddleware`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/routes.ts).
   - **Real-Time & Persistent Notifications:** Reuses [`realtimeNotificationServer`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/notifications/realtime/notification.realtime.ts), [`NotificationService.sendBulkNotifications`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/notifications/services/notification.service.ts), and [`EventBus`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/workflows/event-bus.service.ts).

---

## 2. Physical Database Tables, Enums & Functions Verified in PostgreSQL

### 2.1 Core Tables & Column Inventory

| Physical Table                           | Primary Key                      | Key Columns                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| :--------------------------------------- | :------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public.classroom_sessions`              | `session_id` (`uuid`)            | `org_id`, `academic_year_id`, `timetable_entry_id`, `creation_method` (`classroom_session_creation_method`), `section_id`, `academic_year_grade_subject_id`, `faculty_assignment_id`, `lesson_plan_id`, `classroom_id`, `session_date` (`date`), `scheduled_start_time` (`time`), `scheduled_end_time` (`time`), `actual_start_at` (`timestamptz`), `actual_end_at` (`timestamptz`), `delivery_mode` (`classroom_delivery_mode`), `teaching_approach` (`classroom_teaching_approach`), `meeting_url` (`varchar`), `session_status` (`classroom_session_status`), `topics_covered`, `teacher_remarks`, `not_conducted_reason`, `created_by`, `updated_by`, `created_at`, `updated_at` |
| `public.classroom_session_attendance`    | `session_attendance_id` (`uuid`) | `org_id`, `session_id`, `student_id`, `enrollment_id`, `attendance_status` (`classroom_attendance_status`), `participation_mode` (`classroom_participation_mode`), `recorded_by`, `recorded_at`, `remarks`, `created_at`, `updated_at`                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `public.classroom_session_audit_history` | `audit_id` (`uuid`)              | `org_id`, `entity_type` (`varchar(40)`: `'classroom_session'` \| `'session_attendance'`), `entity_id` (`uuid`), `action` (`'INSERT'` \| `'UPDATE'` \| `'DELETE'`), `old_values` (`jsonb`), `new_values` (`jsonb`), `actor_user_id` (`uuid`), `occurred_at` (`timestamptz`)                                                                                                                                                                                                                                                                                                                                                                                                           |

> **Important Schema Discovery Verified Against PG:**
>
> - `classroom_session_audit_history.entity_type` is `VARCHAR(40)` (NOT a PostgreSQL enum type), constrained via CHECK constraint `ck_classroom_session_audit_entity`, and indexed on `(org_id, entity_type, entity_id, occurred_at DESC)`.
> - `lesson_plans.curriculum_unit_id` joins `curriculum_plan_units` -> `curriculum_plans` (`cp.org_id`, `cp.academic_year_grade_subject_id`).
> - `classroom_session_attendance` uses `recorded_by` (no `updated_by` column).
> - `fk_classroom_session_attendance_session_org` has `ON DELETE RESTRICT` / `NO ACTION`.

### 2.2 PostgreSQL Enums (`S3.1`)

- `classroom_session_status`: `'scheduled' | 'in_progress' | 'completed' | 'not_conducted' | 'cancelled'`
- `classroom_delivery_mode`: `'physical' | 'online' | 'hybrid'`
- `classroom_teaching_approach`: `'traditional' | 'flipped'`
- `classroom_session_creation_method`: `'automatic' | 'manual'`
- `classroom_attendance_status`: `'present' | 'absent' | 'late' | 'excused'`
- `classroom_participation_mode`: `'physical' | 'online'`

_(Note: `notifications.category` only defines `'ADMISSION' | 'ATTENDANCE' | 'FEE' | 'EXAM' | 'SYSTEM'`; classroom notifications therefore emit using `'SYSTEM'` for session lifecycle events and `'ATTENDANCE'` for attendance updates.)_

### 2.3 Constraints, Triggers, RLS Policies & Stored Function

- **`classroom_sessions` Constraints:**
  - `ck_classroom_sessions_scheduled_time`: `scheduled_end_time > scheduled_start_time`
  - `ck_classroom_sessions_actual_time`: `actual_end_at IS NULL OR (actual_start_at IS NOT NULL AND actual_end_at > actual_start_at)`
  - `ck_classroom_sessions_creation_source`: `creation_method <> 'automatic' OR timetable_entry_id IS NOT NULL`
  - `ck_classroom_sessions_delivery_location`: `(delivery_mode IN ('physical','hybrid') AND classroom_id IS NOT NULL) OR (delivery_mode = 'online' AND classroom_id IS NULL)`
  - `ck_classroom_sessions_not_conducted_reason`: `session_status <> 'not_conducted' OR NULLIF(btrim(not_conducted_reason), '') IS NOT NULL`
  - `ck_classroom_sessions_status_timestamps`: tight invariant coupling `(session_status, actual_start_at, actual_end_at)`
  - Partial Unique Index `uq_classroom_sessions_timetable_date`: `(timetable_entry_id, session_date) WHERE timetable_entry_id IS NOT NULL`
  - Composite Foreign Keys enforcing tenant ownership & cross-column integrity (`fk_classroom_sessions_classroom_org`, `fk_classroom_sessions_faculty_assignment`, `fk_classroom_sessions_created_by`, `fk_classroom_sessions_updated_by`).
- **`classroom_session_attendance` Constraints:**
  - `ck_classroom_session_attendance_participation`: requires non-null `participation_mode` on `'present'`/`'late'` and `NULL` on `'absent'`/`'excused'`.
  - Unique Index `uq_classroom_session_attendance_session_student`: `(session_id, student_id)`.
- **Active PostgreSQL Triggers:**
  - `trg_s31_validate_classroom_session` -> `s31_validate_classroom_session()` (org alignment, academic-year date bounds, active faculty assignment on `session_date`, lesson plan teacher match, published timetable checks).
  - `trg_s31_session_transition` -> `s31_validate_session_transition()` (`scheduled -> in_progress | cancelled | not_conducted`; `in_progress -> completed`).
  - `trg_s31_validate_session_attendance` -> `s31_validate_session_attendance()` (blocks writes/deletes when `session_status <> 'in_progress'`, requires `NEW.recorded_by = assigned teacher's user_id`, checks active `student_enrollments` on `session_date` and mode matching for `physical`/`online` sessions).
  - `trg_s31_audit_classroom_sessions` & `trg_s31_audit_session_attendance` -> `s31_write_classroom_audit()` (writes immutable `INSERT`/`UPDATE`/`DELETE` JSONB snapshots into `classroom_session_audit_history`).
  - `trg_s31_classroom_sessions_updated_at` & `trg_s31_classroom_session_attendance_updated_at` -> `s31_set_updated_at()`.
- **RLS Policies:** `p_classroom_sessions_{select,insert,update}`, `p_classroom_session_attendance_{select,insert,update}`, `p_classroom_session_audit_history_select`.
- **Database Procedure:** `s31_generate_classroom_sessions_for_date_range(p_org_id, p_academic_year_id, p_start_date, p_end_date)` generates `automatic` sessions idempotently from `published` `timetable_versions` while respecting `academic_calendar_working_days`, school-wide/grade-specific holidays, and faculty assignment date validity.
