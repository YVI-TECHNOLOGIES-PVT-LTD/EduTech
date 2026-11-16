# Phase 2 Blueprint: Navigation Architecture & Route Layout Specification

**Document Reference:** `docs/parent-mobile-audit/phase-2/03-navigation-architecture.md`  
**Phase:** Phase 2 — Complete UI/UX Architecture & Redesign Blueprint  
**Status:** ARCHITECTURAL SPECIFICATION & BLUEPRINT (READ-ONLY DESIGN)

---

## 1. Executive Summary & Root Cause Resolution

The Phase 1.1 audit discovered severe structural flaws in navigation:

1. **Parallel Tabs Anti-Pattern:** Two duplicate, competing tab layouts existed (`app/(parent)/_layout.tsx` with 4 tabs and `app/(tabs)/_layout.tsx` with 3 tabs), causing route confusion.
2. **Infinite Redirect Loop (`ISSUE-NAV-01`):** `unexpected-error.tsx` used `router.replace(ROUTES.TABS.DASHBOARD)` which failed when unauthenticated.
3. **Dead Loop Navigation (`ISSUE-NAV-02`):** `dashboard.tsx` pointed 4 action cards back to `ROUTES.TABS.DASHBOARD`.
4. **Non-Functional Retry (`ISSUE-NAV-03`):** `no-internet.tsx` had an empty handler `onPress={() => {}}`.
5. **Orphaned Routes:** `app/index - Copy.tsx` and `app/(teacher)/index.tsx` were live routes outside the navigation hierarchy.

This document specifies the **canonical navigation architecture**, complete Expo Router layout hierarchy, route constants, and deep-link routing.

---

## 2. Canonical Expo Router Directory Structure

To resolve the dual-tab conflict, all main authenticated experiences are unified under `app/(main)/_layout.tsx`:

```
apps/mobile_app/app/
├── _layout.tsx                     # Root App Layout: ThemeProvider, QueryProvider, AuthProvider
├── index.tsx                       # Initial Route Dispatcher (Auth check & hydration router)
│
├── (auth)/                         # Authentication Route Group (Stack)
│   ├── _layout.tsx                 # Auth Stack Layout (headerShown: false, gestureEnabled: false)
│   ├── splash.tsx                  # Splash & onboarding carousel
│   ├── login.tsx                   # Email/Password + biometric login
│   ├── register.tsx                # Parent registration & lead claim
│   ├── forgot-password.tsx         # Password reset request (calls POST /auth/forgot-password)
│   ├── otp.tsx                     # 6-digit OTP verification with timer & resend
│   └── reset-password.tsx          # Set new password & confirm
│
├── (main)/                         # [CANONICAL] Primary Parent Application Shell (Tabs)
│   ├── _layout.tsx                 # Protected 5-Tab Bar Navigator (Wrapped in ProtectedRoute)
│   │
│   ├── home/                       # Tab 1: Home Dashboard
│   │   ├── _layout.tsx             # Stack Layout for Home detail views
│   │   ├── index.tsx               # Adaptive Home Dashboard (Enrolled SIS vs Applicant)
│   │   └── child-switcher.tsx      # Presentation: transparentModal / bottom sheet
│   │
│   ├── academics/                  # Tab 2: Academics
│   │   ├── _layout.tsx             # Stack Layout for Academic detail views
│   │   ├── index.tsx               # Academics Hub
│   │   ├── attendance.tsx          # Monthly attendance calendar & leaves
│   │   ├── timetable.tsx           # Weekly timetable & period schedule
│   │   ├── homework/
│   │   │   ├── index.tsx           # Homework list (Pending / Completed)
│   │   │   └── [id].tsx            # Homework details & attachments
│   │   ├── examinations/
│   │   │   ├── index.tsx           # Exam schedules & date sheets
│   │   │   └── [id].tsx            # Hall ticket & exam syllabus
│   │   └── results/
│   │       ├── index.tsx           # Academic grade reports & trends
│   │       └── [id].tsx            # Term report card viewer
│   │
│   ├── communication/              # Tab 3: School Communication & Feed
│   │   ├── _layout.tsx             # Stack Layout for Communication
│   │   ├── index.tsx               # School Feed (Announcements, Circulars, Events)
│   │   ├── circulars/[id].tsx      # Circular viewer & PDF download
│   │   ├── events/[id].tsx         # Event details & calendar RSVP
│   │   ├── messages/
│   │   │   ├── index.tsx           # Teacher message threads list
│   │   │   └── [id].tsx            # Chat conversation with teacher
│   │   └── helpdesk/
│   │       ├── index.tsx           # Parent support tickets
│   │       ├── new.tsx             # Submit new inquiry/ticket
│   │       └── [id].tsx            # Ticket thread & status
│   │
│   ├── finance/                    # Tab 4: Finance & Payments
│   │   ├── _layout.tsx             # Stack Layout for Finance
│   │   ├── index.tsx               # Fee Dashboard & balance summary
│   │   ├── structure.tsx           # Annual fee structure & breakdowns
│   │   ├── checkout/
│   │   │   ├── review.tsx          # Fee line selection & order review
│   │   │   ├── payment.tsx         # Razorpay checkout wrapper
│   │   │   └── status.tsx          # Payment outcome (Success/Pending/Failed)
│   │   ├── history.tsx             # Transaction ledger
│   │   └── receipts/[id].tsx       # PDF receipt viewer & share
│   │
│   └── profile/                    # Tab 5: Family Profile & Settings
│       ├── _layout.tsx             # Stack Layout for Profile
│       ├── index.tsx               # Parent & Student profile overview
│       ├── student.tsx             # Detailed enrolled student bio & medical
│       ├── transport.tsx           # Bus route, stop time & driver contact
│       ├── library.tsx             # Borrowed books & due dates
│       ├── settings.tsx            # Biometrics, theme, notifications toggle
│       └── support.tsx             # FAQ, contacts & logout
│
├── (admission)/                    # Dedicated Admission Funnel Stack (Protected)
│   ├── _layout.tsx                 # Admission Stack Navigator
│   ├── index.tsx                   # My Admission Applications list
│   ├── wizard.tsx                  # 4-step new admission application
│   └── [id]/
│       ├── index.tsx               # Application Hub & Progress Stepper
│       ├── documents.tsx           # Document upload & verification
│       ├── fees.tsx                # Admission fee payment checkout
│       ├── receipt.tsx             # Admission fee payment receipt
│       ├── assessment.tsx          # Interview & test scheduling
│       ├── decision.tsx            # Offer letter review & acceptance
│       └── timeline.tsx            # Milestones audit log
│
└── (common)/                       # Global Modals & System Fallbacks (Stack)
    ├── _layout.tsx                 # Common Stack Navigator
    ├── notifications.tsx           # Notification Center (All categories)
    ├── unexpected-error.tsx        # Crash recovery screen
    ├── no-internet.tsx             # Offline screen with NetInfo re-probe
    └── maintenance.tsx             # Scheduled maintenance banner
```

