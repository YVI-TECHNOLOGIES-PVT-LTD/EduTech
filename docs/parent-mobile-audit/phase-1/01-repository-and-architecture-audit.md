# 01 — Repository & Architecture Audit: Parent Mobile Application

**Project:** EduTrack ERP — Parent Mobile Application  
**Audit Phase:** Phase 1 — Complete Mobile Application Audit & Baseline Validation  
**Date of Audit:** November 2, 2026  
**Status:** Complete & Validated  
**Inspection Mode:** Static Code Analysis, Build Verification, and Test Execution (Read-Only)

---

## 1. Executive Architecture Summary

The EduTrack ERP Parent Mobile Application is housed within the monorepo at `apps/mobile_app/`. The project is constructed using **React Native 0.74.5** on top of the **Expo SDK 51 (`~51.0.28`)** ecosystem, utilizing **Expo Router v3 (`~3.5.24`)** for file-based routing.

While initial high-level documentation outlines a 21-module ERP client for all school stakeholders, the physical source code audit reveals that the mobile application is currently focused on the **Parent Admission Self-Service Lifecycle** and **Real-Time Notification System**, accompanied by a foundation of atomic UI components and partial module stubs.

```
                                  +---------------------------------------+
                                  |         apps/mobile_app/app/          |
                                  |         (Expo Router Entry)           |
                                  +-------------------+-------------------+
                                                      |
                    +---------------------------------+---------------------------------+
                    |                                 |                                 |
         +----------v----------+           +----------v----------+           +----------v----------+
         |     app/(auth)/     |           |    app/(parent)/    |           |     app/(tabs)/     |
         |  Authentication &   |           |  Parent Admission   |           |    Legacy Admin     |
         |  Onboarding Flow    |           |  Self-Service Hub   |           |    Mock Portal      |
         +----------+----------+           +----------+----------+           +----------+----------+
                    |                                 |                                 |
                    +---------------------------------+---------------------------------+
                                                      |
                                  +-------------------v-------------------+
                                  |         apps/mobile_app/src/          |
                                  |   (Domain Logic, API, UI Atoms)       |
                                  +-------------------+-------------------+
                                                      |
                    +---------------------------------+---------------------------------+
                    |                                 |                                 |
         +----------v----------+           +----------v----------+           +----------v----------+
         |  src/api/ & client  |           | src/features/       |           | src/components/ui/  |
         |  Axios Client, Auth |           | Admission, Auth,    |           | Atomic Design Sys   |
         |  Interceptors, Keys |           | Notifications (19 stubs)       | Atoms/Molecules/... |
         +---------------------+           +---------------------+           +---------------------+
```

---

## 2. Monorepo Structure & Application Boundaries

The EduTrack repository is organized as a pnpm/npm monorepo consisting of:

- `apps/backend/`: Node.js / Express / Prisma ORM backend service providing enterprise school ERP APIs.
- `apps/web_app/`: Next.js web application for administrative staff, teachers, and finance teams.
- `apps/mobile_app/`: React Native / Expo parent-facing mobile application.
- `packages/`: Shared packages:
  - `packages/types/`: Shared TypeScript data structures.
  - `packages/validation/`: Shared Zod validation schemas.
  - `packages/ui/`: Shared web UI components.
  - `packages/config/`: Shared tooling configs (ESLint, Prettier, TypeScript).

### Application Isolation Analysis

The mobile application at `apps/mobile_app` maintains its own `package.json`, TypeScript configuration (`tsconfig.json`), Metro configuration (`metro.config.js`), Tailwind configuration (`tailwind.config.js`), and testing setup (`jest.config.js`). It imports `@edutrack/types` and `@edutrack/validation` from workspace packages.

---

## 3. Technology Stack & Core Dependencies

