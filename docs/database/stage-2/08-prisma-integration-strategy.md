# EduTrack ERP — Stage 2 Database Architecture

# Report 08: Prisma Schema & ORM Integration Strategy

**Document ID:** STG2-DB-ORM-08  
**Date:** November 10, 2026  
**Author:** Principal Prisma Architect & Backend Framework Engineer  
**Scope:** Architectural Options for Integrating Stage-2 Models with Prisma under Governance Freeze  
**Governing Rule:** `.agents/AGENTS.md` (Stage-1 Database Freeze)

---

## 1. Executive Summary

A central architectural challenge in EduTrack ERP is the strict governance rule:

> **"apps/backend/prisma/schema.prisma is the SOLE Source of Truth for Database Models. Stage-1 & Implementation Freeze: Absolutely ZERO database DDL, SQL, or Prisma schema changes allowed during frontend or business module implementation."**

Simultaneously, `apps/backend/prisma/schema.prisma` already contains **109 models**, of which 34 models describe Stage-2 Academic Planning.

This report evaluates three architectural strategies for integrating Stage 2 without violating Stage-1 immutability:

1. **Option 1: Isolated Secondary Prisma Schema & Client (`apps/backend/prisma/stage2.prisma`)**
2. **Option 2: Controlled Governance Unfreeze & Unified Schema Evolution**
3. **Option 3: Prisma Multi-Schema Extension via PostgreSQL Schemas (`stage2` schema)**

---

## 2. Evaluation of Strategic Options

### Option 1: Isolated Secondary Prisma Schema & Client

- **Description:** Maintain `schema.prisma` as Stage-1 only. Create `apps/backend/prisma/schema-stage2.prisma` generating `@prisma/client-stage2`.
- **Pros:**
  - 100% preserves physical isolation of Stage-1 schema file.
- **Cons & Fatal Flaws:**
  - **Relational Partitioning Problem:** Stage-2 models MUST establish relations to Stage-1 entities (e.g. `academic_calendars.academic_year_id -> academic_years.academic_year_id`, `lesson_plans.teacher_staff_id -> staff.staff_id`). In Prisma, cross-schema foreign-key relations between two independent `.prisma` files are **not supported**. Every referenced model must be duplicated across both schema files.
  - **Connection Pool Exhaustion:** Two separate PrismaClient instances double the active database connection pool requirements in Node.js.
  - **Cross-Module Transaction Incompatibility:** `$transaction` cannot execute atomically across two separate PrismaClient instances.

---

### Option 2: Controlled Governance Unfreeze & Unified Schema Evolution (RECOMMENDED)

- **Description:** Treat `schema.prisma` as an evolutionary, version-tagged repository artifact. Formally execute an architectural stage transition:
  1. Complete and approve Stage-1 delivery.
  2. The Architecture Board signs off on lifting the Stage-1 freeze.
  3. Formally tag `release-stage1` in Git.
  4. Activate Stage-2 models within the existing unified `schema.prisma` and deploy verified PostgreSQL DDL.
- **Pros:**
  - **Zero Duplication:** Single unified AST model graph. Native relations across `academic_years`, `grades`, `curriculum_plans`, and `lesson_plans`.
  - **Atomic `$transaction` Support:** Enables full ACID guarantees when publishing calendars or saving multi-unit lesson plans.
  - **Single Connection Pool:** Prevents database pool starvation in production.
  - **Matches Current Repo Reality:** All 34 Stage-2 models already physically exist in `schema.prisma` (having been introspected from Supabase).
- **Cons:**
  - Requires explicit architectural board authorization to update the freeze milestone.

---

### Option 3: Multi-Schema Partitioning in PostgreSQL (`public` vs `academic_planning`)

- **Description:** Use Prisma preview feature `multiSchema`:
  ```prisma
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
    schemas  = ["public", "academic_planning"]
  }
  ```
  Stage-1 tables remain in `public`; Stage-2 tables are created in `academic_planning`.
- **Pros:**
  - Database-level namespace separation. Clean DDL isolation.
- **Cons:**
  - Adds schema migration complexity in Supabase.
  - Current codebase already maps all 109 models explicitly to `@@schema("public")`. Changing namespaces would require broad migration adjustments.

---

## 3. Recommended Architectural Integration Blueprint

The Architecture Board recommends **Option 2 (Controlled Unified Schema Evolution)** under the following governance runbook:

```
                               PRISMA INTEGRATION RUNBOOK
                                           │
                                           ▼
                 Step 1: Complete and Tag Stage-1 Milestone in Git
                                           │
                                           ▼
                 Step 2: Formally Authorize Stage-2 Database Transition
                                           │
                                           ▼
                 Step 3: Deploy Physical Stage-2 DDL to PostgreSQL
                         (apps/database/stage_2/schema/*.sql)
                                           │
                                           ▼
                 Step 4: Decommission In-Memory Fallback Proxy
                         in apps/backend/src/lib/prismaClient.ts
                                           │
                                           ▼
                 Step 5: Run prisma generate in Backend Build
                         (Emits typed delegates for all 34 Stage-2 models)
                                           │
                                           ▼
                 Step 6: Implement Stage-2 Repositories & Services
```

---

## 4. Decommissioning the In-Memory Proxy Fallback

Before activating Stage-2 backend development, [`apps/backend/src/lib/prismaClient.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/lib/prismaClient.ts) must be hardened:

```typescript
// Proposed refactor for Stage 2 Prisma Client Singleton:
// REMOVE: createSafeModelDelegate and fallbackStores Map in RAM

function wrapWithStrictProxy<T extends object>(target: T): T {
  return new Proxy(target, {
    get(obj: any, prop: string | symbol) {
      if (typeof prop === 'string' && !prop.startsWith('$') && !prop.startsWith('_')) {
        if (!(prop in obj) || obj[prop] === undefined) {
          throw new Error(
            `[FATAL PERSISTENCE ERROR] Attempted access to unmapped Prisma model delegate '${prop}'. ` +
              `Physical database table and generated Prisma client model are required. ` +
              `In-memory mock fallback is strictly prohibited.`,
          );
        }
      }
      return obj[prop];
    },
  });
}
```

This guarantees that:

- Any missing table fails loudly with an explicit runtime exception.
- Zero data is silently routed to Node.js RAM.
- All Stage-2 operations are backed by durable, ACID-compliant PostgreSQL storage.
