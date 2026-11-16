# 11 — Consolidated Issues & Risk Register: Parent Mobile Application

**Project:** EduTrack ERP — Parent Mobile Application  
**Audit Phase:** Phase 1 — Complete Mobile Application Audit & Baseline Validation  
**Date of Audit:** November 2, 2026  
**Status:** Complete & Validated  
**Inspection Scope:** Consolidated Defect Register across Security, Finance, Navigation, Architecture, and UI/UX

---

## 1. Severity Classification Framework

- **CRITICAL:** Security vulnerability, financial logic flaw, cross-tenant/cross-child data exposure, application breaking defect.
- **HIGH:** Broken core workflow, major API failure, navigation dead loop, significant data inconsistency, major usability barrier.
- **MEDIUM:** Inconsistent UI, unvirtualized list performance, missing feedback, unhandled edge cases, stubbed secondary feature.
- **LOW:** Minor typography inconsistency, color token hardcoding, unused imports, cosmetic improvements.

---

## 2. Master Issues & Risk Register Table

| Issue ID          | Domain       | Module         | Screen / File                            |   Severity   | Title / Summary                                                                  |
| :---------------- | :----------- | :------------- | :--------------------------------------- | :----------: | :------------------------------------------------------------------------------- |
| **ISSUE-SEC-01**  | Security     | Notifications  | `src/.../notification-socket.ts`         | **CRITICAL** | Cleartext JWT Access Token Exposed in WebSocket URL Query String                 |
| **ISSUE-FIN-01**  | Finance      | Admission Fees | `app/.../[id]/fees.tsx`                  | **CRITICAL** | Absence of Payment Gateway SDK & Reliance on Simulated Ledger Settlement         |
| **ISSUE-SEC-02**  | Security     | Auth / API     | `src/api/client.ts`                      |   **HIGH**   | Lack of Silent Token Refresh Interceptor (Immediate Logout on 401)               |
| **ISSUE-NAV-01**  | Navigation   | Common Errors  | `app/(common)/unexpected-error.tsx`      |   **HIGH**   | Crash Recovery Fallback Misroutes Parents to Mock Staff Admin Dashboard          |
| **ISSUE-NAV-02**  | Navigation   | Secondary Tabs | `app/(tabs)/dashboard.tsx`               |   **HIGH**   | Dead Navigation Loop on 4 Action Buttons in Secondary Mock Dashboard             |
| **ISSUE-FUNC-01** | Functional   | Auth           | `app/(auth)/forgot-password.tsx`         |   **HIGH**   | Password Recovery Button Jumps to OTP Without Calling Backend API                |
| **ISSUE-FUNC-02** | Functional   | SIS Academics  | `app/(parent)/index.tsx`, `(student)`    |   **HIGH**   | Complete Absence of Enrolled Student SIS Features (Attendance, Timetable, Exams) |
| **ISSUE-FIN-02**  | Finance      | School Fees    | `src/features/finance/index.ts`          |   **HIGH**   | Complete Absence of Enrolled Student Tuition & School Fee Collection Engine      |
| **ISSUE-ARCH-01** | Architecture | Core / Storage | `src/core/` vs `src/storage/`            |  **MEDIUM**  | Dual Parallel Architecture for Storage and Auth Services                         |
| **ISSUE-ARCH-02** | Architecture | Routing        | `app/index - Copy.tsx`, `_layout - Copy` |  **MEDIUM**  | Orphan Duplicate Route Files Exposed to Expo Router Navigation Tree              |
| **ISSUE-PERF-01** | Performance  | Applications   | `app/(parent)/applications.tsx`          |  **MEDIUM**  | Unvirtualized ScrollView Rendering Heavy Lists (Potential UI Jank / High RAM)    |
| **ISSUE-PERF-02** | Performance  | Notifications  | `app/(parent)/notifications.tsx`         |  **MEDIUM**  | Unvirtualized ScrollView for Real-Time Notification History                      |
| **ISSUE-UI-01**   | UI/UX        | Wizard         | `app/.../wizard.tsx`                     |  **MEDIUM**  | 8-Step Progress Indicator Overflows Horizontally on Small Mobile Displays        |
| **ISSUE-UI-02**   | UI/UX        | Global Styling | Multiple Screens (`(parent)`, `(tabs)`)  |  **MEDIUM**  | Inconsistent Hardcoded Color Hexes Bypassing Semantic Theme Tokens               |
| **ISSUE-SEC-03**  | Security     | Web Fallback   | `src/storage/secure-store.ts`            |  **MEDIUM**  | Unencrypted LocalStorage Fallback for Tokens in Web Environments                 |
| **ISSUE-NAV-03**  | Navigation   | Network        | `app/(common)/no-internet.tsx`           |  **MEDIUM**  | Empty Click Handler on "Retry Connection" Button                                 |
| **ISSUE-TEST-01** | Quality      | Integration    | `tests/integration/auth.test.ts`         |  **MEDIUM**  | Integration Test Suite is a Dummy Stub (`expect(true).toBe(true)`)               |
| **ISSUE-UI-03**   | UI/UX        | Layout         | `app/(parent)/_layout.tsx`               |   **LOW**    | Fixed Bottom Tab Height (62dp) Colliding with iOS Home Indicator                 |
| **ISSUE-CODE-01** | Code Quality | Linting        | Multiple Files                           |   **LOW**    | 91 ESLint Warnings for Unused Variables and Console Logging                      |

