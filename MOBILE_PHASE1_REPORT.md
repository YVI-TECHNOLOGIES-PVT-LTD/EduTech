# EduTrack ERP Mobile V1 — Phase 1 Report

## Foundation & Canonical API Layer

**Document**: `MOBILE_PHASE1_REPORT.md`  
**Date**: August 22, 2026  
**Status**: APPROVED & COMPLETE  
**Audited Location**: `apps/mobile_app/`

---

## 1. Architecture Audited & Established

The production foundation for the EduTrack ERP Parent / Admission Mobile Application has been fully consolidated:

```text
                    Mobile UI (Future Phases)
                               │
                               ▼
             TanStack React Query Hooks (`useQuery` / `useMutation`)
                               │
                               ▼
            Canonical Typed API Services (`src/api/*.api.ts`)
                               │
                               ▼
          Unified Production API Client (`src/api/client.ts`)
                               │
             ┌─────────────────┴─────────────────┐
             ▼                                   ▼
  Authorization Interceptor              401 Session Interceptor
  (`expo-secure-store` JWT)              (`clearSession` + `logout`)
             │                                   │
             └─────────────────┬─────────────────┘
                               ▼
                   EduTrack Backend (`/api/v1`)
```

- **Single HTTP Transport**: One unified, centralized `apiClient` instance configured with base URL, timeout, request correlation headers, response error normalization, and safe logging.
- **Single Secret Token Strategy**: `SecureStorage` using `expo-secure-store` (with web fallback) exclusively for JWT access and refresh tokens.
- **Single Form Draft Strategy**: `DraftStorage` using `@react-native-async-storage/async-storage` strictly for non-sensitive application form drafts (`edutrack_app_draft_<userId>_<appId>`).
- **Single Client Authentication State**: `useAuthStore` (Zustand) managing only client-side session lifecycle (`isHydrating`, `isAuthenticated`, `user`, `tokens`).
- **Single Server State Strategy**: `QueryClientProvider` (TanStack Query) managing server data caching, background revalidation, and mutation safety (strict no-retry policy on mutations).

---

## 2. Files Changed & Created

| Category              | File Path                                                | Action      | Description                                                                                     |
| :-------------------- | :------------------------------------------------------- | :---------- | :---------------------------------------------------------------------------------------------- |
| **Config & Env**      | `apps/mobile_app/.env`                                   | Modified    | Configured API (`http://localhost:3000/api`) & WS (`ws://localhost:3000/ws/notifications`) URLs |
| **Config & Env**      | `apps/mobile_app/.env.example`                           | Modified    | Updated template with port 3000 endpoints                                                       |
| **Config & Env**      | `apps/mobile_app/src/config/env.ts`                      | Modified    | Added platform-aware URL resolution (Android emulator `10.0.2.2` vs localhost)                  |
| **Storage**           | `apps/mobile_app/src/storage/secure-store.ts`            | **Created** | Consolidated SecureStore abstraction for tokens                                                 |
| **Storage**           | `apps/mobile_app/src/storage/draft-storage.ts`           | **Created** | AsyncStorage draft persistence for wizard progress                                              |
| **Storage**           | `apps/mobile_app/src/services/secure-storage.service.ts` | Modified    | Delegated to unified `SecureStorage`                                                            |
| **Storage**           | `apps/mobile_app/src/core/auth/token-manager.ts`         | Modified    | Delegated to unified `SecureStorage`                                                            |
| **API Client**        | `apps/mobile_app/src/api/client.ts`                      | **Created** | Production Axios client with `ApiError` normalization & 401 handling                            |
| **API Client**        | `apps/mobile_app/src/services/api-client.ts`             | Modified    | Re-exported canonical `apiClient` & `ApiError`                                                  |
| **API Client**        | `apps/mobile_app/src/core/api/clients/http-client.ts`    | Modified    | Re-exported canonical `apiClient`                                                               |
| **API Endpoints**     | `apps/mobile_app/src/api/endpoints.ts`                   | **Created** | Canonical API endpoints mapped strictly to `MOBILE_IMPLEMENTATION_GATE.md`                      |
| **API Endpoints**     | `apps/mobile_app/src/constants/api-endpoints.ts`         | Modified    | Re-exported canonical `ENDPOINTS`                                                               |
| **Query Keys**        | `apps/mobile_app/src/api/query-keys.ts`                  | **Created** | Centralized query key factory for React Query                                                   |
| **Types**             | `apps/mobile_app/src/types/auth.types.ts`                | **Created** | Request/Response types for login, registration, OTP, auth state                                 |
| **Types**             | `apps/mobile_app/src/types/admission.types.ts`           | **Created** | Domain types for applications, statuses, documents, assessments, decisions, fees                |
| **Types**             | `apps/mobile_app/src/types/notification.types.ts`        | **Created** | Notification models, lists, and unread counts                                                   |
| **Types**             | `apps/mobile_app/src/types/user.types.ts`                | Modified    | Unified `UserProfile` supporting both camelCase and snake_case backend fields                   |
| **Types**             | `apps/mobile_app/src/types/index.ts`                     | Modified    | Exported all type modules                                                                       |
| **API Services**      | `apps/mobile_app/src/api/auth.api.ts`                    | **Created** | Parent auth service (`login`, `registerParent`, `verifyOtp`, `logout`)                          |
| **API Services**      | `apps/mobile_app/src/api/metadata.api.ts`                | **Created** | Public metadata service (`config`, `academicYears`, `classes`, `documentTypes`)                 |
| **API Services**      | `apps/mobile_app/src/api/applications.api.ts`            | **Created** | Applications service (`listMine`, `getById`, `create`, `updateStatus`)                          |
| **API Services**      | `apps/mobile_app/src/api/documents.api.ts`               | **Created** | Multipart documents service (`upload`, `getSignedUrl`)                                          |
| **API Services**      | `apps/mobile_app/src/api/assessment.api.ts`              | **Created** | Assessment results service (`getByApplicationId`)                                               |
| **API Services**      | `apps/mobile_app/src/api/decision.api.ts`                | **Created** | Admission decisions service (`getByApplicationId`)                                              |
| **API Services**      | `apps/mobile_app/src/api/fees.api.ts`                    | **Created** | Fees & ledger payment service (`getFeeSummary`, `recordPayment`, `getReceipt`)                  |
| **API Services**      | `apps/mobile_app/src/api/notifications.api.ts`           | **Created** | Notifications service (`list`, `getUnreadCount`, `markRead`, `markAllRead`)                     |
| **API Services**      | `apps/mobile_app/src/api/index.ts`                       | **Created** | Single export index for entire API layer                                                        |
| **State & Providers** | `apps/mobile_app/src/stores/auth.store.ts`               | Modified    | Added explicit hydration lifecycle (`isHydrating`, `setHydrating`)                              |
| **State & Providers** | `apps/mobile_app/src/providers/AuthProvider.tsx`         | Modified    | Cold-start token hydration with `isInitialized` context                                         |
| **State & Providers** | `apps/mobile_app/src/providers/QueryProvider.tsx`        | Modified    | Status-aware retry policy and strict `retry: false` on mutations                                |
| **Tests**             | `apps/mobile_app/jest.config.js`                         | **Created** | Jest configuration with setup mocks                                                             |
| **Tests**             | `apps/mobile_app/tests/jest.setup.js`                    | **Created** | Standard mocks for React Native / SecureStore / AsyncStorage                                    |
| **Tests**             | `apps/mobile_app/tests/unit/api-client.test.ts`          | **Created** | Unit tests for API client and error normalization                                               |
| **Tests**             | `apps/mobile_app/tests/unit/secure-store.test.ts`        | **Created** | Unit tests for SecureStorage                                                                    |
| **Tests**             | `apps/mobile_app/tests/unit/draft-storage.test.ts`       | **Created** | Unit tests for DraftStorage                                                                     |
| **Tests**             | `apps/mobile_app/tests/unit/auth-store.test.ts`          | **Created** | Unit tests for AuthStore                                                                        |
| **Tests**             | `apps/mobile_app/tests/unit/api-services.test.ts`        | **Created** | Unit tests for all canonical API services                                                       |
| **Tests**             | `apps/mobile_app/package.json`                           | Modified    | Added `"test": "jest"` script                                                                   |

---

## 3. API Client & Error Normalization

The unified `apiClient` handles:

1. **Bearer Token Injection**: Automatically pulls active token from `SecureStorage.getAccessToken()`.
2. **Correlation ID**: Generates and attaches unique `X-Request-Id` for tracing.
3. **Safe Redaction Logging**: Redacts tokens, passwords, OTPs, and signed URLs in development mode.
4. **Normalized Error Taxonomy**:
   - `ApiError(0, ..., 'NETWORK_ERROR' | 'TIMEOUT')`: Network / connectivity failures with user-friendly messages.
   - `ApiError(401, ..., 'UNAUTHORIZED')`: Triggers automatic `SecureStorage.clearSession()` and `useAuthStore.getState().logout()`.
   - `ApiError(403, ..., 'FORBIDDEN')`: Access denied messages.
   - `ApiError(404, ..., 'NOT_FOUND')`: Missing resource messages.
   - `ApiError(409, ..., 'CONFLICT')`: Resource conflict / concurrency state messages.
   - `ApiError(422, ..., 'VALIDATION_ERROR')`: Form / DTO validation error messages.
   - `ApiError(429, ..., 'RATE_LIMITED')`: Rate limiting notices.
   - `ApiError(5xx, ..., 'SERVER_ERROR')`: Sanitized backend failure messages without exposing raw server stack traces.

---

## 4. Security & Storage Verification

- **Zero JWT Tokens in AsyncStorage**: Verified via search. `SecureStorage` using `expo-secure-store` handles all credentials.
- **Zero Passwords / OTPs Stored**: Neither `SecureStore` nor `AsyncStorage` stores plain passwords or OTP codes.
- **Zero Signed URLs Stored**: Pre-signed URLs are fetched on-demand with short TTLs.
- **No Arbitrary Parent ID in UI Requests**: The mobile app relies entirely on server-side token identity (`GET /v1/applications?mine=true`), preventing IDOR vulnerabilities.
- **Strict Prohibition of Legacy Endpoints**: Grep verification confirmed zero references to legacy routes (`/dashboard/parent/overview`, `/v1/admission/my`, `/v1/admission/apply`, `/v1/admission/application/documents/upload`).

---

## 5. Verification & Test Results

### Automated Unit Test Suite

Ran `npm test` (`jest`):

- **Test Suites**: 6 passed, 6 total
- **Tests**: 25 passed, 25 total
- **Snapshots**: 0 total
- **Time**: 7.023s

```text
PASS tests/unit/api-client.test.ts (5 tests)
PASS tests/unit/app.test.ts (1 test)
PASS tests/unit/auth-store.test.ts (4 tests)
PASS tests/unit/draft-storage.test.ts (3 tests)
PASS tests/unit/secure-store.test.ts (3 tests)
PASS tests/unit/api-services.test.ts (9 tests)
```

### TypeScript Compilation

- `apps/mobile_app` (`tsc --noEmit`): **PASS (0 errors)**
- `apps/backend` (`tsc --noEmit`): **PASS (0 errors)**
- `apps/web_app` (`tsc --noEmit`): **PASS (0 errors)**

---

## 6. Phase 1 Verdict

**PHASE 1 (FOUNDATION & CANONICAL API LAYER) IS COMPLETE AND VERIFIED.**  
The repository is primed for **Phase 2 (Authentication & Parent Session)**.
