# EduTrack ERP — Notification Module Audit: System Inventory

**Document Reference:** `docs/audit/notification/01-notification-inventory.md`  
**Audit Date:** October 2026  
**Auditor Role:** Principal Software Architect & Application Security Engineer  
**Scope:** Complete repository scan of all notification models, endpoints, services, subscribers, adapters, and UI components across backend, web app, and mobile app.

---

## 1. Executive Summary

This inventory establishes the authoritative catalog of all notification-related components in the EduTrack ERP monorepo. It details physical database models, backend API routes, core services, background event subscribers, transport adapters, WebSocket real-time servers, and frontend/mobile client consumption surfaces.

---

## 2. Database Models & Schema Artifacts

| Component                  | Source File                                         | Status                | Description                                                                                                                                                                                                                                                                                                                                           |
| :------------------------- | :-------------------------------------------------- | :-------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `notifications` table      | PostgreSQL `04_tables.sql` / Prisma `schema.prisma` | **Physical & Mapped** | Authoritative physical database table storing durable user notifications. Key fields: `notification_id` (UUID), `org_id` (UUID), `recipient_user_id` (UUID), `category`, `type`, `priority`, `title`, `message`, `entity_type`, `entity_id` (UUID), `action_url`, `is_read`, `read_at`, `metadata` (JSONB), `expires_at`, `created_at`, `updated_at`. |
| `feed_posts` table         | `schema.prisma` (uncommitted)                       | **Prisma Only**       | Models communication/feed posts, announcements, and notices with audience targeting. Unwired to active notification dispatchers.                                                                                                                                                                                                                      |
| `user_device_tokens`       | _None_                                              | **Missing in DB**     | Table for storing FCM/APNS device tokens. Unimplemented under database schema freeze.                                                                                                                                                                                                                                                                 |
| `notification_preferences` | _None_                                              | **Missing in DB**     | Table for per-user, per-channel opt-in/opt-out configuration. Unimplemented under database schema freeze.                                                                                                                                                                                                                                             |
| `notification_templates`   | _None_                                              | **Code-Defined**      | Dynamic template storage. Standardized templates are currently managed in code via `FinanceTemplateRenderer.ts`.                                                                                                                                                                                                                                      |
| `notification_outbox`      | _None_                                              | **Missing in DB**     | Transactional outbox table for reliable at-least-once cross-boundary messaging.                                                                                                                                                                                                                                                                       |

---

## 3. Backend REST & WebSocket API Endpoints

### 3.1 REST API Routes (`apps/backend/src/modules/notifications/routes/notification.routes.ts`)

All routes mounted at `/v1/notifications` and `/notifications` under `authenticate` session middleware:

| HTTP Method | Path                              | Controller Method                       | RBAC / Auth Scope  | Description                                                                                                                     |
| :---------- | :-------------------------------- | :-------------------------------------- | :----------------- | :------------------------------------------------------------------------------------------------------------------------------ |
| `GET`       | `/v1/notifications/unread-count`  | `NotificationController.getUnreadCount` | Authenticated User | Returns `{ count: number }` of unread notifications scoped to caller's `org_id` and `user_id`. Used for bell badges.            |
| `GET`       | `/v1/notifications`               | `NotificationController.list`           | Authenticated User | Retrieves paginated notifications with filters (`page`, `limit`, `category`, `is_read`). Returns `NotificationListResponseDto`. |
| `POST`      | `/v1/notifications/mark-all-read` | `NotificationController.markAllRead`    | Authenticated User | Marks all unread notifications as read for calling user within tenant. Returns `{ count: number }`.                             |
| `PATCH`     | `/v1/notifications/:id/read`      | `NotificationController.markRead`       | Authenticated User | Marks a single notification as read if owned by caller. Returns updated `NotificationResponseDto` or 404.                       |
| `DELETE`    | `/v1/notifications/:id`           | `NotificationController.delete`         | Authenticated User | Permanently deletes/dismisses single notification owned by caller. Returns `{ success: true }` or 404.                          |

