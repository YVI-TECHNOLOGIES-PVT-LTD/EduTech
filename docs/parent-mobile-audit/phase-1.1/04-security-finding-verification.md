# Phase 1.1 Verification Report: Security Findings & Baseline Risk Analysis

**Audit Document Reference:** `docs/parent-mobile-audit/phase-1.1/04-security-finding-verification.md`  
**Parent Report:** `docs/parent-mobile-audit/phase-1/05-security-assessment.md`  
**Status:** COMPLETE & VERIFIED  
**Commit:** `a9c3486`

---

## 1. Executive Summary

This independent verification audits all security findings reported in Phase 1 regarding the EduTrack Parent Mobile App (`apps/mobile_app`) and its interaction with the Express backend (`apps/backend`).

Both critical security findings from Phase 1 (`ISSUE-SEC-01` and `ISSUE-SEC-02`) have been **independently verified and confirmed** with exact source code citations. Additionally, three secondary security architectural risks (session hydration without role verification, web storage fallback risk, and unhandled refresh token rotation) were evaluated.

---

## 2. Verification of `ISSUE-SEC-01`: Cleartext JWT in WebSocket URL Query Parameter

### 2.1 Finding Description

The mobile client establishes its persistent notification WebSocket connection by transmitting the user's bearer authentication JWT token as a raw URL query parameter (`?token=...`).

### 2.2 Client-Side Code Verification

- **File:** `apps/mobile_app/src/features/notifications/services/notification-socket.ts`
- **Lines 87–93:**

```typescript
const wsProtocol = resolvedWsBase.startsWith('https') ? 'wss' : 'ws';
const normalizedHost = resolvedWsBase.replace(/^https?:\/\//, '').replace(/\/$/, '');
const endpoint = `${wsProtocol}://${normalizedHost}/api/v1/notifications/stream?token=${encodeURIComponent(
  token,
)}`;

this.ws = new WebSocket(endpoint);
```

### 2.3 Backend Architectural Verification

We inspected `apps/backend/src/modules/notifications/realtime/notification.realtime.ts` to examine backend WebSocket authentication handling:

- **Lines 51–64:**

```typescript
private extractToken(req: IncomingMessage): string | null {
  // 1. Check WebSocket subprotocol: Sec-WebSocket-Protocol
  const protocolHeader = req.headers['sec-websocket-protocol'];
  if (protocolHeader) {
    const protocols = protocolHeader.split(',').map((p) => p.trim());
    const authProto = protocols.find((p) => p.startsWith('bearer.'));
    if (authProto) {
      return authProto.slice(7);
    }
  }

  // 2. Check query parameter (legacy/fallback)
  const parsedUrl = parse(req.url || '', true);
  if (typeof parsedUrl.query.token === 'string' && parsedUrl.query.token.length > 0) {
    return parsedUrl.query.token;
  }

  return null;
}
```

### 2.4 Evidence & Risk Evaluation

- **Verdict:** **CONFIRMED — CRITICAL DEFECT**.
- **Evidence:** The backend's primary preferred token mechanism is `Sec-WebSocket-Protocol` (`bearer.<token>`), with query parameters explicitly treated as a legacy fallback. The mobile client completely ignores subprotocols and sends the token in the URL.
- **Risk:**
  1. **Log Leakage:** Query parameters are routinely logged in full plain text by reverse proxies (Nginx, Cloudflare, AWS ALB), API gateways, and web server access logs.
  2. **Browser/OS History & Cache:** On web or proxy-inspected environments, tokens in URLs persist in access records.
  3. **Man-In-The-Middle / Shoulder Surfing:** URL paths are exposed in diagnostic monitoring tools (DataDog, Sentry, APM tracing).

---

## 3. Verification of `ISSUE-SEC-02`: Missing Silent Refresh Token Rotation

### 3.1 Finding Description

The mobile application stores a `refreshToken` in secure storage upon login, but never utilizes it. When an `accessToken` expires (HTTP 401), the Axios response interceptor immediately forces an application-wide logout rather than refreshing the token.

### 3.2 Client-Side Interceptor Verification

- **File:** `apps/mobile_app/src/api/client.ts`
- **Lines 106–122:**

```typescript
client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      const isRegisterRequest = error.config?.url?.includes('/auth/register');

      if (!isLoginRequest && !isRegisterRequest) {
        onUnauthorized?.();
      }
    }
    return Promise.reject(error);
  },
);
```

- **File:** `apps/mobile_app/src/providers/AuthProvider.tsx` & `src/stores/auth.store.ts`:
  When `onUnauthorized` is fired, `AuthService.logout()` deletes all stored tokens and clears Zustand state. There is zero retry mechanism, zero queueing of concurrent requests, and zero call to a refresh endpoint.

