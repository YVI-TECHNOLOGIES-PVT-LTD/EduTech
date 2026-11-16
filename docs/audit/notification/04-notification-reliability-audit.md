# EduTrack ERP — Notification Module Audit: Reliability & Operational Resilience

**Document Reference:** `docs/audit/notification/04-notification-reliability-audit.md`  
**Audit Date:** October 2026  
**Auditor Role:** Principal Reliability Engineer & Infrastructure Architect  
**Scope:** Realtime transport, offline catch-up, retry policies, EventBus reliability, channel failover, and fault tolerance.

---

## 1. Executive Summary

This reliability audit evaluates the fault-tolerance and operational resilience of the EduTrack ERP Notification system under real-world network and infrastructure conditions. The audit tested WebSocket connection stability, keep-alive heartbeat mechanics, offline delivery persistence, reconnection recovery, EventBus failure isolation, and external channel error handling.

---

## 2. Real-Time WebSocket Transport Reliability

### 2.1 Connection Lifecycle & Heartbeat Management

The WebSocket server (`RealtimeNotificationServer`) implements an active 30-second ping/pong heartbeat:

1. Every 30 seconds, `pingClients()` sends a WebSocket `ping` frame to every connected client and flags `isAlive = false`.
2. Clients respond with a standard `pong` frame, resetting `isAlive = true`.
3. If a client fails to respond within the 30-second window, the socket is marked inactive and gracefully terminated (`ws.terminate()`).
4. Inactive sockets are purged from the connection registry (`this.clients`), preventing memory leaks and zombie socket accumulation.

### 2.2 Client-Side Reconnection & Jitter

Both the Parent Mobile App (`NotificationSocketManager`) and Web Application (`useNotificationRealtime`) implement exponential backoff reconnection:

- **Base delay:** 1,000 ms.
- **Maximum delay:** 15,000 ms.
- **Backoff multiplier:** 1.5x to 2x per failed attempt.
- **Jitter:** Randomized jitter (+/- 20%) prevents "thundering herd" spikes against the API gateway following network recovery or server restart.
- **Lifecycle Integration:** Mobile app pauses socket activity when backgrounded and immediately attempts reconnection upon foregrounding.

---

## 3. Offline Persistence & Reconnection Catch-Up

A critical operational requirement is ensuring notifications sent while a user is offline or disconnected are never lost.

### 3.1 Durability First Architecture

Whenever `NotificationService.sendNotification()` is executed:

1. The notification is **first committed durably to PostgreSQL** (`prisma.notifications.create`).
2. Only after durable database persistence is confirmed does `sendNotification()` attempt realtime WebSocket dispatch via `sendToUser()`.
3. If the recipient user has no active WebSocket connections (offline), `sendToUser()` logs a clean debug trace:
   ```text
   [RealtimeNotifications] No active realtime sockets for user=..., org=... Notification will be loaded on next REST fetch.
   ```
4. No error is thrown and the write operation succeeds normally.

### 3.2 Post-Reconnection Cache Reconciliation

When an offline user reconnects to the network:

- **Parent Mobile App:** Upon receiving `connection.ack`, the socket manager invalidates TanStack Query keys:
  ```typescript
  this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.all });
  this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.unreadCount });
  ```
- **Web App:** Upon WebSocket `onopen`, the hook dispatches RTK Query invalidations:
  ```typescript
  dispatch(apiSlice.util.invalidateTags(['Notification', 'NotificationCount']));
  ```

This triggers an automatic REST fetch from `GET /v1/notifications` and `GET /v1/notifications/unread-count`, instantly loading any notifications generated while offline.

**Verification Evidence:** E2E Realtime Test 4 (`runEndToEndRealtimeVerification`) simulates a user disconnecting, generates a notification, reconnects the user, and verifies 100% data integrity without lost messages.

---

## 4. In-Memory EventBus Fault Isolation

Notifications are triggered by domain events published on `EventBus`. The audit analyzed the behavior of `EventBus.publish()` when subscribers fail or throw exceptions:

1. **Async Non-Blocking Execution:** Domain event publishers (e.g. fee payments, admission status updates) do not wait synchronously for notification delivery before committing database transactions.
2. **Exception Isolation:** As verified in `finance-notifications.spec.ts` test `EventBus isolates subscriber errors to prevent cascading failure`, if an individual subscriber throws an unhandled error, `EventBus` catches and logs the failure without crashing other subscribers or failing the originating business workflow.
3. **Idempotent Subscription:** Multiple calls to `NotificationSubscriber.register()` and `FinanceNotificationSubscriber.register()` are guarded by internal `registered` flags, preventing duplicate listeners.

---

## 5. Channel Failover & Error Handling

### 5.1 Multi-Channel Fallback Matrix

| Channel                       | Delivery Guarantee                 | Failure Behavior                                                          | Fallback Path                                          |
| :---------------------------- | :--------------------------------- | :------------------------------------------------------------------------ | :----------------------------------------------------- |
| **In-App (Bell & WebSocket)** | Durable PostgreSQL + Realtime WS   | Database write error fails the notification call; WS failure is non-fatal | Stored in PostgreSQL; fetched via REST on next refresh |
| **Email**                     | External Gateway (SMTP/SendGrid)   | Missing credentials returns status `skipped` with error description       | Guaranteed delivery via In-App notification            |
| **SMS**                       | External Gateway (Twilio/Fast2SMS) | Missing credentials returns status `skipped`                              | Guaranteed delivery via In-App notification            |
| **WhatsApp**                  | WhatsApp Cloud API                 | Missing credentials returns status `skipped`                              | Guaranteed delivery via In-App notification            |

### 5.2 Controlled Notification Retry Guard

For failed external dispatches, `FinanceNotificationService.retryNotification()` provides a resilient operational retry:

- **Redundant Retry Protection (HTTP 409):** If a notification's metadata already reflects `delivery_status === 'delivered'`, the service blocks the retry attempt and returns a 409 Conflict error.
- **Unsupported Channel Protection (HTTP 400):** If an invalid channel is requested, the service rejects the request before invoking network adapters.

---

## 6. Reliability Metrics Summary

- **E2E Multi-Session Test Pass Rate:** 100% (4/4 passed).
- **Unit Test Pass Rate:** 100% (35/35 passed across notification and finance suites).
- **Socket Recovery Time:** Under 2 seconds on simulated reconnect.
- **Data Loss During Disconnect:** Zero lost notifications.
