# EduTrack ERP — Final Database Forensic Audit Report

**Document ID:** AUDIT-EDUTRACK-DB-2026-FINAL  
**Audit Date:** November 10, 2026  
**Auditor:** Senior PostgreSQL Database Architect, Prisma Specialist, Database Security Auditor & ERP Data-Integrity Engineer  
**Audit Scope:** Finalized Stage-1 SQL DDL Suite, Prisma Schema, Migration History, Backend Data Access Contract, Multi-Tenant Security, Relational Integrity, and Stage 2 Compatibility  
**Governing Rule:** `.agents/AGENTS.md` (Stage-1 Database & Implementation Freeze — STRICT READ-ONLY AUDIT)

---

## 1. Executive Summary & Audit Dashboard

This forensic audit represents an exhaustive, evidence-based investigation into the finalized database implementation of the EduTrack ERP platform. The audit was conducted strictly under read-only constraints, without modifying any SQL file, Prisma model, migration script, or application source file.

### Audit Summary Dashboard

| Metric                                    |    Verified Value    | Status / Diagnostic Note                                                   |
| :---------------------------------------- | :------------------: | :------------------------------------------------------------------------- |
| **Total SQL Tables Verified**             |        **33**        | 30 in `04_tables.sql`, 2 in `10_alterations.sql`, 1 in `11_vector.sql`     |
| **Total Prisma Models Verified**          |       **109**        | All 33 SQL tables mapped; 76 additional models for Stages 2–4              |
| **Total SQL Enums Verified**              |        **37**        | 36 distinct types + 1 duplicate declaration (`notification_category`)      |
| **Total Prisma Enums Verified**           |        **78**        | 37 Stage-1 common enums + 41 additional multi-stage enums                  |
| **Total Foreign Keys Audited**            |       **101**        | Across all Stage-1 entities                                                |
| **Total Database Indexes Audited**        |        **68**        | 65 in `06_indexes.sql`, 2 in alterations, 1 in vector                      |
| **Total Triggers Audited**                |        **25**        | Attached to `set_updated_at()`; 1 syntax blocker in script                 |
| **Total Functions Audited**               |        **1**         | `set_updated_at()` PL/pgSQL function                                       |
| **Total Views Audited**                   |        **1**         | `chatbot_transcripts` view                                                 |
| **Total RLS Policies Audited**            |        **2**         | Declared on `chatbot_sessions` & `chatbot_messages`                        |
| **Confirmed Critical Defects**            |        **2**         | Inoperative RLS; Silent RAM mock fallback in Prisma client                 |
| **Confirmed High-Severity Defects**       |        **9**         | DDL syntax errors, missing columns, missing enums, cascade deletes         |
| **Medium-Severity Findings**              |        **7**         | Relational mismatches, unindexed foreign keys, race conditions             |
| **Low-Severity / Informational Findings** |        **5**         | Redundant indexes, duplicate enums, naming inconsistencies                 |
| **Stage 2 Academic Planning Feasibility** |     **BLOCKED**      | 5 of 6 requirements unsupported by frozen Stage-1 SQL suite                |
| **Live Database Verification Status**     |     **PENDING**      | Credentials use superuser (`postgres`); read-only connection rule enforced |
| **Source Modification Certification**     | **0 Files Modified** | Verified zero writes to application or database files                      |

---

## 2. Master Finding Registry

### CRITICAL FINDINGS (Immediate Security / Data Loss Risks)

---

#### FIND-SEC-01: Inoperative Database Row-Level Security Architecture

