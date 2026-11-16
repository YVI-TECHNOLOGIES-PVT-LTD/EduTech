# 03 — Complete UI/UX Audit: Parent Mobile Application

**Project:** EduTrack ERP — Parent Mobile Application  
**Audit Phase:** Phase 1 — Complete Mobile Application Audit & Baseline Validation  
**Date of Audit:** November 2, 2026  
**Status:** Complete & Validated  
**Inspection Scope:** Comprehensive screen-by-screen evaluation across 8 dimensions

---

## 1. UI/UX Evaluation Framework & Scoring System

Each screen is evaluated and scored from **1 to 5** across 8 core dimensions:

1. **Visual Design (VD):** Typography hierarchy, color system fidelity, branding, icon consistency.
2. **Layout Quality (LQ):** Alignment, information density, safe-area handling, keyboard behavior.
3. **Usability (US):** Step count, label clarity, action discoverability, feedback patterns.
4. **Navigation (NV):** Route consistency, transitions, back-button handling, breadcrumbs.
5. **Responsiveness (RS):** Small screen adaptation, aspect ratio flexibility, text overflow prevention.
6. **Accessibility (AC):** WCAG AA contrast, accessible touch targets (>=44x44), screen reader labels.
7. **Functional Completeness (FC):** Feature readiness against parent expectations, lack of stubs/mock.
8. **Loading & Error Handling (LE):** Skeletons, spinners, empty states, network error recovery.

### Rating Scale

- **1 — Critical Problems:** Non-functional, severe layout breakage, or blocking defects.
- **2 — Needs Substantial Improvement:** Disconnected workflows, mock data, poor accessibility.
- **3 — Acceptable but Inconsistent:** Functional but suffers from visual or UX friction.
- **4 — Good Implementation:** Modern, clean, accessible, and functional with minor polish needed.
- **5 — Excellent Implementation:** Pixel-perfect, accessible, fully responsive, and intuitive.

---

## 2. Global Design System & Heuristic Findings

### A. Visual Consistency

- **Strengths:** High-quality Design Token definitions in `src/theme/tokens/` and `src/theme/palettes/`. Consistent use of Tailwind border radii (`rounded-2xl`, `rounded-3xl`) across admission cards.
- **Weaknesses:** Substantial color hardcoding. Several screens bypass `useTheme()` tokens and hardcode raw Tailwind hex colors (e.g. `bg-[#312e81]`, `text-indigo-950`, `border-indigo-200`), causing noticeable contrast and styling inconsistencies when switching between Light and Dark mode.

### B. Layout Quality & Safe Area

- **Strengths:** Standardized `SafeAreaView` wrapping across all top-level parent screens (`index.tsx`, `applications.tsx`, `notifications.tsx`, `profile.tsx`).
- **Weaknesses:** In bottom-sheet modals and long forms (`register.tsx`, `wizard.tsx`), `KeyboardAvoidingView` does not always compensate for Android soft keyboard navigation bars, resulting in obscured submit buttons on smaller displays.

### C. Usability & Task Flows

- **Strengths:** The Admission Application lifecycle (`app/(parent)/applications/[id]`) is well thought-out with clear contextual cards for documents, fees, assessment, and timeline.
- **Weaknesses:** Complete absence of Enrolled Student SIS features (attendance, report cards, class timetables, fee invoices). The app is currently an Admission portal rather than a daily school companion for parents.

### D. Mobile Experience & Touch Targets

- **Strengths:** Card touch targets are generous (height >= 56px).
- **Weaknesses:** Certain icon-only header buttons (`Feather name="refresh-cw"`) have touch areas smaller than 44x44 dp when not padded properly.

### E. Accessibility (a11y)

- **Strengths:** Accessibility roles (`accessibilityRole="button"`, `accessibilityRole="tab"`) and labels are present in newer admission components (`ChildSwitcher.tsx`, `ApplicationStatusCard.tsx`).
- **Weaknesses:** Form inputs lack explicit `aria-describedby` or accessible error announcements. Contrast ratio for secondary muted text (`text-slate-400` on `#f4f5f9` background) falls below WCAG AA 4.5:1.

