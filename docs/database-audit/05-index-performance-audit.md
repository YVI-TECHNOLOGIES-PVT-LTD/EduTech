# EduTrack ERP — Database Forensic Audit

# Report 05: Index Coverage & Query Performance Audit

**Audit Date:** November 10, 2026  
**Auditor:** Senior PostgreSQL Database Architect & Performance Optimization Engineer  
**Audit Scope:** Index Coverage, Redundant Indexes, Duplicate Indexes, Missing Foreign Key Indexes, Query Pattern Analysis, and Write-Amplification Risks  
**Source Baseline:** `apps/database/stage_1/schema/06_indexes.sql`, `10_alterations.sql`, `11_vector.sql`, `schema.prisma`, Backend Repositories

---

## 1. Executive Summary

This forensic audit analyzes the 68 physical indexes declared across the Stage-1 SQL suite, cross-referenced with the application's real query patterns and Prisma schema indexes.

While index coverage for tenant filtering (`org_id`) and core status columns is generally well-structured, the audit identified **multiple duplicate and redundant indexes** that cause unnecessary disk bloat and write-amplification during `INSERT`/`UPDATE` operations.

Furthermore, several critical child lookup foreign keys (including `staff(user_id)`, `admission_decisions(application_id)`, and `admission_fee_payments(application_id)`) lack dedicated indexes, creating risk of sequential scans during join operations and cascade deletions.

---

## 2. Complete Index Inventory Analysis

The Stage-1 SQL files declare 68 index definitions:

- **65 indexes** in [`06_indexes.sql`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/06_indexes.sql)
- **2 indexes** in [`10_admission_enquiry_alterations.sql`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/10_admission_enquiry_alterations.sql) (`idx_lead_query_type_mappings_query_type`, `idx_leads_parent_id`)
- **1 index** in [`11_document_chunks_vector.sql`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/11_document_chunks_vector.sql) (`ix_document_chunks_org`)

---

## 3. Redundant & Duplicate Indexes Forensic Audit

In PostgreSQL, every `UNIQUE` constraint automatically creates a backing B-tree index. Additionally, a B-tree index on composite columns `(col_a, col_b)` serves any query searching on `col_a` alone. Separate indexes on `col_a` or exact duplicates of unique constraints are completely redundant.

### A. Exact Duplicate Indexes (Unique Constraint Backing)

| Index Name                           | Table                     | Indexed Column(s)    | Existing Unique Constraint                                             | Verdict                                                                     |
| :----------------------------------- | :------------------------ | :------------------- | :--------------------------------------------------------------------- | :-------------------------------------------------------------------------- |
| `ix_leads_lead_number`               | `leads`                   | `lead_number`        | `lead_number VARCHAR(30) NOT NULL UNIQUE` (`04_tables.sql:541`)        | **100% DUPLICATE**. Wastes disk space and doubles B-tree write overhead.    |
| `ix_admissions_applications_number`  | `admissions_applications` | `application_number` | `application_number VARCHAR(30) NOT NULL UNIQUE` (`04_tables.sql:767`) | **100% DUPLICATE**. Wastes disk space and doubles B-tree write overhead.    |
| `ix_leads_org` vs `idx_leads_org_id` | `leads`                   | `org_id`             | Both index `org_id` on table `leads`                                   | **100% DUPLICATE**. Two identical single-column indexes on `leads(org_id)`. |

### B. Redundant Prefix Indexes (Covered by Composite Unique Constraints)

| Index Name                              | Table                  | Indexed Column     | Composite Constraint Available       | Why It Is Redundant                                                                           |
| :-------------------------------------- | :--------------------- | :----------------- | :----------------------------------- | :-------------------------------------------------------------------------------------------- |
| `ix_users_org`                          | `users`                | `org_id`           | `UNIQUE(org_id, email)`              | Any query `WHERE org_id = $1` can use the leading edge of the `(org_id, email)` unique index. |
| `ix_roles_org`                          | `roles`                | `org_id`           | `UNIQUE(org_id, role_name)`          | Covered by leading edge of `(org_id, role_name)`.                                             |
| `ix_designations_org`                   | `designations`         | `org_id`           | `UNIQUE(org_id, designation_name)`   | Covered by leading edge of `(org_id, designation_name)`.                                      |
| `ix_departments_org`                    | `departments`          | `org_id`           | `UNIQUE(org_id, department_name)`    | Covered by leading edge of `(org_id, department_name)`.                                       |
| `ix_academic_year_grades_academic_year` | `academic_year_grades` | `academic_year_id` | `UNIQUE(academic_year_id, grade_id)` | Covered by leading edge of `(academic_year_id, grade_id)`.                                    |

---

## 4. Missing Index Analysis on Foreign Keys

PostgreSQL does NOT automatically index foreign key columns. If a foreign key is unindexed, parent table deletions (`ON DELETE CASCADE` or `RESTRICT`) trigger sequential table scans on the child table, causing lock contention and severe latency spikes.

