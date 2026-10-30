# EduTrack ERP — Notification Module Audit: Database Architecture & Schema Integrity

**Document Reference:** `docs/audit/notification/03-notification-database-audit.md`  
**Audit Date:** October 2026  
**Auditor Role:** Principal Database Architect & Data Governance Specialist  
**Governing Rule:** Non-Negotiable Database Schema Freeze (Rule 1.1 / Section 1.1)

---

## 1. Executive Summary

This audit evaluates the physical database structures backing the Notification module in EduTrack ERP. It verifies compliance with the non-negotiable database schema freeze, reviews indexing efficiency, assesses relational integrity, and documents missing tables as architectural recommendations rather than executing unsanctioned DDL.

---

## 2. Authoritative Database Model: `notifications`

The sole physical database table backing notifications is `public.notifications`, mapped in `apps/backend/prisma/schema.prisma` as `model notifications`:

```prisma
model notifications {
  notification_id   String                @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  org_id            String                @db.Uuid
  recipient_user_id String                @db.Uuid
  category          notification_category @default(SYSTEM)
  type              String                @db.VarChar(100)
  priority          notification_priority @default(NORMAL)
  title             String                @db.VarChar(255)
  message           String
  entity_type       String?               @db.VarChar(100)
  entity_id         String?               @db.Uuid
  action_url        String?               @db.VarChar(500)
  is_read           Boolean               @default(false)
  read_at           DateTime?             @db.Timestamptz(6)
  metadata          Json?                 @db.JsonB
  expires_at        DateTime?             @db.Timestamptz(6)
  created_at        DateTime              @default(now()) @db.Timestamptz(6)
  updated_at        DateTime              @default(now()) @db.Timestamptz(6)

  organizations     organizations         @relation(fields: [org_id], references: [org_id], onDelete: Cascade, onUpdate: NoAction)
  users             users                 @relation(fields: [recipient_user_id], references: [user_id], onDelete: Cascade, onUpdate: NoAction)

  @@index([org_id, recipient_user_id, is_read], map: "ix_notifications_user_unread")
  @@index([org_id, recipient_user_id, created_at], map: "ix_notifications_user_feed")
  @@index([org_id], map: "ix_notifications_org")
  @@schema("public")
}
```

### 2.1 Database Enums

Two PostgreSQL enums govern categories and priorities:

- **`notification_category`:** `ADMISSION`, `ATTENDANCE`, `FEE`, `EXAM`, `SYSTEM`
- **`notification_priority`:** `LOW`, `NORMAL`, `HIGH`, `URGENT`

### 2.2 Field-by-Field Analysis

| Field               | Data Type    | Nullable | Default             | Analysis & Verification                                                                                      |
| :------------------ | :----------- | :------- | :------------------ | :----------------------------------------------------------------------------------------------------------- |
| `notification_id`   | UUID         | No       | `gen_random_uuid()` | Primary key. Prevents sequential enumeration attacks.                                                        |
| `org_id`            | UUID         | No       | None                | Foreign key to `organizations.org_id`. Cascades on tenant deletion. Required for tenant partition isolation. |
| `recipient_user_id` | UUID         | No       | None                | Foreign key to `users.user_id`. Cascades on user deletion. Strictly enforced in all queries.                 |
| `category`          | Enum         | No       | `SYSTEM`            | Validated by Zod DTO schema; maps to notification tabs and filter presets.                                   |
| `type`              | VarChar(100) | No       | None                | Domain event identifier (e.g. `fee.payment.success`, `application.decision_recorded`).                       |
| `priority`          | Enum         | No       | `NORMAL`            | Used by mobile and web frontends for badge highlights and styling.                                           |
| `title`             | VarChar(255) | No       | None                | Concise message header; sanitized via template renderer.                                                     |
| `message`           | Text         | No       | None                | Full notification body; HTML-escaped.                                                                        |
| `entity_type`       | VarChar(100) | Yes      | Null                | Polymorphic domain entity type (`admission_application`, `lead`, `fee_assessment`).                          |
| `entity_id`         | UUID         | Yes      | Null                | Polymorphic entity UUID. Guarded by `safeUuid()` in repository to prevent invalid UUID cast crashes.         |
| `action_url`        | VarChar(500) | Yes      | Null                | Deep-link route. Allowlist-validated on client side before navigation.                                       |
| `is_read`           | Boolean      | No       | `false`             | Read tracking flag.                                                                                          |
| `read_at`           | Timestamptz  | Yes      | Null                | Timestamp recorded when user marks notification as read.                                                     |
| `metadata`          | JSONB        | Yes      | Null                | Flexible schema-less storage for correlation IDs, channel delivery records, and audit details.               |
| `expires_at`        | Timestamptz  | Yes      | Null                | TTL expiration timestamp for ephemeral alerts.                                                               |
| `created_at`        | Timestamptz  | No       | `now()`             | Creation timestamp; indexed for chronological ordering.                                                      |
| `updated_at`        | Timestamptz  | No       | `now()`             | Auto-updated on mark-read transitions.                                                                       |

