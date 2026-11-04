# 05 — API & Data Integration Audit: Parent Mobile Application

**Project:** EduTrack ERP — Parent Mobile Application  
**Audit Phase:** Phase 1 — Complete Mobile Application Audit & Baseline Validation  
**Date of Audit:** November 2, 2026  
**Status:** Complete & Validated  
**Inspection Mode:** Static Code Trace & Mocked Unit Verification (No Production Network Calls)

---

## 1. API Architecture & Network Layer

The Parent Mobile Application interacts with the EduTrack ERP backend via an **Axios HTTP Client** paired with **TanStack React Query v5** for query caching, deduplication, and lifecycle management.

```
+-----------------------------------------------------------------------------------------+
|                                     Component / Screen                                  |
|                 (e.g. ParentDashboardScreen, DocumentCenterScreen, FeePaymentScreen)    |
+--------------------------------------------+--------------------------------------------+
                                             |
                                  TanStack Query Hook
                   (e.g. useMyApplications, useApplicationFee, useUploadDocument)
                                             |
                                    Dedicated API Service
                     (e.g. applicationsApi, feesApi, documentsApi, authApi)
                                             |
+--------------------------------------------v--------------------------------------------+
| Canonical API Client (src/api/client.ts)                                                |
|                                                                                         |
|  [Request Interceptor]                                                                  |
|   ├── Attaches `Authorization: Bearer <accessToken>` from SecureStorage                 |
|   ├── Attaches `X-Workspace-Id: <workspaceId>` from SecureStorage                       |
|   ├── Attaches unique `X-Request-Id: req-mob-<timestamp>-<hash>`                        |
|   └── Logs sanitized URL (redacting passwords, OTPs, tokens)                            |
|                                                                                         |
|  [Response Interceptor]                                                                 |
|   ├── Error Normalization into `ApiError` class                                         |
|   ├── Status 401 Handling: Clears session & calls `useAuthStore.logout()` (NO REFRESH)  |
|   ├── Status 403, 404, 409, 422, 429, 500 error mapping                                 |
|   └── Network Timeout (20000ms) detection                                              |
+--------------------------------------------+--------------------------------------------+
                                             |
                                     Backend REST API
                               (http://10.0.2.2:3000/api or prod)
```

---

## 2. Comprehensive Endpoint Inventory & Screen Mapping

Below is the verified mapping of all active mobile API integrations discovered in `src/api/endpoints.ts`, services, and hooks:

