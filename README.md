# EduTrack ERP — Enterprise SaaS School Management System

Welcome to the **EduTrack ERP** repository. EduTrack is an enterprise-grade multi-tenant School Management System built as a modern TypeScript monorepo.

---

## 🏛️ Architecture Overview

The EduTrack repository is organized as a single monorepo managed via `pnpm` workspaces and `Turborepo`:

```
                                  +-------------------+
                                  | edutrack-monorepo |
                                  +---------+---------+
                                            |
         +----------------------------------+----------------------------------+
         |                                  |                                  |
  +------v------+                    +------v------+                    +------v------+
  |apps/backend |                    |apps/web_app |                    |apps/mobile  |
  |@edutrack/api|                    |@edutrack/web|                    |@edutrack/mb |
  |Express REST |                    |React 18 SPA |                    |Expo 51 Mobile|
  +------+------+                    +------+------+                    +------+------+
         |                                  |                                  |
         +------------------+---------------+------------------+---------------+
                            |                                  |
                    +-------v-------+                  +-------v-------+
                    |@edutrack/types|                  |@edutrack/valid|
                    +---------------+                  +---------------+
                            |                                  |
                    +-------v-------+                  +-------v-------+
                    |  @edutrack/ui |                  |@edutrack/cnfg |
                    +---------------+                  +---------------+
```

---

## 🛠️ Technology Stack

- **Monorepo Manager:** `pnpm@9.15.4` + `turbo^2.3.4`
- **Language Runtime:** Node.js `>=20.x` with TypeScript `^5.3.2`
- **Backend API:** Express.js `4.22` + Prisma ORM `5.22` + Supabase Auth
- **Database:** PostgreSQL 3NF Schema (26 normalized tables)
- **Web Frontend:** React `18.2` + Vite `5.0` + Radix UI + Tailwind CSS + TanStack Query + Zustand
- **Mobile Platform:** Expo SDK `51.0` + React Native `0.74` + Expo Router `3.5` + NativeWind

---

## 📚 Documentation Portal

Comprehensive architecture and governance documents are available in the repository:

- 📐 **[Architecture Portal](file:///c:/Program%20Files/EduTech/ARCHITECTURE.md)** (`docs/architecture/`, `backend/`, `frontend/`, `mobile/`, `database/`, `security/`)
- 📑 **[Architecture Decision Records (ADRs)](file:///c:/Program%20Files/EduTech/docs/adr/)** (ADR 0001 - 0006)
- 📜 **[Coding & Git Standards](file:///c:/Program%20Files/EduTech/CODING_STANDARDS.md)** (`docs/standards/`, `docs/git/`)
- 📊 **[Technology Stack Matrix](file:///c:/Program%20Files/EduTech/TECH_STACK.md)**
- 📋 **[Workspace Inventories](file:///c:/Program%20Files/EduTech/PROJECT_STRUCTURE.md)** ([API](file:///c:/Program%20Files/EduTech/docs/API_INVENTORY.md), [Database](file:///c:/Program%20Files/EduTech/docs/DATABASE_INVENTORY.md), [Packages](file:///c:/Program%20Files/EduTech/docs/PACKAGE_INVENTORY.md), [Scripts](file:///c:/Program%20Files/EduTech/docs/SCRIPT_INVENTORY.md), [Repository](file:///c:/Program%20Files/EduTech/docs/REPOSITORY_INVENTORY.md))
- ✅ **[Phase-0 Sign-Off Checklist](file:///c:/Program%20Files/EduTech/PHASE_CHECKLIST.md)** and **[Audit Report](file:///c:/Program%20Files/EduTech/docs/PHASE_0_AUDIT_REPORT.md)**

---

## 🚀 Quick Start Guide

```bash
# 1. Install workspace dependencies
pnpm install

# 2. Configure environment files (copy the templates; do not commit the copies)
cp apps/backend/.env.example apps/backend/.env
cp apps/web_app/.env.example apps/web_app/.env
cp apps/mobile_app/.env.example apps/mobile_app/.env

# 3. Start development servers
pnpm run dev
```

## Docker

`apps/mobile_app` is not part of the stack. Postgres, the API, and the web app are. Host ports bind to `127.0.0.1`. Details are in [`docs/docker/CONTAINER_ARCHITECTURE.md`](docs/docker/CONTAINER_ARCHITECTURE.md).

```bash
# Start Postgres, the API, and the web app. The API applies the Prisma schema on boot.
docker compose up --build -d

# Logs
docker compose logs -f backend web postgres

# Schema sync one-off (also runs automatically on backend startup)
docker compose run --rm backend ./node_modules/.bin/prisma db push --schema=prisma/schema.prisma --skip-generate --accept-data-loss

# There is no seed script.

# Stop, and drop the database volume
docker compose down
docker compose down -v
```

- Login page: `http://127.0.0.1:8080/login`
- API liveness: `http://127.0.0.1:3000/health/live`

Optional overrides live in [`.env.docker.example`](.env.docker.example). Copy that file to `.env.docker` (gitignored) and run `docker compose --env-file .env.docker up --build -d`.

---

## 🧪 Quality Gate Verification

To run full codebase verification (linting, typechecking, and build validation):

```bash
pnpm run verify
```
