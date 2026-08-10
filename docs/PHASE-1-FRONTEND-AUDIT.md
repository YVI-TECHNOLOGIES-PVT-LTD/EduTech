# PHASE 1 FRONTEND ARCHITECTURE AUDIT REPORT
**EduTrack ERP Web Application**

---

## 1. Executive Summary

This document provides a comprehensive Phase-1 architectural audit of the `@edutrack/web` frontend application within the EduTrack ERP monorepo. The goal of Phase 1 is to establish a standardized, enterprise-grade architecture for state management, API communication, authentication, authorization, routing, and UI state without altering backend contracts or business behavior.

### Critical Findings:
1. **Competing Global State Systems**: State management is currently fragmented across multiple Zustand stores (`src/store/`), React Context (`AuthContext.tsx`), and partial Redux Toolkit slices (`src/shared/store/` and `src/app/store/`).
2. **Competing Server Query Systems**: Both `@tanstack/react-query` (used heavily across domain modules in `src/modules/` and `src/pages/`) and Redux Toolkit Query (`apiSlice.ts` and `src/shared/api/*`) are installed and used concurrently.
3. **Multiple API Clients**: HTTP traffic is handled via raw Axios instances (`apiClient`), direct fetch calls in hooks, and RTK Query `fetchBaseQuery`.
4. **Duplicated Auth & Permission Hooks**: `AuthContext.tsx` holds auth state in React state, while a dummy `useAuthStore` (Zustand) and Redux `authSlice` also exist.

---

## 2. Detected Technology Stack

- **Monorepo Manager**: `pnpm@9.15.4` + Turborepo (`turbo@2.3.4`)
- **Framework**: React 18.2.0 + Vite 5.0.0
- **Language**: TypeScript 5.2.2 (Strict mode enabled)
- **UI Framework & Design System**: TailwindCSS 3.3.5, Radix UI primitives, Lucide React icons, Framer Motion
- **State Management**:
  - Global Client State: `@reduxjs/toolkit` 2.2.1 (Target) + `zustand` 4.5.2 (Legacy competing) + `React Context`
  - Server State: `@tanstack/react-query` 5.101.2 (Legacy competing) + `RTK Query` (Target)
- **HTTP Client**: `axios` 1.6.0 + `fetchBaseQuery` (RTK Query)
- **Authentication Engine**: `@supabase/supabase-js` 2.39.0 + Custom backend auth `/me`

---

## 3. Current Folder Structure

```
apps/web_app/src/
├── api/                  # Legacy/ad-hoc API functions (departments, facultyStaff, import)
├── app/                  # App initialization, router, root providers, Redux store setup
├── auth/                 # Legacy auth utilities
├── components/           # Shared UI primitives, guards, error boundaries
├── config/               # Application configuration, navigation, route registry
├── constants/            # Global app constants
├── context/              # AuthContext (React Context-based user/session management)
├── features/             # Feature tabs & UI components using RTK Query (academics, admissions, etc.)
├── hooks/                # Custom React hooks (useAuth, useRole, useSession, theme)
├── i18n/                 # Internationalization setup
├── layouts/              # DashboardLayout, PublicLayout, AdmissionWorkspaceLayout
├── lib/                  # Axios apiClient setup, Supabase client, utilities
├── modules/              # Domain modules (admission, student, dashboard, admin, common, fees, import)
├── pages/                # Workspace pages & public landing pages
├── rbac/                 # PermissionGate, usePermission hook
├── routes/               # Modular route definitions
├── services/             # Domain & UI service helpers
├── shared/               # Shared RTK Query APIs, Redux slices, shared UI components
├── store/                # Legacy Zustand stores (app, auth, dashboard, navigation, notification, profile, settings)
├── styles/               # Global CSS & Tailwind imports
├── theme/                # Theme tokens
├── types/                # Domain & TypeScript interfaces
└── utils/                # Utility functions
```

---

## 4. State Management Ownership Audit

| State Category | Legacy Owner | Competing Owner | Target Owner (Phase 1) | Migration Action |
|---|---|---|---|---|
| Authenticated User & Session | `AuthContext` (useState) | `auth.store.ts` (Zustand) & `authSlice` (Redux) | Redux Toolkit (`authSlice.ts`) | Centralize session & user in Redux `authSlice`. Expose `useAuth` hook powered by Redux state. |
| User Permissions & Roles | `AuthContext` (functions) | Direct user prop checks | Redux Toolkit (`permissionSlice.ts` / `authSlice.ts`) | Centralize permission and role selectors (`selectHasPermission`, `selectHasRole`). |
| Application Settings (Theme, Font, Density) | `settings.store.ts` (Zustand) | `app.store.ts` (Zustand) | Redux Toolkit (`uiSlice.ts`) | Migrate theme, density, high contrast, reduced motion to Redux `uiSlice`. |
| App Context (School ID, Academic Year) | `app.store.ts` (Zustand) | `dashboard.store.ts` (Zustand) | Redux Toolkit (`tenantSlice.ts` / `appSlice.ts`) | Centralize global tenant and academic context in Redux. |
| Notifications & Toasts | `notification.store.ts` (Zustand) | `sonner` / `use-toast` | Redux Toolkit (`notificationSlice.ts`) | Centralize panel notifications in Redux, trigger toasts via Sonner. |
| User Profile Form Draft State | `profile.store.ts` (Zustand) | React `useState` | Local React State / Redux Form State | Keep local UI state inside Profile components or dedicated slice. |
| Server Data Cache (Students, Admissions, Dashboard Metrics) | `@tanstack/react-query` | `apiClient` (Axios) | RTK Query (`apiSlice.ts` + `src/shared/api/*`) | Migrate custom query/mutation hooks to RTK Query endpoint hooks. |