---

## 3. Screen-by-Screen UI/UX Audit & Scorecard

---

### 1. Root Gate (`app/index.tsx`)

- **Current Implementation:** Instantaneous auth hydration check with full-screen `Loader` atom.
- **Strengths:** Prevents unauthorized flashing; clean redirection logic.
- **Weaknesses:** Plain text spinner; lacks school ERP logo during cold launch.
- **Scorecard:**
  - VD: 3 | LQ: 4 | US: 4 | NV: 4 | RS: 4 | AC: 3 | FC: 4 | LE: 4
  - **Screen Average:** **3.8 / 5.0**
- **Redesign Recommendation:** Display brand logo and subtle fade animation during hydration.
- **Severity:** Low | **Constraints:** None.

---

### 2. Splash Screen (`app/(auth)/splash.tsx`)

- **Current Implementation:** Royal indigo hero canvas `#312e81` with school building line art, marketing copy, and a "Get Started!" rounded button.
- **Strengths:** Engaging initial marketing visual; clean typography layout.
- **Weaknesses:** Hardcoded color palette ignores dark mode preferences; no multi-school or multi-tenant selector for parents with children in specific school districts.
- **Scorecard:**
  - VD: 4 | LQ: 4 | US: 4 | NV: 4 | RS: 4 | AC: 3 | FC: 3 | LE: 3
  - **Screen Average:** **3.6 / 5.0**
- **Redesign Recommendation:** Introduce school district / institutional branding carousel and smooth CTA transitions.
- **Severity:** Low | **Constraints:** None.

---

### 3. Parent Login Screen (`app/(auth)/login.tsx`)

- **Current Implementation:** Navy hero header with rounded bottom-sheet card containing email, password toggle, role validation, and submit button.
- **Strengths:** Strong validation using Zod; prefilled verified email from OTP; parent role enforcement with clean error display.
- **Weaknesses:** Missing "Remember Me" toggle; no biometric login prompt; submit button pushed offscreen on small screens when keyboard opens.
- **Scorecard:**
  - VD: 4 | LQ: 3 | US: 4 | NV: 4 | RS: 3 | AC: 3 | FC: 4 | LE: 4
  - **Screen Average:** **3.6 / 5.0**
- **Redesign Recommendation:** Add FaceID / Fingerprint login button, improve scroll-on-focus keyboard behavior.
- **Severity:** Medium | **Constraints:** Requires `expo-local-authentication`.

---

### 4. Parent Registration Screen (`app/(auth)/register.tsx`)

- **Current Implementation:** Multi-field registration form with Full Name, Email, Phone, Password, Confirm Password, and a dynamic Password Strength Meter bar.
- **Strengths:** Real-time visual password strength calculation; comprehensive Zod schema validation.
- **Weaknesses:** High cognitive density on mobile (5 tall text fields); password complexity requirements are not displayed upfront.
- **Scorecard:**
  - VD: 4 | LQ: 3 | US: 3 | NV: 4 | RS: 3 | AC: 3 | FC: 4 | LE: 4
  - **Screen Average:** **3.5 / 5.0**
- **Redesign Recommendation:** Break into a 2-step registration or collapsible accordion with inline guideline checklists.
- **Severity:** Medium | **Constraints:** None.

---

### 5. Forgot Password Screen (`app/(auth)/forgot-password.tsx`)

- **Current Implementation:** Minimalist single-input screen asking for email address, with a "Send OTP" button.
- **Strengths:** Simple layout.
- **Weaknesses:** **Critical functional defect**: Button has no backend API integration. Navigates to OTP with an empty email parameter, causing dead-end flow.
- **Scorecard:**
  - VD: 2 | LQ: 3 | US: 1 | NV: 1 | RS: 3 | AC: 2 | FC: 1 | LE: 1
  - **Screen Average:** **1.8 / 5.0**
