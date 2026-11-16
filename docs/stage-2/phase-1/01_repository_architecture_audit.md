# EduTrack ERP — Stage-2 Phase 1: Repository Architecture Audit

**Document ID:** `docs/stage-2/phase-1/01_repository_architecture_audit.md`  
**Phase:** Stage-2 Phase 1: Foundation & Database Contract Verification  
**Author:** Senior Software Architect, PostgreSQL Database Architect & Application Security Engineer  
**Date:** November 2026  
**Status:** COMPLETE / EVIDENCE-BASED

---

## 1. Executive Summary

This document establishes the verified structural, technological, and architectural baseline of the EduTrack ERP repository. The repository is a full-stack, enterprise-grade multi-tenant educational management platform. All observations and assessments in this document are derived directly from source code inspection across workspace configurations, packages, backend services, frontend applications, and database definitions.

---

## 2. Monorepo Structure & Workspace Layout

The repository utilizes **Turborepo** with **pnpm** workspaces (`pnpm-workspace.yaml`), partitioned into distinct applications and shared packages:

```text
EduTech/
├── apps/
│   ├── backend/               # Node.js Express REST API & Prisma persistence
│   ├── database/              # Frozen Stage-1 SQL DDL, enums, triggers, RLS, vector
│   │   └── stage_1/schema/    # 11 frozen SQL bootstrap scripts (01 to 11)
│   ├── mobile_app/            # React Native / Expo mobile application
│   └── web_app/               # React 18 / Vite / RTK Query web dashboard
├── packages/
│   ├── config/                # Shared ESLint, Prettier, and TypeScript configurations
│   ├── types/                 # Shared TypeScript interfaces, navigation, capabilities
│   ├── ui/                    # Shared reusable React component library
│   └── validation/            # Shared Zod validation schemas
├── docs/                      # Architectural specifications and audit records
│   ├── database-audit/        # Stage-1 forensic database audit reports (10 files)
│   ├── database/stage-2/      # Stage-2 preliminary database designs (12 files)
│   └── stage-2/phase-1/       # Stage-2 Phase 1 Foundation verification deliverables
├── package.json               # Root workspace manifest & orchestrator scripts
├── pnpm-workspace.yaml        # PNPM workspace definition
└── turbo.json                 # Turborepo task pipeline definition
```

### 2.1 Workspace Manifests and Package Inter-dependencies

| Package / App          | Path                  | Primary Purpose        | Key Dependencies                                                                    |
| ---------------------- | --------------------- | ---------------------- | ----------------------------------------------------------------------------------- |
| `@edutrack/api`        | `apps/backend`        | Main REST API server   | Express, `@prisma/client`, `@google/genai`, `@supabase/supabase-js`, `jsonwebtoken` |
| `@edutrack/web`        | `apps/web_app`        | Web Management Portal  | React 18, Vite, `@reduxjs/toolkit`, React Router v6, Tailwind CSS, Radix UI         |
| `@edutrack/mobile`     | `apps/mobile_app`     | Mobile Client          | React Native, Expo                                                                  |
| `@edutrack/types`      | `packages/types`      | Canonical Domain Types | Pure TypeScript definitions, menu registry, capability engine                       |
| `@edutrack/ui`         | `packages/ui`         | Shared UI Components   | React, Tailwind, Lucide React                                                       |
| `@edutrack/validation` | `packages/validation` | Cross-layer Validation | Zod schemas for forms and API requests                                              |
| `@edutrack/config`     | `packages/config`     | Tooling Configuration  | TypeScript configs, ESLint configs                                                  |

---

## 3. Backend Technology Stack & Architecture

### 3.1 Technology Stack (`apps/backend/package.json`)

