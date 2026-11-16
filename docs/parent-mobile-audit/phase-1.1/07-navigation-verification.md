# Phase 1.1 Verification Report: Navigation Architecture & Broken Flows

**Audit Document Reference:** `docs/parent-mobile-audit/phase-1.1/07-navigation-verification.md`  
**Parent Report:** `docs/parent-mobile-audit/phase-1/03-navigation-routing-inventory.md`  
**Status:** COMPLETE & VERIFIED  
**Commit:** `a9c3486`

---

## 1. Executive Summary

This independent verification audits the Expo Router file-based routing tree, layout nesting, route guards, and all navigation defects reported in Phase 1 for `apps/mobile_app`.

All three navigation defect findings (`ISSUE-NAV-01`, `ISSUE-NAV-02`, and `ISSUE-NAV-03`) as well as the two orphaned route files (`app/index - Copy.tsx` and `app/(teacher)/index.tsx`) have been **independently confirmed with exact code citations**.

---

## 2. Verification of Navigation Defects

### 2.1 Verification of `ISSUE-NAV-01`: Unexpected Error Screen Misrouting

- **File:** `apps/mobile_app/app/(common)/unexpected-error.tsx`
- **Lines 21–25:**

```typescript
<Button
  title="Return to Dashboard"
  size="lg"
  onPress={() => router.replace(ROUTES.TABS.DASHBOARD as any)}
/>
```

- **Finding:** **CONFIRMED DEFECT**.
  When an unexpected crash occurs anywhere in the app (including pre-auth, login, or registration), the recovery action blindly attempts to navigate to `ROUTES.TABS.DASHBOARD` (`/(tabs)/dashboard`).
  - If the user is unauthenticated, this triggers a redirect collision: `TabsLayout` catches the unauthenticated state via `ProtectedRoute` and redirects to `ROUTES.AUTH.LOGIN`, producing navigation jitter and an infinite redirect loop if the login page itself triggered the crash.
  - The button should route to a safe reset boundary or re-evaluate the auth state to redirect to `ROUTES.AUTH.LOGIN` or `ROUTES.PARENT.HOME`.

---

### 2.2 Verification of `ISSUE-NAV-02`: Quick Action Dead Loop Navigation

- **File:** `apps/mobile_app/app/(tabs)/dashboard.tsx`
- **Lines 25–58:**

```typescript
{
  id: 'assignments',
  title: 'Assignments',
  subtitle: 'Manage & Grade Assignments',
  icon: 'document-text-outline',
  iconColor: '#a855f7',
  bgColor: 'bg-purple-50 dark:bg-purple-950/40',
  route: ROUTES.TABS.DASHBOARD, // <--- DEAD LOOP
},
{
  id: 'exams',
  title: 'Exams',
  subtitle: 'Schedule & Manage Examinations',
  icon: 'newspaper-outline',
  iconColor: '#f97316',
  bgColor: 'bg-orange-50 dark:bg-orange-950/40',
  route: ROUTES.TABS.DASHBOARD, // <--- DEAD LOOP
},
{
  id: 'fees',
  title: 'Fee Collection',
  subtitle: 'Track Fee Payments & Dues',
  icon: 'card-outline',
  iconColor: '#10b981',
  bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
  route: ROUTES.TABS.DASHBOARD, // <--- DEAD LOOP
},
{
  id: 'timetable',
  title: 'Timetable',
  subtitle: 'View Class Timetables',
  icon: 'calendar-outline',
  iconColor: '#0284c7',
  bgColor: 'bg-sky-50 dark:bg-sky-950/40',
  route: ROUTES.TABS.DASHBOARD, // <--- DEAD LOOP
}
```

- **Finding:** **CONFIRMED DEFECT**.
  Four core navigation cards on the main Dashboard screen point to `ROUTES.TABS.DASHBOARD`. When tapped, they invoke `router.push(ROUTES.TABS.DASHBOARD)` which simply re-renders or resets the current screen. Users are trapped in a self-referential loop with zero indication that the target features are unimplemented.

---

### 2.3 Verification of `ISSUE-NAV-03`: No-Internet Screen Inert Retry Handler

- **File:** `apps/mobile_app/app/(common)/no-internet.tsx`
- **Line 17:**

```typescript
<Button title="Retry Connection" size="lg" onPress={() => {}} />
```

- **Finding:** **CONFIRMED DEFECT**.
  The "Retry Connection" button binds an empty anonymous arrow function `onPress={() => {}}`.
  - Pressing the button produces no network re-probe, no NetInfo query, and no navigation pop/refresh.
  - The user remains permanently locked on this screen until the mobile application is killed and restarted.

