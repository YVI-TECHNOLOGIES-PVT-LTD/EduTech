# EduTrack ERP — Authentication Visual Theme Alignment Report

**Canonical Design System Synchronization with the Landing Page**

---

## 1. Landing Page Source of Truth

The Landing Page was forensically inspected and established as the authoritative visual source of truth for all public-facing pages in EduTrack ERP:

- **Canonical Landing Page**: `apps/web_app/src/features/landing/pages/LandingPage.tsx`
- **Canonical Top Navbar**: `apps/web_app/src/features/landing/components/Navbar.tsx`
- **Canonical Announcement Bar**: `apps/web_app/src/features/landing/components/AnnouncementBar.tsx`
- **Design Tokens & Theme Styles**:
  - `apps/web_app/src/styles/landing.css`
  - `apps/web_app/src/styles/globals.css`
  - `apps/web_app/src/styles/theme.css`

---

## 2. Color Mapping

All authentication surfaces, panels, CTAs, and badges now inherit the exact design tokens of the EduTrack Landing Page:

| Design Element       | Landing Page Source Token                         | Auth Usage                                                                |
| :------------------- | :------------------------------------------------ | :------------------------------------------------------------------------ |
| **Primary Theme**    | `#042A2B` / `#063F40` (Dark Forest Teal)          | Brand Panel, Top Navbar, Brand Subtitles, Heading Text, Checked States    |
| **Accent / Gold**    | `#E7B76A` (Hover: `#d8a658`)                      | Primary CTAs, Logo Mark, Active Nav Items, Section Badges, Highlight Text |
| **Page Background**  | `bg-background` / `bg-editorial-mist` (`#f8fafc`) | Main Page Body, Split-Screen Form Canvas                                  |
| **Card Surface**     | `bg-card` (Pure White / Theme Card)               | Auth Form Card Containers, Segmented Inputs                               |
| **Soft Container**   | `bg-editorial-cream` / `bg-muted/40`              | Trust Strips, Information Pills, Password Strength Containers             |
| **Border Tokens**    | `border-border/80` (`border-slate-200/80`)        | Card Outlines, Input Borders, Section Dividers                            |
| **Text Primary**     | `text-[#042A2B]` (Light) / `text-white` (Dark)    | H1/H2 Headings, High-Contrast Labels                                      |
| **Text Muted**       | `text-muted-foreground` (`text-slate-600`)        | Subtitles, Helper Notes, Terms & Conditions                               |
| **Semantic Success** | `emerald-600` / `emerald-500` / `bg-emerald-50`   | Verification Success, Password Met Criteria                               |
| **Semantic Error**   | `destructive` / `red-500` / `bg-destructive/10`   | Form Validation Errors, API Failure Alerts                                |

---

## 3. Typography Mapping

- **Font Family**: Standard institutional font stack matching Landing Page (`font-sans`, Inter / system-ui).
- **Headings (H1/H2)**: `font-extrabold` / `font-black`, `tracking-tight`, dark pine `text-[#042A2B]` (dark: `text-white`) with gold `#E7B76A` highlight accents where applicable.
- **Form Labels**: `text-xs font-bold text-foreground mb-1.5` with semantic red `*` indicators.
- **Helper & Meta Text**: `text-xs font-medium text-muted-foreground` and `text-[11px] font-normal leading-relaxed`.

---

## 4. Icon Mapping

- **Library**: `lucide-react` (matching canonical Landing Page components).
- **Stroke & Scale**: Standard 16px (`w-4 h-4`) and 20px (`w-5 h-5`) with muted-foreground / `#063F40` / `#E7B76A` tints.
- **Brand Logo Icon**: Rounded 2xl gold badge (`bg-[#E7B76A]`) with `#063F40` `Sparkles` icon, matching the Landing Page header.

---

## 5. Button Mapping

- **Primary Action CTAs** (Sign In, Create Account, Verify & Continue, Send Reset Link, Reset Password):
  - `bg-[#E7B76A] hover:bg-[#d8a658] active:scale-[0.98] text-[#042A2B] font-extrabold rounded-xl text-xs sm:text-sm h-12 shadow-md transition-all flex items-center justify-center space-x-2`
