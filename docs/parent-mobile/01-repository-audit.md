# EduTrack ERP — Parent Mobile App

## 01. Repository Discovery & Baseline Audit Report

**Date:** October 15, 2026  
**Module:** Parent Mobile Application (`apps/mobile_app`) & Full-Stack Integration  
**Auditor:** Mobile Architect & Full-Stack Security Auditor  
**Audit Status:** COMPLETE & VERIFIED

---

### Executive Summary

An exhaustive repository discovery and baseline audit was executed on the EduTrack ERP monorepo to determine the exact architecture, implementation state, security boundaries, and operational readiness of the **Parent Mobile Application** (`apps/mobile_app`).

The repository is structured as a pnpm monorepo containing:

1. `apps/mobile_app` — Expo SDK 51 / React Native 0.74.5 cross-platform mobile client with Expo Router file-based routing.
2. `apps/backend` — Express.js / TypeScript / Prisma 5.22.0 RESTful API and WebSocket notification engine.
3. `apps/web_app` — Vite / React admin, staff, and teacher web portal.
4. `packages/*` — Shared workspace packages (`@edutrack/types`, `@edutrack/validation`, `@edutrack/config`).

Prior development in Phases 0–9 focused heavily on the **Parent Admission & Onboarding Pipeline** (registration, OTP verification, login, 8-step application wizard, document upload with pre-signed URLs, entrance assessment tracking, committee decision letters, admission fee settlements, itemized digital receipts, and WebSocket-driven notification center).

The backend contains an authoritative, database-backed **Parent Finance & Multi-Child Ledger Service** (`ParentFinanceService`) with active endpoints (`GET /v1/fees/my` and `GET /v1/fees/my/children/:studentId`). Database models for student attendance, report cards, homework, transport GPS, and hostel do not exist in `apps/backend/prisma/schema.prisma`. Under the non-negotiable **Stage-1 Database Freeze**, zero DDL or schema alterations are permitted; these capabilities are formally documented as architectural recommendations for Stage-2.

---

### 1. Repository Architecture & Technology Stack

```
EduTrack Monorepo
├── apps/
│   ├── mobile_app/                 # Parent & Cross-Platform Mobile Client (Expo SDK 51)
│   ├── backend/                    # Core API, Auth, RBAC & WebSocket Service (Node.js/Express)
│   ├── web_app/                    # Web ERP Portal (Vite/React)
│   └── database/                   # Seed & SQL reference scripts
├── packages/
│   ├── types/                      # Shared Domain & API Types
│   ├── validation/                 # Shared Zod Validation Schemas
│   └── config/                     # Shared ESLint/Prettier/TypeScript Configs
└── docs/
    └── parent-mobile/              # Forensic Audit & Implementation Documentation
```

#### Detailed Mobile Technology Matrix (`apps/mobile_app`)

| Layer / Concern          | Technology & Version                                           | File Location                                  | Assessment                         |
| :----------------------- | :------------------------------------------------------------- | :--------------------------------------------- | :--------------------------------- |
| **Framework**            | Expo SDK `~51.0.28` / React Native `0.74.5` / React `18.2.0`   | `package.json`, `app.json`                     | Modern, stable, production-grade   |
| **Routing**              | `expo-router` `~3.5.24` (File-based routing with typed routes) | `app/`                                         | Active, typed, protected           |
| **Styling**              | `nativewind` `^2.0.11` + `tailwindcss` `3.3.2`                 | `tailwind.config.js`, `global.d.ts`            | Complete utility styling system    |
| **State Management**     | `zustand` `^4.5.2` + `@tanstack/react-query` `^5.28.9`         | `src/stores/`, `src/providers/`                | Decoupled client & server state    |
| **Form Management**      | `react-hook-form` `^7.51.2` + `zod` `^3.22.4`                  | `src/features/admission/schemas/`              | Robust client-side validation      |
| **Secure Token Storage** | `expo-secure-store` `~13.0.2`                                  | `src/storage/secure-store.ts`                  | Hardware-backed Keychain/Keystore  |
| **Offline Drafts**       | `@react-native-async-storage/async-storage` `1.23.1`           | `src/storage/draft-storage.ts`                 | Non-sensitive draft persistence    |
| **Icons & Media**        | `@expo/vector-icons` `^14.0.2`, `expo-image` `~1.13.0`         | `package.json`                                 | Vector iconography                 |
| **Networking**           | `axios` `^1.6.8` with central client                           | `src/api/client.ts`                            | Standardized interceptors & errors |
| **Realtime WebSockets**  | Native WebSocket singleton                                     | `src/features/notifications/services/`         | 25s ping heartbeat + backoff       |
| **File Picker**          | `expo-document-picker` `~12.0.2`                               | `app/(parent)/applications/[id]/documents.tsx` | MIME & 10MB size guards            |