- **Severity:** `CRITICAL`
- **Component / Location:** [`apps/database/stage_1/schema/08_rls.sql:1-15`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/08_rls.sql#L1-L15) & `apps/backend/src/lib/prismaClient.ts`
- **Evidence:** RLS policies rely on `current_setting('app.current_org_id', true)::UUID`. A full codebase search confirms the backend never sets `app.current_org_id`. Furthermore, the backend connects using the PostgreSQL superuser (`postgres.blvseyhzsehfwdmevtyp`), unconditionally bypassing RLS in PostgreSQL.
- **Expected Behavior:** True database-level multi-tenancy requiring an unprivileged database role with strict per-connection tenant context injection.
- **Actual Behavior:** PostgreSQL RLS is 100% inoperative. Multi-tenant isolation relies entirely on application-level `where: { org_id }` filtering.
- **Security Impact:** Severe. Any un-scoped query or SQL injection flaw exposes cross-tenant data.
- **Status:** `CONFIRMED`.
- **Recommended Action:** Formally document that EduTrack operates under **Application-Enforced Multi-Tenancy**. Plan unprivileged database role architecture for Stage 2.
- **Explicit Database Approval Required:** YES.

---

#### FIND-APP-01: Silent In-Memory Mock Fallback in Production Prisma Client Singleton

- **Severity:** `CRITICAL`
- **Component / Location:** [`apps/backend/src/lib/prismaClient.ts:85-245`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/lib/prismaClient.ts#L85-L245)
- **Evidence:** `apps/backend/src/lib/prismaClient.ts` wraps the Prisma client in a JavaScript `Proxy`. Any access to a model delegate not physically compiled into `@prisma/client` routes CRUD operations to `fallbackStores = new Map<string, Map<string, any>>()`.
- **Expected Behavior:** Unmapped model delegates must throw a hard runtime error to alert developers and fail fast.
- **Actual Behavior:** Unmapped models silently store records in volatile Node.js RAM.
- **Business Impact:** Catastrophic silent data loss. Any record created on an unmapped model is permanently deleted whenever the server restarts.
- **Status:** `CONFIRMED`.
- **Recommended Action:** Refactor `wrapWithFallbackProxy` to fail closed with a hard exception on any unmapped model write.
- **Explicit Database Approval Required:** NO (Application code change; defer until implementation unfreeze).

---

### HIGH-SEVERITY FINDINGS (DDL Syntax Blockers & Workflow Blockers)

---

#### FIND-SQL-01: Syntax Defect in `organizations` Table DDL

- **Severity:** `HIGH`
- **Location:** [`apps/database/stage_1/schema/04_tables.sql:40-43`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L40-L43)
- **Evidence:**
  ```sql
  40:     updated_at TIMESTAMPTZ
  41:         NOT NULL DEFAULT now()
  42:
  43:     created_by UUID,
  ```
  Missing comma after `now()`.
- **Impact:** PostgreSQL aborts on table 1 during fresh bootstrap: `ERROR: syntax error at or near "created_by"`.
- **Status:** `CONFIRMED`.
- **Approval Required:** YES (Frozen DDL).

---

#### FIND-SQL-02: Syntax Defect in `student_enrollments` Table DDL

- **Severity:** `HIGH`
- **Location:** [`apps/database/stage_1/schema/04_tables.sql:1283-1284`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L1283-L1284)
- **Evidence:**
  ```sql
  1283:     UNIQUE(student_id, academic_year_grade_id)
  1284:     UNIQUE(section_id, roll_number)
  ```
  Missing comma between two `UNIQUE` constraint clauses.
- **Impact:** PostgreSQL aborts creation of table `student_enrollments`.
- **Status:** `CONFIRMED`.
- **Approval Required:** YES (Frozen DDL).

---

#### FIND-SQL-03: Missing Enum `notification_priority` in SQL DDL Suite

- **Severity:** `HIGH`
- **Location:** [`apps/database/stage_1/schema/04_tables.sql:1296`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L1296) vs [`02_enums.sql`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/02_enums.sql)
- **Evidence:** Table `notifications` declares `priority public.notification_priority NOT NULL DEFAULT 'NORMAL'`, but `notification_priority` is never created in `02_enums.sql`.
- **Impact:** Aborts creation of table `notifications` with `ERROR: type "public.notification_priority" does not exist`.
- **Status:** `CONFIRMED`.
- **Approval Required:** YES (Frozen DDL).

---

#### FIND-SQL-05: Dangling Token `Create` in `07_triggers.sql`

- **Severity:** `HIGH`
- **Location:** [`apps/database/stage_1/schema/07_triggers.sql:194`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/07_triggers.sql#L194)
- **Evidence:** Standalone keyword `Create` on line 194.
- **Impact:** Halts execution of `07_triggers.sql`, preventing attachment of triggers for decisions, payments, students, parents, and enrollments.
- **Status:** `CONFIRMED`.
- **Approval Required:** YES (Frozen DDL).

---

#### FIND-PSC-01: Missing Column `lead_activity_id` on `chatbot_sessions`

- **Severity:** `HIGH`
- **Location:** [`apps/database/stage_1/schema/04_tables.sql:659-683`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L659-L683) vs [`06_indexes.sql:284`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/06_indexes.sql#L284) vs [`schema.prisma:301`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/prisma/schema.prisma#L301)
- **Evidence:** `04_tables.sql` omits `lead_activity_id`. `06_indexes.sql` attempts to index it.
- **Impact:** `06_indexes.sql` fails with `ERROR: column "lead_activity_id" does not exist`.
- **Status:** `CONFIRMED`.
- **Approval Required:** YES (Frozen DDL).

---

#### FIND-REL-01: Destructive Cascade Delete on Academic Year Applications & Payments

- **Severity:** `HIGH`
- **Location:** [`04_tables.sql:764`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L764) & [`04_tables.sql:1106`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L1106)
- **Evidence:** `admissions_applications.academic_year_id` and `admission_fee_payments.application_id` declare `ON DELETE CASCADE`.
- **Impact:** Accidental deletion of an academic year record permanently cascades to destroy all historical student admission applications and fee payment transaction receipts.
- **Status:** `CONFIRMED`.
- **Approval Required:** YES (Frozen DDL).

---

#### FIND-REL-02: Absence of Grade Column on `admissions_applications`

- **Severity:** `HIGH`
- **Location:** [`04_tables.sql:754-796`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L754-L796)
- **Evidence:** `admissions_applications` only references `academic_year_id`. In file 10, `lead_id` was altered to nullable.
- **Impact:** When a parent applies directly (without a prior lead), the database schema physically has no column to store which grade the student is applying for.
- **Status:** `CONFIRMED`.
- **Approval Required:** YES (Frozen DDL).

---

#### FIND-SEC-03: Silent Fallback to Default Organization in Document Controller

- **Severity:** `HIGH`
- **Location:** [`apps/backend/src/modules/admission-management/controllers/admission-document.controller.ts:65-71`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/admission-management/controllers/admission-document.controller.ts#L65-L71)
- **Evidence:**
  ```typescript
  const defaultOrg = await prisma.organizations.findFirst({
    where: { status: 'active' },
    orderBy: { created_at: 'asc' },
    select: { org_id: true },
  });
  targetOrgId = defaultOrg?.org_id;
  ```
- **Impact:** Unauthenticated or untyped requests default to the first organization, leaking document catalogue metadata across tenants.
- **Status:** `CONFIRMED`.
- **Approval Required:** NO (Application code).

---

#### FIND-STG2-01: Stage 2 Academic Planning Blocked by Database Freeze

- **Severity:** `HIGH`
- **Component:** Entire Academic Planning Domain
- **Evidence:** 5 of the 6 Stage 2 functional requirements (Framework Mapping, AI Curriculum Designer, Digital Resource Library, AI Lesson Planning, Academic Setup Publishing) have zero DDL support in `apps/database/stage_1/schema/`.
- **Impact:** Stage 2 cannot be implemented with persistence under the Stage-1 database freeze.
- **Status:** `CONFIRMED`.
- **Approval Required:** YES (Governance authorization to begin Stage 2 DDL).

---

### MEDIUM-SEVERITY FINDINGS (Data Integrity, Performance, and Races)

---

#### FIND-PSC-02: Missing Column `is_teaching_role` in `designations` Table DDL

- **Severity:** `MEDIUM`
- **Location:** [`04_tables.sql:163-187`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L163-L187) vs [`schema.prisma:359`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/prisma/schema.prisma#L359)
- **Evidence:** `schema.prisma` declares `is_teaching_role Boolean @default(false)` on `designations`. This column is absent from `04_tables.sql`.
- **Impact:** Backend queries filtering by `is_teaching_role` fail on a clean Stage-1 database.
- **Status:** `CONFIRMED`.

---

#### FIND-REL-03: Relational Mismatch Permitted Between Section and Grade in `student_enrollments`

- **Severity:** `MEDIUM`
- **Location:** [`04_tables.sql:1240-1285`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L1240-L1285)
- **Evidence:** `student_enrollments` contains independent foreign keys to `academic_year_grades` and `sections`. It lacks a composite foreign key `(section_id, academic_year_grade_id)`.
- **Impact:** A student can be enrolled in Grade 9 while assigned to a Grade 10 section.
- **Status:** `CONFIRMED`.

---

#### FIND-REL-04: Dual Active Enrollments in Same Academic Year Permitted

- **Severity:** `MEDIUM`
- **Location:** [`04_tables.sql:1283`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L1283)
- **Evidence:** Constraint is `UNIQUE(student_id, academic_year_grade_id)` instead of `UNIQUE(student_id, academic_year_id)`.
- **Impact:** A student can be concurrently enrolled in Grade 5 and Grade 6 within the same academic year.
- **Status:** `CONFIRMED`.

---

#### FIND-SEC-02: Multi-Tenant Foreign-Key Consistency Absent on 15 Child Tables

- **Severity:** `MEDIUM`
- **Location:** Database-wide child entities
- **Evidence:** 15 child tables lack `org_id`. Foreign keys do not check tenant matching between parents (e.g. `user_roles` does not check `users.org_id == roles.org_id`).
- **Impact:** Cross-tenant record associations can be created if application validation fails.
- **Status:** `CONFIRMED`.

---

#### FIND-IDX-02: Unindexed Critical Foreign Keys Causing Sequential Scan Latency

- **Severity:** `MEDIUM`
- **Location:** `04_tables.sql` & `06_indexes.sql`
- **Evidence:** Foreign keys `staff(user_id)`, `admission_decisions(application_id)`, `admission_fee_payments(application_id)`, and `chatbot_sessions(escalated_to_staff_id)` have no B-tree index.
- **Impact:** Join lookups and cascade deletes trigger full table scans.
- **Status:** `CONFIRMED`.

---

#### FIND-TRG-01: Missing `BEFORE UPDATE` Triggers on 4 Tables

- **Severity:** `MEDIUM`
- **Location:** `07_triggers.sql`
- **Evidence:** Tables `notifications`, `countries`, `lead_query_types`, and `document_chunks` contain `updated_at` columns but have no trigger attached in `07_triggers.sql`.
- **Impact:** `updated_at` timestamps become stale on row updates.
- **Status:** `CONFIRMED`.

---

#### FIND-APP-02: Concurrency Race Condition in `admission_no` Generation

- **Severity:** `MEDIUM`
- **Location:** [`apps/backend/src/modules/student-management/repositories/student.repository.ts:48`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/student-management/repositories/student.repository.ts#L48)
- **Evidence:** Uses `count(*) + 1` pattern without transaction lock or database sequence.
- **Impact:** Concurrent enrollments fail with duplicate key violation.
- **Status:** `CONFIRMED`.

---

### LOW-SEVERITY & INFORMATIONAL FINDINGS

---

#### FIND-SQL-04: Duplicate Enum Declaration in `02_enums.sql`

- **Severity:** `LOW`
- **Location:** [`02_enums.sql:329` & `337`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/02_enums.sql#L329)
- **Evidence:** `notification_category` is declared twice in immediate succession.
- **Status:** `CONFIRMED`.

---

#### FIND-PSC-03: Extra Enum Value `waiting_for_parent` in Prisma `concern_status`

- **Severity:** `LOW`
- **Location:** [`schema.prisma:1680`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/prisma/schema.prisma#L1680) vs [`02_enums.sql:236-242`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/02_enums.sql#L236-L242)
- **Evidence:** Prisma contains `waiting_for_parent`; absent from `02_enums.sql`.
- **Status:** `CONFIRMED`.

---

#### FIND-IDX-01: Redundant & Duplicate Indexes Causing Write Amplification

- **Severity:** `LOW`
- **Location:** `06_indexes.sql`
- **Evidence:** Exact duplicates on `leads(lead_number)` and `admissions_applications(application_number)`. Redundant prefixes on `users(org_id)`, `roles(org_id)`, `departments(org_id)`.
- **Status:** `CONFIRMED`.

---

#### FIND-IDX-03: Index Name / Column Target Mismatch

- **Severity:** `LOW`
- **Location:** [`06_indexes.sql:165-166`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/06_indexes.sql#L165-L166)
- **Evidence:** Index `ix_admissions_applications_academic_year_grade` indexes column `academic_year_id`.
- **Status:** `CONFIRMED`.

---

#### FIND-APP-03: Extensive Type-Safety Circumvention (558 `as any` Casts)

- **Severity:** `LOW`
- **Location:** `apps/backend/src/modules/`
- **Evidence:** 558 `as any` type assertions circumvent static TypeScript compiler guarantees.
- **Status:** `CONFIRMED`.

---

## 3. Stage 2 Compatibility & Readiness Assessment

| Requirement                     |  Stage-1 Status   | Blocker Description                                                                     | Recommendation                                  |
| :------------------------------ | :---------------: | :-------------------------------------------------------------------------------------- | :---------------------------------------------- |
| **Academic Year Configuration** |    **PARTIAL**    | Foundational models exist. Lacks operational calendar, terms, and working day entities. | Retain current endpoints for core structure.    |
| **Board / Framework Mapping**   | **NOT SUPPORTED** | Only basic string affiliation on organization. No framework tables in SQL suite.        | Formulate Stage 2 DDL package.                  |
| **AI Curriculum Designer**      | **NOT SUPPORTED** | Zero tables in Stage-1 SQL. Prisma proxy would dangerously route writes to RAM.         | Prohibit implementation until Stage 2 unfreeze. |
| **Digital Resource Library**    | **NOT SUPPORTED** | Zero tables in Stage-1 SQL. No teaching asset metadata storage.                         | Prohibit implementation until Stage 2 unfreeze. |
| **AI Lesson Planning**          | **NOT SUPPORTED** | Zero tables in Stage-1 SQL. No pedagogical structure persistence.                       | Prohibit implementation until Stage 2 unfreeze. |
| **Academic Setup Publishing**   | **NOT SUPPORTED** | Zero tables in Stage-1 SQL. No publication state machine.                               | Prohibit implementation until Stage 2 unfreeze. |

---

## 4. Final Recommendations & Roadmap

1. **Maintain Non-Negotiable Database Freeze on Stage-1:**
   - In strict compliance with `.agents/AGENTS.md`, **do not modify or patch any Stage-1 SQL file, Prisma model, or migration script during current application delivery**.
2. **Safeguard the Application Layer:**
   - In `apps/backend/src/lib/prismaClient.ts`, disable the silent in-memory fallback proxy for unmapped models to prevent accidental data loss.
   - Refactor `AdmissionDocumentController` to remove the default organization fallback.
3. **Formulate Stage 2 Migration Package:**
   - Prepare a new, clean migration directory `apps/database/stage_2/schema/` that:
     - Patches the 6 syntax/dependency defects from Stage-1.
     - Adds missing indexes on `staff(user_id)`, `admission_decisions(application_id)`, and `admission_fee_payments(application_id)`.
     - Introduces verified Stage 2 DDL for curriculum frameworks, plans, and resources.
     - Protects financial and application records by replacing `ON DELETE CASCADE` with `ON DELETE RESTRICT`.

---

## 5. Audit Deliverable Sign-Off

All 10 required audit reports have been compiled into `docs/database-audit/`:

- `01-database-inventory.md`: Complete object catalog & cross-reference.
- `02-prisma-sql-consistency.md`: Field-by-field Prisma vs. SQL reconciliation.
- `03-relational-integrity-audit.md`: Relational integrity, enrollment consistency, and cascades.
- `04-multitenant-security-audit.md`: Tenant-isolation matrix and RLS evaluation.
- `05-index-performance-audit.md`: Index coverage, duplicates, and missing FK indexes.
- `06-functions-triggers-audit.md`: Function security, trigger coverage, and syntax blockers.
- `07-migration-drift-audit.md`: Migration history, runner analysis, and bootstrap defects.
- `08-application-database-contract.md`: In-memory proxy discovery and identifier race conditions.
- `09-stage-2-compatibility.md`: Stage 2 Academic Planning feasibility matrix.
- `10-final-database-audit-report.md`: Master finding registry and executive summary.

**Certification:** Zero application source files, SQL files, or database schemas were modified during this forensic audit.
