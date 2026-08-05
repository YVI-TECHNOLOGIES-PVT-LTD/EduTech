# EduTrack ERP — Local Development Workflow (`DEVELOPMENT.md`)

**Generated Date:** August 5, 2026  
**Source of Truth:** Workspace development setup for EduTrack ERP.

---

## 1. Prerequisites

- **Node.js:** `>=20.x`
- **pnpm:** `9.15.4` (`npm install -g pnpm@9.15.4`)
- **Docker Desktop:** Required for local PostgreSQL containerization.

---

## 2. Quick Start Setup

```bash
# 1. Install all monorepo dependencies
pnpm install

# 2. Configure environment variables for backend, web, and mobile
cp apps/backend/.env.example apps/backend/.env
cp apps/web_app/.env.example apps/web_app/.env
cp apps/mobile_app/.env.example apps/mobile_app/.env

# 3. Launch all development servers concurrently
pnpm run dev
```

---

## 3. Workspace Scripts Reference

- `pnpm run dev:api`: Run Express REST API dev server (`apps/backend`).
- `pnpm run dev:web`: Run React Vite SPA web app (`apps/web_app`).
- `pnpm run dev:mobile`: Run Expo mobile Metro bundler (`apps/mobile_app`).
- `pnpm run verify`: Execute workspace quality gate check (`lint`, `typecheck`, `build`).