---

### 2. Application Entry Points & Navigation Structure

#### Mobile Client Entry Points

- **Entry File:** `apps/mobile_app/app/index.tsx`
  - Hydrates authenticated session from `Expo.SecureStore`.
  - Redirects authenticated users (`isAuthenticated === true`) to `/(parent)`.
  - Redirects unauthenticated users to `/(auth)/login`.
  - Employs full-page `Loader` to eliminate unauthenticated data flashing.
- **Root Provider Shell:** `apps/mobile_app/app/_layout.tsx`
  - Wraps tree in `QueryProvider` (React Query) and `AppProvider` (Theme, Toast, Auth lifecycle).
  - Configures Expo Router `Stack` with headerless navigation.
- **Parent Tab Navigator:** `apps/mobile_app/app/(parent)/_layout.tsx`
  - Enforces `<ProtectedRoute>` wrapper.
  - Renders 4 primary tabs: `Home` (`index`), `Applications` (`applications`), `Notifications` (`notifications`), and `Account` (`profile`).
  - Subscribes to live WebSocket notifications via `useNotificationRealtime()`.
  - Renders dynamic unread notification badge on tab icon.

#### Route Inventory (`apps/mobile_app/app/`)

| Route Path                               | File Path                                       | Guard / Access       | Purpose                                |
| :--------------------------------------- | :---------------------------------------------- | :------------------- | :------------------------------------- |
| `/`                                      | `app/index.tsx`                                 | Public               | Cold-launch router & session hydration |
| `/(auth)/login`                          | `app/(auth)/login.tsx`                          | Public               | Parent email & password login          |
| `/(auth)/register`                       | `app/(auth)/register.tsx`                       | Public               | Parent self-registration               |
| `/(auth)/otp`                            | `app/(auth)/otp.tsx`                            | Public               | 6-digit OTP verification               |
| `/(auth)/forgot-password`                | `app/(auth)/forgot-password.tsx`                | Public               | Password recovery request              |
| `/(auth)/workspace`                      | `app/(auth)/workspace.tsx`                      | Public               | School workspace selection             |
| `/(parent)`                              | `app/(parent)/index.tsx`                        | Parent Authenticated | Parent dashboard & child switcher      |
| `/(parent)/applications`                 | `app/(parent)/applications.tsx`                 | Parent Authenticated | Multi-application inventory            |
| `/(parent)/applications/wizard`          | `app/(parent)/applications/wizard.tsx`          | Parent Authenticated | 8-step admission application form      |
| `/(parent)/applications/[id]`            | `app/(parent)/applications/[id].tsx`            | Parent Authenticated | Application Action Hub & Summary       |
| `/(parent)/applications/[id]/documents`  | `app/(parent)/applications/[id]/documents.tsx`  | Parent Authenticated | Document Vault & upload                |
| `/(parent)/applications/[id]/fees`       | `app/(parent)/applications/[id]/fees.tsx`       | Parent Authenticated | Admission fee statement & payment      |
| `/(parent)/applications/[id]/receipt`    | `app/(parent)/applications/[id]/receipt.tsx`    | Parent Authenticated | Digital payment receipt & verification |
| `/(parent)/applications/[id]/assessment` | `app/(parent)/applications/[id]/assessment.tsx` | Parent Authenticated | Entrance exam & assessment tracking    |
| `/(parent)/applications/[id]/decision`   | `app/(parent)/applications/[id]/decision.tsx`   | Parent Authenticated | Admission decision outcome             |
| `/(parent)/applications/[id]/timeline`   | `app/(parent)/applications/[id]/timeline.tsx`   | Parent Authenticated | 5-stage milestone audit timeline       |
| `/(parent)/notifications`                | `app/(parent)/notifications.tsx`                | Parent Authenticated | Notification feed & WebSocket updates  |
| `/(parent)/profile`                      | `app/(parent)/profile.tsx`                      | Parent Authenticated | Parent account details & logout        |
| `/(common)/notifications`                | `app/(common)/notifications.tsx`                | Authenticated        | Standalone notifications fallback      |
| `/(common)/no-internet`                  | `app/(common)/no-internet.tsx`                  | Public               | Offline warning screen                 |
| `/(common)/maintenance`                  | `app/(common)/maintenance.tsx`                  | Public               | Planned maintenance screen             |
| `/(common)/unexpected-error`             | `app/(common)/unexpected-error.tsx`             | Public               | Global crash fallback screen           |