| Category                 | Library / Dependency                        | Version                | Architectural Role                                            |
| :----------------------- | :------------------------------------------ | :--------------------- | :------------------------------------------------------------ |
| **Framework Runtime**    | `expo`                                      | `~51.0.28`             | Managed workflow runtime with custom native bare prebuild     |
| **Mobile Core**          | `react-native`                              | `0.74.5`               | Native mobile foundation                                      |
| **Language**             | `typescript`                                | `~5.3.3`               | Strongly-typed JavaScript execution                           |
| **Routing / Navigation** | `expo-router`                               | `~3.5.24`              | File-based navigation structure (Stack, Tabs)                 |
| **UI Styling**           | `nativewind` + `tailwindcss`                | `^2.0.11` / `3.3.2`    | Utility-first Tailwind CSS for React Native                   |
| **Server State / Cache** | `@tanstack/react-query`                     | `^5.28.9`              | Remote query caching, mutation management, invalidation       |
| **Client State**         | `zustand`                                   | `^4.5.2`               | Global client-side state (Auth, Tenant, Theme, Notifications) |
| **HTTP Client**          | `axios`                                     | `^1.6.8`               | REST API communication, interceptors, error mapping           |
| **Form Management**      | `react-hook-form`                           | `^7.51.2`              | Performant form state and input management                    |
| **Schema Validation**    | `zod` + `@hookform/resolvers`               | `^3.22.4`              | Input validation and type inference                           |
| **Secure Storage**       | `expo-secure-store`                         | `~13.0.2`              | Hardware-backed encrypted key-value token persistence         |
| **Offline Storage**      | `@react-native-async-storage/async-storage` | `1.23.1`               | Local drafting, UI preferences, offline queue                 |
| **Notifications**        | `expo-notifications`                        | `~0.28.11`             | Push notification device tokens and notification handling     |
| **Icons & Media**        | `@expo/vector-icons`, `expo-image`          | `^14.0.2` / `~1.13.0`  | Vector icon sets (Ionicons, Feather) and cached images        |
| **File Handling**        | `expo-document-picker`                      | `~12.0.2`              | Multi-format file selection (PDF, JPEG, PNG)                  |
| **Testing Engine**       | `jest` + `@types/jest`                      | `^29.7.0` / `^29.5.12` | Automated unit testing runner                                 |

---

## 4. Entry Points & Routing Topology

### Primary Entry Point

- Entry is defined in `apps/mobile_app/package.json` line 4 as `expo-router/entry`.
- Root layout file: `apps/mobile_app/app/_layout.tsx`.
- Root routing gate: `apps/mobile_app/app/index.tsx`.

### Root Gate Execution Flow (`apps/mobile_app/app/index.tsx`)

```typescript
// Inspects auth store hydration state
if (isHydrating) return;

if (isAuthenticated) {
  router.replace(ROUTES.PARENT.DASHBOARD); // Evaluates to '/(parent)'
} else {
  router.replace(ROUTES.AUTH.LOGIN); // Evaluates to '/(auth)/login'
}
```

### Route Directory Hierarchy

