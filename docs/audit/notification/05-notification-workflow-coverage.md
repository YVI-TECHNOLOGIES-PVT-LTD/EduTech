# EduTrack ERP — Notification Module Audit: Business Workflow Coverage Matrix

**Document Reference:** `docs/audit/notification/05-notification-workflow-coverage.md`  
**Audit Date:** October 2026  
**Auditor Role:** Principal ERP Integration Specialist & QA Architect  
**Scope:** Verification of cross-module event dispatching, recipient resolution, and UI presentation across Admissions, Finance, Attendance, Announcements, and Mobile clients.

---

## 1. Executive Summary

This workflow coverage audit establishes which ERP lifecycle events trigger notifications, how recipients are resolved, whether templates are properly parameterized, and how notifications are presented to end users.

**Summary of Workflow Coverage:**

- **Admissions & CRM:** **100% Implemented & Verified** (7 domain events active).
- **Finance & Fees:** **100% Implemented & Verified** (13 domain events active + batch reminders).
- **Attendance:** **Gap Identified** (Absence, late arrival, and leave events are not currently published to `EventBus` or `NotificationService`).
- **Announcements / Circulars:** **Gap Identified** (`feed_posts` exists in Prisma schema, but active notification broadcast workers are not yet implemented).
- **Parent Mobile App Experience:** **100% Implemented & Verified** for in-app feed, unread badge, and deep linking; Push Notifications (FCM/APNS) are safely stubbed to WebSocket pending database schema expansion.

---

## 2. Admissions & CRM Lifecycle Workflows

**Subscriber:** `apps/backend/src/modules/notifications/subscribers/notification.subscriber.ts`  
**Event Enum:** `LeadEventType` / `ApplicationEventType` / `StudentEventType`

| Event Type                      | Trigger Origin                          | Recipient Resolution Strategy                                                            | Priority                    | In-App Bell | Realtime WS | Action Deep Link                   | Status       |
| :------------------------------ | :-------------------------------------- | :--------------------------------------------------------------------------------------- | :-------------------------- | :---------- | :---------- | :--------------------------------- | :----------- |
| `lead.activity_added`           | Follow-up logged by counselor/staff     | Assigned counselor (if different from actor) -> Lead creator -> Fallback to active staff | NORMAL                      | Yes         | Yes         | `/app/leads`                       | **VERIFIED** |
| `lead.assigned`                 | Lead counselor assignment changed       | Newly assigned counselor staff user                                                      | HIGH                        | Yes         | Yes         | `/app/leads`                       | **VERIFIED** |
| `application.status_changed`    | Application lifecycle step transitions  | Applicant / Linked Parent User                                                           | Varies                      | Yes         | Yes         | `/app/admissions/applications/:id` | **VERIFIED** |
| `application.document_verified` | Document verification approved/rejected | Applicant / Linked Parent User                                                           | HIGH (if rejected) / NORMAL | Yes         | Yes         | `/app/admissions/applications/:id` | **VERIFIED** |
| `application.decision_recorded` | Offer made, waitlisted, or rejected     | Applicant / Linked Parent User                                                           | HIGH (if approved) / NORMAL | Yes         | Yes         | `/app/admissions/applications/:id` | **VERIFIED** |
| `application.payment_recorded`  | Application fee paid                    | Applicant / Linked Parent User                                                           | NORMAL                      | Yes         | Yes         | `/app/admissions/applications/:id` | **VERIFIED** |
| `student.enrolled`              | Formal student enrollment finalized     | Student User account or Parent User                                                      | NORMAL                      | Yes         | Yes         | `/app/students/:id`                | **VERIFIED** |

---

## 3. Finance & Fees Lifecycle Workflows

**Subscriber:** `apps/backend/src/modules/fees/subscribers/finance-notification.subscriber.ts`  
**Service:** `apps/backend/src/modules/fees/services/FinanceNotificationService.ts`  
**Event Enum:** `FinanceEventType` (`apps/backend/src/modules/fees/events/finance.events.ts`)