---

### 3. Backend API Architecture & Endpoints

The backend (`apps/backend`) runs Express.js with Prisma ORM connecting to PostgreSQL.

#### Authentication & Public Metadata Endpoints

- `POST /v1/auth/login` — Authenticates email & password; issues access & refresh tokens.
- `POST /v1/admission/register` — Self-registration for parents.
- `POST /v1/admission/verify-otp` — Verifies 6-digit OTP and activates parent user.
- `GET /v1/auth/me` / `GET /auth/me` — Fetches current user profile, roles, and enabled features.
- `GET /public/admission/config` / `GET /v1/public/admission/config` — Returns active schools, academic years, grades, and required documents.
- `GET /public/academic-years` / `GET /v1/public/academic-years` — School-scoped academic years.
- `GET /public/classes` / `GET /v1/public/classes` — School-scoped grades and sections.
- `GET /schools` / `GET /v1/schools` — Public active school directory.

#### Parent Admission Endpoints (`apps/backend/src/modules/admission-management/`)

- `GET /v1/applications?mine=true` / `GET /v1/applications/mine` — Lists applications created by the authenticated parent.
- `GET /v1/applications/:id` — Application details scoped to organization and parent.
- `POST /v1/applications` — Creates new admission application draft.
- `PATCH /v1/applications/:id/status` — Transitions application state (e.g., `submitted`).
- `GET /v1/applications/:id/documents` — Lists attached documents with verification states.
- `POST /v1/applications/:id/documents` — Multipart file upload for documents.
- `GET /v1/applications/documents/:id/signed-url` — Issues ephemeral pre-signed URL for viewing.
- `GET /v1/applications/:id/assessment` — Evaluated entrance assessment scores.
- `GET /v1/applications/:id/decision` — Committee admission decision letter & scholarship.
- `GET /v1/applications/:id/fee` — Fee statement calculation for application.
- `POST /v1/applications/:id/payment` — Ledger-backed payment settlement.
- `GET /v1/applications/:id/receipt` — Itemized receipt for application fees.
- `GET /v1/applications/:id/timeline` — Chronological pipeline events.

#### Parent Enrolled Student & Finance Endpoints (`apps/backend/src/modules/fees/`)

- `GET /v1/fees/my` — Multi-child enrolled fee summary for authenticated parent (`ParentFinanceService.getMyChildrenFees`).
- `GET /v1/fees/my/children/:studentId` — Child-specific fee details with strict `student_parents` relationship verification (`ParentFinanceService.getChildFeeDetails`).
- `GET /v1/fees/ledger/student/:studentId` — Student ledger overview.

#### Notification Endpoints (`apps/backend/src/modules/notifications/`)

- `GET /v1/notifications` — Notification feed for current authenticated user.
- `GET /v1/notifications/unread-count` — Unread count for badge indicators.
- `PATCH /v1/notifications/:id/read` — Marks single notification as read.
- `PATCH /v1/notifications/mark-all-read` — Marks all notifications as read.
- `WS /ws/notifications` — WebSocket live notifications.

---

### 4. Database Schema Audit (`schema.prisma`)

The database models are governed exclusively by `apps/backend/prisma/schema.prisma` (53 models).

#### Relevant Database Models

1. **Parent & Student Identity:**
   - `users`: User authentication, credentials, status, email, phone.
   - `roles`: Role definitions (`PARENT`, `ADMIN`, etc.).
   - `user_roles`: Many-to-many user-role assignments.
   - `parents`: Parent entity with contact details and user linkage.
   - `students`: Enrolled student record with admission number, user link, org link.
   - `student_parents`: Authoritative link between `parents` and `students` with `relationship` and `is_primary_contact`.
   - `student_enrollments`: Academic year enrollment linking student to `academic_year_grades` and `sections`.
   - `organizations`: Multi-tenant organization boundaries.

