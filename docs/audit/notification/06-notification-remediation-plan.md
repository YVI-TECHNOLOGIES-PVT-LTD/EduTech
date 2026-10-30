# EduTrack ERP — Notification Module Audit: Remediation Plan & Verified Fixes

**Document Reference:** `docs/audit/notification/06-notification-remediation-plan.md`  
**Audit Date:** October 2026  
**Auditor Role:** Senior Software Architect & Lead Security Engineer  
**Status:** All P1 Defects Remediated & Verified; P2/P3 Architectural Roadmap Defined

---

## 1. Executive Summary

This remediation plan documents the findings identified during the comprehensive Notification Module audit, categorizes them by severity (P0 to P3), details the verified code fixes implemented, and outlines recommended architectural enhancements for subsequent phases under database schema freeze constraints.

---

## 2. Findings Classification & Status Summary

| Finding ID | Severity        | Category                 | Description                                                                                                             | Status                      |
| :--------- | :-------------- | :----------------------- | :---------------------------------------------------------------------------------------------------------------------- | :-------------------------- |
| **SEC-01** | **P1 (High)**   | Security / Multi-Tenancy | `NotificationController` permitted unvalidated `x-tenant-id` request headers to override tenant context.                | **REMEDIATED & VERIFIED**   |
| **SEC-02** | **P1 (High)**   | Security / Privacy       | `RealtimeNotificationServer.sendToOrg` broadcasted internal CRM domain events to parent and student WebSocket sessions. | **REMEDIATED & VERIFIED**   |
| **SEC-03** | **P1 (High)**   | Security / Authorization | `NotificationSubscriber` fell back to arbitrary active users in `users` table when resolving missing recipients.        | **REMEDIATED & VERIFIED**   |
| **GAP-01** | **P2 (Medium)** | Workflow Coverage        | Attendance events (absent, late, leave) not wired to publish notifications.                                             | **DOCUMENTED FOR PHASE 17** |
| **GAP-02** | **P2 (Medium)** | Workflow Coverage        | School announcement/feed post creation not wired to in-app notification dispatch.                                       | **DOCUMENTED FOR PHASE 17** |
| **ARC-01** | **P2 (Medium)** | Database Architecture    | Missing `user_device_tokens` table prevents native FCM/APNS push registration.                                          | **STAGE-2 DDL ROADMAP**     |
| **ARC-02** | **P3 (Low)**    | Database Architecture    | Missing `notification_preferences` table prevents per-user channel opt-in/opt-out.                                      | **STAGE-2 DDL ROADMAP**     |
| **ARC-03** | **P3 (Low)**    | Reliability              | Missing `notification_outbox` table requires in-memory EventBus rather than transactional outbox.                       | **STAGE-2 DDL ROADMAP**     |

---

## 3. Detailed Remediation Actions Implemented

### 3.1 SEC-01 Remediation: Strict Tenant Context from Cryptographic Session

- **Target File:** `apps/backend/src/modules/notifications/controllers/notification.controller.ts`
- **Root Cause:** Line 14 allowed `(req.headers['x-tenant-id'] as string)` as a fallback tenant identifier for user notification queries.
- **Implemented Fix:** Removed untrusted header inspection. Tenant context is now strictly derived from `req.context?.user?.org_id` or `user?.school_id`.
- **Verification Evidence:** All 11 unit tests in `notification.service.spec.ts` pass; tenant isolation verified.

### 3.2 SEC-02 Remediation: Role-Based Segregation in WebSocket Domain Broadcasts

- **Target File:** `apps/backend/src/modules/notifications/realtime/notification.realtime.ts`
- **Root Cause:** `sendToOrg(orgId, payload)` transmitted raw domain events to all connected sockets in the tenant, exposing CRM leads and applicant PII to parent/student mobile clients.
- **Implemented Fix:** In `sendToOrg`, sockets belonging exclusively to `PARENT` or `STUDENT` accounts are skipped. Only administrative and staff sockets receive internal domain event broadcasts.
- **Verification Evidence:** All 4 E2E multi-session realtime tests pass; parents continue to receive personal notifications via `sendToUser`.

### 3.3 SEC-03 Remediation: Hardened Recipient Resolution Fallback

- **Target File:** `apps/backend/src/modules/notifications/subscribers/notification.subscriber.ts`
- **Root Cause:** In `resolveApplicationRecipient`, `ACTIVITY_ADDED`, and `ENROLLED`, the organization fallback queried `db.users.findFirst({ where: { org_id: ..., status: 'active' } })`. This could resolve an unrelated parent or student user.
- **Implemented Fix:** Replaced generic `users` queries with targeted `db.staff.findFirst({ where: { org_id: ..., is_active: true } })`. If no active staff member is found, the subscriber logs an operational warning and safely omits dispatch instead of sending sensitive notifications to arbitrary users.
- **Verification Evidence:** 100% pass across E2E multi-session and subscriber test suites.

---

## 4. Verification Test Matrix

```text
========================================================================================
TEST SUITE                                           PASSED   FAILED   PASS RATE   STATUS
========================================================================================
Notification DTO & Service Unit Tests                     11        0      100%      PASS
Realtime Multi-Session WebSocket E2E Suite                 4        0      100%      PASS
Finance Phase 9 Notification & Communication Suite        24        0      100%      PASS
Mobile Phase 6 Notification & Resilience Suite            25        0      100%      PASS
----------------------------------------------------------------------------------------
TOTAL AUTOMATED NOTIFICATION VERIFICATIONS                64        0      100%      PASS
========================================================================================
TypeScript Compilation (Backend: `tsc --noEmit`)           0 errors                  PASS
TypeScript Compilation (Mobile: `tsc --noEmit`)            0 errors                  PASS
TypeScript Compilation (Web: `tsc --noEmit`)               0 errors                  PASS
========================================================================================
```

---

## 5. Staged Implementation Roadmap for Gaps (Post-Freeze)

### Phase 17 — Attendance & Announcement Event Publishing

1. **Attendance Events:**
   - In `AttendanceCoordinatorService.ts`, inject `EventBus.publish('attendance.marked.absent', payload)` when daily attendance is submitted.
   - Register subscriber in `NotificationSubscriber` to send in-app notification to parents with action link `/app/attendance`.
2. **Announcement Feeds:**
   - Wire `feed_posts` publishing workflow to dispatch high-priority notifications to target audience scopes (`ALL_STUDENTS`, `ALL_PARENTS`, `ALL_STAFF`).

### Stage-2 Database DDL Enhancements

1. Apply DDL migration to create `public.user_device_tokens`.
2. Deploy backend endpoint `POST /v1/notifications/devices` to register Expo/FCM push tokens.
3. Apply DDL migration to create `public.notification_preferences` and mount user settings screen.
4. Implement PostgreSQL transactional outbox worker for guaranteed cross-process message delivery.