| Event Type                          | Trigger Origin                            | Recipient Resolution                   | Supported Channels           | Action Deep Link              | Status       |
| :---------------------------------- | :---------------------------------------- | :------------------------------------- | :--------------------------- | :---------------------------- | :----------- |
| `fee.assessment.created`            | New fee structure demand posted           | Linked parents / student               | In-App, Email, SMS           | `/app/finance/receivables`    | **VERIFIED** |
| `fee.due.soon`                      | Scheduled cron 3-7 days before due date   | Linked parents / student               | In-App, Email, SMS, WhatsApp | `/app/finance/receivables`    | **VERIFIED** |
| `fee.overdue`                       | Unpaid ledger balance past due date       | Linked parents / student               | In-App, Email, SMS, WhatsApp | `/app/finance/receivables`    | **VERIFIED** |
| `fee.payment.initiated`             | Razorpay order created                    | Paying parent / student                | In-App, Email                | `/app/finance/transactions`   | **VERIFIED** |
| `fee.payment.success`               | Authoritative payment verified            | Paying parent / student                | In-App, Email, SMS, WhatsApp | Receipt URL (`/receipts/:id`) | **VERIFIED** |
| `fee.payment.failed`                | Gateway or bank payment failure           | Paying parent / student                | In-App, Email                | Retry Checkout URL            | **VERIFIED** |
| `fee.payment.receipt_available`     | Receipt generated and sealed              | Paying parent / student                | In-App, Email, SMS, WhatsApp | Receipt View/PDF URL          | **VERIFIED** |
| `fee.concession.submitted`          | Parent/counselor requests discount        | Finance Officer / Admin                | In-App, Email                | `/app/finance/concessions`    | **VERIFIED** |
| `fee.concession.approved`           | Concession approved by authorized officer | Requesting parent / student            | In-App, Email                | `/app/finance/receivables`    | **VERIFIED** |
| `fee.concession.rejected`           | Concession rejected with remarks          | Requesting parent / student            | In-App, Email                | `/app/finance/concessions`    | **VERIFIED** |
| `fee.concession.applied`            | Discount posted to ledger                 | Linked parents / student               | In-App, Email                | `/app/finance/receivables`    | **VERIFIED** |
| `fee.collection.follow_up_required` | Aging overdue receivable threshold hit    | Finance Collection Officer             | In-App, Email                | Collection Register URL       | **VERIFIED** |
| `fee.notification.delivery_failed`  | External gateway delivery failure         | Finance Admin Staff                    | In-App                       | Notification Audit Log        | **VERIFIED** |
| **Batch Reminders**                 | Admin triggered from Finance Center       | Filtered students with outstanding > 0 | In-App, Email, SMS           | Direct payment deep link      | **VERIFIED** |

---

## 4. Attendance Workflows (Identified Functional Gaps)

**Module Location:** `apps/backend/src/modules/student/services/attendance/`

| Workflow                        | Current Implementation Status | Root Cause                                                                                                      | Recommendation for Future Phase                                                        |
| :------------------------------ | :---------------------------- | :-------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------- |
| **Daily Student Absence Alert** | **Missing**                   | `AttendanceService` records attendance in the database but does not invoke `EventBus` or `NotificationService`. | Wire `attendance.marked.absent` event to `EventBus` in `AttendanceCoordinatorService`. |
| **Late Arrival Notification**   | **Missing**                   | No event published when student is marked 'Late'.                                                               | Publish `attendance.marked.late` to notify parents.                                    |
| **Leave Request Submitted**     | **Missing**                   | `LeaveService` records leave requests without publishing notifications to class teachers.                       | Publish `attendance.leave.submitted` to teacher recipient.                             |
| **Leave Approval / Rejection**  | **Missing**                   | `LeaveApprovalService` transitions leave status without notifying parents.                                      | Publish `attendance.leave.decision` to parent recipient.                               |

---

## 5. School Announcements & General Communications (Identified Functional Gaps)

**Module Location:** `apps/backend/prisma/schema.prisma` (`model feed_posts`)

| Workflow                              | Current Implementation Status | Root Cause                                                                                                                        | Recommendation for Future Phase                                                                        |
| :------------------------------------ | :---------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **School-wide Circular / Notice**     | **Missing**                   | `feed_posts` table is defined in Prisma schema, but announcement creation services do not yet broadcast to `NotificationService`. | Implement announcement notification worker that dispatches in-app notices for high-priority circulars. |
| **Emergency Closure / Weather Alert** | **Missing**                   | No high-priority broadcast mechanism wired to SMS or Push.                                                                        | Add emergency broadcast endpoint restricted to `SUPERADMIN` role.                                      |

---

## 6. Parent Mobile App Workflow Integration

**Screen:** `apps/mobile_app/app/(parent)/notifications.tsx`  
**Socket Client:** `apps/mobile_app/src/features/notifications/services/notification-socket.ts`

| Mobile Capability               | Verification Evidence                                                                                                                                                                                 | Status           |
| :------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------- |
| **Feed Rendering & Pagination** | Fetches `GET /v1/notifications` with `page` and `limit`. Renders notification cards with category badges and timestamps.                                                                              | **VERIFIED**     |
| **Unread Bell Badge**           | Fetches `GET /v1/notifications/unread-count`. Badges bottom tab bar icon accurately.                                                                                                                  | **VERIFIED**     |
| **Read State Transitions**      | Tapping an unread card calls `PATCH /v1/notifications/:id/read`. Header button calls `POST /mark-all-read`.                                                                                           | **VERIFIED**     |
| **Realtime Push via WebSocket** | Realtime socket listener updates list and increments/decrements badges on incoming socket frames.                                                                                                     | **VERIFIED**     |
| **Deep-Link Navigation**        | `resolveNotificationRoute` parses notification payloads and routes parents to: (1) `/fees`, (2) `/applications/:id`, (3) `/documents`, (4) `/assessments`. Unsafe URLs outside allowlist are blocked. | **VERIFIED**     |
| **Native APNS / FCM Push**      | Intentionally disabled (`isPushSupported() => false`) because backend schema lacks device registration tables. Socket fallback is active.                                                             | **SAFELY GATED** |

---

## 7. Workflow Audit Verdict

- **Core Admissions & Finance Workflows:** 100% verified, active, and reliable.
- **Attendance & Announcement Workflows:** Documented as clear functional gaps for subsequent phases.
- **Parent Mobile Experience:** Fully operational for in-app notifications and real-time updates.