2. **Admission & Application Pipeline:**
   - `admissions_applications`: Main application entity with student/parent details, status, grade link.
   - `admission_documents`: Files attached to applications with verification status and storage paths.
   - `application_assessments`: Entrance test scores, evaluator remarks, pass/fail status.
   - `admission_decisions`: Committee outcomes (`approved`, `waitlisted`, `rejected`), scholarship percentage.
   - `admission_fee_payments`: Payment records for application fees.
   - `document_types`: Configuration of mandatory/optional document requirements.

3. **Finance & Fee Structure:**
   - `fee_structures`: Base fee templates.
   - `fee_components`: Individual line-item fee types (Tuition, Transport, Lab).
   - `installment_plans`: Schedule templates for installment payments.
   - `installment_plan_terms`: Specific installment due dates and percentages.
   - `student_fee_assignments`: Link between enrolled student and assigned fee structure.
   - `student_charges`: Assessed fee charges for students.
   - `student_charge_dues`: Scheduled fee installments and due dates.
   - `payment_orders`: Orders generated for online payment gateways.
   - `payment_transactions`: Completed payment records.
   - `payment_allocations`: Allocation of transaction amounts against dues.

4. **Notifications:**
   - `notifications`: In-app notification records with `user_id`, `type`, `title`, `message`, `is_read`, `metadata`.

#### Database Models NOT Present in `schema.prisma`

- **Attendance:** No `attendance` or `daily_attendance` table exists.
- **Academics:** No `homework`, `timetables`, `exams`, `marks`, or `report_cards` tables exist.
- **Auxiliary Modules:** No `hostel`, `transport_routes`, or `library_loans` tables exist.

Per the Stage-1 freeze, these missing tables are not created or altered in the database.

---

### 5. Commands Executed & Baseline Test Results

All validation checks were executed using Node.js v20.20.2 and pnpm 9.15.4:

| Command                                                     | Working Directory | Result            | Notes                                       |
| :---------------------------------------------------------- | :---------------- | :---------------- | :------------------------------------------ |
| `npx prisma generate`                                       | `apps/backend`    | **PASS** (Exit 0) | Generated Prisma client v5.22.0             |
| `pnpm --filter @edutrack/api typecheck`                     | Root              | **PASS** (Exit 0) | 0 TypeScript errors in Backend              |
| `pnpm --filter @edutrack/mobile typecheck`                  | Root              | **PASS** (Exit 0) | 0 TypeScript errors in Mobile Client        |
| `pnpm --filter @edutrack/web typecheck`                     | Root              | **PASS** (Exit 0) | 0 TypeScript errors in Web App              |
| `pnpm --filter @edutrack/mobile test`                       | Root              | **PASS** (Exit 0) | **14/14 test suites, 179/179 tests passed** |
| `curl -s http://localhost:3000/api/health`                  | Root              | **PASS** (Exit 0) | Backend server operational                  |
| `curl -s http://localhost:3000/api/health/readiness`        | Root              | **PASS** (Exit 0) | PostgreSQL connected                        |
| `curl -s http://localhost:3000/api/schools`                 | Root              | **PASS** (Exit 0) | Returned 4 database organizations           |
| `curl -s http://localhost:3000/api/public/admission/config` | Root              | **PASS** (Exit 0) | Returned admission config                   |

---

### 6. Baseline Defect & Gap Findings

1. **Enrolled Student Data Disconnect in Mobile:**
   - While the backend provides `GET /v1/fees/my` and `GET /v1/fees/my/children/:studentId`, the mobile app only queried `applicationsApi.listMine()`.
   - Parents with enrolled children had no mobile UI to view enrolled student profiles, grade/section, or fee ledgers.
2. **Missing Mobile API Client Methods:**
   - `apps/mobile_app/src/api/endpoints.ts` and `fees.api.ts` lacked endpoints for `/v1/fees/my` and `/v1/fees/my/children/:studentId`.
3. **Database Absence of Attendance & Academics:**
   - Attendance and ongoing gradebooks are absent from `schema.prisma`. Any assumption that attendance exists in the database is verified false. Must be documented as recommendations.
4. **Forgot Password Incomplete:**
   - `app/(auth)/forgot-password.tsx` is a UI placeholder without a corresponding backend self-service password reset API.