---

## 3. Canonical Route Constants Specification

The route definitions in `src/constants/routes.ts` are restructured into unambiguous namespaces:

```typescript
export const ROUTES = {
  // Entry
  INDEX: '/',

  // Authentication Stack
  AUTH: {
    SPLASH: '/(auth)/splash',
    LOGIN: '/(auth)/login',
    REGISTER: '/(auth)/register',
    FORGOT_PASSWORD: '/(auth)/forgot-password',
    OTP: '/(auth)/otp',
    RESET_PASSWORD: '/(auth)/reset-password',
  },

  // Main 5-Tab Navigator
  MAIN: {
    HOME: '/(main)/home',
    CHILD_SWITCHER: '/(main)/home/child-switcher',

    ACADEMICS: {
      HUB: '/(main)/academics',
      ATTENDANCE: '/(main)/academics/attendance',
      TIMETABLE: '/(main)/academics/timetable',
      HOMEWORK_LIST: '/(main)/academics/homework',
      HOMEWORK_DETAIL: (id: string) => `/(main)/academics/homework/${id}`,
      EXAMS_LIST: '/(main)/academics/examinations',
      EXAM_DETAIL: (id: string) => `/(main)/academics/examinations/${id}`,
      RESULTS_LIST: '/(main)/academics/results',
      REPORT_CARD: (id: string) => `/(main)/academics/results/${id}`,
    },

    COMMUNICATION: {
      FEED: '/(main)/communication',
      CIRCULAR_DETAIL: (id: string) => `/(main)/communication/circulars/${id}`,
      EVENT_DETAIL: (id: string) => `/(main)/communication/events/${id}`,
      MESSAGES_LIST: '/(main)/communication/messages',
      MESSAGE_THREAD: (id: string) => `/(main)/communication/messages/${id}`,
      HELPDESK_LIST: '/(main)/communication/helpdesk',
      HELPDESK_NEW: '/(main)/communication/helpdesk/new',
      HELPDESK_DETAIL: (id: string) => `/(main)/communication/helpdesk/${id}`,
    },

    FINANCE: {
      DASHBOARD: '/(main)/finance',
      STRUCTURE: '/(main)/finance/structure',
      CHECKOUT_REVIEW: '/(main)/finance/checkout/review',
      CHECKOUT_PAYMENT: '/(main)/finance/checkout/payment',
      CHECKOUT_STATUS: '/(main)/finance/checkout/status',
      HISTORY: '/(main)/finance/history',
      RECEIPT: (id: string) => `/(main)/finance/receipts/${id}`,
    },

    PROFILE: {
      OVERVIEW: '/(main)/profile',
      STUDENT_INFO: '/(main)/profile/student',
      TRANSPORT: '/(main)/profile/transport',
      LIBRARY: '/(main)/profile/library',
      SETTINGS: '/(main)/profile/settings',
      SUPPORT: '/(main)/profile/support',
    },
  },

  // Admission Funnel Stack
  ADMISSION: {
    APPLICATIONS_LIST: '/(admission)',
    WIZARD: '/(admission)/wizard',
    HUB: (id: string) => `/(admission)/${id}`,
    DOCUMENTS: (id: string) => `/(admission)/${id}/documents`,
    FEES: (id: string) => `/(admission)/${id}/fees`,
    RECEIPT: (id: string) => `/(admission)/${id}/receipt`,
    ASSESSMENT: (id: string) => `/(admission)/${id}/assessment`,
    DECISION: (id: string) => `/(admission)/${id}/decision`,
    TIMELINE: (id: string) => `/(admission)/${id}/timeline`,
  },

  // System & Fallbacks
  COMMON: {
    NOTIFICATIONS: '/(common)/notifications',
    UNEXPECTED_ERROR: '/(common)/unexpected-error',
    NO_INTERNET: '/(common)/no-internet',
    MAINTENANCE: '/(common)/maintenance',
  },
} as const;
```

