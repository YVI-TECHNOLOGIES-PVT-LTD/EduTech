# EduTrack ERP — Mobile V1 Current State Audit (Phase 0)

**Document**: `MOBILE_CURRENT_STATE.md`  
**Date**: August 22, 2026  
**Audited Location**: `apps/mobile_app/`  
**Audit Purpose**: Codebase audit and foundation mapping before executing Phase 1–10 implementation.

---

## 1. Current Architecture & Technology Stack

| Layer / Concern      | Technology & Version                                         | Code Location                            | Status & Readiness                   |
| :------------------- | :----------------------------------------------------------- | :--------------------------------------- | :----------------------------------- |
| **Framework**        | Expo SDK `~51.0.28` / React Native `0.74.5` / React `18.2.0` | `package.json`, `app.json`               | Modern, clean setup                  |
| **Routing**          | `expo-router` `~3.5.24` (File-based navigation)              | `app/`                                   | Active, typed routes enabled         |
| **Styling**          | `nativewind` `^2.0.11` + `tailwindcss` `3.3.2`               | `tailwind.config.js`, `global.d.ts`      | Configured and operational           |
| **State Management** | `zustand` `^4.5.2` + `@tanstack/react-query` `^5.28.9`       | `src/stores/`, `src/providers/`          | Ready for integration                |
| **Form Management**  | `react-hook-form` `^7.51.2` + `zod` `^3.22.4`                | `package.json`                           | Ready for wizard validation          |
| **Secure Storage**   | `expo-secure-store` `~13.0.2`                                | `src/services/secure-storage.service.ts` | Ready for JWT tokens                 |
| **Offline / Drafts** | `@react-native-async-storage/async-storage` `1.23.1`         | `package.json`                           | Ready for wizard drafts              |
| **Icons & Media**    | `@expo/vector-icons` `^14.0.2`, `expo-image` `~1.13.0`       | `package.json`                           | Ready                                |
| **Networking**       | `axios` `^1.6.8` + native `fetch`                            | `src/services/api-client.ts`             | Needs canonical base client refactor |

---

## 2. Existing File Structure & Assessment

```text
apps/mobile_app/
├── app/
│   ├── _layout.tsx                     # Root AppProvider & Stack layout
│   ├── index.tsx                       # Initial redirect screen (Auth vs Tabs)
│   ├── (auth)/                         # Authentication route group
│   │   ├── _layout.tsx
│   │   ├── splash.tsx                  # Splash intro screen
│   │   ├── login.tsx                   # Prototype login screen
│   │   ├── forgot-password.tsx         # Password reset screen
│   │   ├── otp.tsx                     # OTP screen placeholder
│   │   └── workspace.tsx               # School workspace selection screen
│   ├── (tabs)/                         # Default bottom tab navigator
│   │   ├── _layout.tsx
│   │   ├── dashboard.tsx               # Generic mock dashboard
│   │   ├── profile.tsx                 # User profile screen
│   │   └── settings.tsx                # App settings screen
│   ├── (parent)/                       # Parent portal placeholder (ModuleShell)
│   │   ├── _layout.tsx
│   │   └── index.tsx
│   ├── (admission)/                    # Admission portal placeholder (ModuleShell)
│   │   ├── _layout.tsx
│   │   └── index.tsx
│   ├── (student)/                      # Student portal placeholder
│   ├── (teacher)/                      # Teacher portal placeholder
│   └── (common)/                       # Notifications, offline, error screens
│
├── src/
│   ├── components/ui/                  # Atomic Design System (Atoms, Molecules, Organisms, Templates)
│   │   ├── atoms/                      # Button, Input, Badge, Chip, Divider, Loader, Avatar
│   │   ├── molecules/                  # PasswordInput, SearchBar, SectionHeader, Dropdown, Toast, Snackbar
│   │   ├── organisms/                  # Card, Modal, BottomSheet, DataTable, EmptyState, ErrorState, FAB
│   │   └── templates/                  # ScreenWrapper, ModuleShell
│   ├── services/
│   │   ├── api-client.ts               # Basic fetch wrapper (needs upgrade)
│   │   └── secure-storage.service.ts   # Expo SecureStore wrapper
│   ├── stores/
│   │   ├── auth.store.ts               # Zustand authentication store
│   │   ├── notification.store.ts       # Notification state store
│   │   ├── tenant.store.ts             # Workspace/School context store
│   │   └── theme.store.ts              # Theme (light/dark) store
│   ├── core/auth/
│   │   ├── auth.service.ts             # Auth lifecycle manager
│   │   └── token-manager.ts            # SecureStore token reader/writer
│   ├── navigation/                     # Protected route guards & permission checks
│   ├── providers/                      # AppProvider, AuthProvider, QueryProvider, ToastProvider
│   └── types/                          # Domain & API TypeScript definitions
```

