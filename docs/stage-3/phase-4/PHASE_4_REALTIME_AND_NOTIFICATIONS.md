# Stage 3, Phase 4 — Realtime Updates & Notifications

1. **WebSocket Events (`apps/backend/src/modules/notifications/realtime/notification.realtime.ts`)**:
   - Added 6 events to `RealtimeNotificationEvent['type']`: `learning_activity.published`, `learning_activity.updated`, `learning_activity.closed`, `learning_submission.created`, `learning_submission.reviewed`, `learning_submission.resubmission_requested`.
2. **Persisted Bulk Notifications (`NotificationService.sendBulkNotifications`)**:
   - Activity publish/update/close notify section-enrolled students and linked parents with role-appropriate `action_url` (`/app/student/learning-activities`, `/app/parent/learning-activities`).
   - Student project submission notifies the assigned subject teacher (`/app/teacher/learning-activities`).
   - Teacher evaluation / resubmission request notifies the submitting student and linked parents.
3. **Payload Redaction & Fault Isolation**:
   - Event payloads contain only non-sensitive metadata (`activity_id`, `submission_id`, `activity_type`, `title`, `subject_name`, `section_name`, `due_at`, `submission_status`, `review_decision`, `obtained_marks`). Storage paths, buckets, and signed URLs are omitted.
   - Notification/EventBus/WS dispatches run inside isolated non-blocking `try/catch` guards so messaging errors never fail database transactions.
4. **Frontend RTK Cache Invalidation (`apps/web_app/src/features/notifications/hooks/useNotificationRealtime.ts`)**:
   - Invalidates `'LearningActivity'`, `'LearningSubmission'`, and `'LearningOverview'` tags on WebSocket reconnect and upon receiving any `learning_activity.*` or `learning_submission.*` event.