---

## 3. Detailed Issue Specifications

---

### ISSUE-SEC-01: Cleartext JWT Access Token Exposed in WebSocket URL Query String

- **Module:** Notifications & Real-Time Alerts
- **Screen / File:** `apps/mobile_app/src/features/notifications/services/notification-socket.ts` line 91
- **Severity:** **CRITICAL**
- **Description:** The user's JWT access token is appended directly to the WebSocket URL query string when connecting to the realtime server.
- **Evidence:**
  ```typescript
  const wsUrl = `${ENV.WS_URL}?token=${encodeURIComponent(token)}`;
  const socket = new WebSocket(wsUrl);
  ```
- **User Impact:** Session tokens are exposed in cleartext across server access logs, reverse proxy logs (Nginx/Cloudflare), and network monitoring tools, presenting an impersonation and session hijacking risk.
- **Recommended Action:** Authenticate the WebSocket connection via an initial handshake message payload (`{ type: 'AUTH', token }`) over TLS or standard headers.
- **Phase Dependency:** Phase 2 (Security Hardening).

---

### ISSUE-FIN-01: Absence of Payment Gateway SDK & Reliance on Simulated Ledger Settlement

- **Module:** Finance & Payment Processing
- **Screen / File:** `apps/mobile_app/app/(parent)/applications/[id]/fees.tsx` lines 49–53; `src/api/fees.api.ts` line 17
- **Severity:** **CRITICAL**
- **Description:** The mobile app has no native payment gateway SDK (Razorpay / Stripe) integrated. Clicking "Pay Now" creates a dummy client-side reference `MOB-${Date.now()}` and posts directly to `/v1/applications/:id/payment`.
- **Evidence:**
  ```typescript
  payload: {
    payment_mode: selectedMode,
    transaction_reference: `MOB-${Date.now()}`,
    remarks: 'Admission application processing fee settled via mobile self-service',
  }
  ```
- **User Impact:** No actual financial transaction or funds transfer takes place. In production, this allows fee statuses to be marked as paid without verified bank transactions.
- **Recommended Action:** Integrate official Razorpay or Stripe native checkout SDK, generate server-side orders, and verify signatures via webhooks.
- **Phase Dependency:** Phase 2 (Finance Architecture).

---

### ISSUE-SEC-02: Lack of Silent Token Refresh Interceptor (Immediate Logout on 401)

