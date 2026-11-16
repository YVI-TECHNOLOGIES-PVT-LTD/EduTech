# EduTrack ERP — Parent Mobile App

# Phase 3 — Wave 1.1: Navigation Regression Report

## 1. Canonical 5-Tab Navigation (`app/(main)`)

The primary navigation architecture is anchored by [`app/(main)/_layout.tsx`](<file:///c:/Users/user/Documents/GitHub/EduTech/apps/mobile_app/app/(main)/_layout.tsx>), providing five persistent tabs:

| Tab Name      | Canonical Route         | Icon Set                              | Active / Target Screen                                              |
| :------------ | :---------------------- | :------------------------------------ | :------------------------------------------------------------------ |
| **Home**      | `/(main)/home`          | `home` / `home-outline`               | Adaptive Parent Dashboard (`app/(main)/home/index.tsx`)             |
| **Academics** | `/(main)/academics`     | `school` / `school-outline`           | Academics Module Preview (`app/(main)/academics/index.tsx`)         |
| **Updates**   | `/(main)/communication` | `chatbubbles` / `chatbubbles-outline` | Communication & Circulars (`app/(main)/communication/index.tsx`)    |
| **Fees**      | `/(main)/finance`       | `card` / `card-outline`               | Fee & Invoices Hub (`app/(main)/finance/index.tsx`)                 |
| **Profile**   | `/(main)/profile`       | `person` / `person-outline`           | Account, Child Switcher & Settings (`app/(main)/profile/index.tsx`) |

### Route Protection

The entire `(main)` tab layout is wrapped within `<ProtectedRoute allowedRoles={['parent', 'guardian', 'admin', 'super_admin']}>`. Unauthenticated sessions are automatically redirected to `ROUTES.AUTH.LOGIN` (`/(auth)/login`).

---

## 2. Verification of All 9 Admission Routes

All 9 admission application routes remain intact, active, and fully functional:

|  #  | Route Path                               | File Location                                   | Purpose & Consumer                                  |
| :-: | :--------------------------------------- | :---------------------------------------------- | :-------------------------------------------------- |
|  1  | `/(parent)/applications`                 | `app/(parent)/applications.tsx`                 | Full list of parent's admission applications        |
|  2  | `/(parent)/applications/wizard`          | `app/(parent)/applications/wizard.tsx`          | 5-step multi-page admission application wizard      |
|  3  | `/(parent)/applications/[id]`            | `app/(parent)/applications/[id]/index.tsx`      | Application detail view and summary card            |
|  4  | `/(parent)/applications/[id]/documents`  | `app/(parent)/applications/[id]/documents.tsx`  | Required document upload and status verification    |
|  5  | `/(parent)/applications/[id]/fees`       | `app/(parent)/applications/[id]/fees.tsx`       | Application fee breakdown and simulated checkout    |
|  6  | `/(parent)/applications/[id]/receipt`    | `app/(parent)/applications/[id]/receipt.tsx`    | Official fee payment receipt display and download   |
|  7  | `/(parent)/applications/[id]/assessment` | `app/(parent)/applications/[id]/assessment.tsx` | Assessment score breakdown and examiner feedback    |
|  8  | `/(parent)/applications/[id]/decision`   | `app/(parent)/applications/[id]/decision.tsx`   | Official admission offer letter and decision status |
|  9  | `/(parent)/applications/[id]/timeline`   | `app/(parent)/applications/[id]/timeline.tsx`   | Complete timestamped audit trail of application     |

All 9 routes are accessible directly, via deep links, and through the quick action shortcuts in [`ApplicantDashboardView.tsx`](file:///c:/Users/user/Documents/GitHub/EduTech/apps/mobile_app/src/components/dashboard/ApplicantDashboardView.tsx).

---

## 3. Duplicate Navigation Shells Audit

In accordance with Section 5 of the directive, existing routes were inspected to determine whether any render legacy navigation shells:

1. **`app/(parent)/_layout.tsx`**:
   - Renders a 4-tab bottom bar (`Home`, `Applications`, `Notifications`, `Account`).
   - If a user enters `/(parent)/applications`, this layout provides the navigation context.
2. **`app/(tabs)/_layout.tsx`**:
   - Renders a legacy 3-tab bottom bar (`Home`, `Profile`, `Settings`).
   - Quick actions on `(tabs)/dashboard.tsx` now navigate directly to canonical `/(main)/*` routes.
3. **Coexistence Strategy**:
   - The root gateway [`app/index.tsx`](file:///c:/Users/user/Documents/GitHub/EduTech/apps/mobile_app/app/index.tsx) routes authenticated users exclusively to `ROUTES.MAIN.HOME` (`/(main)/home`).
   - The legacy shells remain in place without modification during Wave 1 to ensure that any external deep links or automated tests targeting `/(parent)` or `/(tabs)` do not encounter 404 breaks.
   - Deprecation of legacy tab shells will take place in Wave 5 after comprehensive route aliasing.

---

## 4. Remediation of Navigation Defects

1. **`ISSUE-NAV-01` (`unexpected-error.tsx`)**:
   - Verified that clicking "Return to Dashboard" checks `useAuthStore.getState().isAuthenticated`.
   - If authenticated, redirects to `ROUTES.MAIN.HOME`; if unauthenticated, redirects to `ROUTES.AUTH.LOGIN`, eliminating the redirect loop.
2. **`ISSUE-NAV-02` (`dashboard.tsx`)**:
   - Verified that all 4 quick action buttons ("Attendance", "Homework", "Exams", "Pay Fees") are mapped to active canonical routes (`ROUTES.MAIN.ACADEMICS` and `ROUTES.MAIN.FINANCE`).
3. **`ISSUE-NAV-03` (`no-internet.tsx`)**:
   - Verified that "Retry Connection" performs an active check before navigating back.
