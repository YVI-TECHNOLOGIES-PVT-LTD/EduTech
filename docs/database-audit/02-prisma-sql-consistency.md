# EduTrack ERP — Database Forensic Audit

# Report 02: Prisma vs. Authoritative SQL Consistency Audit

**Audit Date:** November 10, 2026  
**Auditor:** Senior PostgreSQL Database Architect & Prisma Specialist  
**Audit Scope:** Full structural, type, nullability, default, relationship, and constraint reconciliation between `apps/database/stage_1/schema/*.sql` and `apps/backend/prisma/schema.prisma`  
**Governing Rule:** `.agents/AGENTS.md` (Stage-1 Database & Implementation Freeze)

---

## 1. Executive Summary

A comprehensive forensic reconciliation between the authoritative Stage-1 SQL DDL suite (`apps/database/stage_1/schema/`) and the application Prisma schema (`apps/backend/prisma/schema.prisma`) reveals that **all 33 Stage-1 SQL tables are mapped in Prisma**.

However, the Prisma schema contains **109 models** and **78 enums** (compared to 33 SQL tables and 37 SQL enums). This is not random drift: the extra 76 models and 41 enums represent Stage 2 (Academic Planning / Curriculum), Stage 3 (Timetable / Bell Schedules), and Stage 4 (Finance, Billing, Helpdesk, and Feeds) introspected from a live PostgreSQL instance.

Critical structural discrepancies were identified where the frozen SQL suite omits columns present in Prisma, where SQL index definitions reference non-existent columns, and where enum definitions diverge.

---

## 2. Table-to-Model Reconciliation Matrix