| #   | Endpoint URL                                | Method | Calling Service                   | Calling Hook                   | Consuming Screens                           |      Auth Req.      |         Verification Mode          |
| :-- | :------------------------------------------ | :----: | :-------------------------------- | :----------------------------- | :------------------------------------------ | :-----------------: | :--------------------------------: |
| 1   | `/v1/auth/login`                            |  POST  | `authApi.login`                   | `useLogin`                     | `app/(auth)/login.tsx`                      |       Public        | Statically Inspected & Unit Tested |
| 2   | `/v1/admission/register`                    |  POST  | `authApi.register`                | `useRegister`                  | `app/(auth)/register.tsx`                   |       Public        | Statically Inspected & Unit Tested |
| 3   | `/v1/admission/verify-otp`                  |  POST  | `authApi.verifyOtp`               | `useVerifyOtp`                 | `app/(auth)/otp.tsx`                        |       Public        | Statically Inspected & Unit Tested |
| 4   | `/public/admission/config`                  |  GET   | `metadataApi.getAdmissionConfig`  | `useAdmissionConfig`           | `.../applications/wizard.tsx`               |       Public        | Statically Inspected & Unit Tested |
| 5   | `/public/academic-years`                    |  GET   | `metadataApi.getAcademicYears`    | `useAcademicYears`             | `.../applications/wizard.tsx`               |       Public        | Statically Inspected & Unit Tested |
| 6   | `/public/classes`                           |  GET   | `metadataApi.getClasses`          | `useClasses`                   | `.../applications/wizard.tsx`               |       Public        | Statically Inspected & Unit Tested |
| 7   | `/v1/applications/document-types`           |  GET   | `metadataApi.getDocumentTypes`    | `useDocumentTypes`             | `wizard.tsx`, `.../documents.tsx`           |    Bearer Token     | Statically Inspected & Unit Tested |
| 8   | `/v1/applications?mine=true`                |  GET   | `applicationsApi.listMine`        | `useMyApplications`            | `(parent)/index.tsx`, `applications.tsx`    |    Bearer Token     | Statically Inspected & Unit Tested |
| 9   | `/v1/applications/:id`                      |  GET   | `applicationsApi.getById`         | `useQuery([applications, id])` | `.../applications/[id].tsx`                 |    Bearer Token     | Statically Inspected & Unit Tested |
| 10  | `/v1/applications`                          |  POST  | `applicationsApi.create`          | `useSubmitApplication`         | `.../applications/wizard.tsx`               |    Bearer Token     | Statically Inspected & Unit Tested |
| 11  | `/v1/applications/:id/documents`            |  GET   | `documentsApi.list`               | `useApplicationDocuments`      | `.../applications/[id]/documents.tsx`       |    Bearer Token     | Statically Inspected & Unit Tested |
| 12  | `/v1/applications/:id/documents`            |  POST  | `documentsApi.upload`             | `useUploadDocument`            | `.../applications/[id]/documents.tsx`       |    Bearer Token     | Statically Inspected & Unit Tested |
| 13  | `/v1/applications/documents/:id/signed-url` |  GET   | `documentsApi.getSignedUrl`       | Inline caller                  | `.../applications/[id]/documents.tsx`       |    Bearer Token     | Statically Inspected & Unit Tested |
| 14  | `/v1/applications/:id/fee`                  |  GET   | `feesApi.getFeeSummary`           | `useApplicationFee`            | `.../applications/[id]/fees.tsx`            |    Bearer Token     | Statically Inspected & Unit Tested |
| 15  | `/v1/applications/:id/payment`              |  POST  | `feesApi.recordPayment`           | `useRecordPayment`             | `.../applications/[id]/fees.tsx`            |    Bearer Token     | Statically Inspected & Unit Tested |
| 16  | `/v1/applications/:id/receipt`              |  GET   | `feesApi.getReceipt`              | `useApplicationReceipt`        | `.../applications/[id]/receipt.tsx`         |    Bearer Token     | Statically Inspected & Unit Tested |
| 17  | `/v1/applications/:id/assessment`           |  GET   | `assessmentApi.getByApplication`  | `useApplicationAssessment`     | `.../applications/[id]/assessment.tsx`      |    Bearer Token     | Statically Inspected & Unit Tested |
| 18  | `/v1/applications/:id/decision`             |  GET   | `decisionApi.getByApplication`    | `useApplicationDecision`       | `.../applications/[id]/decision.tsx`        |    Bearer Token     | Statically Inspected & Unit Tested |
| 19  | `/v1/applications/:id/timeline`             |  GET   | `timelineApi.getByApplication`    | `useApplicationTimeline`       | `.../applications/[id]/timeline.tsx`        |    Bearer Token     | Statically Inspected & Unit Tested |
| 20  | `/v1/notifications`                         |  GET   | `notificationsApi.list`           | `useNotifications`             | `(parent)/notifications.tsx`                |    Bearer Token     | Statically Inspected & Unit Tested |
| 21  | `/v1/notifications/unread-count`            |  GET   | `notificationsApi.getUnreadCount` | `useUnreadNotificationCount`   | `(parent)/index.tsx`, `notifications.tsx`   |    Bearer Token     | Statically Inspected & Unit Tested |
| 22  | `/v1/notifications/:id/read`                | PATCH  | `notificationsApi.markAsRead`     | `useMarkNotificationRead`      | `(parent)/notifications.tsx`                |    Bearer Token     | Statically Inspected & Unit Tested |
| 23  | `/v1/notifications/mark-all-read`           |  POST  | `notificationsApi.markAllAsRead`  | `useMarkAllNotificationsRead`  | `(parent)/notifications.tsx`                |    Bearer Token     | Statically Inspected & Unit Tested |
| 24  | `/ws/notifications?token=...`               |   WS   | `NotificationSocketManager`       | `useNotificationRealtime`      | `(parent)/_layout.tsx`, `notifications.tsx` | Bearer Token in URL | Statically Inspected & Unit Tested |

---

## 3. Deep Integration Audit by Functional Domain

---

### A. Authentication & Onboarding Integrations

#### 1. User Login (`POST /v1/auth/login`)

- **Calling Service:** `authApi.login(credentials: LoginRequest)`
- **Calling Hook:** `useLogin()`
- **Request Payload:** `{ email: string, password: string }`
- **Response Structure:**
  ```typescript
  {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: {
      id: string;
      email: string;
      full_name: string;
      role?: string;
      roles?: string[];
    }
  }
  ```
