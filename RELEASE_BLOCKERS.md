# EduTrack ERP — Release Blockers Audit

## 1. Overview

This document logs the exact release blockers captured during initial command execution (`pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm verify`).

---

## 2. Identified Release Blockers

### Blocker 1: Missing `@edutrack/config` Workspace Symlinks in `node_modules`

- **File:** `apps/backend/package.json`, `apps/web_app/package.json`, `apps/mobile_app/package.json`, `packages/types/package.json`, `packages/ui/package.json`, `packages/validation/package.json`.
- **Exact Compiler Error Message:** `ESLint couldn't find the config "@edutrack/config/eslint/node"`.
- **Root Cause:** `"@edutrack/config": "workspace:*"` was added to `devDependencies`, but `pnpm install` was not run after editing `package.json` files to create symlinks in workspace `node_modules/@edutrack/config`.
- **Risk:** High (blocks `pnpm lint` and `pnpm verify`).
- **Safe Fix:** Run `pnpm install` to regenerate pnpm workspace symlinks across all 8 projects.

---

### Blocker 2: Web App ESM ESLint Config Reference

- **File:** `apps/web_app/.eslintrc.js`.
- **Exact Compiler Error Message:** `ReferenceError: module is not defined in ES module scope` / `Unexpected top-level property "__esModule"`.
- **Root Cause:** `apps/web_app` has `"type": "module"`. Using `export default` in `.eslintrc.js` generates top-level `__esModule` property, while using `module.exports` throws `ReferenceError` in ESM scope.
- **Risk:** High (blocks `apps/web_app#lint`).
- **Safe Fix:** Use standard `.eslintrc.cjs` with `module.exports = { extends: ['@edutrack/config/eslint/react'] }` in `apps/web_app`.