| SQL Object                  | File Location           | Prisma Model                |   Status    | Discrepancy / Audit Finding                                                                                                                                      |
| :-------------------------- | :---------------------- | :-------------------------- | :---------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `organizations`             | `04_tables.sql:5`       | `organizations`             | **MATCHED** | Syntax defect in SQL (missing comma line 41).                                                                                                                    |
| `users`                     | `04_tables.sql:53`      | `users`                     | **MATCHED** | Columns `country_id` & `avatar_url` added via `10_alterations.sql`. `country_id` is NOT NULL in Prisma.                                                          |
| `roles`                     | `04_tables.sql:99`      | `roles`                     | **MATCHED** | 100% matched.                                                                                                                                                    |
| `user_roles`                | `04_tables.sql:138`     | `user_roles`                | **MATCHED** | Composite PK `(user_id, role_id)` matched.                                                                                                                       |
| `designations`              | `04_tables.sql:163`     | `designations`              |  **DRIFT**  | **`is_teaching_role Boolean @default(false)`** exists in Prisma (`schema.prisma:359`) but is **MISSING from all SQL DDL files**.                                 |
| `departments`               | `04_tables.sql:194`     | `departments`               | **MATCHED** | 100% matched.                                                                                                                                                    |
| `staff`                     | `04_tables.sql:224`     | `staff`                     | **MATCHED** | 100% matched.                                                                                                                                                    |
| `parents`                   | `04_tables.sql:268`     | `parents`                   | **MATCHED** | `user_id` added via `ALTER TABLE parents ADD COLUMN user_id` in `04_tables.sql:302`.                                                                             |
| `academic_years`            | `04_tables.sql:311`     | `academic_years`            | **MATCHED** | 100% matched.                                                                                                                                                    |
| `admission_configurations`  | `04_tables.sql:352`     | `admission_configurations`  | **MATCHED** | `processing_fee` added in `10_alterations.sql:174`.                                                                                                              |
| `grades`                    | `04_tables.sql:411`     | `grades`                    | **MATCHED** | 100% matched.                                                                                                                                                    |
| `academic_year_grades`      | `04_tables.sql:453`     | `academic_year_grades`      | **MATCHED** | 100% matched.                                                                                                                                                    |
| `sections`                  | `04_tables.sql:491`     | `sections`                  | **MATCHED** | 100% matched.                                                                                                                                                    |
| `leads`                     | `04_tables.sql:534`     | `leads`                     | **MATCHED** | `parent_id`, `contact_consent`, `contact_consent_at` added in `10_alterations.sql:7, 96`.                                                                        |
| `lead_activities`           | `04_tables.sql:618`     | `lead_activities`           | **MATCHED** | 100% matched.                                                                                                                                                    |
| `chatbot_sessions`          | `04_tables.sql:659`     | `chatbot_sessions`          |  **DRIFT**  | **`lead_activity_id UUID`** exists in Prisma (`schema.prisma:301`) and is indexed in `06_indexes.sql:284`, but is **MISSING from table DDL in `04_tables.sql`**. |
| `chatbot_messages`          | `04_tables.sql:688`     | `chatbot_messages`          | **MATCHED** | 100% matched.                                                                                                                                                    |
| `lead_visits`               | `04_tables.sql:707`     | `lead_visits`               | **MATCHED** | 100% matched.                                                                                                                                                    |
| `admissions_applications`   | `04_tables.sql:754`     | `admissions_applications`   | **MATCHED** | `lead_id` made nullable in `10_alterations.sql`. 6 academic fields added in `10_alterations.sql:134` and reconciled in Prisma (`schema.prisma:200-205`).         |
| `document_types`            | `04_tables.sql:802`     | `document_types`            | **MATCHED** | 100% matched.                                                                                                                                                    |
| `admission_documents`       | `04_tables.sql:846`     | `admission_documents`       | **MATCHED** | `file_path` renamed to `storage_path`, 3 metadata fields added in `10_alterations.sql:103-109`.                                                                  |
| `assessment_configurations` | `04_tables.sql:896`     | `assessment_configurations` | **MATCHED** | 100% matched.                                                                                                                                                    |
| `application_assessments`   | `04_tables.sql:968`     | `application_assessments`   | **MATCHED** | 100% matched.                                                                                                                                                    |
| `admission_decisions`       | `04_tables.sql:1050`    | `admission_decisions`       | **MATCHED** | 100% matched.                                                                                                                                                    |
| `admission_fee_payments`    | `04_tables.sql:1101`    | `admission_fee_payments`    | **MATCHED** | `payment_mode`, `card_name`, `card_last_four` added in `10_alterations.sql:177-181`.                                                                             |
| `students`                  | `04_tables.sql:1144`    | `students`                  | **MATCHED** | `nationality` added in `10_alterations.sql:126`.                                                                                                                 |
| `student_parents`           | `04_tables.sql:1202`    | `student_parents`           | **MATCHED** | Composite PK `(student_id, parent_id)` matched.                                                                                                                  |
| `student_enrollments`       | `04_tables.sql:1240`    | `student_enrollments`       | **MATCHED** | Syntax defect in SQL (missing comma line 1284).                                                                                                                  |
| `notifications`             | `04_tables.sql:1288`    | `notifications`             | **DEFECT**  | SQL references enum `notification_priority` which is **UNDEFINED in `02_enums.sql`**.                                                                            |
| `countries`                 | `04_tables.sql:1331`    | `countries`                 | **MATCHED** | Defined at end of `04_tables.sql`.                                                                                                                               |
| `lead_query_types`          | `10_alterations.sql:12` | `lead_query_types`          | **MATCHED** | 100% matched.                                                                                                                                                    |
| `lead_query_type_mappings`  | `10_alterations.sql:46` | `lead_query_type_mappings`  | **MATCHED** | Composite PK `(lead_id, query_type_id)` matched.                                                                                                                 |
| `document_chunks`           | `11_vector.sql:9`       | `document_chunks`           | **MATCHED** | Field `embedding Unsupported("vector(3072)")?` mapped in Prisma (`schema.prisma:376`).                                                                           |

---

## 3. Data Type & Expression Mappings

| Database Data Type                           | Prisma Schema Type                                               | Behavioral Verification | Notes                                                                                                           |
| :------------------------------------------- | :--------------------------------------------------------------- | :---------------------: | :-------------------------------------------------------------------------------------------------------------- |
| `UUID PRIMARY KEY DEFAULT gen_random_uuid()` | `String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid` |     **CONSISTENT**      | PostgreSQL generates v4 UUID natively.                                                                          |
| `VARCHAR(n)`                                 | `String @db.VarChar(n)`                                          |     **CONSISTENT**      | Length constraints preserved.                                                                                   |
| `TEXT`                                       | `String`                                                         |     **CONSISTENT**      | PostgreSQL arbitrary-length text.                                                                               |
| `TIMESTAMPTZ NOT NULL DEFAULT now()`         | `DateTime @default(now()) @db.Timestamptz(6)`                    |     **CONSISTENT**      | Microsecond timestamp precision.                                                                                |
| `DATE NOT NULL DEFAULT CURRENT_DATE`         | `DateTime @default(dbgenerated("CURRENT_DATE")) @db.Date`        |     **CONSISTENT**      | Truncated to date without time.                                                                                 |
| `NUMERIC(10,2)` / `DECIMAL(10,2)`            | `Decimal @db.Decimal(10, 2)`                                     |     **CONSISTENT**      | High-precision arbitrary decimal representation.                                                                |
| `BOOLEAN NOT NULL DEFAULT TRUE`              | `Boolean @default(true)`                                         |     **CONSISTENT**      | Exact boolean mapping.                                                                                          |
| `vector(3072)`                               | `Unsupported("vector(3072)")?`                                   |     **COMPATIBLE**      | Prisma does not natively support pgvector; requires raw SQL queries (`$queryRaw`) for vector similarity search. |