---

## 4. Remediation of Specific Phase 1.1 Navigation Defects

### 4.1 Remediation of `ISSUE-NAV-01` (`unexpected-error.tsx`)

- **Old Behavior:** `router.replace(ROUTES.TABS.DASHBOARD)` triggered redirect collision for unauthenticated users.
- **Redesigned Behavior:**
  ```typescript
  const handleResetSession = () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    if (isAuthenticated) {
      router.replace(ROUTES.MAIN.HOME as any);
    } else {
      router.replace(ROUTES.AUTH.LOGIN as any);
    }
  };
  ```

### 4.2 Remediation of `ISSUE-NAV-02` (Dashboard Dead Action Loops)

- **Old Behavior:** 4 quick action cards (`Assignments`, `Exams`, `Fee Collection`, `Timetable`) all looped back to `ROUTES.TABS.DASHBOARD`.
- **Redesigned Behavior:** Cards route directly to the canonical academic and finance sub-routes:
  - Assignments $\rightarrow$ `ROUTES.MAIN.ACADEMICS.HOMEWORK_LIST`
  - Exams $\rightarrow$ `ROUTES.MAIN.ACADEMICS.EXAMS_LIST`
  - Fee Collection $\rightarrow$ `ROUTES.MAIN.FINANCE.DASHBOARD`
  - Timetable $\rightarrow$ `ROUTES.MAIN.ACADEMICS.TIMETABLE`

### 4.3 Remediation of `ISSUE-NAV-03` (`no-internet.tsx`)

- **Old Behavior:** `onPress={() => {}}` (empty no-op handler).
- **Redesigned Behavior:** Binds active network probing:
  ```typescript
  const handleRetryConnection = async () => {
    setIsChecking(true);
    const netState = await NetInfo.fetch();
    setIsChecking(false);
    if (netState.isConnected && netState.isInternetReachable !== false) {
      router.back();
    } else {
      showToast('Network still unavailable. Please check Wi-Fi/Cellular data.');
    }
  };
  ```

### 4.4 Deletion of Orphaned Files

In Phase 3 implementation, the following files will be deleted:

- `apps/mobile_app/app/index - Copy.tsx`
- `apps/mobile_app/app/(teacher)/index.tsx`

---

## 5. Deep-Linking Scheme & Universal Links

The app will register universal URL schemes in `app.json`:

- **Custom Scheme:** `edutrack://`
- **Universal Link:** `https://parent.edutrack.edu/`

### Route Resolution Mapping:

| External Deep Link                        | Resolved Internal Route                             |
| ----------------------------------------- | --------------------------------------------------- |
| `edutrack://fees/pay?invoice=INV-101`     | `/(main)/finance/checkout/review?invoiceId=INV-101` |
| `edutrack://homework/view?hw=HW-88`       | `/(main)/academics/homework/HW-88`                  |
| `edutrack://applications/view?app=APP-01` | `/(admission)/APP-01`                               |
| `edutrack://notifications`                | `/(common)/notifications`                           |
| `edutrack://attendance`                   | `/(main)/academics/attendance`                      |

All incoming deep-link parameters are sanitized by `extractApplicationId` or `validateEntityId` against strict route regexes before navigation dispatch.
