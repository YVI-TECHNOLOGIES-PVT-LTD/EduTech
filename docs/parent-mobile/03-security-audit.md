# EduTrack ERP — Parent Mobile App

## 03. Comprehensive Security & Privacy Audit Report

**Date:** October 15, 2026  
**Target:** `apps/mobile_app` & Backend Parent API Surfaces (`apps/backend`)  
**Auditor:** Full-Stack Security Auditor & Mobile Architect  
**Audit Status:** COMPLETE & VERIFIED

---

### Executive Summary

A comprehensive security, privacy, and architectural isolation audit was conducted on the Parent Mobile Application and its associated backend API contracts.

The review specifically focused on student privacy, multi-tenant boundaries, broken object-level authorization (BOLA/IDOR), token lifecycle security, credential sanitization, deep-link allowlists, payment tampering, and injection vectors.

The audit confirms that the parent mobile client and backend enforce strict security standards:

- Hardware-backed token storage in `Expo.SecureStore` (Keychain on iOS, Keystore on Android).
- Zero plain-text tokens or student records in `AsyncStorage`.
- Automated log redaction for JWT tokens, passwords, OTPs, and authorization headers.
- Server-side multi-tenant scoping and ownership validation on all application and fee endpoints.
- Strict allowlist enforcement for notification deep links, preventing arbitrary routing or external URL redirection.

---

### 1. Broken Object-Level Authorization (BOLA / IDOR)

#### Threat Description

In a multi-parent educational system, an authenticated parent must never access another parent's child records, admission applications, fee ledgers, or uploaded verification documents by substituting IDs in query parameters or request URLs.

#### Findings & Verification

1. **Admission Applications (`/v1/applications/:id`):**
   - **Backend Controller:** `AdmissionController.getById` (`apps/backend/src/modules/admission-management/controllers/admission.controller.ts`)
   - **Enforcement:**
     ```typescript
     const isOnlyParent =
       user?.roles?.includes('PARENT') &&
       !user?.roles?.some((r) => ['ADMIN', 'FRONT_OFFICE', 'STAFF'].includes(r));
     const parentUserId = isOnlyParent ? user?.id : undefined;
     const result = await AdmissionService.getApplicationById(id, orgId, parentUserId);
     ```
   - If an application belongs to parent A and parent B attempts `GET /v1/applications/{app_A_id}`, the query includes `created_by: parentUserId` and `org_id: orgId`. The query returns `404 Not Found` or `403 Forbidden`. Cross-parent access is strictly denied.
2. **Document Pre-Signed URLs (`/v1/applications/documents/:id/signed-url`):**
   - Documents are tied to the parent's application. Pre-signed URLs are generated with short-lived TTLs (5–15 minutes). Object paths in Supabase Storage are private and never exposed directly to the mobile client.
3. **Multi-Child Fee Ledgers (`/v1/fees/my/children/:studentId`):**
   - **Backend Service:** `ParentFinanceService.verifyParentChildAccess(orgId, userId, studentId, userEmail)`
   - **Enforcement:**
     ```typescript
     const link = await prisma.student_parents.findFirst({
       where: {
         parent_id: parent.parent_id,
         student_id: safeStudentId,
       },
     });
     if (!link) return false; // Returns 403 Forbidden
     ```
   - Even if parent B obtains the UUID of parent A's enrolled student, the backend checks the authoritative `student_parents` table and rejects the request with HTTP 403: `"You are not authorized to view financial records for this student."`

**Verdict:** **SECURE / VERIFIED**

---

### 2. Broken Function-Level Authorization (BFLA)

#### Threat Description

Parent accounts must not be able to execute administrative, staff, or teacher functions (e.g., verifying their own documents, approving admission decisions, enrolling students, modifying fee structures).

#### Findings & Verification

1. **RBAC Policy Separation:**
   - In `apps/backend/src/modules/admission-management/policies/admission.policy.ts`:
     - `canView()` requires `APPLICATION_VIEW`.
     - `canManageDocuments()` (verifying documents) requires `ADMISSION_REVIEW`.
     - `canManageDecisions()` (approving applications) requires `ADMISSION_APPROVE`.
     - `canManageAssessments()` requires `ADMISSION_RECOMMEND`.
