# EduTrack ERP — Stage 3 Phase 2: Prisma Client Synchronization Report (WS1)

> **Workstream:** WS1 — Prisma Client Synchronization & Schema Parity Verification  
> **Schema Freeze Status:** **ENFORCED** (`apps/backend/prisma/schema.prisma` unmodified; SHA-256 `73d98492b3a7f2cbfd9348de94a0373ef530be966d6d00c3a4008bc0974d6c39`, `445,174` bytes)  
> **Verification Status:** **BLOCKED AT DMMF REGENERATION BY FROZEN SCHEMA `P1012` ERRORS (EXPLICITLY DOCUMENTED); RUNTIME PROTECTED BY FAIL-FAST `PersistenceError`**

---

## 1. Executive Summary

Stage 3 Phase 1 identified a structural gap between the generated `@prisma/client` DMMF (`109` models, `78` enums) and the live frozen PostgreSQL database + frozen [`apps/backend/prisma/schema.prisma`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/prisma/schema.prisma) (`148` tables/models, `92` enums).

Under Stage 3 Phase 2 governance, `apps/backend/prisma/schema.prisma` is **strictly frozen** (zero edits, zero migrations, zero `db push` / `db pull`). Executing Prisma schema validation (`npx prisma validate`) against the frozen file surfaces **3 pre-existing `P1012` relation errors** (`Prisma CLI Version : 5.22.0`) inside Stage 3 model definitions, which prevent `prisma generate` from emitting an updated `@prisma/client` DMMF until an authorized schema/DBA maintenance window resolves those 3 relations.

---

## 2. Observed Workspace & Generator Configuration

- **Package Version:** `@prisma/client@^5.22.0` declared in [`apps/backend/package.json`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/package.json#L27), single workspace Prisma installation.
- **Generator & Datasource ([`schema.prisma`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/prisma/schema.prisma#L1-L11)):**
  - `provider = "prisma-client-js"`
  - `previewFeatures = ["multiSchema"]`
  - `datasource db`: PostgreSQL (`env("DATABASE_URL")`, `directUrl = env("DIRECT_URL")`, `schemas = ["public"]`).

---

## 3. Parity Matrix (Observed After Final Phase 2 Edits)

| Layer                                                                                                          |          Models / Tables          |           Enums            | Status                                                                                                       |
| :------------------------------------------------------------------------------------------------------------- | :-------------------------------: | :------------------------: | :----------------------------------------------------------------------------------------------------------- |
| **Live PostgreSQL Catalog (`public` schema)**                                                                  |         `148` base tables         | `92` `typtype = 'e'` enums | **Verified Live**                                                                                            |
| **Frozen [`schema.prisma`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/prisma/schema.prisma)** | `148` models _(+`7` views in DB)_ |         `92` enums         | **Unmodified** (`445,174` bytes; SHA-256 `73d98492b3a7f2cbfd9348de94a0373ef530be966d6d00c3a4008bc0974d6c39`) |
| **Generated `@prisma/client` (`Prisma.dmmf.datamodel`)**                                                       |           `109` models            |         `78` enums         | **Stage 1/2 + Timetable synced; `39` Stage 3 models unmapped**                                               |

---

## 4. Exact `P1012` Blocker Output (`npx prisma validate`)

Running `cd apps/backend && npx prisma validate` fails with **`Validation Error Count: 3`** (`Error code: P1012`) because three Stage 3 composite foreign keys define one-to-one Prisma `@relation` fields without a matching `@@unique(...)` constraint on the defining side (or one-to-many relation multiplicity):

1. [`schema.prisma` Line 3455](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/prisma/schema.prisma#L3454-L3456) — `assessment_attendance_records.assessment_students`:
   - `@relation(fields: [assessment_student_id, assessment_id], references: [assessment_student_id, assessment_id], onDelete: Cascade, onUpdate: NoAction, map: "fk_assessment_attendance_roster")`
2. [`schema.prisma` Line 3651](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/prisma/schema.prisma#L3650-L3652) — `assessment_results.assessment_students`:
   - `@relation(fields: [assessment_student_id, assessment_id], references: [assessment_student_id, assessment_id], onDelete: Cascade, onUpdate: NoAction, map: "fk_assessment_results_roster")`
3. [`schema.prisma` Line 3967](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/prisma/schema.prisma#L3966-L3968) — `intervention_plans.student_learning_gaps`:
   - `@relation(fields: [learning_gap_id, org_id], references: [learning_gap_id, org_id], onUpdate: NoAction, map: "fk_intervention_plans_learning_gap_org")`

_(Plus non-fatal warning on `onDelete: SetNull` with required fields.)_

---

## 5. Mitigation & Interim Safe Access Strategy

Because `schema.prisma` cannot be modified during Phase 2:

1. **Zero Silent Degradation (WS2):** [`apps/backend/src/lib/prismaClient.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/lib/prismaClient.ts#L13-L32) wraps the singleton `PrismaClient` in `wrapPrismaWithStrictPersistence()`. Calling any unmapped Stage 3 Prisma model delegate (e.g., `prisma.classroom_sessions.findMany()`) now throws a typed [`PersistenceError`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/lib/prismaClient.ts#L13-L32) (`code: 'PRISMA_DELEGATE_UNAVAILABLE'`, `statusCode: 500`) instead of silently diverting writes into volatile RAM Maps.
2. **Backend Typecheck & Runtime Parity:**
   - All `109` generated models/delegates used by Stage 1, Stage 2, Finance, Admissions, Academic Management, Communication, Notifications, and Parent Portal resolve directly to `@prisma/client` and execute cleanly against PostgreSQL (`cd apps/backend && npx tsc --noEmit` exits `0`).
   - Verified in [`stage3-phase2-hardening.spec.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/tests/stage3-phase2-hardening.spec.ts): unmapped Stage 3 delegates fail fast with `PersistenceError`, while generated financial & academic delegates execute directly against PostgreSQL.
3. **DBA / Pre-Stage-3-Implementation Change Request:**
   - Authorize adding the three missing composite `@@unique` / relation fixes in `schema.prisma` (matching PostgreSQL's `1:1` unique constraints `assessment_attendance_records(assessment_student_id, assessment_id)`, `assessment_results(assessment_student_id, assessment_id)`, and `intervention_plans(learning_gap_id, org_id)`), then re-run `cd apps/backend && npx prisma generate` before building Prisma-delegate repositories for Stage 3 tables—or use explicit parameterized SQL (`prisma.$queryRawUnsafe` / `$executeRawUnsafe`) via repository helpers per Phase 1 guidance while DMMF remains unregenerated.
