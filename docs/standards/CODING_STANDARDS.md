# EduTrack ERP — Coding Standards & Engineering Conventions (`CODING_STANDARDS.md`)

**Generated Date:** August 5, 2026  
**Source of Truth:** Workspace code conventions across Express backend, React web, and Expo mobile.

---

## 1. Naming Conventions

- **Files & Directories:**
  - Backend Source Files: `kebab-case.ts` (e.g. `auth.middleware.ts`, `admission.service.ts`).
  - React Web Components & Pages: `PascalCase.tsx` (e.g. `Button.tsx`, `Dashboard.tsx`).
  - Shared Packages: `@edutrack/package-name`.
- **Code Identifiers:**
  - Classes / Interfaces / Types: `PascalCase` (e.g., `SessionService`, `UserProfile`).
  - Variables / Functions / Methods: `camelCase` (e.g., `validateSession`, `checkPermission`).
  - Constants / Enums: `UPPER_SNAKE_CASE` (e.g., `CACHE_TTL_MS`, `PERMISSIONS`).
  - SQL Tables & Columns: `snake_case` (e.g., `admissions_applications`, `created_at`).

---

## 2. TypeScript Guidelines

- Always enforce strict type checking (`"strict": true` in `tsconfig.json`).
- Avoid using `any` type. Define explicit types in `@edutrack/types` or local `.types.ts` files.
- Prefer `interface` for object schemas and `type` for unions/primitives.
- All async functions must explicitly declare `Promise<T>` return types.

---

## 3. Controller & Service Conventions

- **Controllers:**
  - Validate request payload against Zod schemas from `@edutrack/validation`.
  - Delegates business logic execution to Service modules.
  - Return standardized HTTP response formats: `{ success: true, data: T }` or `{ success: false, error: string }`.
- **Services:**
  - Contain pure business logic and database access calls.
  - Must be stateless and handle error throw conditions.