### 3.3 Backend Refresh Endpoint Verification

We inspected `apps/backend/src/auth/auth.routes.ts` and `apps/backend/src/auth/auth.controller.ts`:

- **Route Registration:**

```typescript
// apps/backend/src/auth/auth.routes.ts line 9
authRouter.post('/refresh', authController.refreshToken);
```

- **Controller Implementation:**

```typescript
// apps/backend/src/auth/auth.controller.ts lines 63–75
async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ success: false, message: 'Refresh token is required' });
      return;
    }
    const result = await authService.refreshToken(refreshToken);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
```

### 3.4 Evidence & Risk Evaluation

- **Verdict:** **CONFIRMED — HIGH RISK / ARCHITECTURAL DEFECT**.
- **Evidence:** Backend fully supports `POST /v1/auth/refresh`. The mobile app collects and stores `refreshToken` in `apps/mobile_app/src/storage/secure-store.ts` (`edutrack_refresh_token`), but never uses it.
- **Risk:**
  1. Once access tokens reach their 15-minute or 1-hour expiration, active parents will be abruptly kicked out of active form filling, document uploads, or fee payments.
  2. Degrades user retention and breaks real-time background push/WebSocket reconnects.

---

## 4. Verification of Additional Security Controls

### 4.1 Token Storage Security

- **File:** `apps/mobile_app/src/storage/secure-store.ts`
- **Implementation:**
  - **Native (iOS / Android):** Uses `expo-secure-store` (`SecureStore.setItemAsync`, `SecureStore.getItemAsync`, `SecureStore.deleteItemAsync`). Keys are stored in the iOS Keychain and Android KeyStore with hardware encryption.
  - **Web Fallback:**
    ```typescript
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    }
    ```
- **Finding:** While native storage is secure, web fallback uses unencrypted `localStorage`, vulnerable to XSS. If web builds are deployed in Phase 2, an in-memory or httpOnly cookie strategy must be used.

### 4.2 Role Verification & Session Hydration

- **File:** `apps/mobile_app/src/providers/AuthProvider.tsx` (Lines 21–32)
- **File:** `apps/mobile_app/src/stores/auth.store.ts` (Lines 28–32)
- **Finding:** During app cold start, `AuthProvider` reads `accessToken` from `SecureStorage`. If present, it sets:
  ```typescript
  setTokens({ accessToken, refreshToken });
  ```
  Zustand computes `isAuthenticated: !!tokens?.accessToken`.
  **Defect:** The client does **not** call `GET /v1/auth/me` during hydration. It never validates if:
  1. The token has been revoked on the server.
  2. The user has the `PARENT` role.
  3. The account is suspended.

### 4.3 Deep Link Route Sanitization & Allowlisting

- **File:** `apps/mobile_app/src/features/notifications/utils/notification-deep-link.ts`
- **Lines 6–15:** Strict allowlist `ALLOWED_PARENT_ROUTES` restricting deep-link targets to parent application hub, documents, fees, receipt, assessment, decision, timeline, and notifications.
- **Lines 21–51:** `extractApplicationId` sanitizes entity IDs and strips non-string inputs.
- **Verdict:** **VERIFIED POSITIVE CONTROL**. Deep link redirection is hardened against arbitrary URI navigation and prevents navigating to administrative or internal staff screens.

---

## 5. Security Findings Matrix

| Finding ID     | Title                                                       | Verified Severity | Code Reference                     | Recommended Action for Phase 2                                                 |
| -------------- | ----------------------------------------------------------- | ----------------- | ---------------------------------- | ------------------------------------------------------------------------------ |
| `ISSUE-SEC-01` | Cleartext JWT in WebSocket URL query param                  | **CRITICAL**      | `notification-socket.ts#L91`       | Migrate to `Sec-WebSocket-Protocol: bearer.<token>`                            |
| `ISSUE-SEC-02` | Missing silent refresh token interceptor                    | **HIGH**          | `client.ts#L106-L122`              | Implement Axios interceptor with token queue consuming `POST /v1/auth/refresh` |
| `ISSUE-SEC-03` | Session hydration omits server-side token & role validation | **MEDIUM**        | `AuthProvider.tsx#L24-L32`         | Call `GET /v1/auth/me` on hydration before unblocking UI                       |
| `ISSUE-SEC-04` | Plaintext `localStorage` fallback on Web platform           | **LOW**           | `secure-store.ts#L13-L16`          | Restrict web storage or use secure session cookie                              |
| `SEC-CTRL-01`  | Deep Link Allowlist & Entity ID Sanitization                | **POSITIVE**      | `notification-deep-link.ts#L6-L51` | Maintain and extend to enrolled SIS routes in Phase 2                          |