```
apps/mobile_app/app/
├── _layout.tsx                     # Root Stack Navigator registering route groups
├── index.tsx                       # Initial conditional redirection gate
├── (auth)/                         # Authentication & Onboarding stack
│   ├── _layout.tsx                 # Auth Stack Navigator
│   ├── splash.tsx                  # Public marketing splash & CTA
│   ├── login.tsx                   # Credentials login with Parent role guard
│   ├── register.tsx                # Parent account registration
│   ├── forgot-password.tsx         # Password reset screen (stub)
│   ├── otp.tsx                     # 6-digit OTP verification screen
│   └── workspace.tsx               # School workspace selection (mock data)
├── (parent)/                       # Authenticated Parent Portal (Core Business Module)
│   ├── _layout.tsx                 # Parent Bottom Tab Navigator (Home, Apps, Alerts, Account)
│   ├── index.tsx                   # Parent Dashboard (Active Application, Child Switcher)
│   ├── applications.tsx            # My Applications list
│   ├── notifications.tsx           # Realtime Notification Center
│   ├── profile.tsx                 # Parent Account Profile & Theme Switcher
│   └── applications/               # Nested admission sub-routes
│       ├── wizard.tsx              # 8-step Admission Application Wizard
│       └── [id].tsx                # Application Hub screen
│           ├── assessment.tsx      # Entrance test & interview tracker
│           ├── decision.tsx        # Admission decision & offer letter
│           ├── documents.tsx       # Document center & upload manager
│           ├── fees.tsx            # Admission fee breakdown & simulated payment
│           ├── receipt.tsx         # Payment receipt view
│           └── timeline.tsx        # Milestone audit timeline
├── (tabs)/                         # Secondary/Legacy Bottom Tab Navigator
│   ├── _layout.tsx                 # Secondary Tab Navigator
│   ├── dashboard.tsx               # Mock school admin dashboard (hardcoded stats)
│   ├── profile.tsx                 # Mock user profile
│   └── settings.tsx                # App settings (Theme, Biometrics, Push switches)
├── (common)/                       # Common system exception screens
│   ├── _layout.tsx                 # Common Stack
│   ├── maintenance.tsx             # Scheduled maintenance banner
│   ├── no-internet.tsx             # Offline network error screen
│   ├── notifications.tsx           # Stub generic notifications
│   └── unexpected-error.tsx        # Fallback error crash screen
├── (admission)/                    # Generic Admission Module placeholder (ModuleShell)
├── (student)/                      # Generic SIS Student placeholder (ModuleShell)
└── (teacher)/                      # Generic Teacher placeholder (ModuleShell - Unregistered)
```

---

## 5. Architectural Layering Analysis (`apps/mobile_app/src/`)

The application architecture under `src/` exhibits a multi-layered design:

```
src/
├── api/             # Canonical Axios client, API services, and React Query keys
├── assets/          # Static assets, branding logos, icons, and fee artwork
├── components/      # UI component tree
│   ├── admission/   # Domain-specific admission cards and widgets
│   ├── common/      # Common widgets (e.g. OfflineBanner)
│   └── ui/          # Atomic Design System (Atoms, Molecules, Organisms, Templates)
├── config/          # Environment resolution (env.ts), app configs, navigation constants
├── constants/       # Route definitions (routes.ts), storage keys
├── core/            # Domain abstraction layer (auth, api, permissions, logging, tenant)
├── features/        # Feature modularity folders (22 domain packages)
├── hooks/           # Common, network, and UI hooks
├── navigation/      # Route guards (protected-route.tsx, role-guard.tsx)
├── providers/       # Context providers (AppProvider, AuthProvider, NetworkProvider)
├── services/        # Auxiliary services (secure-storage, push-notifications)
├── storage/         # SecureStore wrapper and AsyncStorage draft manager
├── stores/          # Zustand global state slices
├── theme/           # Complete Design System token engine (Palettes, Spacing, Typography)
├── types/           # Mobile TypeScript domain models
├── utils/           # Formatters, loggers, status mappers, validators
└── validation/      # Zod validation schemas
```

---

## 6. Dual/Parallel Architecture Identification

A critical architectural finding is the existence of two parallel layers for core infrastructural concerns:

1. **The Canonical Runtime Layer (`src/api/`, `src/storage/`, `src/features/`):**
   - Actively consumed by all production screens in `app/(parent)/` and `app/(auth)/`.
   - Utilizes `src/api/client.ts` (`apiClient`), `src/storage/secure-store.ts` (`SecureStorage`), and feature-specific hooks.
   - Fully tested by unit test suites in `tests/unit/`.

2. **The Abstract Enterprise Core Layer (`src/core/`):**
   - Contains `src/core/auth/auth.service.ts`, `src/core/auth/token-manager.ts`, `src/core/storage/secure-store.ts` (`SecureStorageService`), `src/core/permissions/permission-engine.ts`, and `src/core/tenant/tenant.service.ts`.
   - Mostly consumed by legacy/mock screens (`app/(tabs)/dashboard.tsx`, `app/(tabs)/profile.tsx`, `app/(auth)/workspace.tsx`).
   - `src/core/api/clients/http-client.ts` simply re-exports `src/api/client.ts`.