- **Redesign Recommendation:** Connect to backend password recovery API (`POST /v1/auth/forgot-password`), add phone OTP option, add success feedback toast.
- **Severity:** **HIGH** | **Constraints:** Backend password reset endpoint contract.

---

### 6. OTP Verification Screen (`app/(auth)/otp.tsx`)

- **Current Implementation:** Six individual digit input boxes with auto-focus forward and backward jumping, 60s countdown timer, and verify button.
- **Strengths:** Polished 6-box input UX; clipboard paste support; clean timer display.
- **Weaknesses:** Resend button only restarts the visual timer without invoking a resend API endpoint.
- **Scorecard:**
  - VD: 4 | LQ: 4 | US: 4 | NV: 4 | RS: 4 | AC: 3 | FC: 3 | LE: 4
  - **Screen Average:** **3.8 / 5.0**
- **Redesign Recommendation:** Wire Resend OTP API mutation, add SMS autofill listeners.
- **Severity:** Medium | **Constraints:** SMS permission dependencies.

---

### 7. School Workspace Selection (`app/(auth)/workspace.tsx`)

- **Current Implementation:** Radio list of campuses with icons and badges, routing to `/(tabs)/dashboard`.
- **Strengths:** Attractive card styling.
- **Weaknesses:** **100% Mock Data**: "Springfield Academy" and "St. Jude". Navigates to legacy admin tabs instead of parent portal.
- **Scorecard:**
  - VD: 4 | LQ: 3 | US: 2 | NV: 1 | RS: 3 | AC: 3 | FC: 1 | LE: 1
  - **Screen Average:** **2.3 / 5.0**
- **Redesign Recommendation:** Wire to real multi-school tenant API or remove from parent onboarding if single-school.
- **Severity:** **HIGH** | **Constraints:** Multi-tenant backend query.

---

### 8. Parent Home Dashboard (`app/(parent)/index.tsx`)