- **Module:** Authentication & API Client
- **Screen / File:** `apps/mobile_app/src/api/client.ts` lines 106–120
- **Severity:** **HIGH**
- **Description:** The Axios response interceptor does not attempt to exchange the stored `refreshToken` for a new `accessToken` when receiving an HTTP 401 Unauthorized status. Instead, it forcefully clears the session and logs the user out.
- **Evidence:**
  ```typescript
  if (status === 401) {
    if (!isAuthRoute) {
      await SecureStorage.clearSession();
      useAuthStore.getState().logout();
    }
    return Promise.reject(new ApiError(401, message));
  }
  ```
- **User Impact:** When short-lived JWT access tokens expire, active users (e.g. parents filling out long forms) are abruptly logged out and lose unsaved progress.
- **Recommended Action:** Implement standard Axios 401 retry interceptor that calls `POST /v1/auth/refresh`, updates tokens, and transparently replays queued requests.
- **Phase Dependency:** Phase 2 (API Client Refactor).

---

### ISSUE-NAV-01: Crash Recovery Fallback Misroutes Parents to Mock Staff Admin Dashboard

- **Module:** Common Error Handling
- **Screen / File:** `apps/mobile_app/app/(common)/unexpected-error.tsx` line 24
- **Severity:** **HIGH**
- **Description:** When an unexpected error occurs and the user clicks "Return to Dashboard", the application redirects to `ROUTES.TABS.DASHBOARD` instead of the parent dashboard.
- **Evidence:**
  ```typescript
  <Button
    title="Return to Dashboard"
    size="lg"
    onPress={() => router.replace(ROUTES.TABS.DASHBOARD as any)}
  />
  ```
- **User Impact:** Parents recovering from a crash are dumped into the mock staff administration dashboard displaying irrelevent metrics ("1,248 Students, 98 Teachers").
- **Recommended Action:** Change route destination to `ROUTES.PARENT.DASHBOARD`.
- **Phase Dependency:** Phase 2 (Navigation Cleanup).

---

### ISSUE-NAV-02: Dead Navigation Loop on 4 Action Buttons in Secondary Mock Dashboard

- **Module:** Secondary Navigation Tabs
- **Screen / File:** `apps/mobile_app/app/(tabs)/dashboard.tsx` lines 30, 39, 48, 57
- **Severity:** **HIGH**
- **Description:** The quick access buttons for Assignments, Exams, Fee Collection, and Timetable are hardcoded to route to `ROUTES.TABS.DASHBOARD`, reloading the exact same screen on every tap.
- **Evidence:**
  ```typescript
  { id: 'assignments', title: 'Assignments', route: ROUTES.TABS.DASHBOARD },
  { id: 'exams', title: 'Exams', route: ROUTES.TABS.DASHBOARD },
  { id: 'fees', title: 'Fee Collection', route: ROUTES.TABS.DASHBOARD },
  { id: 'timetable', title: 'Timetable', route: ROUTES.TABS.DASHBOARD },
  ```
- **User Impact:** Confusing dead-end UX for parents attempting to access academic modules.
- **Recommended Action:** Deprecate or replace this screen entirely with a unified Parent Enrolled Student SIS dashboard in Phase 2.
- **Phase Dependency:** Phase 2 (Dashboard Redesign).

---

### ISSUE-FUNC-01: Password Recovery Button Jumps to OTP Without Calling Backend API

- **Module:** Authentication & Password Recovery
- **Screen / File:** `apps/mobile_app/app/(auth)/forgot-password.tsx` lines 31–35
- **Severity:** **HIGH**
- **Description:** The "Send OTP" button navigates directly to `ROUTES.AUTH.OTP` without invoking any backend API to generate or send an OTP.
- **Evidence:**
  ```typescript
  <Button
    title="Send OTP"
    size="lg"
    onPress={() => router.push(ROUTES.AUTH.OTP as any)}
  />
  ```