---

## 4. Enum Consistency & Drift Analysis

### Reconciled Enum Inventory (37 Common Enums)

| Enum Name               | SQL Values (`02_enums.sql` & `10_alterations.sql`)                                 | Prisma Values (`schema.prisma`)                                                    |                             Reconciliation Status                              |
| :---------------------- | :--------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------- | :----------------------------------------------------------------------------: |
| `lead_priority`         | `hot`, `warm`, `cold` (renamed to `high`, `medium`, `low` in `10_alterations.sql`) | `high`, `medium`, `low`                                                            |                      **ALIGNED** via file 10 alterations                       |
| `lead_activity_type`    | 8 original values + `campus_visit`, `application_started` (in file 10)             | 10 values                                                                          |                      **ALIGNED** via file 10 alterations                       |
| `assessment_result`     | `pass`, `fail`, `recommended`, `not_recommended` + `conditional_pass` (file 10)    | 5 values                                                                           |                      **ALIGNED** via file 10 alterations                       |
| `concern_status`        | `open`, `in_progress`, `escalated`, `resolved`, `closed`                           | `open`, `in_progress`, `escalated`, `resolved`, `closed`, **`waiting_for_parent`** | **DRIFT**: `waiting_for_parent` is in Prisma but **NEVER added to SQL files**. |
| `notification_priority` | **MISSING** from `02_enums.sql`                                                    | `LOW`, `NORMAL`, `HIGH`, `URGENT`                                                  |       **BLOCKER**: SQL table creation fails because type does not exist.       |
| `notification_category` | `ADMISSION`, `ATTENDANCE`, `FEE`, `EXAM`, `SYSTEM`                                 | `ADMISSION`, `ATTENDANCE`, `FEE`, `EXAM`, `SYSTEM`                                 |       **SYNTAX DEFECT**: Declared twice in `02_enums.sql:329` and `337`.       |

---

## 5. Constraint & Relationship Consistency

### A. Referential Actions (`ON DELETE` / `ON UPDATE`)

1. **Delete Cascades:**
   - SQL `04_tables.sql` declares `ON DELETE CASCADE` on tenant-child tables (`users.org_id`, `roles.org_id`, `departments.org_id`, `staff.org_id`, `leads.org_id`).
   - Prisma mirrors this via `onDelete: Cascade`.
2. **Delete Restrict:**
   - SQL declares `ON DELETE RESTRICT` on core classification keys (e.g., `staff.designation_id`, `staff.department_id`, `leads.academic_year_grade_id`).
   - Prisma mirrors this via `onDelete: Restrict` or `onDelete: NoAction`.
3. **Delete Set Null:**
   - Audit fields (`created_by`, `updated_by`) uniformly specify `ON DELETE SET NULL`.
   - Prisma represents these as optional relation fields `users? @relation(...)`.

### B. Unique Constraints

1. **Composite Uniqueness:**
   - `roles`: `UNIQUE(org_id, role_name)` -> Prisma `@@unique([org_id, role_name])`
   - `users`: `UNIQUE(org_id, email)` -> Prisma `@@unique([org_id, email])`
   - `designations`: `UNIQUE(org_id, designation_name)` -> Prisma `@@unique([org_id, designation_name])`
   - `departments`: `UNIQUE(org_id, department_name)` -> Prisma `@@unique([org_id, department_name])`
   - `academic_year_grades`: `UNIQUE(academic_year_id, grade_id)` -> Prisma `@@unique([academic_year_id, grade_id])`
   - `lead_query_types`: `UNIQUE(org_id, query_type_name)` -> Prisma `@@unique([org_id, query_type_name])`
   - `document_chunks`: `UNIQUE(org_id, document_name, chunk_index)` -> Prisma `@@unique([org_id, document_name, chunk_index])`