- **Current Implementation:** Complete parent home screen featuring `ChildSwitcher`, `ApplicationStatusCard`, session greeting, and 3 quick action shortcuts.
- **Strengths:** Excellent multi-application child switcher; live TanStack Query integration; pull-to-refresh; clear application status progress.
- **Weaknesses:** Completely focused on new admissions. No widgets for enrolled children (e.g. today's attendance, pending school fee invoice, daily timetable).
- **Scorecard:**
  - VD: 4 | LQ: 4 | US: 4 | NV: 4 | RS: 4 | AC: 4 | FC: 3 | LE: 4
  - **Screen Average:** **3.9 / 5.0**
- **Redesign Recommendation:** Unify into a dual-mode dashboard: "Admissions & Applications" tab + "Enrolled Students (SIS)" tab.
- **Severity:** **HIGH (Scope Gap)** | **Constraints:** Requires backend SIS parent endpoints.

---

### 9. My Applications List (`app/(parent)/applications.tsx`)

- **Current Implementation:** Full scrollable list of parent admission applications with count badges, new application shortcut, and refresh trigger.
- **Strengths:** Clean card layout; responsive pull-to-refresh; robust error handling with retry button.
- **Weaknesses:** Uses unvirtualized `ScrollView`; lacks search bar and status filters.
- **Scorecard:**
  - VD: 4 | LQ: 4 | US: 4 | NV: 4 | RS: 4 | AC: 3 | FC: 4 | LE: 4
  - **Screen Average:** **3.9 / 5.0**
- **Redesign Recommendation:** Convert to `FlatList`, add segmented status filter chips (All, Pending, Approved, Draft).
- **Severity:** Medium | **Constraints:** None.

---

### 10. Parent Notification Center (`app/(parent)/notifications.tsx`)

- **Current Implementation:** Modern alert center with real-time WebSocket connection banner, unread badge, 'All'/'Unread' filter, shimmer loading, and deep linking.
- **Strengths:** Best-implemented screen in the app. Real-time updates, optimistic mark-all-read mutation, rich empty state.
- **Weaknesses:** Lacks swipe gestures; all notifications share similar indigo styling regardless of category (academic vs finance).
- **Scorecard:**
  - VD: 5 | LQ: 4 | US: 5 | NV: 5 | RS: 4 | AC: 4 | FC: 4 | LE: 5
  - **Screen Average:** **4.5 / 5.0**
- **Redesign Recommendation:** Add category color coding (Fees = Gold, Exams = Purple, Notices = Blue) and swipe-to-dismiss.
- **Severity:** Low | **Constraints:** None.

---

### 11. Parent Account Profile (`app/(parent)/profile.tsx`)

- **Current Implementation:** Profile card with initials avatar, contact details, theme appearance toggle, and sign-out button.
- **Strengths:** Clean card structure; functional theme toggle (Light/Dark); confirmation alert on logout.
- **Weaknesses:** Entirely read-only; no profile edit form; no emergency contact management or password update.
- **Scorecard:**
  - VD: 4 | LQ: 4 | US: 3 | NV: 4 | RS: 4 | AC: 3 | FC: 3 | LE: 4
  - **Screen Average:** **3.6 / 5.0**
- **Redesign Recommendation:** Add Edit Profile modal, Change Password flow, and linked student cards.
- **Severity:** Medium | **Constraints:** Backend parent update endpoint.

---

### 12. Admission Wizard (`app/(parent)/applications/wizard.tsx`)

- **Current Implementation:** 8-step wizard with step indicator, Guidelines, Student info, Parent info, Academics, Documents, Fees, Review, and Confirmation.
- **Strengths:** Draft persistence to AsyncStorage; Zod validation per step; comprehensive metadata querying.
- **Weaknesses:** 8 steps create significant mobile fatigue; horizontal progress bar overflows on narrow displays.
- **Scorecard:**
  - VD: 4 | LQ: 3 | US: 3 | NV: 3 | RS: 3 | AC: 3 | FC: 4 | LE: 4
  - **Screen Average:** **3.4 / 5.0**
- **Redesign Recommendation:** Consolidate into 4 intuitive stages (1. Applicant, 2. Guardian, 3. Uploads, 4. Payment).
- **Severity:** Medium | **Constraints:** Form validation schema consolidation.

---

### 13. Application Hub Screen (`app/(parent)/applications/[id].tsx`)

- **Current Implementation:** Detailed view for a specific application with status banner, progress %, and 5 action portals.
- **Strengths:** Excellent information architecture for admission tracking; dynamic status mapping.
- **Weaknesses:** Portal cards have identical styling; does not dynamically highlight required pending actions (e.g. document re-upload).
- **Scorecard:**
  - VD: 4 | LQ: 4 | US: 4 | NV: 4 | RS: 4 | AC: 4 | FC: 4 | LE: 4
  - **Screen Average:** **4.0 / 5.0**
- **Redesign Recommendation:** Dynamic urgent action hero card that highlights the immediate next step.
- **Severity:** Low | **Constraints:** None.

---

### 14. Document Center (`app/(parent)/applications/[id]/documents.tsx`)

- **Current Implementation:** Upload requirements checklist with document status badges, DocumentPicker integration, and signed URL link opener.
- **Strengths:** 10MB client file size validation; signed URL retrieval; clear status feedback (Verified, Rejected).
- **Weaknesses:** Relies on external app to view documents; no camera snapshot option.
- **Scorecard:**
  - VD: 4 | LQ: 4 | US: 4 | NV: 4 | RS: 4 | AC: 3 | FC: 4 | LE: 4
  - **Screen Average:** **3.9 / 5.0**
- **Redesign Recommendation:** Add camera photo capture (`expo-image-picker`) and in-app image preview modal.
- **Severity:** Medium | **Constraints:** Camera permissions.

---

### 15. Fee Statement & Settlement (`app/(parent)/applications/[id]/fees.tsx`)

- **Current Implementation:** Itemized fee breakdown card with payment mode selector (UPI, Cards, Net Banking) and "Pay Now" trigger.
- **Strengths:** Double-submit protection (`isPaying`); clear payment status badges; receipt navigation.
- **Weaknesses:** **Simulated payment**: Uses `MOB-${Date.now()}` client-side reference instead of opening a real payment gateway checkout sheet.
- **Scorecard:**
  - VD: 4 | LQ: 4 | US: 3 | NV: 4 | RS: 4 | AC: 3 | FC: 2 | LE: 4
  - **Screen Average:** **3.5 / 5.0**
- **Redesign Recommendation:** Integrate real Razorpay / Stripe mobile SDK checkout sheet.
- **Severity:** **HIGH (Financial Integrity)** | **Constraints:** Payment gateway credentials & backend webhook verification.

---

### 16. Fee Receipt Screen (`app/(parent)/applications/[id]/receipt.tsx`)

- **Current Implementation:** Digital receipt paper styling with dashed perforation border, payment details, and total amount.
- **Strengths:** Beautiful receipt visual design; clear payment confirmation.
- **Weaknesses:** Lacks native PDF export or sharing functionality.
- **Scorecard:**
  - VD: 4 | LQ: 4 | US: 3 | NV: 4 | RS: 4 | AC: 3 | FC: 3 | LE: 4
  - **Screen Average:** **3.6 / 5.0**
- **Redesign Recommendation:** Add "Share Receipt" and "Download PDF" buttons using `expo-print` and `expo-sharing`.
- **Severity:** Low | **Constraints:** None.

---

### 17. Assessment Tracker (`app/(parent)/applications/[id]/assessment.tsx`)

- **Current Implementation:** Evaluation milestones card showing entrance test schedule, venue, examiner name, and marks.
- **Strengths:** Clear schedule layout; helpful evaluation banner.
- **Weaknesses:** Static display; no "Add to Calendar" button; no venue map link.
- **Scorecard:**
  - VD: 4 | LQ: 4 | US: 3 | NV: 4 | RS: 4 | AC: 3 | FC: 4 | LE: 4
  - **Screen Average:** **3.8 / 5.0**
- **Redesign Recommendation:** Add native calendar event sync and video call launcher for online interviews.
- **Severity:** Low | **Constraints:** None.

---

### 18. Admission Decision Screen (`app/(parent)/applications/[id]/decision.tsx`)

- **Current Implementation:** Official outcome card displaying committee decision (Approved, Waitlisted, Rejected) and remarks.
- **Strengths:** Dignified outcome presentation; clear validity timeline.
- **Weaknesses:** No interactive "Accept Offer" or "Pay Seat Deposit" action button.
- **Scorecard:**
  - VD: 4 | LQ: 4 | US: 3 | NV: 4 | RS: 4 | AC: 3 | FC: 3 | LE: 4
  - **Screen Average:** **3.6 / 5.0**
- **Redesign Recommendation:** Provide an "Accept Admission Offer" interactive workflow with digital signature.
- **Severity:** Medium | **Constraints:** Backend offer acceptance endpoint.

---

### 19. Milestone Timeline (`app/(parent)/applications/[id]/timeline.tsx`)

- **Current Implementation:** Vertical audit trail of admission pipeline events from submission to enrollment.
- **Strengths:** Excellent audit transparency; clean chronological flow.
- **Weaknesses:** Connectors between steps can break visually if notes wrap across multiple lines.
- **Scorecard:**
  - VD: 4 | LQ: 3 | US: 4 | NV: 4 | RS: 4 | AC: 3 | FC: 4 | LE: 4
  - **Screen Average:** **3.8 / 5.0**
- **Redesign Recommendation:** Modernize into a polished SVG stepper with relative time badges ("2h ago").
- **Severity:** Low | **Constraints:** None.

---

### 20. Secondary Admin Dashboard (`app/(tabs)/dashboard.tsx`)

- **Current Implementation:** Hardcoded admin statistics ("1,248 Students, 98 Teachers") and 2x3 quick access grid.
- **Strengths:** Visual layout looks appealing on surface.
- **Weaknesses:** **Critical functional defect**: 100% hardcoded mock data; 4 out of 6 action buttons loop back to dashboard; staff admin content presented in parent app.
- **Scorecard:**
  - VD: 3 | LQ: 3 | US: 1 | NV: 1 | RS: 3 | AC: 2 | FC: 1 | LE: 1
  - **Screen Average:** **1.9 / 5.0**
- **Redesign Recommendation:** Deprecate or replace completely with a real Parent Enrolled Student Dashboard.
- **Severity:** **HIGH** | **Constraints:** Phase 2 Architecture decision.

---

### 21. Secondary Admin Profile (`app/(tabs)/profile.tsx`)

- **Current Implementation:** Profile card displaying hardcoded "Dr. Sarah Jenkins", "Springfield Academy".
- **Strengths:** Clean card layout.
- **Weaknesses:** Clashes with real parent auth store data; mock school context.
- **Scorecard:**
  - VD: 3 | LQ: 3 | US: 2 | NV: 2 | RS: 3 | AC: 2 | FC: 1 | LE: 2
  - **Screen Average:** **2.3 / 5.0**
- **Redesign Recommendation:** Remove and unify with `app/(parent)/profile.tsx`.
- **Severity:** Medium | **Constraints:** None.

---

### 22. App Settings (`app/(tabs)/settings.tsx`)

- **Current Implementation:** Theme mode selector (Light/Dark/System) and biometric/push switches.
- **Strengths:** Theme switcher works and reacts globally.
- **Weaknesses:** Biometric switch is unbacked local state; push toggle does not communicate with OS notification permissions.
- **Scorecard:**
  - VD: 4 | LQ: 4 | US: 3 | NV: 3 | RS: 4 | AC: 3 | FC: 2 | LE: 3
  - **Screen Average:** **3.3 / 5.0**
- **Redesign Recommendation:** Relocate under `app/(parent)/` and wire to real hardware biometrics and OS push permissions.
- **Severity:** Medium | **Constraints:** `expo-local-authentication`.

---

### 23–27. Common Screens (`no-internet`, `maintenance`, `unexpected-error`, `notifications`)

- **Current Implementation:** Static error and maintenance screens using emojis and buttons.
- **Strengths:** Clean messaging for edge cases.
- **Weaknesses:** `no-internet.tsx` has empty retry handler; `unexpected-error.tsx` misroutes parents to mock admin dashboard.
- **Scorecard:**
  - VD: 3 | LQ: 3 | US: 2 | NV: 2 | RS: 3 | AC: 2 | FC: 2 | LE: 2
  - **Average:** **2.4 / 5.0**
- **Redesign Recommendation:** Implement automatic connectivity detection and correct route redirectors.
- **Severity:** Medium | **Constraints:** NetInfo integration.

---

### 28–30. Module Shell Placeholders (`(admission)`, `(student)`, `(teacher)`)

- **Current Implementation:** Generic cards displaying module name, icon, and "Active ERP Module" banner.
- **Strengths:** None (placeholders).
- **Weaknesses:** Provide zero functionality to parents.
- **Scorecard:**
  - VD: 2 | LQ: 2 | US: 1 | NV: 1 | RS: 3 | AC: 2 | FC: 1 | LE: 1
  - **Average:** **1.6 / 5.0**
- **Redesign Recommendation:** Replace `(student)` placeholder with real SIS module; delete unused placeholders.
- **Severity:** Medium | **Constraints:** Monorepo module scope.

---

## 4. UI/UX Scorecard Summary Table

| Screen Name               | Route                                      | VD  | LQ  | US  | NV  | RS  | AC  | FC  | LE  | **Overall** | Priority        |
| :------------------------ | :----------------------------------------- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :---------: | :-------------- |
| **Parent Notifications**  | `/(parent)/notifications`                  |  5  |  4  |  5  |  5  |  4  |  4  |  4  |  5  |   **4.5**   | Polish          |
| **Application Hub**       | `/(parent)/applications/[id]`              |  4  |  4  |  4  |  4  |  4  |  4  |  4  |  4  |   **4.0**   | Minor           |
| **Parent Dashboard**      | `/(parent)`                                |  4  |  4  |  4  |  4  |  4  |  4  |  3  |  4  |   **3.9**   | Expand Scope    |
| **Applications List**     | `/(parent)/applications`                   |  4  |  4  |  4  |  4  |  4  |  3  |  4  |  4  |   **3.9**   | Minor           |
| **Document Center**       | `.../[id]/documents`                       |  4  |  4  |  4  |  4  |  4  |  3  |  4  |  4  |   **3.9**   | Medium          |
| **OTP Verification**      | `/(auth)/otp`                              |  4  |  4  |  4  |  4  |  4  |  3  |  3  |  4  |   **3.8**   | Medium          |
| **Assessment Tracker**    | `.../[id]/assessment`                      |  4  |  4  |  3  |  4  |  4  |  3  |  4  |  4  |   **3.8**   | Low             |
| **Milestone Timeline**    | `.../[id]/timeline`                        |  4  |  3  |  4  |  4  |  4  |  3  |  4  |  4  |   **3.8**   | Low             |
| **Root Gate**             | `/`                                        |  3  |  4  |  4  |  4  |  4  |  3  |  4  |  4  |   **3.8**   | Low             |
| **Parent Profile**        | `/(parent)/profile`                        |  4  |  4  |  3  |  4  |  4  |  3  |  3  |  4  |   **3.6**   | Medium          |
| **Splash Screen**         | `/(auth)/splash`                           |  4  |  4  |  4  |  4  |  4  |  3  |  3  |  3  |   **3.6**   | Low             |
| **Fee Receipt**           | `.../[id]/receipt`                         |  4  |  4  |  3  |  4  |  4  |  3  |  3  |  4  |   **3.6**   | Low             |
| **Parent Login**          | `/(auth)/login`                            |  4  |  3  |  4  |  4  |  3  |  3  |  4  |  4  |   **3.6**   | Medium          |
| **Parent Register**       | `/(auth)/register`                         |  4  |  3  |  3  |  4  |  3  |  3  |  4  |  4  |   **3.5**   | Medium          |
| **Fee Settlement**        | `.../[id]/fees`                            |  4  |  4  |  3  |  4  |  4  |  3  |  2  |  4  |   **3.5**   | **CRITICAL**    |
| **Admission Decision**    | `.../[id]/decision`                        |  4  |  4  |  3  |  4  |  4  |  3  |  3  |  4  |   **3.6**   | Medium          |
| **Admission Wizard**      | `/(parent)/applications/wizard`            |  4  |  3  |  3  |  3  |  3  |  3  |  4  |  4  |   **3.4**   | High            |
| **App Settings**          | `/(tabs)/settings`                         |  4  |  4  |  3  |  3  |  4  |  3  |  2  |  3  |   **3.3**   | Medium          |
| **Common System Screens** | `/(common)/*`                              |  3  |  3  |  2  |  2  |  3  |  2  |  2  |  2  |   **2.4**   | High            |
| **Workspace Selection**   | `/(auth)/workspace`                        |  4  |  3  |  2  |  1  |  3  |  3  |  1  |  1  |   **2.3**   | **CRITICAL**    |
| **Secondary Profile**     | `/(tabs)/profile`                          |  3  |  3  |  2  |  2  |  3  |  2  |  1  |  2  |   **2.3**   | Deprecate       |
| **Secondary Dashboard**   | `/(tabs)/dashboard`                        |  3  |  3  |  1  |  1  |  3  |  2  |  1  |  1  |   **1.9**   | **CRITICAL**    |
| **Forgot Password**       | `/(auth)/forgot-password`                  |  2  |  3  |  1  |  1  |  3  |  2  |  1  |  1  |   **1.8**   | **CRITICAL**    |
| **Module Shells**         | `/(admission)`, `/(student)`, `/(teacher)` |  2  |  2  |  1  |  1  |  3  |  2  |  1  |  1  |   **1.6**   | Deprecate/Build |
