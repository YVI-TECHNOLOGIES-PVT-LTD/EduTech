# EDUTRACK ERP — AUTHENTICATION UI REDESIGN

## 1. Existing Authentication Architecture

The EduTrack ERP authentication flow operates on a hybrid enterprise architecture that preserves strict role-based access control, tenant multi-tenancy isolation, and parent admission self-service:

- **State Management & Store**:
  - `authSlice` stores the authenticated `EnrichedUser`, native JWT access tokens (`accessToken`, `refreshToken`), and initialization status.
  - `permissionSlice` manages the active permission codes and role matrices (`PARENT`, `ADMIN`, `STAFF`, etc.).
  - `tenantSlice` tracks the active school/tenant ID (`school_id`).
  - `AuthContext` provides global session synchronization, identity fetching via `/me`, and role-checking helpers (`hasRole`, `hasPermission`, `signOut`).
- **Token & Storage Lifecycle**:
  - Tokens are saved in `localStorage` under `edutrack_access_token` and injected into subsequent API calls via Axios interceptors / RTK Query base queries.
- **Parent Registration & Admission Lifecycle**:
  - `RegistrationPage` (`/admission/register`) &rarr; Dispatches payload to `admissionApi.registerParent` (`/v1/admission/register`).
  - `OtpVerificationPage` (`/admission/register/otp`) &rarr; Verifies 6-digit code via `admissionApi.verifyOtp` (`/v1/admission/verify-otp`).
  - `RegistrationSuccessPage` (`/admission/register/success`) &rarr; Presents welcome status and directs to sign in.
  - `LoginPage` (`/login`) &rarr; Executes `useLoginMutation` (`/auth/login`), populates Redux credentials and redirects parents to `/app/admissions/my` and staff to `/app/workspace` or their requested protected route.

---

## 2. Login UI

The Login experience was upgraded from a plain form into a **desktop split-screen authentication experience**:

- **Left Brand Panel (`AuthLayout`)**:
  - Deep EduTrack indigo/slate-950 backdrop with subtle purple ambient glow.
  - Prominent EduTrack brand mark and `PARENT PORTAL` uppercase badge.
  - Headline: _"Your child's admission journey, all in one place."_
  - Interactive feature indicator cards:
    - **Applications**: Real-time submission & stage tracking
    - **Document Center**: Digital upload & verified storage
    - **Fee & Payment**: Transparent schedules & receipts
    - **Admission Status**: Instant evaluation decisions
  - 256-Bit SSL encryption trust badge and Academic Year 2026–2027 indicator.
- **Right Login Card**:
  - Clean `#f8fafc` background with rounded-3xl white card container (`shadow-[0_20px_50px_rgba(15,23,42,0.06)]`).
  - Form Fields:
    - **Email Address**: `Input` with left `Mail` icon, subtle border, accessible focus ring, and validation error messages.
    - **Password**: `Input` with left `Lock` icon, accessible `Eye`/`EyeOff` toggle button (`aria-label`), and right-aligned "Forgot password?" link.
    - **Remember Me**: Custom checkbox to remember device session.
  - **Submit Button**: High-contrast indigo button (`h-12`, `rounded-xl`, `font-bold`) with `Loader2` spinner ("Signing in...") and hover/active press animations.
  - **Error Alert**: User-friendly, safe error banner with `AlertCircle` preventing raw stack trace exposure.
  - **Secondary Navigation**: Clean links to "Create Account" (`/admission/register`) and "Contact School Support" (`/contact`).

---

## 3. Registration UI

The Parent Registration experience (`/admission/register`) was redesigned with structured form sections:

- **Section 1: Personal Information**:
  - First Name and Last Name inputs with `User` icons.
  - Mobile Phone Number with `+91` country code prefix and `Phone` icon.
  - Email Address with `Mail` icon and helper text.
- **Section 2: Account Security**:
  - Password and Confirm Password inputs with independent show/hide toggles.
  - **Live Password Strength Meter**: 3-stage visual progress bar (Weak / Moderate / Strong).
  - **Live Criteria Checklist**: Instant checkmark indicators for minimum 6 characters and number/symbol inclusions.
- **Section 3: Terms & Consent**:
  - Terms of Service & Privacy Policy acceptance checkbox with clear validation error handling.
  - Communication updates consent checkbox.
- **Submission & State**:
  - Primary CTA button "Create Account & Continue" with spinner state ("Creating Parent Account...").
  - Direct link back to Sign In.

---

## 4. OTP UI

The OTP Verification experience (`/admission/register/otp`) was redesigned into a focused security checkpoint:

- **Visual Header**: Glowing purple/indigo `KeyRound` badge with masked contact target (e.g., `98*****210` or `pa***@example.com`).
- **6-Digit Segmented Input**:
  - Individual numeric slot inputs with automatic forward focus, backspace backward focus, and arrow key navigation.
  - Full clipboard paste support (automatically parses and slots 6 digits).
  - High-visibility mono typography (`font-black`, `font-mono`, `text-2xl`).
- **Security & Expiration**:
  - `ShieldCheck` indicator: "Code valid for 10 minutes • Single use".
- **Cooldown & Resend**:
  - 60-second active countdown timer (`00:XX`).
  - Clickable "Resend Verification Code" button with `RefreshCw` icon once timer expires.
- **Verification CTA**: "Verify & Continue" button with loading spinner ("Verifying Code...").

---

## 5. Password Recovery UI

1. **Forgot Password (`/forgot-password`)**:
   - `AuthLayout` container with "Forgot Password?" header.
   - Email input with `Mail` icon.
   - "Send Reset Link" button with loading state.
   - Instant transition to confirmation view with glowing checkmark ("Check Your Inbox"), instructions, and "Return to Sign In" CTA.
