# Phase 2 Blueprint: UI State Design — Loading, Empty, Error & Success States

**Document Reference:** `docs/parent-mobile-audit/phase-2/15-loading-empty-error-success-states.md`  
**Phase:** Phase 2 — Complete UI/UX Architecture & Redesign Blueprint  
**Status:** ARCHITECTURAL SPECIFICATION & BLUEPRINT (READ-ONLY DESIGN)

---

## 1. Executive Summary & Philosophy

In an enterprise education ERP, screen state transitions directly affect user trust. A blank white screen during a fee payment or an unhandled network drop during document upload causes extreme parental anxiety.

### Core State Design Principles:

1. **Never Show Generic Blank Screens:** Every screen must implement explicit visual designs for all four fundamental states: **Loading, Empty, Error, and Success**.
2. **Predictable Skeleton Shimmers:** Loading states must mirror the structural layout of the resolved content rather than showing centered generic spinners.
3. **Actionable Error Recovery:** Errors must always provide a non-destructive recovery action (`Retry Sync`, `Check Network`, `Switch Payment Method`).
4. **Preserve User Input on Failure:** Form fields, document selections, and wizard steps are cached locally; an API error must never wipe parent inputs.

---

## 2. Loading State Specifications

```
┌───────────────────────────────────────────────────────────────┐
│                      SKELETON SHIMMER RULES                   │
├───────────────────────────────────────────────────────────────┤
│ • Pulse Animation: Opacity shifts from 0.4 to 0.9 over 1.2s   │
│ • Base Color: bg-slate-200 dark:bg-slate-800                  │
│ • Shimmer Highlight: bg-slate-100 dark:bg-slate-700           │
│ • Structure: Matches exact card, pill, and avatar dimensions  │
└───────────────────────────────────────────────────────────────┘
```

### 2.1 Initial Load vs. Pull-to-Refresh

- **Initial Cold Fetch:** Displays full-page structural skeleton components:
  - `DashboardSkeleton`: Header, child card, attendance pill, 6-box quick actions, and fee widget skeletons.
  - `FeedSkeleton`: 3 card skeletons with avatar, headline, image placeholder, and text lines.
  - `TimetableSkeleton`: 5 period row skeletons with time blocks.
- **Pull-to-Refresh (Background Invalidation):**
  - Retains existing cached data on screen.
  - Activates native platform indicator (`RefreshControl` on iOS / Android) at top of screen.
  - Seamlessly updates numbers and badges without screen flashing.

---

## 3. Empty State Specifications

Empty states are designed with bespoke illustrations, clear explanations, and positive calls-to-action:

| Domain Context                | Visual Illustration     | Primary Headline           | Subtitle Explanation                                                                   | Primary Call-to-Action            |
| ----------------------------- | ----------------------- | -------------------------- | -------------------------------------------------------------------------------------- | --------------------------------- |
| **No Enrolled Students**      | Family Shield & Crest   | _"No Children Linked Yet"_ | _"Your account is registered, but no student records are linked to this phone/email."_ | `[ Link Student by Admission # ]` |
| **No Admission Applications** | Document with checkmark | _"No Active Applications"_ | _"Start your child's enrollment journey by filling out our online admission form."_    | `[ Start Admission Application ]` |
| **No Homework Due**           | Books with golden star  | _"All Caught Up!"_         | _"No pending homework assignments due for this week. Enjoy your evening!"_             | `[ View Past Completed Tasks ]`   |
| **Zero Fee Balance**          | Shield with green check | _"All Fees Settled"_       | _"There are no outstanding tuition or transport dues for the current academic term."_  | `[ View Past Receipts ]`          |
| **No School Notices**         | Megaphone in clouds     | _"No Unread Notices"_      | _"Your communication feed is up to date. New school circulars will appear here."_      | `[ Refresh Feed ]`                |
| **No Attendance Records**     | Calendar with sun       | _"Classes Not in Session"_ | _"Attendance records are only marked on scheduled school days."_                       | `[ View Academic Calendar ]`      |

---

## 4. Error State Specifications & Recovery Paths

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ERROR RECOVERY MATRIX                           │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Transient Network Interruption (Offline / Weak Signal)

- **Visual Design:** Non-blocking top floating banner (`bg-amber-600 text-white py-2 px-4 flex-row items-center justify-between`).
- **Copy:** _"Offline: Displaying cached data. Reconnecting..."_
- **Behavior:**
  - The parent can still browse cached homework, timetables, past receipts, and attendance.
  - Transactional write actions (e.g. "Pay Now", "Submit Leave") display a non-blocking toast: _"Action unavailable offline. Please reconnect to cellular or Wi-Fi data."_

### 4.2 Hard Network Loss (`SCR-SYS-03`: `no-internet.tsx`)

- Displayed when an un-cached network operation fails completely.
- **Headline:** _"No Internet Connection"_
- **Resolution of `ISSUE-NAV-03`:** The "Retry Connection" button actively invokes `NetInfo.fetch()`. If connection is restored, it pops back to the previous screen automatically; if still offline, it triggers a gentle haptic shake.

### 4.3 Session Expiration (HTTP 401 Unauthorized)

- **Silent Refresh Attempt (`ISSUE-SEC-02` Remediation):**
  1. Axios interceptor catches 401.
  2. Submits `POST /v1/auth/refresh` with stored `refreshToken`.
  3. If refresh succeeds: Replays original failed request transparently without user interruption.
  4. If refresh fails (token revoked or expired):
     - Displays subtle modal dialog: _"Session Expired: For your security, please log in again."_
     - Clears tokens and smoothly redirects to `/(auth)/login`.

### 4.4 Payment Failure Screen (`SCR-FIN-04`)

- **Headline:** _"Transaction Incomplete"_
- **Copy:** _"Your payment could not be processed by the bank. If funds were debited, they will be refunded within 3-5 business days."_
- **Action 1:** `[ Try Again with UPI / Card ]` (Preserves order lines).
- **Action 2:** `[ Contact Accounts Helpdesk ]`.

### 4.5 Application Crash Boundary (`SCR-SYS-02`: `unexpected-error.tsx`)

- **Resolution of `ISSUE-NAV-01`:**
  - Renders a friendly institutional crash screen: _"An unexpected application issue occurred."_
  - The "Reset Session" button checks `useAuthStore.getState().isAuthenticated`. If true, routes to `/(main)/home`; if false, routes to `/(auth)/login` (preventing infinite redirect collisions).

---

## 5. Success State Specifications

Success states provide tangible reassurance that critical operations were recorded:

### 5.1 Admission Form Submitted (`SCR-ADM-02`)

- **Visual:** Celebratory confetti animation (lightweight Lottie).
- **Details:**
  - _"Application Successfully Submitted!"_
  - Application Number: `#APP-2026-102`
  - Subhead: _"Our admissions committee has received your submission. Next step: Upload verification documents."_
- **Action:** `[ Upload Required Documents Now ]` $\rightarrow$ `/(admission)/[id]/documents`.

### 5.2 Fee Payment Settled (`SCR-FIN-04`)

- **Visual:** Emerald checkmark with gentle haptic vibration.
- **Details:**
  - _"Tuition Payment Confirmed!"_
  - Official Receipt Number: `#REC-2026-9042`
  - Amount Paid: `₹ 32,500`
- **Actions:**
  - Primary: `[ Download Official PDF Receipt ]`
  - Secondary: `[ Share Receipt via WhatsApp ]`
  - Tertiary: `[ Back to Home Dashboard ]`