- **Parent Role Enforcement:** `useLogin.ts` validates `isParentUser(response.user)`. If the user does not possess the `PARENT` role, it immediately invokes `authApi.logout()` and throws an `ApiError(403, 'Access Denied: The mobile app is reserved for Parent accounts.', 'PARENT_ROLE_REQUIRED')`.
- **Session Persistence:** Saves `accessToken` and `refreshToken` to `SecureStorage` and sets Zustand `useAuthStore`.

#### 2. Parent Self-Registration (`POST /v1/admission/register`)

- **Calling Service:** `authApi.register(payload: RegisterRequest)`
- **Request Payload:** `{ full_name: string, email: string, phone: string, password: string }`
- **Response Structure:** `{ success: boolean, message: string, requiresOtp: boolean }`
- **Navigation Trigger:** Routes user to `/(auth)/otp` passing `{ email, phone }`.

#### 3. OTP Verification (`POST /v1/admission/verify-otp`)

- **Calling Service:** `authApi.verifyOtp(payload: VerifyOtpRequest)`
- **Request Payload:** `{ email: string, phone?: string, otp: string }`
- **Response Structure:** `{ success: boolean, verified: boolean, message: string }`
- **Navigation Trigger:** Replaces route to `/(auth)/login` with query params `{ verifiedEmail, verified: 'true' }`.

---

### B. Admission Lifecycle & Application Integrations

#### 4. Parent Applications Listing (`GET /v1/applications?mine=true`)

- **Calling Service:** `applicationsApi.listMine()`
- **Calling Hook:** `useMyApplications()` / `useQuery` in `ParentDashboardScreen`
- **Query Key:** `['applications', 'mine']` (`QUERY_KEYS.applications.mine()`)
- **Response Structure:** Array of `AdmissionApplication`:
  ```typescript
  [
    {
      application_id: string;
      application_number: string;
      status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'DOCUMENTS_PENDING' | 'ASSESSMENT_SCHEDULED' | 'APPROVED' | 'REJECTED';
      student_name?: string;
      student_first_name?: string;
      student_last_name?: string;
      leads?: { student_first_name: string; student_last_name: string };
      grade_applied?: string;
      created_at: string;
    }
  ]
  ```
- **Multi-Student Switcher Binding:** Binds directly to `ChildSwitcher.tsx`. Auto-selects the first application if none is explicitly selected by parent.

#### 5. Application Detail Hub (`GET /v1/applications/:id`)

- **Calling Service:** `applicationsApi.getById(id)`
- **Query Key:** `['applications', 'detail', id]`
- **Response Structure:** Complete application record including nested `admission_documents`, `leads`, `grades`, and timeline milestones.

#### 6. Document Upload & Signed URL (`POST / GET /v1/applications/:id/documents`)

- **Upload Payload:** Multipart `FormData` containing `file` (`uri`, `name`, `type`), `document_type_id`, and `title`.
- **Signed URL Endpoint:** `GET /v1/applications/documents/:docId/signed-url`
  - Returns: `{ signed_url: string, expires_at: string }`
  - Consumed via React Native `Linking.openURL(signed_url)` to securely view documents.

#### 7. Assessment & Decision Tracking (`GET /v1/applications/:id/assessment`, `/decision`)

- **Assessment Endpoint:** Returns exam date, venue, interviewer, score, and passing threshold.
- **Decision Endpoint:** Returns committee status (`ACCEPTED`, `WAITLISTED`, `REJECTED`), official remarks, offer letter valid date.

---

### C. Admission Finance Integrations

#### 8. Fee Statement (`GET /v1/applications/:id/fee`)

- **Calling Service:** `feesApi.getFeeSummary(id)`
- **Query Key:** `['fees', 'summary', id]`
- **Response Structure:**
  ```typescript
  {
    application_id: string;
    application_fee: number;
    processing_charge: number;
    tax: number;
    total_amount: number;
    currency: string;
    payment_status: 'pending' | 'paid' | 'waived';
    due_date?: string;
    breakdown: Array<{ name: string; amount: number }>;
  }
  ```

#### 9. Simulated Payment Settlement (`POST /v1/applications/:id/payment`)