### 3.2 Finance Notification Admin Endpoints (`apps/backend/src/modules/fees/fees.routes.ts`)

Administrative finance notification routes mounted at `/v1/fees/notifications` under `authenticate` and `resolveTenantMiddleware`:

| HTTP Method | Path                                       | Controller / Service                            | Roles / Scope             | Description                                                         |
| :---------- | :----------------------------------------- | :---------------------------------------------- | :------------------------ | :------------------------------------------------------------------ |
| `GET`       | `/v1/fees/notifications/summary`           | `FinanceNotificationService.getSummary`         | Finance Officers / Admins | Aggregate statistics: 24h sent, delivered, failed, channel counts.  |
| `GET`       | `/v1/fees/notifications`                   | `FinanceNotificationService.getNotifications`   | Finance Officers / Admins | Audit ledger of all finance-related notifications in tenant.        |
| `GET`       | `/v1/fees/notifications/templates`         | `FinanceNotificationService.getTemplates`       | Finance Officers / Admins | Catalog of 12 standard financial templates and variables.           |
| `GET`       | `/v1/fees/notifications/channels/health`   | `FinanceNotificationService.getChannelHealth`   | Finance Officers / Admins | Live health and credential check for In-App, Email, SMS, WhatsApp.  |
| `POST`      | `/v1/fees/notifications/templates/preview` | `FinanceNotificationService.previewTemplate`    | Finance Officers / Admins | Safe template variable preview with mock student data.              |
| `POST`      | `/v1/fees/notifications/reminders/send`    | `FinanceNotificationService.sendBatchReminders` | Finance Officers / Admins | Batch due/overdue reminders based on real ledger balances.          |
| `POST`      | `/v1/fees/notifications/:id/retry`         | `FinanceNotificationService.retryNotification`  | Finance Officers / Admins | Controlled retry for failed notification dispatches with 409 guard. |

### 3.3 WebSocket Real-Time Server (`apps/backend/src/modules/notifications/realtime/notification.realtime.ts`)

| Protocol           | Paths                                           | Auth Mechanism                                                        | Connection Key         | Description                                                                                                                                                            |
| :----------------- | :---------------------------------------------- | :-------------------------------------------------------------------- | :--------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ws://` / `wss://` | `/ws/notifications`, `/api/v1/notifications/ws` | JWT Query Param (`?token=`), Bearer Header, or Sec-WebSocket-Protocol | `${org_id}:${user_id}` | Real-time bi-directional notification transport. Dispatches live `notification.created`, `notification.updated`, `notification.deleted` directly to recipient sockets. |

---

## 4. Backend Services, Repositories & Subscribers

### 4.1 Core Notification Module (`apps/backend/src/modules/notifications/`)

- **`NotificationService`** (`services/notification.service.ts`): Canonical business service for creating, reading, marking, and deleting notifications; coordinates PostgreSQL writes with WebSocket pushes.
- **`NotificationRepository`** (`repositories/notification.repository.ts`): Multi-tenant database repository enforcing strict `org_id` and `recipient_user_id` query predicates on every operation.
- **`RealtimeNotificationServer`** (`realtime/notification.realtime.ts`): Singleton WebSocket server managing connected client sockets, heartbeat ping/pong, and tenant-scoped routing.
- **`NotificationSubscriber`** (`subscribers/notification.subscriber.ts`): Domain event listener registered to `EventBus` for Admissions and CRM lifecycle events.

### 4.2 Finance Notification Module (`apps/backend/src/modules/fees/`)

