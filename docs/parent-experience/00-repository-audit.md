# EduTrack ERP — Parent Experience Integration

# Document 00: Repository Architecture & Subsystem Map

**Document Version:** 1.0.0  
**Phase:** Phase 0 — Complete Repository Audit, System Discovery & Integration Blueprint  
**Date:** October 16, 2026  
**Governing Standard:** Schema Freeze & Prisma-First Domain Architecture ([AGENTS.md](file:///Users/sathish/Documents/GitHub/EduTech/.agents/AGENTS.md))  
**Auditor:** Antigravity AI Pair Programmer

---

## 1. Executive Overview

This audit establishes the factual workspace baseline for the **EduTrack Enterprise SaaS ERP** monorepo. It catalogs all active applications, shared packages, build systems, runtime dependencies, service registries, and testing infrastructure, specifically evaluating readiness for the **Parent Experience Integration (Web & Mobile)**.

### Monorepo Topology

```
EduTech (Root)
├── apps/
│   ├── backend/       # Node.js + Express + Prisma ORM (Port 3000)
│   ├── web_app/       # React 18 + Vite SPA + Tailwind CSS (Port 5173)
│   ├── mobile_app/    # Expo 51 + React Native + Expo Router
│   └── database/      # SQL migrations, seed scripts, legacy DDL
├── packages/
│   ├── config/        # Shared ESLint, Prettier, and TS configs
│   ├── types/         # Shared TypeScript interfaces & DTO definitions
│   ├── ui/            # Shared UI design tokens and components
│   └── validation/    # Shared Zod validation schemas
├── docs/              # Architectural blueprints, forensic audits, specifications
└── postman/           # API integration collections & environments
```

---

## 2. Package Manager & Monorepo Tooling

| Component                        | Tool / Version         | Configuration File                                                                              | Verified Behavior                                                 |
| :------------------------------- | :--------------------- | :---------------------------------------------------------------------------------------------- | :---------------------------------------------------------------- |
| **Package Manager**              | `pnpm@9.15.4`          | [package.json](file:///Users/sathish/Documents/GitHub/EduTech/package.json#L6)                  | Workspace symlinks managed via `pnpm-workspace.yaml`.             |
| **Workspace Definition**         | `apps/*`, `packages/*` | [pnpm-workspace.yaml](file:///Users/sathish/Documents/GitHub/EduTech/pnpm-workspace.yaml#L1-L3) | Isolates runtime applications from reusable packages.             |
| **Monorepo Build Orchestration** | Turborepo `v2.3.4`     | [turbo.json](file:///Users/sathish/Documents/GitHub/EduTech/turbo.json)                         | Orchestrates `build`, `lint`, `typecheck`, and `test` pipelines.  |
| **Code Formatting**              | Prettier `3.4.2`       | [.prettierrc](file:///Users/sathish/Documents/GitHub/EduTech/.prettierrc)                       | Integrated with Git pre-commit hooks via `husky` + `lint-staged`. |
| **Linting**                      | ESLint `8.57.0`        | Root & module `.eslintrc.js`                                                                    | Enforces TypeScript strict typing across all packages.            |

### Root NPM Scripts:

- `dev`: `turbo run dev`
- `dev:api`: `pnpm --filter @edutrack/api run dev`
- `dev:web`: `pnpm --filter @edutrack/web run dev`
- `dev:mobile`: `pnpm --filter @edutrack/mobile run start`
- `build`: `turbo run build`
- `typecheck`: `turbo run typecheck`
- `prisma:generate`: `pnpm --filter @edutrack/api run db:generate`
- `prisma:validate`: `pnpm --filter @edutrack/api run db:validate`

---

## 3. Application Stack & Framework Audits

### 3.1 Backend Application (`apps/backend` — `@edutrack/api`)

- **Runtime & Language:** Node.js v20+ with TypeScript `5.3.2`.
- **HTTP Framework:** Express `4.22.1` with `helmet@7.1.0`, `compression@1.8.1`, `cors@2.8.5`, and `express-rate-limit@8.2.1`.
- **Database & ORM:**
  - Prisma Client `5.22.0` configured in [apps/backend/prisma/schema.prisma](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/prisma/schema.prisma).
  - PostgreSQL with `multiSchema` support (`public`).
  - Native connection pooling via PostgreSQL direct connection and Supabase client `2.39.0`.
- **Payment Gateway:** Razorpay Node.js SDK `2.9.8` with cryptographic HMAC-SHA256 signature verification.
- **Reporting & Export:** `puppeteer@24.37.2` (PDF receipts), `xlsx@0.18.5` (Excel reports), `json2csv@6.0.0-alpha.2`.
- **Validation:** Zod `3.22.4`.
- **Server Entry:** [apps/backend/src/server.ts](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/server.ts) mounting [apps/backend/src/app.ts](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/app.ts).
- **Typecheck Status:** `tsc --noEmit` exits with **Code 0** (verified clean).

#### Backend Module Structure (`apps/backend/src/modules/`):

1. `admission`: CRM enquiries, lead assignment, application wizard, document uploads, assessments, offer letters, and atomic student provisioning.
2. `fees`: 16-phase ERP Finance engine (structures, installments, charges, dues, payments, reconciliation, accounting exports, receipts, parent ledger).
3. `academic-management`: Academic years, grades, terms, curriculum, syllabus, and class allocations.
4. `student-management`: Student profiles, enrollment records, medical logs, and identity cards.
5. `parent-management`: Parent/guardian entities, emergency contacts, and family relationships.
6. `dashboard`: Role-specific overview aggregates for Admin, Front Office, Student, and Parent.
7. `notifications`: In-app notification dispatcher and template renderers.
8. `user-management` & `rbac`: Centralized role-based access control and tenant resolution.

### 3.2 Web Frontend (`apps/web_app` — `@edutrack/web`)

- **Framework & Bundler:** React `18.2.0`, React DOM `18.2.0`, Vite `5.0.0`.
- **Routing:** `react-router-dom@6.20.0` configured centrally in [apps/web_app/src/config/route_registry.tsx](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/config/route_registry.tsx).
- **State Management & Caching:**
  - `@reduxjs/toolkit@2.2.1` & `react-redux@9.1.0` (RTK Query for admission APIs).
  - `@tanstack/react-query@5.101.2` for asynchronous query caching.
  - `zustand@4.5.2` for lightweight client UI state.
- **Styling & UI Primitives:**
  - Tailwind CSS `3.3.5` with `tailwindcss-animate@1.0.7` and `tw-animate-css@1.4.0`.
  - Radix UI (`@radix-ui/react-*`) accessible primitives (dialogs, tabs, popovers, dropdowns).
  - `lucide-react@0.563.0` icon set.
  - `sonner@2.0.7` notifications.
- **Reporting / Print Engine:** `react-to-print@3.2.0` (statement printing).
- **Typecheck Status:** `tsc --noEmit` exits with **Code 0** (verified clean).

### 3.3 Parent Mobile Application (`apps/mobile_app` — `@edutrack/mobile`)

- **Framework & Runtime:** Expo SDK `~51.0.28`, React Native `0.74.5`.
- **File-Based Routing:** `expo-router@~3.5.24` with native stack navigation.
- **State & Server Queries:**
  - `@tanstack/react-query@5.28.9` for query caching, background polling, and stale-time management.
  - `zustand@4.5.2` for persistent authentication state.
- **Storage:** `expo-secure-store@~13.0.2` (JWT and refresh tokens) and `@react-native-async-storage/async-storage@1.23.1`.
- **Styling:** NativeWind `2.0.11` + Tailwind CSS `3.3.2`.
- **Icons & Visuals:** `@expo/vector-icons@14.0.2` (Ionicons, Feather).
- **Testing:** Jest `29.7.0` with 14 test suites and 181 unit tests (100% passing).

---

## 4. Shared Libraries (`packages/`)

1. **`@edutrack/types` ([packages/types](file:///Users/sathish/Documents/GitHub/EduTech/packages/types)):**
   - Central TypeScript interfaces for Admissions, Academic terms, Finance summaries, Payment DTOs, and User sessions.
2. **`@edutrack/validation` ([packages/validation](file:///Users/sathish/Documents/GitHub/EduTech/packages/validation)):**
   - Isomorphic Zod schemas enforcing strict input validation across API requests and client forms.
3. **`@edutrack/ui` ([packages/ui](file:///Users/sathish/Documents/GitHub/EduTech/packages/ui)):**
   - Core design tokens, theme definitions, button styles, badges, and card surfaces.
4. **`@edutrack/config` ([packages/config](file:///Users/sathish/Documents/GitHub/EduTech/packages/config)):**
   - Unified ESLint rules, TypeScript compiler presets, and Prettier configurations.

---

## 5. Master Route Registration & Prefix Conventions

All HTTP routes are exposed under `/api` in [apps/backend/src/app.ts](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/app.ts#L96):

```
HTTP Base: http://localhost:3000/api

├── /auth & /v1/auth                     -> publicAuthRouter, protectedAuthRouter
├── /v1/admission/crm                    -> crmRouter (leads, enquiries)
├── /v1/admission/application            -> applicationRouter
├── /v1/admission/application/documents  -> documentRouter
├── /v1/admission/evaluation             -> evaluationRouter
├── /v1/admission/assessment             -> assessmentRouter
├── /v1/admission/enrollment             -> enrollmentRouter
├── /v1/applications & /applications     -> admissionManagementRouter
├── /v1/students & /students             -> studentManagementRouter
├── /v1/parents & /parents               -> parentManagementRouter
├── /v1/academic & /academic             -> academicManagementRouter
├── /v1/fees & /fees                     -> feesRouter (Finance Module Master)
├── /dashboard                           -> dashboardRouter
├── /v1/notifications & /notifications   -> notificationRouter
├── /create-order & /verify-payment      -> razorpayRouter
└── /health                              -> healthRouter (system readiness probes)
```

---

## 6. Verification Summary & Command Status

| Verification Scope                       | Command Executed                            | Exit Code | Verified Outcome                                                                       |
| :--------------------------------------- | :------------------------------------------ | :-------- | :------------------------------------------------------------------------------------- |
| **Backend TypeScript Verification**      | `pnpm --filter @edutrack/api run typecheck` | `0`       | Clean compile; zero type errors across all controllers and services.                   |
| **Web Frontend TypeScript Verification** | `pnpm --filter @edutrack/web run typecheck` | `0`       | Clean compile; zero type errors across all modules and route components.               |
| **Mobile App Unit Test Suite**           | `pnpm --filter @edutrack/mobile run test`   | `0`       | 14 test suites passed; 181 unit tests executed and passed without regressions.         |
| **Git Working Tree State**               | `git status -s`                             | `0`       | Identified active work in progress; strict compliance with zero deletion/revert rules. |