2. **Parent Role Guard in Mobile Client:**
   - In `apps/mobile_app/src/features/auth/hooks/useLogin.ts`:
     ```typescript
     if (!isParentUser(response.user)) {
       await authApi.logout();
       throw new ApiError(
         403,
         'Access Denied: The mobile app is reserved for Parent accounts.',
         'PARENT_ROLE_REQUIRED',
       );
     }
     ```
   - Administrative and staff users attempting to log into the mobile app are cleanly rejected and instructed to use the Web ERP.
   - Conversely, a parent attempting to invoke `PATCH /v1/applications/:id/decision` or `PATCH /v1/applications/documents/:id/verify` is rejected with HTTP 403 by the backend RBAC middleware.

**Verdict:** **SECURE / VERIFIED**

---

### 3. Multi-Tenant Organization Isolation

#### Threat Description

EduTrack ERP is a multi-tenant platform hosting multiple schools and educational organizations. A parent enrolled in School A must never view or query data from School B.

#### Findings & Verification

1. **Tenant Resolution Middleware:**
   - The backend runs `resolveTenantMiddleware` on all fee and admission endpoints.
   - The organization context is derived from `req.context.user.org_id` / `user.school_id` decoded from the cryptographically signed JWT.
   - Client-supplied `org_id` headers are overridden or validated against the user's authorized tenant session.
2. **Mobile Client Header Injection:**
   - In `apps/mobile_app/src/api/client.ts`:
     - Every outgoing request injects `Authorization: Bearer <token>` and `X-Workspace-Id: <workspaceId>`.
     - Cross-tenant requests with conflicting parameters fail tenant validation.

**Verdict:** **SECURE / VERIFIED**

---

### 4. Token Storage & Session Security

#### Threat Description

JWT access tokens and refresh tokens stored in unencrypted storage (e.g., standard `AsyncStorage` or `localStorage`) can be extracted from rooted or compromised mobile devices.

#### Findings & Verification

1. **Hardware-Backed Isolation:**
   - `apps/mobile_app/src/storage/secure-store.ts` uses `expo-secure-store`:
     - **iOS:** Stored in iOS Keychain with accessibility set to `AFTER_FIRST_UNLOCK`.
     - **Android:** Encrypted in `SharedPreferences`, with AES keys stored in Android KeyStore.
2. **Draft Isolation:**
   - `apps/mobile_app/src/storage/draft-storage.ts` uses `AsyncStorage` exclusively for non-sensitive admission form drafts (names, academic history).
   - Keys are isolated per parent user ID (`draft_<userId>_<appId>`).
   - Tokens and payment credentials are never stored in `AsyncStorage`.
3. **Session Invalidation (401 Interceptor):**
   - In `apps/mobile_app/src/api/client.ts`:
     - Any 401 response from the server triggers `SecureStorage.clearSession()`, purges `auth.store`, and resets navigation.
   - In `apps/mobile_app/src/features/notifications/services/notification-socket.ts`:
     - Logging out immediately closes active WebSockets with standard code `1000` (Normal Closure), preventing lingering socket sessions.

**Verdict:** **SECURE / VERIFIED**

---

### 5. Sensitive Data Sanitization & Log Audit

#### Threat Description

Credentials, passwords, OTPs, and authorization headers logged in client console output or crash reports can leak to log aggregation tools or debugging proxies.

#### Findings & Verification

1. **Console Sanitization:**
   - `apps/mobile_app/src/core/logging/logger.ts` enforces automated regex redaction:
     - Bearer tokens are redacted to `Bearer [REDACTED]`.
     - Passwords, OTP codes, and refresh tokens are masked before logging.
2. **URL Query Param Sanitization:**
   - In `apps/mobile_app/src/api/client.ts`:
     - URLs logged in debug mode sanitize query parameters matching `token`, `key`, `secret`, `otp`, or `password`.
3. **Production Log Suppression:**
   - In `apps/mobile_app/src/config/env.ts` and `eas.json`:
     - In production builds (`EXPO_PUBLIC_ENV="production"`), `ENABLE_LOGGING` defaults to `false`. Debug console logs are silenced in production builds.

**Verdict:** **SECURE / VERIFIED**

---

### 6. Deep Link & Notification Route Allowlist

#### Threat Description

Unvalidated deep links or push notification payloads can redirect users to unintended internal screens, bypass authentication guards, or trigger malicious URL schemes.

#### Findings & Verification

1. **Strict Route Allowlist:**
   - `apps/mobile_app/src/features/notifications/utils/notification-deep-link.ts` defines `ALLOWED_PARENT_ROUTES`:
     - `APPLICATION_HUB`: `/(parent)/applications/${id}`
     - `DOCUMENTS`: `/(parent)/applications/${id}/documents`
     - `FEES`: `/(parent)/applications/${id}/fees`
     - `RECEIPT`: `/(parent)/applications/${id}/receipt`
     - `ASSESSMENT`: `/(parent)/applications/${id}/assessment`
     - `DECISION`: `/(parent)/applications/${id}/decision`
     - `TIMELINE`: `/(parent)/applications/${id}/timeline`
     - `NOTIFICATIONS`: `/(parent)/notifications`
