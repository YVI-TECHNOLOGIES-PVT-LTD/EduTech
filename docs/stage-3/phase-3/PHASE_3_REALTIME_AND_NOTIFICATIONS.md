# EduTrack ERP — Stage 3 Phase 3: Real-Time WebSockets & Persistent Notifications

> **Backend Dispatch:** [`dispatchClassroomRealtimeAndNotifications`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/classroom/classroom.service.ts#L85-L193)  
> **Realtime Server:** [`notification.realtime.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/notifications/realtime/notification.realtime.ts)  
> **Frontend Hook:** [`useNotificationRealtime.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/features/notifications/hooks/useNotificationRealtime.ts)

---

## 1. Event Taxonomy

Extended `RealtimeNotificationEvent['type']` in [`notification.realtime.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/notifications/realtime/notification.realtime.ts) and [`ClassroomEventType`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/classroom/classroom.types.ts#L15-L25) with 7 canonical domain events:

1. `classroom.session_scheduled`
2. `classroom.session_updated`
3. `classroom.session_started`
4. `classroom.session_completed`
5. `classroom.session_cancelled`
6. `classroom.session_not_conducted`
7. `classroom.attendance_updated`

---

## 2. Targeted Scoped Delivery & Redaction Architecture

Because [`RealtimeNotificationServer.sendToOrg`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/notifications/realtime/notification.realtime.ts) intentionally skips `PARENT` and `STUDENT` sockets on org-wide broadcasts, Hybrid Classroom uses **explicit user-targeted dispatch** (`realtimeNotificationServer.sendToUser(orgId, userId, payload)`):

1. **Audience Resolution (`ClassroomRepository.getSessionAudienceUsers`):** Resolves ONLY:
   - Actively enrolled students (`student_enrollments` valid on `session_date` -> `students.user_id`), or the specific updated students for attendance events.
   - Linked parents of those students (`student_parents` -> `parents.user_id`).
   - The assigned teacher (`staff.user_id`).
2. **Confidential Payload Redaction:** WebSocket broadcasts and notification metadata carry ONLY non-sensitive summary fields (`session_id`, `section_id`, `subject_id`, `subject_name`, `section_name`, `session_date`, `scheduled_start_time`, `scheduled_end_time`, `session_status`, `delivery_mode`, `teaching_approach`, `has_meeting_url`). Private `meeting_url` values are **never** emitted over WebSockets or persisted inside notification metadata; authorized students fetch `meeting_url` strictly over authenticated HTTP once the session is `in_progress`.
3. **Non-Blocking Resilience:** All `EventBus.publish`, `realtimeNotificationServer.sendToUser`, and `NotificationService.sendBulkNotifications` dispatches execute inside defensive `try / catch` blocks after database commits. Failures log warnings without aborting or rolling back committed session or attendance transactions (verified in `classroom.spec.ts` Group 8).
4. **Canonical Enum Alignment:** Persisted database notifications map to existing PostgreSQL `notification_category` values (`SYSTEM` for session schedule/lifecycle updates and `ATTENDANCE` for attendance updates) with role-scoped `action_url` destinations (`/app/student/classroom`, `/app/parent/classroom`, `/app/teacher/classroom`).

---

## 3. Frontend RTK Query Cache Invalidation

[`useNotificationRealtime.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/features/notifications/hooks/useNotificationRealtime.ts) handles:

- `connection.ack` reconnects by invalidating `['ClassroomOverview', 'ClassroomSession', 'ClassroomAttendance']`.
- Any of the 7 `classroom.*` WebSocket events by immediately dispatching `apiSlice.util.invalidateTags(['ClassroomOverview', 'ClassroomSession', 'ClassroomAttendance'])` so open Teacher, Student, Parent, and Admin screens update live without polling or manual page reload.
