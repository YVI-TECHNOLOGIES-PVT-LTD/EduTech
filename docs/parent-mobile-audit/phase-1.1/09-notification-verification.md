# Phase 1.1 Verification Report: Notification System Architecture & Delivery Channels

**Audit Document Reference:** `docs/parent-mobile-audit/phase-1.1/09-notification-verification.md`  
**Parent Report:** `docs/parent-mobile-audit/phase-1/04-module-audit-summary.md`  
**Status:** COMPLETE & VERIFIED  
**Commit:** `a9c3486`

---

## 1. Executive Summary

This independent verification audits all notification delivery channels within the EduTrack Parent Mobile App (`apps/mobile_app`) and Express backend (`apps/backend`), comprising:

1. **In-App REST Notifications:** Fully functional and integrated with React Query.
2. **WebSocket Realtime Stream:** Fully functional event-driven sync, but severely compromised by transmission of cleartext JWT in URL query parameters (`ISSUE-SEC-01`).
3. **Native Push Notifications:** Non-operational. `isPushSupported()` hardcoded to `false` because the backend database schema (`apps/backend/prisma/schema.prisma`) lacks device token models, and no token registration endpoint exists.

---

## 2. In-App Notifications Audit

### 2.1 REST API Integration

- **File:** `apps/mobile_app/src/api/notifications.api.ts`
- **Endpoints Implemented:**
  - `GET /v1/notifications`: Paginated list of notifications for the authenticated parent.
  - `GET /v1/notifications/unread-count`: Unread counter used for tab bar badges.
  - `PATCH /v1/notifications/:id/read`: Marks a single notification as read.
  - `POST /v1/notifications/mark-all-read`: Bulk marks all notifications as read.
- **Backend Matching:** Verified against `apps/backend/src/modules/notifications/routes/notification.routes.ts`. All 4 endpoints exist, accept valid payloads, and return expected JSON structures.

### 2.2 Client-Side State & UI

- **Screen:** `apps/mobile_app/app/(parent)/notifications.tsx`
- **Components:**
  - `NotificationCard`: Displays title, message, timestamp, and unread indicator dot.
  - `NotificationEmptyState`: Renders clean empty state when list is empty.
  - `NotificationSkeleton`: Renders animated loading skeleton while queries resolve.
- **Cache Management:** React Query keys (`QUERY_KEYS.notifications.all`, `QUERY_KEYS.notifications.unreadCount`) update optimistically or invalidate upon user actions and WebSocket events.

---

## 3. Realtime WebSocket Stream Audit

### 3.1 Connection Lifecycle & Security Vulnerability

- **File:** `apps/mobile_app/src/features/notifications/services/notification-socket.ts`
- **Lines 90–93:**

```typescript
const wsUrl = `${ENV.WS_URL}?token=${encodeURIComponent(token)}`;
const socket = new WebSocket(wsUrl);
this.ws = socket;
```

- **Finding:** **CONFIRMED CRITICAL DEFECT (`ISSUE-SEC-01`)**.
  The client exposes the parent's authentication token in the URL query string, directly violating secure transit best practices.
  The backend (`apps/backend/src/modules/notifications/realtime/notification.realtime.ts#L53-L60`) supports standard `Sec-WebSocket-Protocol: bearer.<token>`, but the client fails to utilize it.

### 3.2 Realtime Event Processing & Invalidation

- **Events Handled:**
  - `notification.created`: Invalidate `notifications.all`, `notifications.unreadCount`, and domain queries for admission applications (`applications.detail(appId)`).
  - `notification.read`: Invalidate unread count.
  - `application.status_changed`: Invalidate application hub and status timeline.
- **Resilience:**
  - Implements heartbeat ping/pong timer (30s interval).
  - Automatic reconnection using exponential backoff with random jitter (capped at 5 retry attempts).

---

## 4. Native Push Notifications Audit

### 4.1 Client Hardcoded Fallback

- **File:** `apps/mobile_app/src/features/notifications/services/push-notification.service.ts`
- **Lines 20–26:**

```typescript
export const pushNotificationService = {
  /**
   * Check push notification support on the current platform and backend
   */
  isPushSupported(): boolean {
    // Current backend contract does not have push token persistence schema
    return false;
  },
  ...
```

- **File:** `apps/mobile_app/src/services/notifications/push/push-notification.service.ts`
  Contains `expo-notifications` wrappers (`requestPermissionsAsync()`, `getExpoPushTokenAsync()`), but these are never connected to any backend sync routine.

### 4.2 Root Cause in Backend & Prisma Schema

We searched `apps/backend/prisma/schema.prisma` for any push token storage tables (e.g. `user_devices`, `push_tokens`, `device_registrations`, or `fcm_tokens`).

- **Result:** **ZERO MODELS FOUND**.
- **Explanation:** In accordance with the Stage-1 Database Freeze Rule, schema modifications were prohibited during module development. Because no table exists to store Expo Push Tokens or APNs/FCM tokens mapped to `user_id` or `parent_id`, the mobile app developer correctly guarded the push service by returning `isPushSupported() = false` to avoid silent network failures.

---

## 5. Notification Channel Summary Matrix

| Delivery Channel         | Frontend Client Status                       | Backend Status                                 | Database Storage             | Functional Status                                        |
| ------------------------ | -------------------------------------------- | ---------------------------------------------- | ---------------------------- | -------------------------------------------------------- |
| **In-App REST**          | Fully Implemented (`useNotifications`)       | Fully Implemented (`notification.routes.ts`)   | `model notifications`        | **WORKING (100%)**                                       |
| **WebSocket Realtime**   | Fully Implemented (`notification-socket.ts`) | Fully Implemented (`notification.realtime.ts`) | Redis pub/sub / In-memory    | **WORKING WITH SECURITY VULNERABILITY (`ISSUE-SEC-01`)** |
| **Expo Push (APNs/FCM)** | Stubs (`pushNotificationService`)            | Completely Absent (0 routes)                   | Missing from `schema.prisma` | **NON-FUNCTIONAL (Disabled by design)**                  |

---

## 6. Recommendations for Phase 2 Implementation

1. **Remediate WebSocket Security:** Modify `notification-socket.ts` to transmit tokens via `Sec-WebSocket-Protocol: ['bearer', token]` or connection headers instead of URL parameters.
2. **Push Token Schema Recommendation (Post-Freeze):** Once database freeze is lifted in subsequent backend cycles, create `user_devices (id, user_id, device_token, platform, last_seen_at)` in Prisma and expose `POST /v1/notifications/devices` to enable native OS push notifications when the app is in the background.