- **Calling Service:** `feesApi.recordPayment(id, payload)`
- **Calling Hook:** `useRecordPayment()`
- **Request Payload:**
  ```typescript
  {
    payment_mode: 'upi' | 'card' | 'netbanking';
    transaction_reference: string; // e.g. "MOB-1730538000000"
    remarks: string;
  }
  ```
- **Query Invalidation Chain:** Upon mutation success, automatically invalidates:
  - `QUERY_KEYS.fees.summary(appId)`
  - `QUERY_KEYS.fees.receipt(appId)`
  - `QUERY_KEYS.applications.detail(appId)`
  - `QUERY_KEYS.timeline.byApplication(appId)`
  - `QUERY_KEYS.applications.mine()`
- **Receipt Retrieval (`GET /v1/applications/:id/receipt`):**
  - Returns itemized receipt record: `{ receipt_number, amount, payment_date, payment_mode, currency }`.

---

### D. Notification Integrations & Real-Time WebSocket

#### 10. Notification Queries & Mutations

- `GET /v1/notifications`: Retrieves parent notifications list with pagination support.
- `GET /v1/notifications/unread-count`: Returns active unread count (cached with 30s `staleTime`).
- `PATCH /v1/notifications/:id/read`: Marks individual notification as read.
- `POST /v1/notifications/mark-all-read`: Optimistically marks all notifications as read in cache.

#### 11. WebSocket Real-Time Connection (`ws://.../ws/notifications`)

- Managed by `NotificationSocketManager` singleton (`src/features/notifications/services/notification-socket.ts`).
- **Connection Handshake:** Connects via `ws://<host>/ws/notifications?token=<accessToken>`.
- **Incoming Event Dispatch:**
  - On incoming message, parses event type (e.g. `notification.created`, `application.status_changed`).
  - Automatically triggers TanStack Query invalidation for `['notifications']`, `['applications']`, and `['fees']`.
  - Heartbeat ping-pong every 30 seconds; exponential backoff reconnection (max 15s delay).

---

## 4. Discovered API & Integration Risks

### Risk 1: Absence of Token Refresh Interceptor (HIGH SEVERITY)

- **Evidence:** In `src/api/client.ts` lines 106–120:
  ```typescript
  if (status === 401) {
    if (!isAuthRoute) {
      await SecureStorage.clearSession();
      useAuthStore.getState().logout();
    }
    return Promise.reject(new ApiError(401, 'Session expired. Please sign in again.'));
  }
  ```
- **Impact:** The client never attempts to exchange the stored `refreshToken` for a new `accessToken`. When the short-lived JWT expires during active parent usage (e.g. while filling out the 8-step wizard), the user is abruptly logged out and loses their active state.

### Risk 2: JWT Token Exposed in WebSocket URL Query String (HIGH SEVERITY)

- **Evidence:** In `src/features/notifications/services/notification-socket.ts` line 91:
  ```typescript
  const wsUrl = `${ENV.WS_URL}?token=${encodeURIComponent(token)}`;
  const socket = new WebSocket(wsUrl);
  ```
- **Impact:** Bearer tokens passed via URL parameters are stored in plaintext in intermediate proxy logs, server access logs, and load balancer traces.

### Risk 3: Simulated Payment Settlement / No Gateway SDK (CRITICAL SEVERITY)

- **Evidence:** In `app/(parent)/applications/[id]/fees.tsx` lines 49–53:
  ```typescript
  payFee({
    applicationId: appId,
    payload: {
      payment_mode: selectedMode,
      transaction_reference: `MOB-${Date.now()}`,
      remarks: 'Admission application processing fee settled via mobile self-service',
    },
  });
  ```
- **Impact:** No true money movement occurs. The mobile client simply sends a client-generated string to a simulated recording endpoint. In production, this allows fraudulent fee settlements if the endpoint is not secured by server-side payment gateway webhook verification.

### Risk 4: Missing General School ERP APIs (SCOPE GAP)

- **Evidence:** No endpoints or services exist for:
  - Student Attendance (`GET /v1/student/attendance`)
  - Class Timetable (`GET /v1/academics/timetable`)
  - Examination Results (`GET /v1/academics/results`)
  - School Fee Invoices (`GET /v1/finance/invoices`)
- **Impact:** The mobile app is unable to serve parents of already-enrolled students until these integrations are built.

### Risk 5: Forgot Password API Disconnect (FUNCTIONAL DEFECT)

- **Evidence:** `app/(auth)/forgot-password.tsx` lines 34–35 has an empty button action navigating directly to OTP without triggering a password reset email/SMS endpoint.
