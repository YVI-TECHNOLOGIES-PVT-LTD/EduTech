# EduTrack ERP — Stage 3 Phase 3: Attendance Implementation & Online Join Semantics

> **Tables:** `classroom_session_attendance`  
> **Triggers Enforced:** `trg_s31_validate_session_attendance`, `trg_s31_audit_session_attendance`, `trg_s31_classroom_session_attendance_updated_at`

---

## 1. Live Attendance Marking & Correction (`PUT /teacher/sessions/:sessionId/attendance`)

1. **Strict Live-Session Gate:**
   - Both `ClassroomService.markTeacherAttendance` and PostgreSQL trigger `s31_validate_session_attendance` reject any attendance insert/update when `session_status !== 'in_progress'` (`409 SESSION_NOT_IN_PROGRESS`).
2. **Section Enrollment & Mode Integrity:**
   - Every submitted `student_id` is verified against `student_enrollments` matching the session's `section_id`, `academic_year_grade_id`, and `session_date` (`enrollment_date <= session_date AND (exit_date IS NULL OR exit_date >= session_date)`).
   - `present` and `late` require `participation_mode` (`'physical'` | `'online'`), whereas `absent` and `excused` force `participation_mode = NULL` (matching `ck_classroom_session_attendance_participation`).
   - Delivery-mode constraints enforce `participation_mode = 'physical'` for `physical` sessions and `'online'` for `online` sessions; `hybrid` sessions allow per-student mix of `physical` and `online`.
3. **Batch Atomic Upsert:**
   - Executed inside `prisma.$transaction` using `INSERT INTO classroom_session_attendance ... ON CONFLICT (session_id, student_id) DO UPDATE SET attendance_status = EXCLUDED.attendance_status, participation_mode = EXCLUDED.participation_mode, remarks = EXCLUDED.remarks, recorded_by = EXCLUDED.recorded_by, recorded_at = NOW()`.
   - `recorded_by` is always bound to the assigned session teacher's `user_id` so the database actor invariant holds.

---

## 2. Idempotent Student Online Join (`POST /student/sessions/:sessionId/join`)

1. **Preconditions Checked Server-Side:**
   - Authenticated user must hold `STUDENT` role and be actively enrolled in the session's section on `session_date` (`403` otherwise).
   - `session_status` must be `'in_progress'` (`409 SESSION_NOT_JOINABLE` if `scheduled`, `completed`, `cancelled`, or `not_conducted`).
   - `delivery_mode` must be `'online'` or `'hybrid'` (`409 PHYSICAL_SESSION_NO_ONLINE_JOIN` if `'physical'`) and `meeting_url` must be present (`409 MISSING_MEETING_URL`).
2. **Database-Consistent Auto-Attendance (`ON CONFLICT DO NOTHING`):**
   - Because `s31_validate_session_attendance` enforces `NEW.recorded_by = v_assigned_staff_user_id`, the repository records automatic online attendance with `attendance_status = 'present'`, `participation_mode = 'online'`, `remarks = 'Joined online session'`, and `recorded_by = assignedTeacherUserId` inside a transaction using:
     `INSERT INTO classroom_session_attendance (...) VALUES (...) ON CONFLICT (session_id, student_id) DO NOTHING RETURNING ...`
   - **First join:** inserts the attendance row (`already_recorded: false`), emits `classroom.attendance_updated` notifications/WS event (including teacher update), and returns the authorized `meeting_url`.
   - **Duplicate / reconnect joins:** hits `ON CONFLICT DO NOTHING`, reads the existing attendance row cleanly without throwing `409` or overwriting prior teacher corrections (e.g., `late`), and returns `{ session_id, meeting_url, attendance, already_recorded: true }`.

---

## 3. Server-Computed Attendance Analytics

Both Student (`/student/attendance`, `/student/overview`) and Parent (`/parent/children/:childId/attendance`, `/parent/children/:childId/overview`) endpoints compute all KPI counters directly in SQL (`getStudentAttendanceOverviewAndHistory`):

- `total_sessions`
- `conducted_sessions` (`session_status IN ('in_progress', 'completed')`)
- `marked_sessions`
- `present_count`, `late_count`, `absent_count`, `excused_count`
- `attended_count` (`present_count + late_count`)
- `attendance_percentage`: `ROUND(((present + late) / marked_sessions) * 100, 1)` when `marked_sessions > 0`, else `0`.

No client-side percentage math is trusted.