2. **Reset Password (`/reset-password`)**:
   - URL token verification.
   - New Password and Confirm Password inputs with show/hide toggles and live mismatch validation.
   - "Reset Password" button with loading state.
   - Success state with "Password Updated Successfully" and direct "Sign In to Parent Portal" CTA.
3. **Session Expired (`/session-expired`)**:
   - Amber warning card with `Clock` icon and explanation.
   - Direct "Sign In to Continue" CTA.
4. **In-App Password Management (`ChangePasswordPage.tsx`)**:
   - Upgraded to matching design system inputs, eye toggles, and feedback alerts.

---

## 6. Design System

The redesign strictly adheres to the established EduTrack visual language:

- **Color Tokens**:
  - Primary: Deep EduTrack Indigo (`#4f46e5`, `indigo-600`, `indigo-700`) & Deep Dark Slate/Indigo (`#030712`, `indigo-950`).
  - Surfaces: `#f8fafc` background, pure white card containers (`bg-white dark:bg-card`), soft borders (`border-slate-200/80`, `border-border`).
  - Badges & Accents: Soft lavender (`bg-indigo-50 text-indigo-700`), emerald status accents (`emerald-500`), amber warning accents (`amber-500`).
- **Typography & Radii**:
  - Inter / System font hierarchy (`font-black`, `font-extrabold`, `font-bold`, `font-medium`).
  - Rounded geometry: `rounded-2xl` for inputs/badges, `rounded-3xl` for auth card containers, `rounded-xl` for buttons.
- **Icons**: Lucide icons (`Mail`, `Lock`, `User`, `Phone`, `Eye`, `EyeOff`, `KeyRound`, `ShieldCheck`, `CheckCircle2`, `ArrowRight`, `Sparkles`).

---

## 7. Responsive Design

Tested and optimized across all major breakpoints:

- **Desktop (1280px, 1440px, 1920px)**: Split-screen 2-column layout (Left Brand Panel + Right Form Container).
- **Tablet / Small Laptop (768px – 1024px)**: Adaptive split view with balanced margins and padding.
- **Mobile (320px, 375px, 390px, 414px)**: Single-column layout with compact top EduTrack brand header, no horizontal overflow, full-width touch-friendly inputs (`min-h-[44px]`), and responsive buttons.

---

## 8. Accessibility

- **Keyboard Navigation**: Full Tab/Shift-Tab order, Enter to submit, Arrow keys and Backspace support in OTP slots.
- **Screen Readers**: Explicit `<label>` elements linked via `htmlFor`/`id`, `aria-label` for show/hide password buttons, `aria-invalid` for validation errors, and `role="alert"` on error banners.
- **Contrast**: High contrast text ratios on all backgrounds (dark slate text on white/light gray; white text on indigo/slate-950).
- **Reduced Motion**: Transitions respect `prefers-reduced-motion` and stay within 150–250ms subtle curves.

---

## 9. Functional Preservation

| Subsystem                     | Status    | Details                                                                                                                     |
| :---------------------------- | :-------- | :-------------------------------------------------------------------------------------------------------------------------- |
| **JWT Storage & Restoration** | UNCHANGED | `localStorage.getItem('edutrack_access_token')` behavior intact                                                             |
| **API Endpoints & Contracts** | UNCHANGED | `/auth/login`, `/v1/admission/register`, `/v1/admission/verify-otp`, `/auth/forgot-password`, `/auth/reset-password` intact |
| **Redux Auth Slices**         | UNCHANGED | `authSlice`, `permissionSlice`, `tenantSlice` dispatches intact                                                             |
| **Role-Based Redirects**      | UNCHANGED | Parents route to `/app/admissions/my`, Staff route to `/app/workspace`                                                      |
| **Protected Route Guards**    | UNCHANGED | `ProtectedRoute`, `PermissionGuard`, and `AppShell` intact                                                                  |
| **Validation Rules**          | UNCHANGED | Zod schema contracts preserved                                                                                              |

---

## 10. Files Modified

### New Files:

- `apps/web_app/src/modules/auth/components/AuthLayout.tsx`
- `apps/web_app/docs/auth_ui_redesign.md`

### Modified Files:

- `apps/web_app/src/modules/auth/pages/LoginPage.tsx`
- `apps/web_app/src/modules/admission/pages/public/RegistrationPage.tsx`
- `apps/web_app/src/modules/admission/pages/public/OtpVerificationPage.tsx`
- `apps/web_app/src/modules/admission/pages/public/RegistrationSuccessPage.tsx`
- `apps/web_app/src/modules/auth/pages/ForgotPasswordPage.tsx`
- `apps/web_app/src/modules/auth/pages/ResetPasswordPage.tsx`
- `apps/web_app/src/modules/auth/pages/SessionExpiredPage.tsx`
- `apps/web_app/src/modules/auth/pages/ChangePasswordPage.tsx`
- `apps/web_app/src/pages/Login.tsx` (re-exports canonical `LoginPage`)
- `apps/web_app/src/app/router.tsx` (added `/register` & `/signup` convenience redirects)

---

## 11. Backend Changes

**0** (Zero backend files modified).

---

## 12. Database Changes

**0** (Zero Prisma schema, DDL, or SQL migration changes).

---

## 13. Verification

- **Frontend Typecheck (`tsc --noEmit`)**: **PASS** (0 errors)
- **Frontend Build (`vite build`)**: **PASS** (`✓ built in 1m 2s`)
- **Backend Typecheck**: NOT MODIFIED (0 changes)
- **Backend Build**: NOT MODIFIED (0 changes)

---

## 14. Final Status

**PASS** — Production Ready.