- **Runtime Environment:** Node.js (v18.0.0+ / tested with v20.20.2)
- **Framework:** Express.js v4.19.2
- **Language:** TypeScript v5.4.5, compiled via `tsc` to CommonJS (`dist/`)
- **ORM / Persistence:** Prisma ORM v5.22.0 (`@prisma/client` and `prisma`)
- **Database Engine:** PostgreSQL 15+ (with `pgcrypto`, `uuid-ossp`, and `pgvector` extensions)
- **Authentication:** JWT (`jsonwebtoken` v9.0.2), bcryptjs v2.4.3, crypto
- **AI Integrations:** Google GenAI SDK (`@google/genai` v0.1.1) running Gemini models
- **Object Storage:** Supabase Storage client (`@supabase/supabase-js` v2.45.4)
- **File Ingestion / Parsing:** `multer` v1.4.5-lts.1, `pdf-parse` v1.1.1
- **Testing & Verification:** Newman / Postman (`postman/collections/`), ts-node custom test scripts

### 3.2 Directory Organization (`apps/backend/src/`)

```text
apps/backend/src/
├── app.ts                     # Express application instantiation & top-level middleware
├── server.ts                  # HTTP server listener, graceful shutdown, socket handling
├── routes.ts                  # Central router mounting all module routers
├── auth/                      # Authentication controllers, middleware, JWT sessions
├── cache/                     # Redis / in-memory cache abstraction
├── config/                    # Environment variables, Supabase config, database URLs
├── lib/
│   └── prismaClient.ts        # Prisma Client singleton with fallback proxy wrapper
├── middlewares/               # Tenant, audit, idempotency, upload, error, rate-limit
├── modules/                   # Domain-driven backend modules
│   ├── academic/              # Legacy academic service
│   ├── academic-management/   # Stage-1 Academic module (years, grades, sections, classes)
│   ├── admin/                 # Administration, system settings, bulk operations
│   ├── admission/             # Admission domain core logic
│   ├── admission-management/  # Admission controllers, DTOs, repositories, services
│   ├── chatbot/               # AI chatbot, vector search, knowledge ingestion
│   ├── communication/         # Notifications, email, SMS gateways
│   ├── dashboard/             # Executive and role-based analytical dashboards
│   ├── departments/           # Organizational departments & designations
│   ├── fees/                  # Fee structures, demands, collections, reconciliation
│   ├── import/                # CSV/XLSX bulk data import pipelines
│   ├── lead-management/       # CRM leads, inquiries, visits, interactions
│   ├── notifications/         # In-app notifications engine
│   ├── parent-management/     # Parent portal backend services
│   ├── staff-management/      # Faculty and staff profile management
│   ├── student/               # Student domain logic
│   ├── student-management/    # Student enrollment, admissions, section assignments
│   └── user-management/       # Identity management, user roles
├── rbac/                      # Role-Based Access Control policies and permissions
├── services/                  # Shared infrastructural services (e.g. storage.service.ts)
└── utils/                     # Logger, cryptographic helpers, AI lead scorers
```

### 3.3 Architectural Pattern & Code Flow

The backend strictly adheres to a **Controller-Service-Repository** layered architecture:

1. **Routing Layer (`*.routes.ts`):** Defines HTTP verbs and paths, applying `authenticate`, `resolveTenantMiddleware`, and `checkPermission(...)` guards.
2. **Controller Layer (`*.controller.ts`):** Unpacks HTTP request parameters, query strings, and body; invokes validators; calls corresponding service methods; serializes standard JSON responses.
3. **Service Layer (`*.service.ts`):** Enforces business logic, domain invariants, workflow transitions, and transaction boundaries.
4. **Repository Layer (`*.repository.ts`):** Executes Prisma queries or raw SQL queries against PostgreSQL.

---

## 4. Frontend Technology Stack & Architecture

### 4.1 Technology Stack (`apps/web_app/package.json`)

