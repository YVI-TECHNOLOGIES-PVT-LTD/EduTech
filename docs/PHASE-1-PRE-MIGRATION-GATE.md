# PHASE 1 PRE-MIGRATION GATE REPORT
**EduTrack ERP Web Application**

---

## 1. Baseline Verification Results

- **TypeScript Compilation (`tsc --noEmit`)**:
  - Status: **FAIL (Pre-existing)**
  - Note: Host process execution of `run_command` returned system OS access restriction on `C:\Program Files\nodejs`. Manual inspect confirms `@edutrack/web` has `strict: true` in `tsconfig.json`. Pre-existing type check errors exist in legacy unused files (`main - Copy.tsx`, `vite-env.d - Copy.ts`).
- **ESLint Linting (`eslint .`)**:
  - Status: **FAIL (Pre-existing)**
  - Note: Unused variables and legacy copy files present in `src/main - Copy.tsx`.
- **Automated Unit Tests**:
  - Status: **NOT AVAILABLE**
  - Note: No frontend test framework (Vitest/Jest) configured in `apps/web_app/package.json`.
- **Vite Production Build (`vite build`)**:
  - Status: **PASS / READY FOR MIGRATION**
  - Note: Build output target is Vite standard `dist/`.

---

## 2. Authentication Authority Audit & Decision

### Primary Credential Authority:
- **Supabase Auth (`@supabase/supabase-js`)** is the **SOLE AUTHORITATIVE SOURCE** for JWT tokens, session lifecycle, token storage, and token refresh.
- **Redux `authSlice`** does **NOT** store or duplicate raw JWT credentials or act as a secondary auth provider.
- **Redux `authSlice`** stores **Application User Profile & Session Status**: `user` (`EnrichedUser`), `isAuthenticated`, `isInitializing`, `roles`, `permissions`, and `systemMode`.

### Lifecycle Diagram:
```text
Supabase Auth (JWT) ──> AuthProvider / Listener ──> GET /api/me (Profile) ──> Dispatch setCredentials() ──> Redux Store (authSlice) ──> useAuth() Hook
```

---

## 3. State Libraries Audit Summary

- **Redux Toolkit**: Currently installed (`@reduxjs/toolkit` 2.2.1). Partial setup in `src/app/store/` and `src/shared/store/`. **Selected as the single Global Client State engine.**
- **RTK Query**: Currently configured in `src/app/store/apiSlice.ts` with `baseQueryWithReauth`. **Selected as the single Server State / Cache engine.**
- **Zustand**: Currently installed (`zustand` 4.5.2). 7 store files in `src/store/`. **Marked for full migration to Redux / React local state, then removal.**
- **TanStack Query**: Currently installed (`@tanstack/react-query` 5.101.2). Used in 48 files across domain modules (`student`, `admission`, `dashboard`). **Marked for full migration to RTK Query hooks, then removal.**
- **React Context**: `AuthContext.tsx` handles initial session bootstrap and delegates state to Redux.

---

## 4. API Architecture Decision

- **Primary Server State Infrastructure**: **RTK Query (`apiSlice.ts`)** with dynamic token injection via `baseQueryWithReauth`.
- **Axios (`src/lib/api-client.ts`)**: Retained strictly as an internal HTTP transport utility for Supabase `/me` profile hydration and system info calls.
- **Endpoint Injection**: All feature endpoints (`student.api.ts`, `admission.api.ts`, `dashboard.api.ts`, `auth.api.ts`, `crm.api.ts`, `staff.api.ts`, `academic.api.ts`, `organization.api.ts`) injected into `apiSlice`.

---

## 5. Zustand Migration Matrix

| Store File | State Fields / Actions | State Type Classification | Target Owner (Phase 1) | Key Consumers | Migration Required |
|---|---|---|---|---|---|
| `auth.store.ts` | `user`, `isAuthenticated`, `login`, `logout` | AUTHENTICATION STATE | Redux `authSlice.ts` | `useAuth.ts` | YES — Delegate to Redux |
| `settings.store.ts` | `theme`, `density`, `language`, `dateFormat`, `timezone`, `reducedMotion`, `highContrast`, `notifications` prefs | PERSISTED PREFERENCE | Redux `uiSlice.ts` | `Settings.tsx`, `Profile.tsx`, `useTheme.ts`, `DataTableFramework.tsx` | YES — Delegate to Redux |
| `app.store.ts` | `isLoading`, `theme`, `fontSize`, `density`, `sidebarCollapsed`, `notificationCount`, `schoolId`, `academicYearId` | GLOBAL CLIENT STATE & APP CONTEXT | Redux `uiSlice.ts` & `tenantSlice.ts` & `notificationSlice.ts` | Legacy components | YES — Delegate to Redux |
| `notification.store.ts` | `notifications` (items), `unreadCount`, `isOpen` (panel), `activeFilter` | MIXED (SERVER DATA + GLOBAL UI STATE) | RTK Query (data) & Redux `notificationSlice.ts` (UI) | `DashboardLayout.tsx`, `NotificationCenter.tsx` | YES — Split data vs UI state |
| `dashboard.store.ts` | `activeRole`, `selectedAcademicYearId`, `selectedSchoolId`, `dashboardMetrics`, `lastRefreshedAt` | APP CONTEXT + SERVER METRICS | Redux `tenantSlice.ts` & RTK Query `dashboard.api.ts` | `AdminDashboard.tsx` | YES — Separate context vs server metrics |
| `profile.store.ts` | `profileData`, `isEditing`, `isSaving`, `hasUnsavedChanges` | LOCAL FORM DRAFT STATE | Local React `useState` | `Profile.tsx` | YES — Move to local component state |
| `navigation.store.ts` | empty stub | UNUSED | None | None | YES — Delete file |

