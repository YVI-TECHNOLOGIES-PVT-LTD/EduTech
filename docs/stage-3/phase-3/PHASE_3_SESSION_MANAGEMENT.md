# EduTrack ERP — Stage 3 Phase 3: Session Management & Lifecycle Governance

> **Repository:** [`classroom.repository.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/classroom/classroom.repository.ts)  
> **Service:** [`classroom.service.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/classroom/classroom.service.ts)  
> **Validation:** [`classroom.validation.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/classroom/classroom.validation.ts)

---

## 1. Dual Creation Workflows (Timetable Generation & Manual Scheduling)

### 1.1 Idempotent Bulk Generation from Published Timetables

Admins trigger `POST /api/v1/classroom/admin/sessions/generate` with `{ academic_year_id, start_date, end_date }`.

- [`generateSessionsSchema`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/classroom/classroom.validation.ts#L185-L210) validates UUID format, calendar date validity, `end_date >= start_date`, and limits synchronous generation batches to `31` days.
- [`ClassroomRepository.generateSessionsFromTimetable`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/classroom/classroom.repository.ts) executes `SELECT public.s31_generate_classroom_sessions_for_date_range($1::uuid, $2::uuid, $3::date, $4::date) AS created_count`.
- PostgreSQL respects `academic_calendar_working_days`, published school-wide and grade-specific holidays/vacations/closures, active teacher assignments (`effective_from`/`effective_to`), and relies on partial unique index `uq_classroom_sessions_timetable_date` (`ON CONFLICT DO NOTHING`) so repeat runs return `created_count: 0` cleanly.

### 1.2 Teacher Manual Session Scheduling & Conflict Detection

Teachers create sessions via `POST /api/v1/classroom/teacher/sessions`.

- Ownership verification ensures `faculty_assignment_id` belongs to the authenticated staff member in the current tenant organization (`verifyTeacherFacultyAssignment`).
- Optional `lesson_plan_id` is verified against `lesson_plans.teacher_staff_id` before insert.
- **Delivery Mode Mutual Validation** mirrors `ck_classroom_sessions_delivery_location`:
  - `'physical'`: `classroom_id` required, `meeting_url` must be `null`.
  - `'online'`: `classroom_id` must be `null`, valid `http://`/`https://` `meeting_url` required.
  - `'hybrid'`: both `classroom_id` and `meeting_url` required.
- **Schedule Overlap Check (`409 SESSION_SCHEDULE_CONFLICT`)**: [`checkSessionConflicts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/classroom/classroom.repository.ts#L545) scans active non-cancelled/non-not-conducted sessions on the same `session_date` where `scheduled_start_time < new_end AND scheduled_end_time > new_start` across three dimensions:
  1. **Teacher conflict** (`fa.staff_id`)
  2. **Section conflict** (`cs.section_id`)
  3. **Physical room conflict** (`cs.classroom_id`, when assigned)

---

## 2. Deterministic Session Lifecycle State Machine

```text
                ┌──────────────┐
       ┌────────┤  scheduled   ├────────┐
       │        └──────┬───────┘        │
       ▼               ▼                ▼
┌─────────────┐  ┌───────────┐  ┌───────────────┐
│  cancelled  │  │in_progress│  │ not_conducted │
└─────────────┘  └─────┬─────┘  └───────────────┘
                       ▼
                 ┌───────────┐
                 │ completed │
                 └───────────┘
```

1. **Enforced Both in Service & PostgreSQL Trigger (`s31_validate_session_transition`):**
   - `scheduled -> in_progress` sets `actual_start_at = NOW()`.
   - `in_progress -> completed` sets `actual_end_at = NOW()` and locks further metadata or attendance edits (`409`).
   - `scheduled -> not_conducted` requires non-blank `not_conducted_reason`.
   - `scheduled -> cancelled` closes an unstarted session cleanly.
   - Reverse transitions (e.g., `completed -> in_progress`) and cross-terminal transitions are rejected with `409 INVALID_STATUS_TRANSITION`.
2. **Idempotent Retries:** Repeating an already-reached target transition (`start` on `in_progress`, `complete` on `completed`, `cancel` on `cancelled`) returns HTTP `200` with `{ session, already_in_state: true }` without firing duplicate side effects.
3. **Immutable Audit Trail:** Every `INSERT`, `UPDATE`, and `DELETE` on `classroom_sessions` is captured automatically by PostgreSQL trigger `trg_s31_audit_classroom_sessions` (`s31_write_classroom_audit`) in `classroom_session_audit_history` and queryable via `/teacher/sessions/:sessionId/audit` and `/admin/sessions/:sessionId/audit`.
