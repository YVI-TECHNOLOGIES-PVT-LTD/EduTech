# EduTrack ERP — Parent Mobile App

# Phase 3 — Wave 1: Navigation Migration Report

## 1. Canonical 5-Tab Architecture

Phase 1.1 verified a major architectural fragmentation in mobile routing: a dual-tab conflict existed between `(parent)` (focusing on admission applications) and `(tabs)` (a legacy 3-tab layout containing dashboard, profile, and settings).

In Wave 1, this fragmentation is resolved by establishing **`app/(main)`** as the canonical single-root parent tab navigation hierarchy.

### Tab Navigation Structure (`app/(main)/_layout.tsx`)

| Tab Key             | Route Path              | Icon (Active / Inactive)              | Purpose / Target                                       |
| :------------------ | :---------------------- | :------------------------------------ | :----------------------------------------------------- |
| **`home`**          | `/(main)/home`          | `home` / `home-outline`               | Adaptive parent dashboard (Enrolled SIS / Applicant)   |
| **`academics`**     | `/(main)/academics`     | `book` / `book-outline`               | Academics hub (Attendance, Timetable, Homework, Exams) |
| **`communication`** | `/(main)/communication` | `chatbubbles` / `chatbubbles-outline` | School announcements, circulars, teacher messaging     |
| **`finance`**       | `/(main)/finance`       | `card` / `card-outline`               | Fees, invoices, payment history, online gateway        |
| **`profile`**       | `/(main)/profile`       | `person` / `person-outline`           | Family profile, child switcher, app settings, sign-out |

### Route Protection Integration

The `(main)` layout is wrapped inside `<ProtectedRoute allowedRoles={['parent', 'guardian', 'admin', 'super_admin']}>` imported from [`apps/mobile_app/src/components/common/ProtectedRoute.tsx`](file:///c:/Users/user/Documents/GitHub/EduTech/apps/mobile_app/src/components/common/ProtectedRoute.tsx). Unauthenticated users or users with invalid sessions are intercepted and routed back to `ROUTES.AUTH.LOGIN`.

---

## 2. Route Constants Update (`src/constants/routes.ts`)

The canonical `ROUTES.MAIN` namespace was added without removing or mutating existing routes:

```typescript
export const ROUTES = {
  // Canonical Phase 3 Wave 1 Navigation
  MAIN: {
    ROOT: '/(main)',
    HOME: '/(main)/home',
    ACADEMICS: '/(main)/academics',
    COMMUNICATION: '/(main)/communication',
    FINANCE: '/(main)/finance',
    PROFILE: '/(main)/profile',
  },
  // Preserved legacy namespaces for backward compatibility
  AUTH: { ... },
  PARENT: { ... },
  TABS: { ... },
  COMMON: { ... },
} as const;
```

---

## 3. Remediation of Navigation Defects

### 3.1. `ISSUE-NAV-01` — Unexpected Error Redirect Loop

- **Defect**: In [`app/(common)/unexpected-error.tsx`](<file:///c:/Users/user/Documents/GitHub/EduTech/apps/mobile_app/app/(common)/unexpected-error.tsx>), the recovery button unconditionally called `router.replace('/(tabs)/dashboard')`. For unauthenticated parents or parents without a session, this triggered `ProtectedRoute` to reject them back to login, which could re-trigger error states, creating an infinite redirect cycle.
- **Fix**: Updated `handleRecover` to check `useAuthStore.getState().isAuthenticated`. If authenticated, it routes safely to `ROUTES.MAIN.HOME`; if unauthenticated, it routes to `ROUTES.AUTH.LOGIN`.

### 3.2. `ISSUE-NAV-02` — Dead Action Buttons on Legacy Dashboard

- **Defect**: In [`app/(tabs)/dashboard.tsx`](<file:///c:/Users/user/Documents/GitHub/EduTech/apps/mobile_app/app/(tabs)/dashboard.tsx>), the 4 primary quick action buttons ("Pay Fees", "Attendance", "Homework", "Report Card") had empty `onPress={() => {}}` handlers or no navigation target.
- **Fix**: Mapped each button to active routes:
  - "Pay Fees" -> `ROUTES.MAIN.FINANCE` (`/(main)/finance`)
  - "Attendance" -> `ROUTES.MAIN.ACADEMICS` (`/(main)/academics`)
  - "Homework" -> `ROUTES.MAIN.ACADEMICS` (`/(main)/academics`)
  - "Report Card" -> `ROUTES.MAIN.ACADEMICS` (`/(main)/academics`)

### 3.3. `ISSUE-NAV-03` — Passive Network Recovery

- **Defect**: In [`app/(common)/no-internet.tsx`](<file:///c:/Users/user/Documents/GitHub/EduTech/apps/mobile_app/app/(common)/no-internet.tsx>), clicking "Try Again" immediately executed `router.back()` without validating whether network connectivity was actually restored.
- **Fix**: Added active network ping verification using a non-mutating health probe before navigating back. If network is still unreachable, an alert informs the user rather than bouncing back to a broken screen.

---

## 4. Backward Compatibility & Root Gateway

1. **Root Stack Registration**: `app/_layout.tsx` registered `<Stack.Screen name="(main)" options={{ headerShown: false }} />`.
2. **Root Gateway Redirect**: `app/index.tsx` checks authentication state. Authenticated parents are seamlessly routed to `ROUTES.MAIN.HOME`.
3. **Preservation of Admission Routes**:
   - `/(parent)/applications` (Application list)
   - `/(parent)/applications/wizard` (New application multi-step wizard)
   - `/(parent)/applications/[id]` (Application detail)
   - `/(parent)/applications/[id]/documents`
   - `/(parent)/applications/[id]/fees`
   - `/(parent)/applications/[id]/receipt`
   - `/(parent)/applications/[id]/assessment`
   - `/(parent)/applications/[id]/decision`
   - `/(parent)/applications/[id]/timeline`
     All existing 9 admission routes remain 100% active, fully functional, and accessible via deep links or dashboard quick actions.