2. **Composite Uniqueness Drift in Prisma:**
   - Prisma introduces artificial surrogate uniqueness constraints introspected from Supabase:
     - `staff`: `@@unique([org_id, user_id], map: "uq_staff_org_user")`
     - `students`: `@@unique([org_id, student_id], map: "uq_students_org_student")`
     - `users`: `@@unique([org_id, user_id], map: "uq_users_org_user")`
   - These composite constraints on `(org_id, primary_key)` do not exist in `04_tables.sql` because the primary key is already globally unique. They were added to support composite foreign keys or Supabase multi-tenant patterns.

---

## 6. Field-Level Discrepancy Findings

### FIND-PSC-01: Missing Column `lead_activity_id` in `chatbot_sessions` Table DDL

- **Severity:** HIGH
- **Location:** [`apps/database/stage_1/schema/04_tables.sql:659-683`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L659-L683) vs [`apps/database/stage_1/schema/06_indexes.sql:284`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/06_indexes.sql#L284) vs [`schema.prisma:301`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/prisma/schema.prisma#L301)
- **Evidence:** `04_tables.sql` does not declare `lead_activity_id` on `chatbot_sessions`. However, `06_indexes.sql` executes `CREATE INDEX ix_chatbot_sessions_lead_activity ON chatbot_sessions(lead_activity_id);` and Prisma maps `lead_activity_id String? @db.Uuid`.
- **Impact:** Applying `04_tables.sql` and `06_indexes.sql` from scratch causes an immediate SQL execution failure (`column "lead_activity_id" does not exist`).
- **Confirmation:** Confirmed repository defect.
- **Recommended Action:** Document as verified defect. When database freeze is lifted, add `lead_activity_id UUID REFERENCES lead_activities(activity_id) ON DELETE SET NULL` to `chatbot_sessions`.

### FIND-PSC-02: Missing Column `is_teaching_role` in `designations` Table DDL

- **Severity:** MEDIUM
- **Location:** [`apps/database/stage_1/schema/04_tables.sql:163-187`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L163-L187) vs [`schema.prisma:359`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/prisma/schema.prisma#L359)
- **Evidence:** `schema.prisma` declares `is_teaching_role Boolean @default(false)` on model `designations`. This column is absent from `04_tables.sql` and `10_alterations.sql`.
- **Impact:** Any backend query relying on `prisma.designations.findMany({ where: { is_teaching_role: true } })` will fail against a database built strictly from `stage_1/schema/*.sql`.
- **Confirmation:** Confirmed repository drift.
- **Recommended Action:** Maintain frozen database baseline; document recommendation for future migration.

### FIND-PSC-03: Undefined Enum `notification_priority` in SQL DDL

- **Severity:** HIGH
- **Location:** [`apps/database/stage_1/schema/04_tables.sql:1296`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L1296) vs [`apps/database/stage_1/schema/02_enums.sql`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/02_enums.sql)
- **Evidence:** `04_tables.sql` line 1296 defines `priority public.notification_priority NOT NULL DEFAULT 'NORMAL'`. However, `notification_priority` is never created in `02_enums.sql`. Prisma defines it with values `[LOW, NORMAL, HIGH, URGENT]`.
- **Impact:** `04_tables.sql` fails on table `notifications` with `ERROR: type "public.notification_priority" does not exist`.
- **Confirmation:** Confirmed repository defect.
- **Recommended Action:** Document as verified blocker in SQL initialization.

### FIND-PSC-04: Extra Enum Value `waiting_for_parent` in Prisma `concern_status`

- **Severity:** LOW
- **Location:** [`apps/backend/prisma/schema.prisma:1680`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/prisma/schema.prisma#L1680) vs [`apps/database/stage_1/schema/02_enums.sql:236-242`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/02_enums.sql#L236-L242)
- **Evidence:** Prisma contains value `waiting_for_parent` in `concern_status`. `02_enums.sql` only defines `['open', 'in_progress', 'escalated', 'resolved', 'closed']`.
- **Impact:** If application sets `concern_status = 'waiting_for_parent'`, PostgreSQL throws invalid input value for enum error.
- **Confirmation:** Confirmed drift.
