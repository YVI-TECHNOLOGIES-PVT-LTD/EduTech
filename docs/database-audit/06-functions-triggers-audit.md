# EduTrack ERP — Database Forensic Audit

# Report 06: Functions & Triggers Forensic Audit

**Audit Date:** November 10, 2026  
**Auditor:** Senior PostgreSQL Database Architect & Database Security Auditor  
**Audit Scope:** PL/pgSQL Functions, Triggers, Execution Timing, Event Attachment, Search Path Security, Syntax Defects, and Trigger Coverage Gaps  
**Source Baseline:** `apps/database/stage_1/schema/03_functions.sql`, `07_triggers.sql`, `04_tables.sql`, `10_alterations.sql`, `11_vector.sql`

---

## 1. Executive Summary

This forensic audit analyzes all stored procedures, functions, and trigger attachments within the Stage-1 database suite.

The database relies on a single shared trigger function, `set_updated_at()`, to maintain timestamp consistency across tables containing an `updated_at` column.

The audit identified:

1. **A critical SQL syntax defect** in [`07_triggers.sql:194`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/07_triggers.sql#L194) where a dangling `Create` keyword halts SQL script execution.
2. **A function security vulnerability** where `set_updated_at()` omits an explicit `SET search_path`, creating a security risk in shared database environments.
3. **Four tables containing `updated_at` columns that completely lack trigger attachments**, leading to stale update timestamps.

---

## 2. PostgreSQL Functions Forensic Analysis

### Declared Function: `set_updated_at()`

- **Location:** [`03_functions.sql:5-13`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/03_functions.sql#L5-L13)
- **Source Definition:**
  ```sql
  CREATE OR REPLACE FUNCTION set_updated_at()
  RETURNS TRIGGER AS
  $$
  BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
  END;
  $$
  LANGUAGE plpgsql;
  ```

### Forensic Evaluation:

1. **Timestamp Mutability:**
   - The function assigns `NEW.updated_at = NOW()`. This guarantees that on every SQL `UPDATE` statement, the `updated_at` field is overridden with the current transaction timestamp, preventing application layers from forging historical update timestamps.
2. **Behavior on Unchanged Updates:**
   - The function does NOT compare `NEW` vs `OLD` (`IF NEW IS DISTINCT FROM OLD`). Even if an `UPDATE` statement leaves all column values identical, `updated_at` will be updated to `NOW()`. This is acceptable standard ERP behavior for optimistic locking and cache invalidation.
3. **Search Path Vulnerability (CWE-426):**
   - The function is declared without an explicit schema search path (`SET search_path = ''` or `SET search_path = public`).
   - In PostgreSQL, functions executed by triggers that do not fix their `search_path` can be vulnerable to search-path manipulation attacks if untrusted schemas exist on the database cluster.

---

## 3. Database Triggers Inventory (25 Triggers in `07_triggers.sql`)

All 25 triggers are configured as `BEFORE UPDATE ON <table> FOR EACH ROW EXECUTE FUNCTION set_updated_at()`.

|     #      | Trigger Name                            | Target Table                | Timing & Event             |  Trigger Status  |
| :--------: | :-------------------------------------- | :-------------------------- | :------------------------- | :--------------: |
|     1      | `trg_organizations_updated`             | `organizations`             | `BEFORE UPDATE`            |    Configured    |
|     2      | `trg_roles_updated`                     | `roles`                     | `BEFORE UPDATE`            |    Configured    |
|     3      | `trg_users_updated`                     | `users`                     | `BEFORE UPDATE`            |    Configured    |
|     4      | `trg_designations_updated`              | `designations`              | `BEFORE UPDATE`            |    Configured    |
|     5      | `trg_departments_updated`               | `departments`               | `BEFORE UPDATE`            |    Configured    |
|     6      | `trg_staff_updated`                     | `staff`                     | `BEFORE UPDATE`            |    Configured    |
|     7      | `trg_parents_updated`                   | `parents`                   | `BEFORE UPDATE`            |    Configured    |
|     8      | `trg_academic_years_updated`            | `academic_years`            | `BEFORE UPDATE`            |    Configured    |
|     9      | `trg_admission_configurations_updated`  | `admission_configurations`  | `BEFORE UPDATE`            |    Configured    |
|     10     | `trg_grades_updated`                    | `grades`                    | `BEFORE UPDATE`            |    Configured    |
|     11     | `trg_academic_year_grades_updated`      | `academic_year_grades`      | `BEFORE UPDATE`            |    Configured    |
|     12     | `trg_sections_updated`                  | `sections`                  | `BEFORE UPDATE`            |    Configured    |
|     13     | `trg_leads_updated`                     | `leads`                     | `BEFORE UPDATE`            |    Configured    |
|     14     | `trg_lead_activities_updated`           | `lead_activities`           | `BEFORE UPDATE`            |    Configured    |
|     15     | `trg_lead_visits_updated`               | `lead_visits`               | `BEFORE UPDATE`            |    Configured    |
|     16     | `trg_admissions_applications_updated`   | `admissions_applications`   | `BEFORE UPDATE`            |    Configured    |
|     17     | `trg_document_types_updated`            | `document_types`            | `BEFORE UPDATE`            |    Configured    |
|     18     | `trg_admission_documents_updated`       | `admission_documents`       | `BEFORE UPDATE`            |    Configured    |
|     19     | `trg_assessment_configurations_updated` | `assessment_configurations` | `BEFORE UPDATE`            |    Configured    |
|     20     | `trg_application_assessments_updated`   | `application_assessments`   | `BEFORE UPDATE`            |    Configured    |
| **DEFECT** | _(Dangling `Create` statement)_         | _None_                      | _Syntax error at line 194_ | **HALTS SCRIPT** |
|     21     | `trg_admission_decisions_updated`       | `admission_decisions`       | `BEFORE UPDATE`            |    Configured    |
|     22     | `trg_admission_fee_payments_updated`    | `admission_fee_payments`    | `BEFORE UPDATE`            |    Configured    |
|     23     | `trg_students_updated`                  | `students`                  | `BEFORE UPDATE`            |    Configured    |
|     24     | `trg_student_parents_updated`           | `student_parents`           | `BEFORE UPDATE`            |    Configured    |
|     25     | `trg_student_enrollments_updated`       | `student_enrollments`       | `BEFORE UPDATE`            |    Configured    |

---

## 4. Trigger Coverage Audit (Missing Triggers Analysis)

The database catalog contains **29 tables** that physically declare an `updated_at` column. However, `07_triggers.sql` attaches triggers to only **25 tables**.

### Tables with `updated_at` Columns Lacking Triggers:

|  #  | Table Name             | Source File & Column Definition                                                                                                                                                                  | Impact of Missing Trigger                                                                                                                                             |
| :-: | :--------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|  1  | **`notifications`**    | [`04_tables.sql:1314`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L1314): `updated_at timestamp with time zone NOT NULL DEFAULT now()`            | When a notification is marked as read (`is_read = true`, `read_at = now()`), `updated_at` will remain unchanged unless explicitly passed in the SQL `UPDATE` payload. |
|  2  | **`countries`**        | [`04_tables.sql:1339`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L1339): `updated_at timestamp with time zone NOT NULL DEFAULT now()`            | Metadata changes to country records will not update timestamp automatically.                                                                                          |
|  3  | **`lead_query_types`** | [`10_alterations.sql:34`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/10_admission_enquiry_alterations.sql#L34): `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()` | Admin updates to query types will have stale `updated_at`.                                                                                                            |
|  4  | **`document_chunks`**  | [`11_vector.sql:28`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/11_document_chunks_vector.sql#L28): `updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()`          | Re-embedding document chunks leaves original ingestion timestamp intact.                                                                                              |

---

## 5. Functions & Triggers Forensic Findings

### FIND-TRG-01: Dangling `Create` Keyword in `07_triggers.sql`

- **Severity:** HIGH
- **Location:** [`apps/database/stage_1/schema/07_triggers.sql:194`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/07_triggers.sql#L194)
- **Evidence:**
  ```sql
  192:     EXECUTE FUNCTION set_updated_at();
  193:
  194: Create
  195: -- ============================================================================
  196: -- ADMISSION DECISIONS
  197: -- ============================================================================
  198:
  199: CREATE TRIGGER trg_admission_decisions_updated
  ```
- **Expected Behavior:** Valid SQL script with properly formed DDL statements.
- **Actual Behavior:** An uncompleted `Create` token sits alone on line 194. When piped to PostgreSQL `psql`, it causes a syntax error:
  `ERROR: syntax error at or near "CREATE"`
  and aborts execution of subsequent triggers (`trg_admission_decisions_updated`, `trg_admission_fee_payments_updated`, `trg_students_updated`, `trg_student_parents_updated`, `trg_student_enrollments_updated`).
- **Confirmation:** Confirmed repository defect.
- **Recommendation:** Document as confirmed DDL defect. In future migration after freeze lift, remove line 194.

### FIND-TRG-02: Missing Triggers on `notifications`, `document_chunks`, `lead_query_types`, and `countries`

- **Severity:** MEDIUM
- **Location:** `apps/database/stage_1/schema/07_triggers.sql`
- **Evidence:** 4 tables with `updated_at` lack `BEFORE UPDATE` trigger attachments.
- **Expected Behavior:** Every table containing an `updated_at` column must have an automated `set_updated_at()` trigger attached, per documented trigger strategy in [`DATABASE_DESIGN.md:405-415`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/DATABASE_DESIGN.md#L405-L415).
- **Actual Behavior:** Stale update timestamps occur whenever updates are performed without explicit timestamp arguments.
- **Recommendation:** Document as maintenance recommendation for Stage 2.