---

## 5. API & Communication Architecture Audit

### Identified API Clients:
1. `src/lib/api-client.ts`: Axios instance with request/response interceptors for Supabase auth headers & error handling.
2. `src/app/store/baseQueryWithReauth.ts`: RTK Query custom `fetchBaseQuery` handling token refresh and error mapping.
3. `src/api/*`: Custom Axios functions for departments, faculty staff, import history.
4. `src/modules/*/hooks/*`: Direct TanStack `useQuery` wrappers around `apiClient`.

### Target Architecture:
- Single authoritative server-state infrastructure using **RTK Query** (`apiSlice.ts`).
- Central base query (`baseQueryWithReauth`) automatically injecting `Authorization: Bearer <token>` and `x-tenant-id`.
- Feature endpoints injected into `apiSlice` using `apiSlice.injectEndpoints(...)`.

---

## 6. Authentication & Authorization Lifecycle Audit

### Current Lifecycle:
```
Supabase Auth (JWT) ──> AuthContext (onAuthStateChange) ──> GET /api/me (apiClient) ──> EnrichedUser ──> AuthContext State
```

### Modernized Phase 1 Lifecycle:
```
Supabase Auth (JWT) ──> AuthProvider / Listener ──> Dispatch setCredentials() ──> Redux Store (authSlice) ──> Selectors / useAuth Hook
```

- **Authentication State**: Fully held in Redux (`state.auth.user`, `state.auth.accessToken`, `state.auth.isAuthenticated`).
- **Authorization / RBAC**: Redux selectors (`selectHasPermission`, `selectHasRole`) used by `ProtectedRoute`, `PermissionGuard`, and component gates.
- **Backend Security Boundary**: Frontend permission gates enforce UI navigation safety; backend controllers remain the ultimate security boundary.

---

## 7. Migration Plan & Step-by-step Execution Strategy

1. **Step 1: Standardize Redux Store Configuration**
   - Combine `auth`, `permission`, `ui`, `notification`, `tenant`, and `apiSlice` inside `src/app/store/index.ts` and `rootReducer.ts`.

2. **Step 2: Connect AuthContext to Redux Auth Slice**
   - Update `AuthContext.tsx` to dispatch actions to Redux `authSlice`, ensuring backward compatibility for `useAuth()` hook consumers across all 100+ components.

3. **Step 3: Standardize UI & Settings State in Redux**
   - Enhance `uiSlice.ts` to manage theme mode (`light`/`dark`/`system`), layout density, sidebar state, font size, high contrast, reduced motion.
   - Refactor `useSettingsStore` and `useTheme` hooks to delegate to Redux `uiSlice`.

4. **Step 4: Centralize Notifications in Redux**
   - Implement `notificationSlice.ts` in Redux to manage unread counts, notification items, and panel visibility.
   - Refactor `useNotificationStore` consumers to use Redux actions and selectors.

5. **Step 5: Migrate Server State from TanStack Query to RTK Query**
   - Inject domain endpoints (`student.api.ts`, `admission.api.ts`, `dashboard.api.ts`, `staff.api.ts`, `academic.api.ts`, `crm.api.ts`) into `apiSlice`.
   - Update module custom hooks (`useStudents`, `useStudent`, `useApplication`, `useDashboardKPIs`, etc.) to wrap RTK Query hooks.

6. **Step 6: Cleanup Competing Libraries & Code Verification**
   - Remove unused Zustand stores after zero imports remain.
   - Remove `@tanstack/react-query` after full migration.
   - Verify TypeScript compilation, linting, tests, and build.

---

## 8. Baseline & Target Verification Matrix

| Validation Criteria | Target Status | Verification Command |
|---|---|---|
| TypeScript Compilation | PASS | `pnpm --filter @edutrack/web typecheck` |
| ESLint Code Quality | PASS | `pnpm --filter @edutrack/web lint` |
| Monorepo Build | PASS | `pnpm --filter @edutrack/web build` |
| Architectural Cleanliness | Zero competing stores/query engines | Grep search for `zustand`, `react-query` |