---

## 3. Indexing & Query Performance Evaluation

The table features three composite and single-column indexes:

1. **`ix_notifications_user_unread` (`org_id`, `recipient_user_id`, `is_read`):**
   - Directly powers `NotificationRepository.countUnreadByUser()` and `NotificationController.getUnreadCount()`.
   - Explains the O(1) performance of bell badge retrieval across millions of rows.
2. **`ix_notifications_user_feed` (`org_id`, `recipient_user_id`, `created_at`):**
   - Directly powers paginated queries in `NotificationRepository.findManyByUser()` (`ORDER BY created_at DESC LIMIT X OFFSET Y`).
   - Completely avoids table sequential scans for user notification feeds.
3. **`ix_notifications_org` (`org_id`):**
   - Supports tenant-level foreign key maintenance and cascade operations.

---

## 4. Schema Freeze Compliance & Architecture Recommendations

Under the non-negotiable database freeze, the following architectural gaps cannot be resolved via DDL during this phase. They are formally documented below:

### 4.1 Missing: Push Device Tokens (`user_device_tokens`)

- **Status:** Unimplemented in schema.
- **Impact:** Mobile app push tokens (FCM/APNS) cannot be registered or stored. Mobile client correctly falls back to WebSocket real-time delivery.
- **Stage-2 Schema Recommendation:**
  ```sql
  CREATE TABLE public.user_device_tokens (
    token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(org_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    device_platform VARCHAR(20) NOT NULL CHECK (device_platform IN ('ios', 'android', 'web')),
    device_token TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_device_token UNIQUE (user_id, device_token)
  );
  CREATE INDEX ix_user_device_tokens_lookup ON public.user_device_tokens (org_id, user_id, is_active);
  ```

### 4.2 Missing: User Notification Preferences (`notification_preferences`)

- **Status:** Unimplemented in schema.
- **Impact:** Users cannot opt out of specific notification categories or channels.
- **Stage-2 Schema Recommendation:**
  ```sql
  CREATE TABLE public.notification_preferences (
    preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(org_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    category public.notification_category NOT NULL,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('in_app', 'email', 'sms', 'whatsapp', 'push')),
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_category_channel_pref UNIQUE (user_id, category, channel)
  );
  ```

### 4.3 Missing: Transactional Outbox Table (`notification_outbox`)

- **Status:** Unimplemented in schema.
- **Impact:** Notifications triggered by business writes rely on in-memory `EventBus`. If a node process restarts between a database write and event processing, the event could be dropped.
- **Stage-2 Schema Recommendation:**
  ```sql
  CREATE TABLE public.notification_outbox (
    outbox_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(org_id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'PUBLISHED', 'FAILED')),
    retry_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ
  );
  CREATE INDEX ix_notification_outbox_pending ON public.notification_outbox (status, created_at);
  ```

---

## 5. Compliance Certification

- Zero database DDL commands were executed.
- Zero Prisma migrations were created.
- `apps/backend/prisma/schema.prisma` was not modified.
- Pre-existing uncommitted models (`feed_posts`, `helpdesk_tickets`) on branch `hari-finance` were preserved intact.
