# EduTrack ERP — Tooling Audit (Before Modifications)

## 1. Overview

- **Audit Date:** August 4, 2026
- **Scope:** Root infrastructure, Turborepo tasks, pnpm workspaces, ESLint configurations, TypeScript hierarchy, Git hooks, Prettier, and Package exports.
- **Rule Strictness:** Zero modification of application code, React components, NestJS logic, DTOs, Prisma schemas, database migrations, or REST APIs.

---

## 2. Workspace Inventory Audit

| Workspace Name         | Path                  | Package Name           | Existing Scripts                                                            | ESLint Config File | Status                                                                          |
| :--------------------- | :-------------------- | :--------------------- | :-------------------------------------------------------------------------- | :----------------- | :------------------------------------------------------------------------------ |
| **Root**               | `/`                   | `edutrack-monorepo`    | `dev`, `build`, `lint`, `typecheck`, `format`, `clean`, `prepare`, `verify` | N/A (Root)         | ⚠️ Missing ESLint TS parser deps & ignored paths in `.gitignore`                |
| **Backend API**        | `apps/backend`        | `@edutrack/api`        | `build`, `typecheck`, `lint`, `dev`, `test`                                 | `.eslintrc.js`     | ⚠️ ESLint parser error on `.ts` files                                           |
| **Web Application**    | `apps/web_app`        | `@edutrack/web`        | `dev`, `build`, `typecheck`, `lint`, `preview`                              | `.eslintrc.js`     | ❌ Incompatible: `"type": "module"` with `.eslintrc.js` (needs `.eslintrc.cjs`) |
| **Mobile Application** | `apps/mobile_app`     | `@edutrack/mobile`     | `start`, `typecheck`, `lint`, `format`                                      | `.eslintrc.js`     | ⚠️ Needs `build` script for Turbo normalization                                 |
| **Shared Config**      | `packages/config`     | `@edutrack/config`     | None                                                                        | N/A                | ⚠️ Missing `./prettier` and `./typescript/*` in package exports                 |
| **Shared Types**       | `packages/types`      | `@edutrack/types`      | `typecheck`                                                                 | None               | ⚠️ Missing `build`, `lint` scripts & explicit exports object                    |
| **Shared UI**          | `packages/ui`         | `@edutrack/ui`         | `typecheck`                                                                 | None               | ⚠️ Missing `build`, `lint` scripts & explicit exports object                    |
| **Shared Validation**  | `packages/validation` | `@edutrack/validation` | `typecheck`                                                                 | None               | ⚠️ Missing `build`, `lint` scripts & explicit exports object                    |

---

## 3. Detailed Component Audits

### 3.1 `pnpm-workspace.yaml`

- **Current State:**
  ```yaml
  packages:
    - 'apps/*'
    - 'packages/*'
  ```
- **Audit Result:** ✅ Healthy. Correctly references all existing app and package directories. No orphan or duplicate packages.

### 3.2 ESLint Configurations

- **Root / Shared Config:**
  - `packages/config/eslint/base.js` uses `eslint:recommended` without `@typescript-eslint/parser` or `ignorePatterns`.
- **`apps/web_app`:**
  - `package.json` specifies `"type": "module"`.
  - Config is currently `.eslintrc.js`, causing Node CommonJS import error (`ReferenceError: module is not defined`). Must be `.eslintrc.cjs`.

### 3.3 TypeScript Hierarchy & Package Exports

- **Exports:**
  - `packages/types`, `packages/ui`, `packages/validation` use string `"exports": { ".": "./src/index.ts" }`. Should be updated to include `types`, `import`, `require`, and `default`.
  - `packages/config/package.json` needs clean export mappings for `@edutrack/config/prettier` and `@edutrack/config/typescript/*`.
- **`packages/database` Audit:**
  - Checked `packages/database` -> **Does NOT exist**.
  - Checked codebase for `@edutrack/database` imports -> **0 occurrences found**.
  - **Verdict:** Creation is **NOT REQUIRED**.

### 3.4 Package Dependencies Audit

