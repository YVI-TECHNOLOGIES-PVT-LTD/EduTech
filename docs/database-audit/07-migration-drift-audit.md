# EduTrack ERP — Database Forensic Audit

# Report 07: Migration History & Schema Drift Audit

**Audit Date:** November 10, 2026  
**Auditor:** Senior PostgreSQL Database Architect & Database Reliability Engineer  
**Audit Scope:** Migration Framework, Schema Drift Analysis, DDL Synchronization, Migration Artifacts, and Fresh-Bootstrap Verifiability  
**Source Baseline:** `apps/database/stage_1/schema/*.sql`, `apps/backend/prisma/schema.prisma`, `apps/backend/scripts/`, `apps/backend/logs/`

---

## 1. Executive Summary

This forensic audit investigates the migration history, schema drift, and synchronization state across the four representations of the EduTrack database:

1. **The Finalized SQL Suite** (`apps/database/stage_1/schema/`, 11 files)
2. **The Prisma Schema** (`apps/backend/prisma/schema.prisma`, 109 models)
3. **The Migration Scripts & Historical Logs** (`apps/backend/scripts/`, `apps/backend/reports/`)
4. **The Live Database** (Supabase PostgreSQL cluster)

### Primary Verdict:

- **The finalized Stage-1 SQL suite cannot be executed cleanly from scratch**. It suffers from 6 confirmed syntax and dependency defects that halt execution on clean PostgreSQL instances.
- **The physical migration directory referenced by runner scripts (`database/migrations/`) is completely missing** from the repository.
- **The Prisma schema represents a later, introspected state** (via `prisma db pull`) containing 76 additional models from Stage 2–4 initiatives.
- **Live Database Verification Status:** Strictly **PENDING** pursuant to Section 1 freeze constraints, as the configured credentials use the cluster superuser (`postgres`) without read-only guarantees.

---

## 2. Reconstructed Schema Evolution & Migration Timeline

```
[Phase 1: Legacy Suite (July 2026)]
  ├── 139 Migration files (000_core_rbac to 140_cleanup)
  ├── Attempted in DRY-RUN mode on 2026-07-24
  └── Failed validation: Attempted to DROP protected core tables (users, roles, schools)
         │
         ▼
[Phase 2: Stage-1 Admission DDL Baseline (August 2026)]
  ├── DDL suite created in apps/database/stage_1/schema/ (01 to 09)
  ├── 30 Tables, 25 Triggers, 65 Indexes
  └── Intended to freeze Admission MVP schema
         │
         ▼
[Phase 3: Stage-1 Alterations & Feature Expansion (Sept–Oct 2026)]
  ├── 10_admission_enquiry_alterations.sql: Added lead consent, lead_query_types,
  │   parent_id on leads, 6 academic fields on admissions_applications,
  │   dropped unique constraint on lead_id, renamed lead_priority enum values
  └── 11_document_chunks_vector.sql: Enabled pgvector, created document_chunks
         │
         ▼
[Phase 4: Schema Introspection & Multi-Stage Expansion (Nov 2026)]
  └── apps/backend/prisma/schema.prisma introspected from Supabase:
      Reflects 109 models (including Stage 2 Academic Planning, Stage 3 Timetable, Stage 4 Finance)
```

---

## 3. Fresh-Bootstrap Defect Analysis (Why Stage-1 SQL Cannot Run From Scratch)

If an engineer or CI/CD pipeline attempts to provision a fresh PostgreSQL instance by running the 11 SQL scripts in sequential order:

```bash
psql -f 01_extensions.sql
psql -f 02_enums.sql
psql -f 03_functions.sql
psql -f 04_tables.sql
psql -f 05_circular_fks.sql
psql -f 06_indexes.sql
psql -f 07_triggers.sql
psql -f 08_rls.sql
psql -f 09_views.sql
psql -f 10_admission_enquiry_alterations.sql
psql -f 11_document_chunks_vector.sql
```

The bootstrap process fails at multiple critical steps:

### Defect 1: Duplicate Enum Declaration in `02_enums.sql`