- **User Impact:** Parents who forget their password cannot recover their accounts through the mobile app.
- **Recommended Action:** Connect to `POST /v1/auth/forgot-password` and pass the verified identifier to the OTP screen.
- **Phase Dependency:** Phase 2 (Auth Completion).

---

### ISSUE-FUNC-02: Complete Absence of Enrolled Student SIS Features

- **Module:** Student Information System (SIS) & Academics
- **Screen / File:** `apps/mobile_app/src/features/student/index.ts`, `app/(student)/index.tsx`
- **Severity:** **HIGH (Major Scope Gap)**
- **Description:** The mobile app has zero screens, hooks, or queries for enrolled students. All attendance, timetable, homework, and report card modules are either missing or 1-line stubs.
- **User Impact:** Parents can only use the mobile app during the admission phase. Once their child is admitted, the app offers zero day-to-day school utility.
- **Recommended Action:** Build Phase 2 around unifying the Parent Admission Portal with the Enrolled Student SIS Dashboard.
- **Phase Dependency:** Phase 2 (Core Feature Expansion).

---

### ISSUE-ARCH-01: Dual Parallel Architecture for Storage and Auth Services

- **Module:** Architecture Core
- **Screen / File:** `src/core/` vs `src/storage/` & `src/api/`
- **Severity:** **MEDIUM**
- **Description:** Two sets of storage services (`SecureStorage` vs `SecureStorageService`) and two sets of auth services exist simultaneously, creating technical debt and developer confusion.
- **User Impact:** Inconsistent behavior (e.g. web fallback works in one service but fails in another).
- **Recommended Action:** Deprecate `src/core/` duplicates and consolidate all storage in `src/storage/secure-store.ts`.
- **Phase Dependency:** Phase 2 (Refactoring).

---

### ISSUE-ARCH-02: Orphan Duplicate Route Files Exposed to Expo Router Navigation Tree

- **Module:** Navigation & Build Architecture
- **Screen / File:** `apps/mobile_app/app/index - Copy.tsx`, `app/_layout - Copy.tsx`
- **Severity:** **MEDIUM**
- **Description:** Leftover copy files in the `app/` folder are treated as valid routes by Expo Router (e.g. `/index - Copy`), creating dead routes and build noise.
- **User Impact:** Potential accidental deep-link hits into obsolete legacy redirectors.
- **Recommended Action:** Delete orphaned copy files in Phase 2.
- **Phase Dependency:** Phase 2 (Housekeeping).

---

### ISSUE-PERF-01 & ISSUE-PERF-02: Unvirtualized ScrollView Rendering Heavy Lists

- **Module:** Performance & List Rendering
- **Screen / File:** `app/(parent)/applications.tsx` line 63; `app/(parent)/notifications.tsx` line 140
- **Severity:** **MEDIUM**
- **Description:** Both screens render potentially large collections inside a plain `ScrollView` instead of a virtualized `FlatList`.
- **User Impact:** Frame rate drops, UI stutter during scrolling, and excessive RAM allocation for parents with extensive histories.
- **Recommended Action:** Refactor to `FlatList` with `initialNumToRender` and `windowSize` limits.
- **Phase Dependency:** Phase 2 (Performance Polish).

---

### ISSUE-UI-01: 8-Step Progress Indicator Overflows Horizontally on Small Mobile Displays

- **Module:** Admission Wizard
- **Screen / File:** `src/features/admission/components/wizard/WizardProgressBar.tsx`
- **Severity:** **MEDIUM**
- **Description:** Rendering 8 distinct step circles in a single row overflows the screen width on compact smartphones (<380dp).
- **User Impact:** Truncated step labels and horizontal layout distortion.
- **Recommended Action:** Replace 8-step bar with a collapsed 4-stage stepper with text progress ("Step 2 of 4: Guardian Information").
- **Phase Dependency:** Phase 2 (UI Redesign).
