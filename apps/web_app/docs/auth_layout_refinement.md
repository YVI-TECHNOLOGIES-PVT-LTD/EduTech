# EduTrack ERP — Authentication Layout Refinement Report
**Duplicate Branding Removal, Fixed Left Brand Panel & Independently Scrollable Right Auth Content**

---

## 1. Duplicate Branding Removed

- **Previous Issue**: The public navigation bar already rendered the canonical EduTrack logo badge and title at the top of the viewport, but the left brand panel was also rendering a second copy of the EduTrack logo and "PARENT PORTAL" title.
- **Resolution**: Completely removed the redundant logo mark and brand header from inside the left panel. The single authoritative source of primary brand identity remains the top `PublicNavbar`. The left panel now opens cleanly with the **Academic Year 2026–2027** gold badge, value proposition headline, and feature indicator cards.

---

## 2. Public Navbar Reused

- Authentication pages reuse the canonical EduTrack Landing Page navigation bar primitives ([PublicNavbar.tsx](file:///c:/Users/DELL/Desktop/EduTech/apps/web_app/src/components/layout/PublicNavbar.tsx)):
  - EduTrack Logo + Sparkles gold icon mark
  - Full navigation links (`Home`, `About`, `Academics`, `Admissions`, `Contact`, `Enquiry`)
  - Primary CTAs (`Sign In`, `Create Account` / `Apply Now`)
  - Mobile responsive hamburger menu drawer with escape key and route change handlers

---

## 3. Left Brand Panel Fixed (No Scroll)

- On desktop breakpoints (`lg:`), the left brand panel (`AuthBrandPanel`) is positioned within `lg:h-screen lg:overflow-hidden`:
  - **Height**: Fixed to the viewport remainder below the navbar.
  - **Scrolling**: `overflow: hidden` (vertical scroll is completely disabled).
  - **Content Composition**: Compact 2x2 feature card grid and SSL security footer designed to fit comfortably in viewports without overflow.

---

## 4. Right Auth Content Independently Scrollable

- The right authentication area (`AuthContentPanel` / `main`) is configured with:
  - `flex-1 min-h-0 h-full overflow-y-auto overflow-x-hidden`
  - Long multi-field forms (e.g. `RegistrationPage`) start with comfortable top padding (`py-8 sm:py-10`) and scroll down smoothly through personal details, mobile OTP notes, account security, password strength meter, and terms checkboxes to the submit button.
  - Short forms (e.g. `LoginPage`, `ForgotPasswordPage`, `SessionExpiredPage`) remain vertically balanced (`my-auto`).
  - No page-level double scrollbars on desktop.

---

## 5. Mobile Responsive Behavior

- On mobile and small screens (`< lg`):
  - Two-column fixed split is gracefully disabled.
  - The page behaves as a natural single-column vertical flow with page-level scrolling.
  - No nested tiny scroll containers.

---

## 6. Shared AuthLayout Architecture

```text
PublicNavbar (Top Sticky Bar, 100% Full Width)
      ↓
AuthLayout (Desktop Height: calc(100vh - navbar), lg:overflow-hidden)
   ├── AuthBrandPanel (Left Column, fixed, overflow-hidden, no duplicate logo)
   └── AuthContent (Right Column, flex-1, min-h-0, overflow-y-auto, scrollable form)
```

---

## 7. Pages Affected

1. `apps/web_app/src/modules/auth/components/AuthLayout.tsx` (Shared layout & AuthBrandPanel)
2. `apps/web_app/src/modules/auth/pages/LoginPage.tsx`
3. `apps/web_app/src/modules/admission/pages/public/RegistrationPage.tsx`
4. `apps/web_app/src/modules/admission/pages/public/OtpVerificationPage.tsx`
5. `apps/web_app/src/modules/admission/pages/public/RegistrationSuccessPage.tsx`
6. `apps/web_app/src/modules/auth/pages/ForgotPasswordPage.tsx`
7. `apps/web_app/src/modules/auth/pages/ResetPasswordPage.tsx`
8. `apps/web_app/src/modules/auth/pages/SessionExpiredPage.tsx`

---

## 8. Authentication Functionality Preserved

- Zero changes to login/registration handlers, JWT tokens, OTP verification logic, Redux store slices (`authSlice`, `permissionSlice`, `tenantSlice`), or API endpoints.

---

## 9. Backend & Database Status

- **Backend Changes**: `0`
- **Database Changes**: `0`
- **Prisma Schema Changes**: `0`
- **SQL / DDL Changes**: `0`

---

## 10. Final Viewport / Scroll Correction

- **Root Cause of Left-Panel Clipping**:
  - The left panel previously had `my-auto` inside a flex container where content height approached or exceeded viewport constraints on standard laptop viewports. In flexbox, `my-auto` centers content by assigning negative margin if the content is taller than the container, which pushed the Academic Year badge and H1 headline upwards under the navbar.
- **Final Navbar / Auth-Shell Relationship**:
  - The page root is a `flex flex-col` container with `PublicNavbar` as a `shrink-0` element taking its natural row space.
  - The auth body below it is `flex-1 min-h-0 w-full flex flex-col lg:flex-row lg:overflow-hidden`.
- **Left Panel Behavior**:
  - `AuthBrandPanel` uses top-aligned flow with compact, responsive 2x2 card metrics and a `shrink-0` security footer.
  - Starts 100% cleanly below the navbar on every resolution with zero clipping, zero overlap, and zero vertical scrolling.
- **Right Panel Behavior**:
  - `main` has `flex-1 min-h-0 h-full overflow-y-auto overflow-x-hidden`.
  - Full registration form scrolls smoothly from top to bottom while the left panel remains completely stationary.
- **Mobile Behavior**:
  - Responsive single-column flow with native page scrolling.