> [!WARNING]
> This dual implementation creates architectural confusion. For example, `src/storage/secure-store.ts` includes web localStorage fallbacks, while `src/core/storage/secure-store.ts` does not. A unification must be planned for Phase 2.

---

## 7. Analysis of Feature Modularity (`src/features/`)

A comprehensive audit of all 22 folders within `apps/mobile_app/src/features/` reveals the following implementation status:

| #   | Feature Module  | Implementation Type   | Description & Discovered Contents                                           |
| :-- | :-------------- | :-------------------- | :-------------------------------------------------------------------------- |
| 1   | `admission`     | **Fully Implemented** | Complete 8-step wizard, 12 hooks, 8 components, Zod schemas, status mappers |
| 2   | `auth`          | **Fully Implemented** | Login, registration, OTP hooks, Zod schemas, role validation logic          |
| 3   | `notifications` | **Fully Implemented** | WebSocket manager, push service, deep link router, 5 hooks, 4 UI cards      |
| 4   | `certificates`  | **Stub Only**         | Single interface `CertificateRequest` (1 line)                              |
| 5   | `common`        | **Stub Only**         | Single interface `CommonNotification` (5 lines)                             |
| 6   | `communication` | **Stub Only**         | Single interface `Announcement` (1 line)                                    |
| 7   | `concerns`      | **Stub Only**         | Single interface `ConcernTicket` (1 line)                                   |
| 8   | `dashboard`     | **Stub Only**         | Single interface `DashboardMetrics` (6 lines)                               |
| 9   | `discipline`    | **Stub Only**         | Single interface `IncidentReport` (1 line)                                  |
| 10  | `expenses`      | **Stub Only**         | Single interface `ExpenseClaim` (1 line)                                    |
| 11  | `finance`       | **Stub Only**         | Single interface `FinanceFeeRecord` (1 line)                                |
| 12  | `forms`         | **Stub Only**         | Single interface `CustomForm` (1 line)                                      |
| 13  | `hostel`        | **Stub Only**         | Single interface `HostelRoom` (1 line)                                      |
| 14  | `hr`            | **Stub Only**         | Single interface `HREmployee` (1 line)                                      |
| 15  | `inventory`     | **Stub Only**         | Single interface `InventoryItem` (1 line)                                   |
| 16  | `library`       | **Stub Only**         | Single interface `LibraryBook` (1 line)                                     |
| 17  | `lms`           | **Stub Only**         | Single interface `CourseModule` (1 line)                                    |
| 18  | `parent`        | **Stub Only**         | Single interface `Parent` (5 lines)                                         |
| 19  | `student`       | **Stub Only**         | Single interface `Student` (8 lines)                                        |
| 20  | `teacher`       | **Stub Only**         | Single interface `Teacher` (6 lines)                                        |
| 21  | `transport`     | **Stub Only**         | Single interface `TransportRoute` (1 line)                                  |
| 22  | `visitor`       | **Stub Only**         | Single interface `VisitorLog` (1 line)                                      |

---

## 8. State Management Architecture

State is cleanly partitioned into dedicated **Zustand** stores:

1. `useAuthStore` (`src/stores/auth.store.ts`):
   - Stores `user` (`UserProfile`), `tokens` (`AuthTokens`: `accessToken`, `refreshToken`, `expiresIn`), `isAuthenticated`, and `isHydrating`.
   - Hydrated during initial launch by `AuthProvider` via `SecureStorage`.
2. `useTenantStore` (`src/stores/tenant.store.ts`):
   - Holds `tenantInfo` (`tenantId`, `workspaceId`, `schoolId`, `academicYearId`, `schoolName`).
   - Primarily used in staff/admin mock contexts (`WorkspaceSelectionScreen`).