- **`FinanceNotificationService`** (`services/FinanceNotificationService.ts`): Orchestrates finance notification events, batch reminders, retries, and audit views.
- **`FinanceNotificationRepository`** (`repositories/FinanceNotificationRepository.ts`): Query layer for financial notification logs and summaries.
- **`FinanceChannelAdapters`** (`services/FinanceChannelAdapters.ts`): Multi-channel dispatcher for `in_app`, `email`, `sms`, `whatsapp`.
- **`FinanceRecipientResolver`** (`services/FinanceRecipientResolver.ts`): Resolves linked parents, student users, and finance staff recipients.
- **`FinanceTemplateRenderer`** (`services/FinanceTemplateRenderer.ts`): Safely interpolates allowlisted variables with HTML escaping and INR currency formatting.
- **`FinanceNotificationSubscriber`** (`subscribers/finance-notification.subscriber.ts`): Listens for all `fee.*` lifecycle events.

### 4.3 Legacy Adapters

- **`NotificationService (Legacy)`** (`apps/backend/src/workflows/NotificationService.ts`): Compatibility wrapper delegating to canonical `NotificationService`.
- **`AdmissionNotificationService`** (`apps/backend/src/modules/compatibility/compatibility.notification.ts`): Legacy admission event compatibility adapter.

---

## 5. Frontend & Mobile UI Implementations

### 5.1 Parent Mobile App (`apps/mobile_app/`)

- **Notification Screen:** `app/(parent)/notifications.tsx`
  - Dual filter tabs: "All" and "Unread".
  - Unread count badge on tab navigation.
  - Mark-as-read on tap; "Mark all as read" header action.
  - Real-time connection status banner ("Live", "Reconnecting...", "Offline").
  - Pull-to-refresh synchronization with TanStack Query.
  - Deep linking via `resolveNotificationRoute` into Fee Details, Application Details, Document Center, and Assessment results.
- **WebSocket Socket Manager:** `src/features/notifications/services/notification-socket.ts`
  - Reconnects with exponential backoff and jitter.
  - Invalidates TanStack Query caches upon receiving `notification.created/updated/deleted`.
  - Silent heartbeat ping/pong keep-alive.
- **Push Notification Service:** `src/features/notifications/services/push-notification.service.ts`
  - Stubbed with explicit `isPushSupported() => false` fallback to WebSocket real-time, accurately reflecting backend schema freeze.

### 5.2 Web Management App (`apps/web_app/`)

- **Notification Flyout Center:** `src/features/notifications/NotificationCenter.tsx`
  - Header bell icon with real-time unread badge.
  - Slide-out popover with notification feed, mark-all-read button, and item navigation.
  - Hook `useNotificationRealtime.ts` connecting to `/ws/notifications` and invalidating RTK Query tags.
- **Finance Notification Center:** `src/modules/fees/pages/FinanceNotificationCenter.tsx`
  - Enterprise administration dashboard:
    1. Operational Metrics Cards (Sent 24h, Delivery Rate, Failure Rate, Channel Health).
    2. Real-time Channel Status Health Probes (In-App, Email, SMS, WhatsApp).
    3. Template Manager & Preview Sandbox.
    4. Batch Reminders Trigger Screen.
    5. Detailed Audit Logs Table with JSON metadata inspector and retry action.

---

## 6. Test Suite Inventory

| Test Suite                         | Path                                                                        | Type               | Status                  |
| :--------------------------------- | :-------------------------------------------------------------------------- | :----------------- | :---------------------- |
| Notification Service & DTO Suite   | `apps/backend/src/modules/notifications/tests/notification.service.spec.ts` | Unit / Integration | **11/11 Passed**        |
| Realtime Multi-Session E2E Suite   | `apps/backend/src/modules/notifications/tests/e2e-realtime.spec.ts`         | E2E Integration    | **4/4 Passed**          |
| Finance Phase 9 Notification Suite | `apps/backend/src/modules/fees/tests/finance-notifications.spec.ts`         | Unit / Integration | **24/24 Passed**        |
| Mobile Phase 6 Notification Suite  | `apps/mobile_app/tests/unit/notifications-phase6.test.ts`                   | Mobile Unit        | **25/25 Passed**        |
| **Total Automated Tests**          |                                                                             |                    | **64 Passed, 0 Failed** |
