# EduTrack ERP — Workspace Script Inventory Ledger

**Generated Date:** August 5, 2026  
**Source of Truth:** Physical code parsing of root and workspace `package.json` manifests.

---

## 1. Root Workspace Orchestration Scripts ([`package.json`](file:///c:/Program%20Files/EduTech/package.json))

| Command Name              | Exact Executable Command                                       | Target Orchestrator | Functional Purpose                                    |
| :------------------------ | :------------------------------------------------------------- | :------------------ | :---------------------------------------------------- |
| `pnpm run dev`            | `turbo run dev`                                                | Turbo               | Launch all workspace dev servers concurrently         |
| `pnpm run dev:api`        | `pnpm --filter @edutrack/api run dev`                          | pnpm filter         | Launch backend API dev server only                    |
| `pnpm run dev:web`        | `pnpm --filter @edutrack/web run dev`                          | pnpm filter         | Launch React web app dev server only                  |
| `pnpm run dev:mobile`     | `pnpm --filter @edutrack/mobile run start`                     | pnpm filter         | Launch Expo mobile dev server only                    |
| `pnpm run build`          | `turbo run build`                                              | Turbo               | Build production dist bundles for all apps & packages |
| `pnpm run build:api`      | `pnpm --filter @edutrack/api run build`                        | pnpm filter         | Compile backend TypeScript (`tsc`)                    |
| `pnpm run build:web`      | `pnpm --filter @edutrack/web run build`                        | pnpm filter         | Compile web TypeScript & run Vite build               |
| `pnpm run lint`           | `turbo run lint --force`                                       | Turbo               | Run ESLint across all monorepo apps and packages      |
| `pnpm run typecheck`      | `turbo run typecheck`                                          | Turbo               | Execute TypeScript `--noEmit` checks across monorepo  |
| `pnpm run test`           | `turbo run test`                                               | Turbo               | Run workspace test scripts                            |
| `pnpm run test:api`       | `newman run postman/collections/common.collection.json ...`    | Newman              | Execute Postman common API tests                      |
| `pnpm run test:auth`      | `newman run postman/collections/auth.collection.json ...`      | Newman              | Execute Postman authentication API tests              |
| `pnpm run test:admission` | `newman run postman/collections/admission.collection.json ...` | Newman              | Execute Postman admission API tests                   |
| `pnpm run test:all`       | `newman run ...`                                               | Newman              | Execute complete Postman integration test suite       |
| `pnpm run format`         | `prettier --write .`                                           | Prettier            | Format all repository files using Prettier            |
| `pnpm run format:check`   | `prettier --check .`                                           | Prettier            | Check formatting compliance across codebase           |
| `pnpm run clean`          | `turbo run clean`                                              | Turbo               | Clean build artifacts and dist folders                |
| `pnpm run verify`         | `pnpm run lint && pnpm run typecheck && pnpm run build`        | Custom              | Root CI Quality Gate sign-off verification script     |

---

## 2. App-Specific Scripts Ledger

### Backend API (`apps/backend/package.json`)

- `dev`: `nodemon` — Hot-reload Node API server.
- `build`: `tsc` — Compile TypeScript to `dist/`.
- `typecheck`: `tsc --noEmit` — Type-check backend TypeScript code.
- `lint`: `eslint . --ext .ts` — Lint backend TypeScript files.
- `test`: `echo "[Backend Test Platform] Standard tests passed"` — Dummy placeholder test script.
- `migrate`: `npx ts-node scripts/migration-runner.ts` — Execute database migration script.
- `db:generate`: `prisma generate` — Generate Prisma Client.
- `db:push`: `prisma db push` — Push Prisma schema directly to PostgreSQL database.

### Web Application (`apps/web_app/package.json`)

- `dev`: `vite` — Launch Vite local development server.
- `build`: `tsc && vite build` — Typecheck and build production SPA bundle.
- `typecheck`: `tsc --noEmit` — Typecheck web application code.
- `lint`: `eslint . --ext .ts,.tsx` — Lint web application TypeScript & TSX code.
- `preview`: `vite preview` — Preview production SPA build locally.

### Mobile Application (`apps/mobile_app/package.json`)

- `start`: `expo start` — Launch Expo Metro bundler.
- `android`: `expo run:android` — Build and run Android native app.
- `ios`: `expo run:ios` — Build and run iOS native app.
- `web`: `expo start --web` — Launch Expo web preview.
- `typecheck`: `tsc --noEmit` — Typecheck mobile TypeScript code.
- `lint`: `eslint . --ext .js,.jsx,.ts,.tsx` — Lint mobile codebase.
