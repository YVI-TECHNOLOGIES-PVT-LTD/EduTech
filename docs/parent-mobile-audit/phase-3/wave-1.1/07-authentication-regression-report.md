# EduTrack ERP — Parent Mobile App

# Phase 3 — Wave 1.1: Authentication & Session Safety Regression Report

## 1. Authentication Architecture Overview

The authentication and session lifecycle operates through a multi-tier security architecture:

```text
  [ User Login: /(auth)/login ]
         │
         ├── Credentials (Email / Password / OTP)
         ▼
  [ AuthService.login() ]
         │
         ├── POST /v1/auth/login
         ├── SecureStorage.setTokens(accessToken, refreshToken)
         ├── SecureStorage.setUser(userProfile)
         └── useAuthStore.getState().setSession(user, tokens)
                     │
                     ▼
  [ Session Lifecycle & API Traffic ]
         │
         ├── apiClient Axios Interceptor attaches Bearer Token
         ├── On 401: Triggers POST /v1/auth/refresh via refresh token queue
         └── ProtectedRoute Guards gate access to (main) and (parent) routes
                     │
                     ▼
  [ User Logout: AuthService.logout() ]
         │
         ├── 1. SecureStorage.clearSession() (Encrypted tokens purged)
         ├── 2. useChildStore.getState().reset() (Active child & AsyncStorage purged)
         └── 3. useAuthStore.getState().logout() (Zustand memory purged)
```

---

## 2. Verification of Security Safeguards

### 2.1. Secure Token Storage

- Encrypted storage is managed by [`SecureStorage`](file:///c:/Users/user/Documents/GitHub/EduTech/apps/mobile_app/src/storage/secure-store.ts) backed by `expo-secure-store` (Keychain on iOS, Keystore on Android).
- Neither JWT access tokens nor refresh tokens are stored in unencrypted `AsyncStorage` or plain file storage.

### 2.2. Token Refresh Flow

- Verified in [`apps/mobile_app/src/api/client.ts`](file:///c:/Users/user/Documents/GitHub/EduTech/apps/mobile_app/src/api/client.ts):
  - When an API request returns an HTTP 401 Unauthorized status, the Axios response interceptor intercepts the failure.
  - It retrieves the stored `refreshToken` from `SecureStorage` and posts to `/v1/auth/refresh`.
  - If the refresh succeeds, the new access token is stored and the failed request is re-dispatched seamlessly.
  - If refresh fails, it triggers `AuthService.logout()`, immediately ejecting the user to the login screen.

### 2.3. Logout Sequence & Child Store Purge

- In [`apps/mobile_app/src/core/auth/auth.service.ts`](file:///c:/Users/user/Documents/GitHub/EduTech/apps/mobile_app/src/core/auth/auth.service.ts#L15-L21):
  ```typescript
  static async logout(): Promise<void> {
    await SecureStorage.clearSession();
    useChildStore.getState().reset();
    useAuthStore.getState().logout();
  }
  ```
- **Audit Verification**:
  - `SecureStorage.clearSession()` removes all tokens from hardware encryption.
  - `useChildStore.getState().reset()` removes `edutrack_active_child_id` from `AsyncStorage` and sets `selectedChildId: null` and `children: []`.
  - `useAuthStore.getState().logout()` clears user profile state.
  - This guarantees that when a parent logs out on a shared tablet or mobile device, no child identity or session remains in memory or local storage.

### 2.4. Route Protection (`ProtectedRoute.tsx`)

- Located in [`apps/mobile_app/src/components/common/ProtectedRoute.tsx`](file:///c:/Users/user/Documents/GitHub/EduTech/apps/mobile_app/src/components/common/ProtectedRoute.tsx):
  - Gated by role whitelist: `['parent', 'guardian', 'admin', 'super_admin']`.
  - Wrapped around `app/(main)/_layout.tsx`, `app/(parent)/_layout.tsx`, and `app/(tabs)/_layout.tsx`.
  - Non-authenticated requests are bounced to `ROUTES.AUTH.LOGIN`.

---

## 3. Regression Verdict

No weakened authentication behaviors, token leaks, or bypass mechanisms were introduced. Authentication safety is **100% PRESERVED**.