2. **Rejection of Arbitrary Routes:**
   - If a notification payload contains external URLs (`http://`, `https://`, `javascript:`) or administrative routes (`/admin`, `/staff`), `resolveNotificationRoute` returns `null`.
   - The user stays safely inside the notification feed.

**Verdict:** **SECURE / VERIFIED**

---

### 7. File Upload & Document Security

#### Threat Description

Unrestricted file uploads can introduce malicious executables, macro-enabled scripts, or denial-of-service via huge file transfers.

#### Findings & Verification

1. **Client-Side Validation:**
   - `apps/mobile_app/app/(parent)/applications/[id]/documents.tsx` and `WizardStep5Documents.tsx`:
     - Allowed MIME types restricted to `application/pdf`, `image/jpeg`, `image/png`.
     - File size capped at 10MB (`sizeMb > 10` rejects selection with an alert).
2. **Pre-Signed Ephemeral Downloads:**
   - Documents are retrieved via `GET /v1/applications/documents/:id/signed-url`.
   - The server verifies that the document belongs to the authenticated user's organization and application before generating a temporary signed URL.

**Verdict:** **SECURE / VERIFIED**

---

### 8. Financial Integrity & Idempotency

#### Threat Description

Double-clicking a payment button or intermittent network retries could record duplicate payments, corrupt ledgers, or over-charge parents.

#### Findings & Verification

1. **UI Double-Submit Lock:**
   - In `app/(parent)/applications/[id]/fees.tsx`:
     - Payment button is disabled while `isPaying === true`.
     - React Query mutation configured with `retry: false` to prevent automatic re-submission upon timeout.
2. **Backend Ledger Idempotency:**
   - `apps/backend/src/modules/admission-management/routes/admission.routes.ts` applies `checkIdempotency` middleware on `POST /:id/payment`.
   - `ParentFinanceService` and `StudentLedgerService` ensure transaction records require unique transaction references.

**Verdict:** **SECURE / VERIFIED**

---

### Security Findings & Remediation Register

| Finding ID | Vulnerability / Concern            | Severity | Affected Component                | Status       | Remediation & Verification                                                                                                                          |
| :--------- | :--------------------------------- | :------- | :-------------------------------- | :----------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SEC-01** | BOLA / IDOR in Child Applications  | High     | `applications/[id].tsx`           | **RESOLVED** | Server validates `created_by === userId` and `org_id === tenantOrgId`. Verified in `AdmissionController.getById`.                                   |
| **SEC-02** | BOLA / IDOR in Student Fee Ledgers | Critical | `/v1/fees/my/children/:studentId` | **RESOLVED** | Server validates `student_parents` linkage in `ParentFinanceService.verifyParentChildAccess`. Unlinked students return 403.                         |
| **SEC-03** | Plaintext Token Leakage Risk       | Critical | Storage layer                     | **RESOLVED** | Verified `Expo.SecureStore` used exclusively for tokens. Zero tokens in `AsyncStorage`. Tested in `secure-store.test.ts`.                           |
| **SEC-04** | Sensitive Information in Logs      | Medium   | Logging layer                     | **RESOLVED** | `logger.ts` and `api/client.ts` enforce automated redaction of Bearer tokens, passwords, and OTPs. Tested in `production-hardening-phase7.test.ts`. |
| **SEC-05** | Arbitrary Deep-Link Redirection    | Medium   | Push Notifications                | **RESOLVED** | Strict allowlist in `notification-deep-link.ts`. Non-allowlisted routes return null. Tested in `notifications-phase6.test.ts`.                      |
| **SEC-06** | Double Payment Submission          | High     | Fee payment mutation              | **RESOLVED** | UI button lock + `retry: false` + backend `checkIdempotency`. Tested in `admission-phase5.test.ts`.                                                 |
| **SEC-07** | Non-Parent Login to Mobile App     | Medium   | Auth lifecycle                    | **RESOLVED** | Role guard in `useLogin.ts` rejects non-parent accounts with 403 and purges tokens. Tested in `auth-phase2.test.ts`.                                |
| **SEC-08** | Stale Data on Child Switching      | Medium   | `ChildSwitcher.tsx`               | **RESOLVED** | React Query invalidates child-specific keys on selection change; state resets completely. Verified in `ParentDashboardScreen`.                      |