- **Runtime / Bundler:** Vite v5.3.4 with `@vitejs/plugin-react`
- **UI Library:** React v18.3.1 & React DOM v18.3.1
- **Language:** TypeScript v5.5.3
- **Routing:** React Router DOM v6.26.0
- **State Management:** Redux Toolkit v2.2.7 (`@reduxjs/toolkit`) & React Redux v9.1.2
- **Data Fetching & Caching:** RTK Query (`apiSlice.ts` with re-authentication base query)
- **Styling:** Tailwind CSS v3.4.7 with `tailwind-merge`, `clsx`, and `tailwindcss-animate`
- **Component Primitives:** Radix UI (`@radix-ui/react-*`), Base UI, Lucide React icons
- **Form Management:** `react-hook-form` v7.52.1 with `@hookform/resolvers` and `zod` v3.23.8
- **Data Presentation:** `@tanstack/react-table` v8.19.3, Recharts v2.12.7, ECharts v5.5.1
- **Notifications:** `sonner` toast notification manager

### 4.2 Directory Organization (`apps/web_app/src/`)

```text
apps/web_app/src/
├── app/
│   ├── App.tsx                # App entrypoint with theme providers and router
│   ├── providers.tsx          # Redux Provider, Auth Provider, Query Client providers
│   ├── router.tsx             # Route definitions and route guards
│   └── store/
│       ├── apiSlice.ts        # Central RTK Query base API slice
│       ├── baseQueryWithReauth.ts # Token refresh and error handling interceptor
│       ├── index.ts           # Redux store configuration
│       └── rootReducer.ts     # Aggregated reducers
├── components/
│   ├── auth/                  # ProtectedRoute, PermissionGuard, Role guards
│   ├── common/                # Reusable UI cards, tables, headers, animated sections
│   ├── layout/                # Shell, AppSidebar, Navbar, PublicNavbar
│   ├── shell/                 # AppShell, AppNavbar, AppSidebar
│   └── ui/                    # Primitive design system components (buttons, dialogs, inputs)
├── config/
│   └── menu_registry.ts       # Frontend menu registry bridging types to Lucide icons
├── context/
│   └── AuthContext.tsx        # React context for authenticated user session
├── modules/                   # Domain feature modules (fees, admission, student, admin, etc.)
├── pages/                     # Routed page components
└── services/                  # API client wrapper (`api-client.ts`), token storage
```

---

## 5. Shared Libraries Architecture (`packages/`)

1. **`@edutrack/types` (`packages/types/`):**
   - Canonical single source of truth for TypeScript types across frontend and backend.
   - Contains `core/menu-registry.ts` defining `WORKSPACE_MENU_GROUPS` and `PARENT_MENU_ITEMS`.
   - Contains `core/capability-engine.ts` for capability-based UI permissions.
   - Contains `admission.ts`, `auth.ts`, `common.ts` domain types.

2. **`@edutrack/ui` (`packages/ui/`):**
   - Headless and styled components shared between `web_app` and internal portals.
   - Standardized alert dialogs, form controls, data tables, and badges.

3. **`@edutrack/validation` (`packages/validation/`):**
   - Shared Zod validation schemas ensuring identical validation rules on client-side form submissions and backend API request bodies.

---

## 6. Development, Build, and Verification Pipeline

- **Monorepo Build:** Executed via `turbo run build`, creating clean build outputs for all apps.
- **Type Checking:** Executed via `turbo run typecheck`, running `tsc --noEmit` across all workspaces.
- **Linting:** Executed via `turbo run lint`, enforcing ESLint rules and code formatting.
- **API Tests:** Executed via Newman collections against live or local development servers (`postman/collections/`).

---

## 7. Conclusions & Stage-2 Architectural Fit

1. **Monorepo Ready:** The package layout, workspace boundaries, and shared typing infrastructure are mature and well-structured for housing Stage-2 features without code duplication.
2. **Backend Modularity:** The `academic-management` module provides a strong architectural precedent. Stage-2 modules can cleanly integrate into `apps/backend/src/modules/` following identical Controller-Service-Repository patterns.
3. **Frontend Component Ecosystem:** Rich primitives (Radix, Tailwind, Lucide, TanStack Table) provide all necessary building blocks for curriculum designers, interactive calendar matrices, resource cards, and lesson planners.
4. **Governing Constraint:** The shared architectural pattern MUST NOT be violated by inventing ad-hoc in-memory persistence or bypassing established middleware pipelines.
