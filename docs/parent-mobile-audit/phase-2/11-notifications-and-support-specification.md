# Phase 2 Blueprint: Notifications, Realtime Architecture & Support Services

**Document Reference:** `docs/parent-mobile-audit/phase-2/11-notifications-and-support-specification.md`  
**Phase:** Phase 2 — Complete UI/UX Architecture & Redesign Blueprint  
**Status:** ARCHITECTURAL SPECIFICATION & BLUEPRINT (READ-ONLY DESIGN)

---

## 1. Executive Summary

Notifications form the real-time circulatory system of the EduTrack Parent Mobile App. Phase 1.1 identified that:

1. In-app REST notifications are functional.
2. The WebSocket connection leaks the parent's authentication token as a cleartext URL query parameter (`ISSUE-SEC-01`).
3. Native device push notifications are hardcoded to `false` because the backend database schema (`apps/backend/prisma/schema.prisma`) lacks a device push token table.

This specification outlines the comprehensive **Notification Center UX**, the **WebSocket Security Remediation**, the **Push Notification Integration Roadmap**, and the **Family Settings & Support Framework**.

---

## 2. Notification Center Screen Architecture (`/(common)/notifications`)

### 2.1 Visual Design & Organization

- **Top Filter Strip:** Horizontal filter chips with counts:
  `[ All (24) ] [ Unread (5) ] [ Admissions (2) ] [ Fees (1) ] [ Academics (2) ]`
- **Bulk Action Header:** `"Mark all as read"` button with checkmark icon.
- **Notification Item Card Anatomy:**
  ```
  ┌───────────────────────────────────────────────────────────────┐
  │ 🟣 [Fee Alert Icon]   Term 2 Fee Due Reminder       10m ago • │
  │                       Amount: ₹ 25,000 • Due in 12 days       │
  │                       Tap to review and pay online            │
  └───────────────────────────────────────────────────────────────┘
  ```
  - **Unread Indicator:** High-visibility sapphire dot on the right edge.
  - **Category Icon:** Color-coded circular icon container (Purple for Fees, Emerald for Attendance, Indigo for Admissions, Amber for Exam).
  - **Deep-Link Dispatch:** Tapping any notification card invokes the validated deep-link resolver (`notification-deep-link.ts`), navigating directly to the target transaction screen.
  - **Swipe-to-Dismiss / Mark Read:** Left swipe marks as read; right swipe deletes from local list.

---

## 3. Realtime WebSocket Architecture & Security Remediation

### 3.1 Remediation of `ISSUE-SEC-01` (Cleartext Token in URL)

In the existing implementation (`notification-socket.ts#L91`), the token was passed via `?token=${encodeURIComponent(token)}`, exposing credentials to access logs and reverse proxies.

#### Redesigned Secure Connection Protocol:

```typescript
// SECURE WEBSOCKET HANDSHAKE IMPLEMENTATION
export class SecureNotificationSocket {
  private connect(token: string) {
    const wsUrl = `${ENV.WS_URL}/api/v1/notifications/stream`;

    // Transmit bearer token via Sec-WebSocket-Protocol subprotocol
    // Supported by backend: notification.realtime.ts lines 53-60
    const protocols = ['bearer', token];

    this.ws = new WebSocket(wsUrl, protocols);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.startHeartbeat(30000);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };
  }
}
```

### 3.2 Real-Time Event Dispatching & Invalidation Matrix

| Incoming Event Type          | Payload Data                       | Triggered Client Action                                                   |
| ---------------------------- | ---------------------------------- | ------------------------------------------------------------------------- |
| `notification.created`       | Full notification object           | Play subtle audio cue, increment tab badge, invalidate notifications list |
| `attendance.marked`          | `{ studentId, status, time }`      | Invalidate attendance query, update Home attendance pill instantly        |
| `fee.payment_settled`        | `{ receiptId, amount }`            | Invalidate fee balances, update ledger, trigger success receipt modal     |
| `application.status_changed` | `{ applicationId, newStage }`      | Advance application stepper, refresh admission hub                        |
| `bus.location_updated`       | `{ routeId, latitude, longitude }` | Update bus tracking live marker on transport screen                       |

---

## 4. Native Push Notification Architecture (APNs & FCM)

### 4.1 Root Cause & Current Baseline

In Phase 1.1, `pushNotificationService.isPushSupported()` returns `false` by design because the Prisma schema lacks a device push token model.

### 4.2 Post-Freeze Recommended Backend Schema

Once the Stage-1 database freeze is lifted in subsequent development cycles, we recommend introducing the following model to `schema.prisma`:

```prisma
model user_devices {
  device_id         String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id           String    @db.Uuid
  device_token      String    @unique @db.VarChar(512)
  platform          String    @db.VarChar(20) // 'ios' | 'android' | 'web'
  app_version       String?   @db.VarChar(50)
  push_provider     String    @default("expo") @db.VarChar(20) // 'expo' | 'fcm' | 'apns'
  is_active         Boolean   @default(true)
  created_at        DateTime  @default(now()) @db.Timestamptz(6)
  last_used_at      DateTime  @default(now()) @db.Timestamptz(6)

  users             users     @relation(fields: [user_id], references: [user_id], onDelete: Cascade)

  @@index([user_id])
}
```

### 4.3 Mobile Client Device Registration Workflow:

1. On login, prompt user for push notification permission (`expo-notifications`).
2. If granted, acquire Expo Push Token: `ExponentPushToken[xxxxxxxxxxxx]`.
3. Dispatch to proposed backend endpoint:
   ```http
   POST /v1/notifications/devices
   Content-Type: application/json
   Authorization: Bearer <token>

   {
     "deviceToken": "ExponentPushToken[xxxxxxxxxxxx]",
     "platform": "ios",
     "appVersion": "1.0.0"
   }
   ```
4. Background notification handlers wake the application, badge the app icon, and route to specific screens upon user tap.

---

## 5. Family Settings & Support Framework (`/(main)/profile/settings`)

### 5.1 Account & Security Settings:

- **Biometric Authentication Toggle:**
  - Uses `expo-local-authentication` (`LocalAuthentication.hasHardwareAsync()`).
  - Supports Apple FaceID / TouchID and Android BiometricPrompt.
  - Encrypts refresh token in hardware Keystore/Keychain when enabled.
- **Change Password:**
  - In-app modal verifying old password before writing new bcrypt hash.
- **Active Devices / Sessions:**
  - View devices currently signed into the parent account with "Log out of all other devices" action.

### 5.2 Notification Channel Preferences:

Granular parent controls allowing customization of alert delivery:

- 🔔 **Attendance Alerts:** Push notification immediately when child is marked absent or late (Enabled by default).
- 💳 **Fee Reminders:** Push alert 7 days, 3 days, and on due date (Enabled by default).
- 📚 **Homework & Academic Updates:** Evening digest of newly assigned homework.
- 📢 **School Announcements & Circulars:** Instant broadcast notifications.
- 🚌 **Bus Transport Tracking:** Proximity alert when school bus is 3 stops away from home.

### 5.3 Institutional Support & Contact Directory (`/(main)/profile/support`):

- **School Emergency Hotline:** Direct dial 1-tap call to school reception.
- **Campus Contacts:** Principal's office, Accounts department, Transport coordinator emails.
- **Frequently Asked Questions (FAQ):** Searchable knowledge base answering common admission, fee payment, and academic questions.
- **Logout Action:**
  - Securely purges access/refresh tokens from `SecureStorage`.
  - Clears Zustand stores (`auth`, `notification`, `child`).
  - Disconnects active WebSocket stream.
  - Redirects to `/(auth)/login`.