---

## 3. Verification of Orphaned & Accidental Routes

### 3.1 Orphaned File Copy: `app/index - Copy.tsx`

- **File:** `apps/mobile_app/app/index - Copy.tsx` (24 lines)
- **Investigation:**
  - This file is an exact copy of `app/index.tsx` created on Windows via OS copy/paste.
  - Because Expo Router operates on automatic filesystem convention, this file creates a live route: `/index - Copy`.
  - It is not registered in `app/_layout.tsx` Stack.Screen items, nor is it linked anywhere in `ROUTES`.
  - **Verdict:** Unintended build artifact / orphaned route. Must be deleted in Phase 2.

### 3.2 Orphaned Portal Stub: `app/(teacher)/index.tsx`

- **File:** `apps/mobile_app/app/(teacher)/index.tsx` (12 lines)
- **Investigation:**
  - Contains a `TeacherModuleScreen` rendering `<ModuleShell moduleName="Teacher Portal" ... />`.
  - The `(teacher)` route group lacks a `_layout.tsx`.
  - It is not registered in `app/_layout.tsx` Stack.Screen definitions.
  - It is not referenced anywhere in `ROUTES`, tab bars, or navigation handlers.
  - **Verdict:** Orphaned prototype screen leftover from early multi-portal experiments.

---

## 4. Route Guard & Layout Nesting Analysis

### 4.1 Route Guard Distribution

We audited the application layout tree to determine where authentication is enforced:

1. `app/_layout.tsx` (Root Stack): Unprotected. Renders `AppProvider` and mounts child route groups.
2. `app/(auth)/_layout.tsx`: Unprotected. Handles login, registration, OTP, splash, and forgot password.
3. `app/(parent)/_layout.tsx`: **PROTECTED**. Wrapped in `<ProtectedRoute>`. Redirects to `/auth/login` if `!isAuthenticated`.
4. `app/(tabs)/_layout.tsx`: **PROTECTED**. Wrapped in `<ProtectedRoute>`.
5. `app/(admission)/_layout.tsx`: **UNPROTECTED**. Does NOT include `<ProtectedRoute>`. If accessed directly, renders public admission stub without auth.
6. `app/(student)/_layout.tsx`: **UNPROTECTED**. Does NOT include `<ProtectedRoute>`.
7. `app/(common)/_layout.tsx`: **UNPROTECTED**. Contains error, 404, and maintenance screens.

### 4.2 Parallel Tabs Layout Anti-Pattern

The codebase currently contains **two independent bottom tab bars**:

1. `app/(parent)/_layout.tsx`: 4 tabs (`Home`, `Applications`, `Notifications`, `Settings`).
2. `app/(tabs)/_layout.tsx`: 3 tabs (`Home` / dashboard, `Profile`, `Calendar`).

- **Architectural Risk:**
  - Having two conflicting tab navigators in the same mobile application causes layout thrashing and confusing user transitions.
  - When a parent logs in, initial routing sends them to `/(parent)` or `/(tabs)/dashboard` inconsistently depending on which button or route constant was used.
  - Phase 2 must consolidate this into a single authoritative bottom tab bar with dynamic module tabs based on active child state.

---

## 5. Navigation Findings Summary

| Issue ID       | Severity   | File Reference                                 | Verified Behavior                                               |
| -------------- | ---------- | ---------------------------------------------- | --------------------------------------------------------------- |
| `ISSUE-NAV-01` | **HIGH**   | `(common)/unexpected-error.tsx#L24`            | Crash screen redirects to dashboard, risking auth loops         |
| `ISSUE-NAV-02` | **HIGH**   | `(tabs)/dashboard.tsx#L30-L57`                 | 4 quick action buttons loop back to `ROUTES.TABS.DASHBOARD`     |
| `ISSUE-NAV-03` | **MEDIUM** | `(common)/no-internet.tsx#L17`                 | "Retry Connection" button has an empty no-op handler `() => {}` |
| `ORPHAN-01`    | **LOW**    | `app/index - Copy.tsx`                         | Duplicate file exposed as `/index - Copy` route                 |
| `ORPHAN-02`    | **LOW**    | `app/(teacher)/index.tsx`                      | Inaccessible teacher portal stub outside navigation hierarchy   |
| `ARCH-NAV-01`  | **HIGH**   | `(parent)/_layout.tsx` vs `(tabs)/_layout.tsx` | Duplicate, competing bottom tab bar layouts                     |