- Checked `apps/mobile_app` for `@edutrack/ui` imports -> **0 occurrences found**.
- **Verdict:** Adding `@edutrack/ui` to `@edutrack/mobile` is **NOT REQUIRED**.

### 3.5 Git Hooks & Lint-Staged

- `.husky/pre-commit`: Contains `pnpm exec lint-staged`.
- `.husky/commit-msg`: ❌ **Missing**. Must be created with `pnpm exec commitlint --edit "$1"`.
- `lint-staged`: Only runs `prettier --write`. Needs `eslint --fix` for TS/JS files.

### 3.6 `.gitignore`

- Currently only ignores `node_modules`. Missing `dist`, `build`, `coverage`, `.turbo`, `.next`, `.expo`, `expo-env.d.ts`, `.env*`, `*.log`.

---

## 4. Proposed Modification Plan & Classification

| #   | File / Target                         | Proposed Modification                                                                                              | Classification   | Justification                                                            |
| :-- | :------------------------------------ | :----------------------------------------------------------------------------------------------------------------- | :--------------- | :----------------------------------------------------------------------- |
| 1   | `apps/web_app/.eslintrc.js`           | Rename to `.eslintrc.cjs`                                                                                          | **SAFE**         | Fixes ESM loader error for `.eslintrc.js` in `"type": "module"` package. |
| 2   | Root `package.json`                   | Add `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `eslint-config-prettier` to `devDependencies` | **SAFE**         | Enables TypeScript ESLint parsing across workspaces.                     |
| 3   | `packages/config/eslint/base.js`      | Add `@typescript-eslint/parser`, `@typescript-eslint` plugin, and `ignorePatterns` for `dist/`, `.turbo/`, etc.    | **SAFE**         | Enables `.ts`/`.tsx` linting and ignores compiled output files.          |
| 4   | `packages/config/package.json`        | Add `./prettier` and `./typescript/*` to `exports`                                                                 | **SAFE**         | Satisfies Phase 3 export requirement.                                    |
| 5   | `packages/config/prettier/index.json` | Create shared Prettier configuration                                                                               | **SAFE**         | Provides `@edutrack/config/prettier` target.                             |
| 6   | `packages/types/package.json`         | Update `exports` map, add `build`, `lint` scripts                                                                  | **SAFE**         | Standardizes package exports and Turbo scripts.                          |
| 7   | `packages/ui/package.json`            | Update `exports` map, add `build`, `lint` scripts                                                                  | **SAFE**         | Standardizes package exports and Turbo scripts.                          |
| 8   | `packages/validation/package.json`    | Update `exports` map, add `build`, `lint` scripts                                                                  | **SAFE**         | Standardizes package exports and Turbo scripts.                          |
| 9   | `packages/config/tsconfig/base.json`  | Add `baseUrl: "."` and `paths` mapping for `@edutrack/*`                                                           | **SAFE**         | Universal fallback for TypeScript path resolution.                       |
| 10  | `.husky/commit-msg`                   | Create file with `pnpm exec commitlint --edit "$1"`                                                                | **SAFE**         | Restores commitlint verification on git commit.                          |
| 11  | Root `package.json` (lint-staged)     | Add `eslint --fix` for `*.{js,jsx,ts,tsx}`                                                                         | **SAFE**         | Auto-fixes staged lint errors before commit.                             |
| 12  | Root `.gitignore`                     | Add `dist`, `build`, `coverage`, `.turbo`, `.next`, `.expo`, `expo-env.d.ts`, `.env*`, `*.log`                     | **SAFE**         | Prevents tracking build outputs & logs.                                  |
| 13  | `apps/mobile_app/package.json`        | Add `"build": "tsc --noEmit"` script                                                                               | **SAFE**         | Normalizes Turbo pipeline script interface.                              |
| 14  | `packages/database`                   | Do NOT create                                                                                                      | **NOT REQUIRED** | Verified missing and unreferenced in codebase.                           |
| 15  | `@edutrack/ui` in mobile              | Do NOT add dependency                                                                                              | **NOT REQUIRED** | Verified unimported in mobile app.                                       |