3. `useNotificationStore` (`src/stores/notification.store.ts`):
   - In-memory store for in-app notifications and unread badge count.
4. `useThemeStore` (`src/stores/theme.store.ts`):
   - Holds theme mode (`'light' | 'dark' | 'system'`).
   - Persisted via `AsyncStorage` and reactive to OS appearance changes.
5. `useOfflineStore` (`src/stores/offline.store.ts`):
   - Network connectivity indicator and pending synchronization queue.
6. `useUserStore` (`src/stores/user.store.ts`):
   - Auxiliary user role context (`activeRole`).

---

## 9. Theme & Styling System

The application features a comprehensive Design Token architecture located in `apps/mobile_app/src/theme/`:

- **Color Palettes**: `lightPalette` and `darkPalette` (`src/theme/palettes/`).
- **Typography**: Explicit scale (`displayLarge`, `headlineMedium`, `bodyMedium`, etc.) in `src/theme/typography/typography.ts`.
- **Spacing Scale**: 4px grid (`xs: 4`, `sm: 8`, `md: 16`, `lg: 24`, `xl: 32`, `xxl: 40`) in `src/theme/spacing/spacing.ts`.
- **Border Radii**: `radius.ts` (`xs: 4` to `full: 9999`).
- **Elevation / Shadows**: Standard cross-platform shadow definitions in `src/theme/elevation/shadows.ts`.

### Styling Inconsistencies Discovered

While `useTheme()` provides reactive tokens, many existing screens use a mix of hardcoded Tailwind utility classes (`bg-indigo-600`, `text-slate-900`, `bg-[#312e81]`) rather than semantic theme tokens (`colors.primary`, `colors.textPrimary`). Dark mode contrast suffers in certain cards because of arbitrary hardcoded color assignments.

---

## 10. Native Platform & Build Configuration

### Android Configuration (`apps/mobile_app/android/`)

- Package name: `com.edutrack.mobile` (configured in `app.json` and `build.gradle`).
- Android SDK versions:
  - Compile SDK: `34`
  - Target SDK: `34`
  - Min SDK: `23`
- Gradle: Gradle wrapper configured with Java 17 compatibility.
- Permissions requested in `AndroidManifest.xml`:
  - `android.permission.INTERNET`
  - `android.permission.ACCESS_NETWORK_STATE`
  - `android.permission.READ_EXTERNAL_STORAGE` (API < 33)
  - `android.permission.READ_MEDIA_IMAGES` (API >= 33)

### iOS Configuration (`apps/mobile_app/app.json`)

- Bundle Identifier: `com.edutrack.mobile`.
- Supports Tablet: `true`.
- Background Modes: `["fetch", "remote-notification"]`.
- Custom Scheme: `edutrack://`.

---

## 11. Architecture Risks & Technical Debt Summary

1. **Leftover Duplicate Files**: Several orphaned copy files exist on disk (e.g. `app/index - Copy.tsx`, `app/_layout - Copy.tsx`, `docs/* - Copy.md`). Expo Router picks up `app/index - Copy.tsx` as a reachable route (`/index - Copy`), creating a dead route hazard.
2. **Dual Auth & Storage Services**: Divergent implementations in `src/core/` versus `src/storage/` and `src/api/`.
3. **No Automatic Token Refresh**: The Axios response interceptor directly logs the user out on any HTTP 401 error without attempting a silent refresh using `refreshToken`.
4. **WebSocket Authentication Exposure**: JWT access token is passed as a URL query parameter (`?token=...`) in `notification-socket.ts`, exposing credentials in proxy logs and browser inspection.
5. **Simulated Payment Engine**: Admission fee settlement uses client-generated transaction IDs without payment gateway SDK integration (Razorpay/Stripe).
6. **Parent SIS / Enrolled Student Disconnect**: Mobile app queries `/v1/applications?mine=true` instead of backend SIS parent-student tables (`student_parents` / `parentRouter.get('/:id/students')`).