- **Location:** [`02_enums.sql:329-335`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/02_enums.sql#L329-L335) and [`02_enums.sql:337-343`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/02_enums.sql#L337-L343)
- **Error:** `CREATE TYPE public.notification_category` is declared twice in immediate succession.
- **PostgreSQL Output:** `ERROR: type "notification_category" already exists`.

### Defect 2: Missing Comma in `organizations` Table DDL

- **Location:** [`04_tables.sql:40-43`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L40-L43)
- **Error:** Missing comma between `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()` and `created_by UUID`.
- **PostgreSQL Output:** `ERROR: syntax error at or near "created_by"`. Execution halts on the very first table!

### Defect 3: Missing Enum `notification_priority`

- **Location:** [`04_tables.sql:1296`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L1296)
- **Error:** `priority public.notification_priority NOT NULL DEFAULT 'NORMAL'`.
- **PostgreSQL Output:** `ERROR: type "public.notification_priority" does not exist`.

### Defect 4: Missing Comma in `student_enrollments` Table DDL

- **Location:** [`04_tables.sql:1283-1284`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L1283-L1284)
- **Error:**
  ```sql
  UNIQUE(student_id, academic_year_grade_id)
  UNIQUE(section_id, roll_number)
  ```
- **PostgreSQL Output:** `ERROR: syntax error at or near "UNIQUE"`.

### Defect 5: Index References Non-Existent Column `chatbot_sessions.lead_activity_id`

- **Location:** [`06_indexes.sql:283-284`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/06_indexes.sql#L283-L284)
- **Error:** `CREATE INDEX ix_chatbot_sessions_lead_activity ON chatbot_sessions(lead_activity_id);`
- **PostgreSQL Output:** `ERROR: column "lead_activity_id" does not exist`.

### Defect 6: Dangling Token `Create` in `07_triggers.sql`

- **Location:** [`07_triggers.sql:194`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/07_triggers.sql#L194)
- **Error:** Standalone keyword `Create` preceding header comments.
- **PostgreSQL Output:** `ERROR: syntax error at or near "CREATE"`.

---

## 4. Migration Scripts & Tooling Forensic Audit

### A. Missing Physical Migrations Directory

- Files in `apps/backend/scripts/`:
  - `migration-config.ts` declares: `migrationsDir: path.join(process.cwd(), 'database', 'migrations')`.
  - Standalone runners (`run-migration-110.js` to `run-migration-120.js`) declare:
    ```javascript
    const sqlPath = path.join(
      __dirname,
      '../database/migrations/110_extend_assessment_configurations.sql',
    );
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Missing migration file at: ${sqlPath}`);
    }
    ```
- **Audit Finding:** The directory `database/migrations/` (and `apps/backend/database/migrations/`) **does not physically exist anywhere in the repository**. Any execution of these runner scripts throws a fatal file-not-found error.

### B. Legacy Migration Log Evaluation (`apps/backend/logs/migration-2026-07-24T08-04.log`)

- Log reveals an earlier attempt to execute a custom enterprise migration runner evaluating 139 SQL scripts (`000_core_rbac_functions.sql` through `140_cleanup_functions.sql`).
- The framework ran in **DRY-RUN mode** and immediately flagged fatal safety violations:
  `[ERROR] [SAFETY VIOLATION] Migration '002_foundation_schema.sql' attempts to DROP protected object 'users'.`
  `[ERROR] [SAFETY VIOLATION] Migration '002_foundation_schema.sql' attempts to DROP protected object 'roles'.`
- These migrations were rejected and subsequently removed from active source control, leading to the creation of the decoupled Stage-1 SQL DDL suite.

---

## 5. Live Database Verification Status

- **Constraint:** Section 1 of the audit instructions strictly forbids connecting to the database unless read-only access is guaranteed.
- **Credential Analysis:** The configured `DATABASE_URL` in `apps/backend/.env` uses the Supabase connection pooler with user `postgres.blvseyhzsehfwdmevtyp`, which has full administrative write and DDL privileges.
- **Status:** **LIVE DATABASE VERIFICATION IS MARKED PENDING**.
- **Repository Evidence:** Prior audit reports in `testing/STAGE1_PRISMA_DATABASE_SCHEMA_RECONCILIATION_AUDIT.md` (which performed direct read-only catalog queries against `information_schema.columns`) confirm that the live database physically contains the altered schema (including the 6 academic fields, `parent_id` on leads, and nullable `lead_id`).

---

## 6. Migration Drift Findings

### FIND-MIG-01: Non-Bootstrappable Stage-1 Authoritative SQL Suite

- **Severity:** HIGH
- **Location:** `apps/database/stage_1/schema/`
- **Evidence:** 6 confirmed syntax and dependency errors documented above prevent clean initialization.
- **Impact:** New developers or automated staging deployments cannot instantiate a functional database from the finalized SQL suite without manual intervention or patching.
- **Recommendation:** Document as frozen baseline defects. Formulate a patch migration plan for Stage 2.

### FIND-MIG-02: Missing Migration Directory for Standalone Runner Scripts

- **Severity:** MEDIUM
- **Location:** `apps/backend/scripts/run-migration-*.js`
- **Evidence:** Scripts reference absent directory `../database/migrations/`.
- **Impact:** Standalone scripts are dead code in their current state.
- **Recommendation:** Archive or decommission orphan runner scripts.