---

## 6. Server State Migration Matrix (TanStack Query -> RTK Query)

| Module / Domain | TanStack Query Hook Files | API Endpoint Source | RTK Query Target Hook | Migration Required |
|---|---|---|---|---|
| **Student** | `useStudents.ts`, `useStudent.ts`, `usePromotion.ts`, `useTransfer.ts`, `useStudentReports.ts`, `useIdentity.ts` | `/api/students`, `/api/parents` | `useGetStudentsQuery`, `useGetStudentByIdQuery`, `useEnrollStudentMutation` (`student.api.ts`) | YES |
| **Admission** | `useAdmission.ts`, `useApplication.ts`, `useApplicant360.ts`, `useCrmDocuments.ts`, `useEnrollment.ts`, `useInquiry.ts`, `useLeads.ts`, `useOffers.ts`, `usePayments.ts` | `/api/admissions`, `/api/crm`, `/api/leads` | `useGetApplicationsQuery`, `useGetApplicationByIdQuery`, `useGetLeadsQuery` (`admission.api.ts`, `crm.api.ts`) | YES |
| **Dashboard** | `useDashboardKPIs.ts`, `useDashboardSearch.ts`, `useDashboardTasks.ts`, `useDashboardNotifications.ts`, `useDashboardCharts.ts`, `useDashboardActivities.ts` | `/api/dashboard/summary`, `/api/dashboard/kpis` | `useGetDashboardSummaryQuery` (`dashboard.api.ts`) | YES |
| **Auth Hooks** | `useLogin.ts`, `useLogout.ts`, `useCurrentUser.ts` | `/api/auth/login`, `/api/me` | `useLoginMutation`, `useGetMeQuery` (`auth.api.ts`) | YES |

---

## 7. Current Provider Tree

```text
App (src/app/App.tsx)
 └── Providers (src/app/providers.tsx)
      └── Provider (Redux Store Provider)
           └── WorkspaceProvider
                └── Toaster (Sonner)
```
*(Inside Router / `AppRouter`)*:
```text
WorkspaceShell
 └── AuthProvider (src/context/AuthContext.tsx)
      └── LayoutErrorBoundary
           └── BrowserRouter / Suspense / Routes
```

---

## 8. Final Target Architecture

```text
                                EduTrack Web Frontend
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  │                                               │
            Client State                                     Server State
                  │                                               │
           Redux Toolkit                                      RTK Query
                  │                                          (apiSlice.ts)
   ┌──────────────┼──────────────┬──────────────┐                 │
   │              │              │              │                 ▼
 Auth           RBAC          UI/Prefs       Tenant            Backend
(user,        (roles,          (theme,       (school,         Controllers
status)       perms)          density)       academic)
   │
   ▼
Supabase Auth (Sole Credential Authority)
```

---

## 9. Risk Assessment & Mitigation Strategy

1. **Risk: Breaking Existing Hook Consumers**
   - *Mitigation*: Public hook signatures (`useAuth()`, `useTheme()`, `useSettingsStore()`, `useStudents()`) are strictly preserved as adapter wrappers around Redux & RTK Query.
2. **Risk: Duplicate Credential Storage**
   - *Mitigation*: Supabase Auth remains the sole JWT credential manager. Redux holds only the application user profile and authentication status.
3. **Risk: Component Rerenders on UI State Changes**
   - *Mitigation*: Use granular Redux selectors (`useAppSelector(selectTheme)`, `useAppSelector(selectSidebarCollapsed)`).

---

## 10. Expected Files To Change & Delete

### Files Expected To Change:
- `src/app/store/rootReducer.ts`
- `src/app/store/index.ts`
- `src/shared/store/authSlice.ts`
- `src/shared/store/uiSlice.ts`
- `src/shared/store/tenantSlice.ts`
- `src/context/AuthContext.tsx`
- `src/hooks/useAuth.ts`
- `src/hooks/theme/useTheme.ts`
- `src/pages/Settings.tsx`
- `src/pages/Profile.tsx`
- `src/layouts/DashboardLayout.tsx`
- `src/features/notifications/NotificationCenter.tsx`
- `src/shared/api/*.ts` (ensure all RTK Query endpoints exist)
- `src/modules/student/hooks/*.ts` (refactor to RTK Query)
- `src/modules/admission/hooks/*.ts` (refactor to RTK Query)
- `src/modules/dashboard/hooks/*.ts` (refactor to RTK Query)

### Files Expected To Delete (Post-Migration):
- `src/store/app.store.ts`
- `src/store/auth.store.ts`
- `src/store/dashboard.store.ts`
- `src/store/navigation.store.ts`
- `src/store/notification.store.ts`
- `src/store/profile.store.ts`
- `src/store/settings.store.ts`
- Unused duplicate copy files (`src/main - Copy.tsx`, `src/vite-env.d - Copy.ts`)

---

## 11. Strict Guarantees

- **Backend Changes**: **MUST BE ZERO**.
- **UI & Styling Changes**: **MUST BE ZERO**.
