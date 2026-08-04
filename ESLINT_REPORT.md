# EduTrack ERP — ESLint Infrastructure Report

## 1. Overview

This report documents the resolution of ESLint configuration issues, module resolution strategy, and parser setup across all monorepo workspaces.

---

## 2. ESM Module Resolution Fix (`apps/web_app`)

- **Problem:** `apps/web_app/package.json` specifies `"type": "module"`. When ESLint loaded `.eslintrc.js` with `module.exports`, Node threw `ReferenceError: module is not defined in ES module scope`.
- **Resolution:**
  - Configured `apps/web_app/.eslintrc.cjs` using CommonJS `module.exports`.
  - Configured `apps/web_app/.eslintrc.js` using ES Module `import`/`export default` syntax to re-export `.eslintrc.cjs`.
  - Both file formats now resolve cleanly without module loader errors.

---

## 3. Shared ESLint Configuration (`packages/config/eslint/base.js`)

- **Problem:** `eslint:recommended` failed to parse TypeScript syntax (`interface`, `type`, type annotations) on `.ts`/`.tsx` files across `@edutrack/api` and packages.
- **Resolution:**
  - Integrated `@typescript-eslint/parser` as the primary parser.
  - Added `@typescript-eslint` plugin and turned off core `no-undef` (TypeScript compiler handles type safety natively).
  - Configured `ignorePatterns` for build outputs: `['dist', 'build', '.turbo', 'coverage', 'node_modules', 'public', '.expo']`.

---

## 4. Workspaces & ESLint Inheritance

| Workspace         | ESLint File                      | Extends Config Target                  | Parser                      |
| :---------------- | :------------------------------- | :------------------------------------- | :-------------------------- |
| `apps/backend`    | `.eslintrc.js`                   | `@edutrack/config/eslint/node`         | `@typescript-eslint/parser` |
| `apps/web_app`    | `.eslintrc.cjs` & `.eslintrc.js` | `@edutrack/config/eslint/react`        | `@typescript-eslint/parser` |
| `apps/mobile_app` | `.eslintrc.js`                   | `@edutrack/config/eslint/react-native` | `@typescript-eslint/parser` |
| Root              | Inherited                        | `@edutrack/config/eslint/base`         | `@typescript-eslint/parser` |
