# Phase 1.1 Verification Report: Forgot Password Disconnect & Recovery Analysis

**Audit Document Reference:** `docs/parent-mobile-audit/phase-1.1/08-forgot-password-verification.md`  
**Parent Report:** `docs/parent-mobile-audit/phase-1/05-security-assessment.md`  
**Status:** COMPLETE & VERIFIED  
**Commit:** `a9c3486`

---

## 1. Executive Summary

This independent verification audits the end-to-end "Forgot Password" / account recovery user journey across `apps/mobile_app` and `apps/backend`.

Phase 1 finding `ISSUE-FUNC-01` is **fully confirmed as a Critical Functional Disconnect**:

1. The mobile screen (`apps/mobile_app/app/(auth)/forgot-password.tsx`) takes user email input but executes zero validation, zero API calls, and passes zero search parameters when navigating to the OTP screen.
2. The OTP screen (`apps/mobile_app/app/(auth)/otp.tsx`) requires `params.email` to submit; because the param is omitted, the submission handler silently aborts (`if (!isOtpComplete || !params.email) return;`).
3. The underlying OTP hook calls `POST /v1/auth/verify-otp`, which is designed exclusively to verify initial registration leads, not password recovery tokens.
4. The Express backend (`apps/backend/src/auth/auth.routes.ts`) possesses **zero endpoints** for password recovery or password resets.

---

## 2. Client-Side Code Verification

### 2.1 Forgot Password Screen Audit

- **File:** `apps/mobile_app/app/(auth)/forgot-password.tsx`
- **Lines 9–38:**

```typescript
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  return (
    <ScreenWrapper scrollable padded>
      <View className="py-8">
        <Text className="text-2xl font-bold ...">Reset Password</Text>
        <Text className="text-sm text-slate-500 ...">
          Enter your email address to receive a 6-digit OTP verification code.
        </Text>

        <Input
          label="Email Address"
          placeholder="user@school.edu"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <Button
          title="Send OTP"
          size="lg"
          onPress={() => router.push(ROUTES.AUTH.OTP as any)}
        />
      </View>
    </ScreenWrapper>
  );
}
```

- **Verified Client Defects:**
  1. **No API Call:** Pressing "Send OTP" immediately triggers `router.push(ROUTES.AUTH.OTP)`. No request is sent to any server to generate, sign, or deliver an OTP.
  2. **Parameter Drop:** The `email` state is not passed in route parameters (e.g., `router.push({ pathname: ROUTES.AUTH.OTP, params: { email } })`).
  3. **No Input Validation:** Pressing "Send OTP" with an empty or malformed email string proceeds directly to the OTP screen without validation.

---

### 2.2 OTP Screen & Hook Audit

- **File:** `apps/mobile_app/app/(auth)/otp.tsx`
- **Lines 22 & 79–87:**

```typescript
const params = useLocalSearchParams<{ email?: string; phone?: string }>();
...
const handleSubmit = () => {
  if (!isOtpComplete || !params.email) return;

  verifyOtp({
    email: params.email.trim().toLowerCase(),
    phone: params.phone || undefined,
    otp: otpCode,
  });
};
```

- **Verified Behavior:**
  - Because `forgot-password.tsx` passes no params, `params.email` is `undefined`.
  - When the user types 6 digits, `handleSubmit` silently executes `return` because `!params.email` evaluates to `true`.
  - The UI provides zero feedback or error message to explain why the submit button is non-responsive.

---

## 3. Backend Route & Service Audit

We performed an exhaustive codebase search across `apps/backend/src` for any password reset, recovery, or OTP generation endpoints.

### 3.1 Authentication Route Verification

- **File:** `apps/backend/src/auth/auth.routes.ts`
- **Lines 8–16 (All Registered Auth Routes):**

```typescript
// Public Authentication Endpoints (Unprotected)
publicAuthRouter.post('/login', AuthController.login);
publicAuthRouter.post('/refresh', AuthController.refresh);
publicAuthRouter.post('/register', AuthController.registerParent);
publicAuthRouter.post('/verify-otp', AuthController.verifyOtp);

// Protected Authentication Endpoints
protectedAuthRouter.post('/logout', authenticate, AuthController.logout);
```

### 3.2 Findings on Backend Password Recovery

- Search for `forgot-password`, `reset-password`, `request-reset`, `send-reset-otp` yielded **0 results**.
- `AuthController.verifyOtp` maps to registration claim confirmation (`leads.status = verified`), not account credential modification.
- There are no database tables or Prisma fields for password reset tokens, token expiration, or password history.

---

## 4. End-to-End Failure Matrix

| Step                            | User Expectation                                | Actual System Behavior                                 | Status      |
| ------------------------------- | ----------------------------------------------- | ------------------------------------------------------ | ----------- |
| 1. Enter email & tap "Send OTP" | Server validates account & emails OTP           | No API call; navigates to OTP screen with empty params | **BROKEN**  |
| 2. Enter 6-digit OTP            | Server verifies code and issues reset token     | `params.email` is undefined; handler silently exits    | **BROKEN**  |
| 3. Set new password             | Screen allows setting new password              | No new password screen or route exists                 | **MISSING** |
| 4. Backend endpoint             | `POST /v1/auth/forgot-password` generates token | Endpoint does not exist in backend router              | **MISSING** |

---

## 5. Security & Functional Implications

1. **Self-Service Lockout:** Any parent who forgets their password is permanently locked out of the mobile app and cannot recover their account without direct database intervention by a systems administrator.
2. **Broken UX Illusion:** The UI creates an illusion of security and account recovery while silently failing at every step.

---

## 6. Recommendations for Phase 2 Implementation

1. **Backend Implementation (`apps/backend`):**
   - Implement `POST /v1/auth/forgot-password`: Generates a cryptographic, time-limited reset token and sends an email via SMTP/SendGrid.
   - Implement `POST /v1/auth/reset-password`: Accepts `{ email, token, newPassword }`, verifies the token, hashes the new password with bcrypt/argon2, and invalidates all existing sessions.
2. **Mobile Client Implementation (`apps/mobile_app`):**
   - Connect `forgot-password.tsx` to `POST /v1/auth/forgot-password` with loading state and error feedback.
   - Pass validated email to the OTP screen.
   - Create a dedicated `app/(auth)/reset-password.tsx` screen for entering and confirming the new password.
