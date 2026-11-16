# Auth System Architecture Discovery Report

**Audit Target**: `apps/backend` (`Express` + `Supabase/Prisma` + `Node.js`)  
**Audit Scope**: Read-Only Architecture Discovery  
**Output Path**: `/audit/auth/AUTH_SYSTEM_DISCOVERY.md`

---

## 1. Architectural Stack Overview

- **Framework**: Express.js Monorepo API Gateway (`apps/backend/src/app.ts`).
- **Route Gateway**: Central router in `apps/backend/src/routes.ts`.
- **Database Layer**: PostgreSQL managed via Prisma ORM (`prisma/schema.prisma`) & Supabase JS Client (`src/config/supabase.ts`).
- **Session & Token Management**: Custom session table tracking (`user_sessions`) via `sessionService` (`src/auth/session.service.ts`).
- **Authentication Guard**: `authenticate` middleware (`src/auth/auth.middleware.ts`).
- **Authorization & RBAC**: `checkPermission` guard (`src/rbac/rbac.middleware.ts`) enforcing `PERMISSIONS` dictionary (`src/rbac/permissions.ts`).

---

## 2. Directory Structure & Key Files

```text
apps/backend/src/
├── app.ts                         # Express setup, CORS, Helmet, rate limiting, error middleware
├── server.ts                      # HTTP listener, RBAC self-healing seeder, worker runtime
├── routes.ts                      # Central route registrations & global middleware mounts
├── auth/
│   ├── auth.middleware.ts         # `authenticate`, `authenticateOptional`, `checkLoginApproval`
│   └── session.service.ts         # Session validation & Supabase auth queries
├── rbac/
│   ├── rbac.middleware.ts         # `checkPermission` guard
│   ├── permissions.ts             # System permission string constants
│   └── rbac.service.ts            # RBAC role & permission queries
└── modules/
    ├── user-management/           # User accounts & role assignments
    └── admission/                 # Public registration & parent auth user onboarding
```