### Critical Foreign Keys Lacking Index Coverage

| Table                     | Column                                        | References                                |  Severity  | Performance Risk                                                                                                                                                                                    |
| :------------------------ | :-------------------------------------------- | :---------------------------------------- | :--------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `staff`                   | `user_id`                                     | `users(user_id)`                          |  **HIGH**  | User login and profile lookup requires resolving `staff` record by `user_id`. Table scan without index.                                                                                             |
| `admission_decisions`     | `application_id`                              | `admissions_applications(application_id)` |  **HIGH**  | 1:1 decision lookup per application; joins without index.                                                                                                                                           |
| `admission_fee_payments`  | `application_id`                              | `admissions_applications(application_id)` |  **HIGH**  | Payment status checks per application trigger sequential scans.                                                                                                                                     |
| `application_assessments` | `config_id`                                   | `assessment_configurations(config_id)`    | **MEDIUM** | Aggregations by assessment configuration scan the entire assessments table.                                                                                                                         |
| `chatbot_sessions`        | `escalated_to_staff_id`                       | `staff(staff_id)`                         | **MEDIUM** | Staff escalation queues scan active chatbot sessions.                                                                                                                                               |
| **All Audit Columns**     | `created_by`, `updated_by` (Across 25 tables) | `users(user_id)`                          |  **LOW**   | Deleting or updating a user record in `users` requires PostgreSQL to check every child table's `created_by`/`updated_by` foreign key. Without indexes, this triggers sequential scans on 25 tables. |

---

## 5. Index Naming & Semantic Defects

### FIND-IDX-01: Index Naming / Target Column Inconsistency

- **Severity:** LOW
- **Location:** [`apps/database/stage_1/schema/06_indexes.sql:165-166`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/06_indexes.sql#L165-L166)
- **Evidence:**
  ```sql
  CREATE INDEX ix_admissions_applications_academic_year_grade
  ON admissions_applications (academic_year_id);
  ```
- **Analysis:** The index is named `ix_admissions_applications_academic_year_grade`, suggesting it indexes `academic_year_grade_id`. However, the column physically indexed is `academic_year_id`. This reflects historical confusion where `academic_year_grade_id` was expected on `admissions_applications` but only `academic_year_id` was created.
- **Impact:** Misleading for database administrators and query tuning tools.
- **Recommendation:** Document name inconsistency. When freeze is lifted, rename index to `ix_admissions_applications_academic_year`.

### FIND-IDX-02: Index on Non-Existent Column `chatbot_sessions(lead_activity_id)`

- **Severity:** HIGH
- **Location:** [`apps/database/stage_1/schema/06_indexes.sql:283-284`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/06_indexes.sql#L283-L284)
- **Evidence:**
  ```sql
  CREATE INDEX ix_chatbot_sessions_lead_activity
  ON chatbot_sessions(lead_activity_id);
  ```
- **Analysis:** Column `lead_activity_id` is NOT defined in `04_tables.sql` for table `chatbot_sessions`.
- **Impact:** Executing `06_indexes.sql` against a clean database created from `04_tables.sql` fails with:
  `ERROR: column "lead_activity_id" does not exist`.
- **Confirmation:** Confirmed repository defect.
- **Recommendation:** Blocked by database freeze. Document as verified defect.

---

## 6. Query Pattern Review from Backend Application Code

| Query Pattern                                | Entity                | Backend Service / Controller           | Current Index Coverage                                                            | Evaluation                                                                                                  |
| :------------------------------------------- | :-------------------- | :------------------------------------- | :-------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------- |
| Filter leads by `org_id` and `stage`         | `leads`               | `lead.controller.ts`, `lead.search.ts` | `ix_leads_org`, `ix_leads_stage`                                                  | **OPTIMAL**: B-tree index on each column. Composite `(org_id, stage)` would improve high-volume throughput. |
| Search lead by phone/email                   | `leads`               | `EnquiryRepository.ts`                 | **NONE** on `contact_phone` / `contact_email`                                     | **SUB-OPTIMAL**: Deduplication lookups scan leads table by phone/email.                                     |
| Fetch unread notifications for user          | `notifications`       | `notification.controller.ts`           | `ix_notifications_recipient_unread (recipient_user_id, is_read, created_at DESC)` | **HIGHLY OPTIMIZED**: Composite covering index matches query perfectly.                                     |
| Fetch student by `admission_no` and `org_id` | `students`            | `student.repository.ts:39`             | `ix_students_org`, `ix_students_admission_number`                                 | **GOOD**: Covered.                                                                                          |
| Look up document by application and type     | `admission_documents` | `admission-document.controller.ts`     | `ix_admission_documents_application`, `ix_admission_documents_document_type`      | **GOOD**: Covered by separate indexes.                                                                      |
