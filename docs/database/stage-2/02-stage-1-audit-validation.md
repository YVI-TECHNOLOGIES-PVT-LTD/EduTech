# EduTrack ERP — Stage 2 Database Architecture

# Report 02: Independent Validation of Stage-1 Audit Findings

**Document ID:** STG2-DB-VAL-02  
**Date:** November 10, 2026  
**Author:** Principal Database Architect & Data Reliability Engineer  
**Audit Baseline:** Stage-1 Finalized SQL Suite (`apps/database/stage_1/schema/*.sql`) & `apps/backend/src/`  
**Governing Rule:** `.agents/AGENTS.md` (Stage-1 Database Freeze)

---

## 1. Executive Summary

This report performs an independent, code-level verification of all previously reported Stage-1 database defects, relational integrity vulnerabilities, and application-to-database contract gaps before initiating Stage 2 architecture design.

### Verdict Matrix

| Investigation Area                    | Assessed Items |         Confirmed Defects         | Architectural Vulnerabilities | Stage 2 Impact                                        |
| :------------------------------------ | :------------: | :-------------------------------: | :---------------------------: | :---------------------------------------------------- |
| **SQL Bootstrap Defects**             |       6        |          **6 Confirmed**          |               0               | Prevents clean fresh database bootstrapping           |
| **Multi-Tenant Relational Integrity** |       10       | **0 Defect / 10 Vulnerabilities** |    **10 Confirmed Risks**     | Database allows cross-tenant foreign-key associations |
| **Prisma In-Memory Proxy Contract**   |       1        |   **1 Confirmed Critical Flaw**   |    1 Architectural Hazard     | Silent data loss risk for unserviced Stage-2 models   |

---

## 2. Independent Validation of SQL Bootstrap Defects

Each reported defect from the baseline forensic audit was independently inspected against the exact lines in `apps/database/stage_1/schema/`:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        SQL BOOTSTRAP DEFECT VERIFICATION MATRIX                        │
├────────────────────────────────────────┬──────────────────────┬───────────┬────────────┤
│ Issue Description                      │ Source File & Line   │ Status    │ Resolution │
├────────────────────────────────────────┼──────────────────────┼───────────┼────────────┤
│ 1. Duplicate notification_category     │ 02_enums.sql:329-343 │ CONFIRMED │ Stage 2 DDL│
│ 2. Missing comma in organizations      │ 04_tables.sql:40-43  │ CONFIRMED │ Stage 2 DDL│
│ 3. Missing notification_priority enum  │ 04_tables.sql:1296   │ CONFIRMED │ Stage 2 DDL│
│ 4. Missing comma in enrollments UNIQUE │ 04_tables.sql:1284   │ CONFIRMED │ Stage 2 DDL│
│ 5. Index on missing lead_activity_id   │ 06_indexes.sql:284   │ CONFIRMED │ Stage 2 DDL│
│ 6. Dangling Create in triggers         │ 07_triggers.sql:194  │ CONFIRMED │ Stage 2 DDL│
└────────────────────────────────────────┴──────────────────────┴───────────┴────────────┘
```

### Detailed Evidence:

#### 1. Duplicate `notification_category` Enum Declaration

- **Source Location:** [`02_enums.sql:329-335`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/02_enums.sql#L329-L335) and [`02_enums.sql:337-343`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/02_enums.sql#L337-L343)
- **Classification:** **CONFIRMED**
- **Evidence:** The identical DDL block `CREATE TYPE public.notification_category AS ENUM ('ADMISSION', 'ATTENDANCE', 'FEE', 'EXAM', 'SYSTEM');` is repeated back-to-back.
- **Engine Behavior:** PostgreSQL raises `ERROR: type "notification_category" already exists` on line 337.

#### 2. Missing Comma in `organizations` Table DDL

- **Source Location:** [`04_tables.sql:40-43`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L40-L43)
- **Classification:** **CONFIRMED**
- **Evidence:** Line 41 terminates `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()` without a trailing comma, immediately followed by `created_by UUID` on line 43.
- **Engine Behavior:** PostgreSQL raises `ERROR: syntax error at or near "created_by"`.

#### 3. Missing Enum `notification_priority`

- **Source Location:** [`04_tables.sql:1296`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L1296) vs [`02_enums.sql`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/02_enums.sql)
- **Classification:** **CONFIRMED**
- **Evidence:** Table `notifications` requires column `priority public.notification_priority NOT NULL DEFAULT 'NORMAL'`. Searching `02_enums.sql` confirms `notification_priority` is completely omitted.
- **Engine Behavior:** PostgreSQL raises `ERROR: type "public.notification_priority" does not exist`.

#### 4. Missing Comma in `student_enrollments` Table DDL

- **Source Location:** [`04_tables.sql:1283-1284`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L1283-L1284)
- **Classification:** **CONFIRMED**
- **Evidence:**
  ```sql
  1283:     UNIQUE(student_id, academic_year_grade_id)
  1284:     UNIQUE(section_id, roll_number)
  ```
  Missing comma separator between constraint clauses.
- **Engine Behavior:** PostgreSQL raises `ERROR: syntax error at or near "UNIQUE"`.

#### 5. Index on Non-Existent Column `chatbot_sessions.lead_activity_id`

- **Source Location:** [`06_indexes.sql:283-284`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/06_indexes.sql#L283-L284) vs [`04_tables.sql:659-683`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L659-L683)
- **Classification:** **CONFIRMED**
- **Evidence:** `CREATE INDEX ix_chatbot_sessions_lead_activity ON chatbot_sessions(lead_activity_id);` indexes a column omitted from table creation.
- **Engine Behavior:** PostgreSQL raises `ERROR: column "lead_activity_id" does not exist`.

#### 6. Dangling `Create` Keyword in Trigger Script

- **Source Location:** [`07_triggers.sql:194`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/07_triggers.sql#L194)
- **Classification:** **CONFIRMED**
- **Evidence:** An uncompleted `Create` keyword sits isolated on line 194 directly before the section comment for `ADMISSION DECISIONS`.
- **Engine Behavior:** Execution halts immediately with `ERROR: syntax error at or near "CREATE"`.

---

## 3. Independent Validation of Multi-Tenant Relational Integrity

The multi-tenant relationships were independently reviewed to evaluate whether cross-tenant corruption is physically preventable by PostgreSQL constraints alone:

| Entity Relationship            | Current Foreign Keys                                              | Can Cross-Tenant References Occur? | Why PostgreSQL Constraints Fail to Prevent It                                                |
| :----------------------------- | :---------------------------------------------------------------- | :--------------------------------: | :------------------------------------------------------------------------------------------- |
| **Users ↔ Roles**              | `user_roles(user_id, role_id)`                                    |              **YES**               | `user_roles` lacks `org_id`. No check enforces `users.org_id == roles.org_id`.               |
| **Staff ↔ Departments**        | `staff(department_id)`                                            |              **YES**               | `staff` checks only that `department_id` exists; does not enforce matching `org_id`.         |
| **Academic Years ↔ Grades**    | `academic_year_grades(academic_year_id, grade_id)`                |              **YES**               | `academic_year_grades` lacks `org_id`. School 1 year can pair with School 2 grade.           |
| **Sections ↔ Teachers**        | `sections(class_teacher_id)`                                      |              **YES**               | `sections` does not verify that `class_teacher.org_id` matches the section's school.         |
| **Admissions ↔ Leads**         | `admissions_applications(lead_id, org_id)`                        |              **YES**               | `admissions_applications` does not enforce `leads.org_id == admissions_applications.org_id`. |
| **Applications ↔ Assessments** | `application_assessments(application_id, config_id, assessed_by)` |              **YES**               | Assessor staff member can belong to an entirely different tenant.                            |
| **Students ↔ Enrollments**     | `student_enrollments(student_id, ayg_id)`                         |              **YES**               | Student from School A can be enrolled in School B's academic grade.                          |
| **Students ↔ Parents**         | `student_parents(student_id, parent_id)`                          |              **YES**               | `student_parents` lacks `org_id`; student can be linked to another tenant's parent.          |
| **Admission Documents**        | `admission_documents(application_id)`                             |              **YES**               | Document row lacks `org_id`; relies 100% on application join.                                |
| **Admission Fee Payments**     | `admission_fee_payments(application_id)`                          |              **YES**               | Payment row lacks `org_id`; relies 100% on application join.                                 |

### Architectural Conclusion:

In Stage 1, **multi-tenant safety is 100% application-dependent**. The database engine provides zero composite integrity across tenant boundaries.

For Stage 2, **composite foreign keys containing `org_id` must be introduced** for every new entity to guarantee database-enforced multi-tenancy.

---

## 4. Independent Validation of Application-to-Database Contract (`prismaClient.ts`)

A forensic line-by-line inspection of [`apps/backend/src/lib/prismaClient.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/lib/prismaClient.ts) verified the in-memory fallback mechanism:

```
                          INCOMING PRISMA DELEGATE INVOCATION
                                           │
                                           ▼
                       Does model exist on raw PrismaClient?
                                    │             │
                               YES  │             │  NO
                                    ▼             ▼
                           Executes on DB    Is model in FINANCIAL_PERSISTENCE_MODELS?
                                              │                       │
                                         YES  │                       │  NO
                                              ▼                       ▼
                                       Throws Error          Routes to in-memory Map
                                     [Writes Blocked]        [RAM-ONLY PERSISTENCE]
                                                                        │
                                                                        ▼
                                                             SILENT DATA LOSS ON RESTART
```

### Forensic Findings:

1. **Unmapped Model Delegate Interception:**
   - Lines 358–367: When code calls `prisma[modelName]`, if `modelName` is absent from the generated Prisma Client, the proxy creates a delegate via `createSafeModelDelegate(modelName)`.
2. **RAM-Only Persistence:**
   - Lines 146–245: `createSafeModelDelegate` implements `findMany`, `findFirst`, `findUnique`, `create`, `createMany`, `update`, `delete`, and `upsert` entirely against `fallbackStores = new Map<string, Map<string, any>>()`.
3. **Severe Hazard for Stage 2 Implementation:**
   - If Stage 2 services are built using `prisma.curriculum_plans.create(...)` or `prisma.lesson_plans.create(...)` before physical PostgreSQL tables and generated client models are deployed, the application will **report HTTP 200/201 success while saving data purely into Node.js heap memory**.
   - Upon pod restart or container redeployment, **all created curriculum and lesson records will vanish completely**.

### Actionable Rule for Stage 2:

The in-memory fallback must be strictly disabled for all Stage-2 models. The proxy must fail closed with a descriptive persistence error whenever an unmapped delegate is invoked.