---

## 3. Existing Reusable Components & Assets

The existing `src/components/ui/` library is well-crafted, responsive, and completely reusable for the Parent Admission Portal:

- `Button` (Variants: primary, secondary, outline, destructive, ghost, link; loading state, icons)
- `Input` & `PasswordInput` (Form control, validation error display, left/right icons, secure toggle)
- `Card` (Elevated, outlined, interactive cards with header/body/footer slots)
- `Badge` & `Chip` (Status badges for application states: submitted, approved, waitlisted, paid)
- `Modal` & `BottomSheet` (Dialogs for receipt sharing, document preview, change requests)
- `ScreenWrapper` (Safe area handling, scroll view toggle, keyboard avoidance, pull-to-refresh)
- `EmptyState` & `ErrorState` (Illustrated fallback UI with retry action buttons)
- `Loader` (Inline spinners, full-page overlays, skeleton loaders)

---

## 4. Missing Functionality (To Be Implemented in Phases 1–8)

1. **Centralized Canonical API Layer (`src/api/`)**:
   - Base URL configuration (`EXPO_PUBLIC_API_URL` or environment config)
   - JWT authentication header injection from `SecureStore`
   - Canonical endpoints for Auth, Metadata, Applications, Documents, Assessment, Decision, Fees, Notifications
   - Interceptors for 401 (token refresh / session clear), 403, 404, 422, and network errors
2. **Authentication Flow (`(auth)/`)**:
   - Parent Login (`POST /v1/auth/login`)
   - Parent Self-Registration (`POST /v1/admission/register`) with live password strength scoring
   - OTP Verification (`POST /v1/admission/verify-otp`) with 6-box PIN input and countdown timer
   - Auto session restoration on app launch
3. **Parent Portal Navigation & Screens (`(parent)/`)**:
   - `ParentDashboard`: Live hero application card, child switcher, pipeline progress, quick actions
   - `MyApplications`: Multi-application list for all children, search, status chips, draft resumption
   - `ApplicationWizard` (8 Steps): Form validation, step navigation, non-sensitive draft autosave in `AsyncStorage`, submission
   - `DocumentVault`: Document category list, file/camera upload (`POST /v1/applications/:id/documents`), pre-signed URL viewer (`GET /v1/applications/documents/:id/signed-url`)
   - `AdmissionStatus`: 5-stage milestone timeline, entrance assessment results (`GET /v1/applications/:id/assessment`), decision & scholarship hero (`GET /v1/applications/:id/decision`), SIS student card
   - `FeePayment`: Fee statement breakdown (`GET /v1/applications/:id/fee`), simulated ledger payment (`POST /v1/applications/:id/payment`), itemized receipt viewer & native share (`GET /v1/applications/:id/receipt`)
   - `NotificationFeed`: Notification feed (`GET /v1/notifications`), unread badge count (`GET /v1/notifications/unread-count`), mark-as-read mutations
4. **WebSocket Realtime Client (`src/websocket/`)**:
   - Connection to `/ws/notifications` with JWT authentication
   - In-app notification badge & banner updates
   - Automatic exponential backoff reconnection & HTTP polling fallback