- **Secondary / Outlined Buttons**:
  - `border border-border/80 text-foreground hover:bg-muted/80 rounded-xl h-11 sm:h-12 font-bold` or `border-white/20 text-white hover:bg-white/10`
- **Inline Link Actions**:
  - `text-[#063F40] dark:text-[#E7B76A] font-extrabold hover:underline transition-colors`

---

## 6. Card & Input Mapping

- **Auth Container Card**:
  - `bg-card border border-border/80 rounded-3xl p-6 sm:p-10 shadow-[0_20px_60px_rgba(4,42,43,0.08)] backdrop-blur-xl relative`
- **Form Input Fields**:
  - `h-11 rounded-xl text-xs font-medium border-border/80 pl-10 focus-visible:border-[#063F40] focus-visible:ring-1 focus-visible:ring-[#063F40] dark:focus-visible:border-[#E7B76A] dark:focus-visible:ring-[#E7B76A] bg-card text-foreground`

---

## 7. Navbar Synchronization

All authentication pages render `PublicNavbar.tsx` (`apps/web_app/src/components/layout/PublicNavbar.tsx`) sticky at the top spanning 100% viewport width:

- **Background**: `bg-[#042A2B] text-white border-b border-white/10`
- **Branding**: `Sparkles` gold badge + `EDUTRACK` font-extrabold + `PARENT PORTAL` uppercase gold subtitle
- **Navigation Links**: `Home`, `About`, `Academics`, `Admissions`, `Contact`, `Enquiry` with `text-emerald-100/80 hover:text-white` and active `text-[#E7B76A]`
- **Right CTAs**: Outlined Sign In button (`/login`) + Gold Apply/Register CTA (`/admission/register`)
- **Authenticated State Awareness**: Displays "Go to Portal" button when token session is active
- **Responsive Mobile Drawer**: Backdrop-blurred `bg-[#042A2B]/98` drawer with complete keyboard escape and route auto-close handling.

---

## 8. Authentication Pages Updated

1. `apps/web_app/src/components/layout/PublicNavbar.tsx`: Synchronized with Landing Page dark teal and gold navigation.
2. `apps/web_app/src/modules/auth/components/AuthLayout.tsx`: Split-screen layout with `#063F40` brand panel, `#E7B76A` feature badges, and `PublicNavbar` header integration.
3. `apps/web_app/src/modules/auth/pages/LoginPage.tsx`: Aligned login form with gold primary CTA, dark pine labels, and token-based inputs.
4. `apps/web_app/src/modules/admission/pages/public/RegistrationPage.tsx`: Aligned multi-field parent signup with live password meter, terms checkboxes, and token-based inputs.
5. `apps/web_app/src/modules/admission/pages/public/OtpVerificationPage.tsx`: Aligned 6-digit segmented OTP verification with gold verify button and resend cooldown.
6. `apps/web_app/src/modules/admission/pages/public/RegistrationSuccessPage.tsx`: Aligned onboarding milestone guide with emerald checkmark and gold portal CTA.
7. `apps/web_app/src/modules/auth/pages/ForgotPasswordPage.tsx`: Aligned password recovery flow with gold submit button and email delivery confirmation.
8. `apps/web_app/src/modules/auth/pages/ResetPasswordPage.tsx`: Aligned token-based password reset form and success confirmation card.
9. `apps/web_app/src/modules/auth/pages/SessionExpiredPage.tsx`: Aligned inactivity timeout alert card with amber status badge and gold sign-in button.
10. `apps/web_app/src/modules/auth/pages/ChangePasswordPage.tsx`: Aligned in-app password update dialog with dark pine/gold button styles.

---

## 9. Functional Preservation

- **Authentication Logic**: 100% untouched.
- **JWT & Redux Credentials**: Handled via `authSlice`, `permissionSlice`, and `tenantSlice`.
- **Form Validation & Schemas**: Handled via `react-hook-form` + `zodResolver`.
- **API Payloads & Endpoints**: Fully preserved against backend contracts (`/auth/login`, `/admission/register/parent`, `/admission/register/verify-otp`, `/auth/forgot-password`, `/auth/reset-password`).

---

## 10. Backend & Database Status

- **Backend Changes**: `0`
- **Database Changes**: `0`
- **Prisma Schema Changes**: `0`
- **SQL / DDL Changes**: `0`
- **Migration Changes**: `0`