---

## 5. Proposed Implementation Structure

We will adopt the clean feature-driven architecture mapped directly to the existing directory layout:

```text
apps/mobile_app/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx                   # Parent Sign In
│   │   ├── register.tsx                # Parent Registration
│   │   └── otp.tsx                     # 6-Digit OTP Verification
│   ├── (parent)/
│   │   ├── _layout.tsx                 # Protected Parent Stack Navigator
│   │   ├── dashboard.tsx               # Parent Dashboard
│   │   ├── applications/
│   │   │   ├── index.tsx               # My Applications List
│   │   │   ├── [id].tsx                # Read-Only Application View
│   │   │   ├── wizard.tsx              # 8-Step Application Wizard
│   │   │   ├── status.tsx              # Status & Decision Tracker
│   │   │   └── fees.tsx                # Fee Statement & Payment
│   │   ├── documents/
│   │   │   └── index.tsx               # Document Vault & Previewer
│   │   └── notifications/
│   │       └── index.tsx               # Notifications Feed
│
├── src/
│   ├── api/
│   │   ├── client.ts                   # Centralized Axios/Fetch client
│   │   ├── endpoints.ts                # Canonical API URL definitions
│   │   ├── auth.api.ts                 # Auth API calls
│   │   ├── admission.api.ts            # Applications, wizard, status, decisions, fees
│   │   └── notification.api.ts         # Notifications & unread counts
│   ├── features/
│   │   ├── auth/                       # Auth hooks, schemas, forms
│   │   ├── admission/                  # Wizard state, 8-step components, draft manager
│   │   ├── dashboard/                  # Hero card, child switcher, metrics
│   │   ├── documents/                  # Upload modal, picker handlers, signed URL viewer
│   │   ├── fees/                       # Fee breakdown, mode selector, receipt share
│   │   ├── decision/                   # Decision alert, scholarship badge, SIS card
│   │   └── notifications/              # WebSocket listener, feed cards
│   ├── storage/
│   │   ├── secure-store.ts             # JWT token storage
│   │   └── draft-storage.ts            # Application draft manager in AsyncStorage
│   ├── websocket/
│   │   └── realtime-client.ts          # WebSocket subscriber with reconnection
│   └── types/
│       ├── admission.types.ts          # Strongly-typed admission models & DTOs
│       └── api.types.ts                # Generic API response shapes
```

---

## 6. Risk Assessment & Mitigations

| Identified Risk                         | Severity | Mitigation Strategy                                                                                                   |
| :-------------------------------------- | :------- | :-------------------------------------------------------------------------------------------------------------------- |
| **Stale / Hardcoded API Base URLs**     | High     | Centralize in `src/api/client.ts` with configurable fallback (`http://10.0.2.2:3000` / `http://localhost:3000`).      |
| **Token Storage in Plain Storage**      | Critical | Use `SecureStore` exclusively for JWT access and refresh tokens. Never store tokens in `AsyncStorage`.                |
| **Session Expiry (401)**                | High     | Implement response interceptor in `api/client.ts` that clears auth store, deletes tokens, and navigates to login.     |
| **Cross-Parent IDOR in Mobile UI**      | Critical | Never allow arbitrary application IDs; only use IDs returned from authenticated `/v1/applications?mine=true` queries. |
| **Large Multipart Uploads over Mobile** | Medium   | Implement chunked / streamed multipart upload with progress indicator and timeout retry.                              |
| **WebSocket Connection Drops**          | Low      | Add exponential backoff reconnection logic (1s, 2s, 5s, 10s, 30s) and fallback to HTTP unread count polling.          |

---

## 7. Audit Conclusion

The existing `apps/mobile_app` project is in a **healthy, modern foundation state** (Expo SDK 51, React Native 0.74.5, TypeScript 5.3). It compiles with **0 TypeScript errors** and has a complete UI component library ready for use.

**Phase 0 is complete. Ready to proceed to Phase 1 (Foundation & API Layer).**
