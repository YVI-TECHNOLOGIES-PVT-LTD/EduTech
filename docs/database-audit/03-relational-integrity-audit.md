# EduTrack ERP — Database Forensic Audit

# Report 03: Relational Integrity & Foreign-Key Audit

**Audit Date:** November 10, 2026  
**Auditor:** Senior PostgreSQL Database Architect & ERP Data-Integrity Engineer  
**Audit Scope:** Relational Cardinality, Foreign-Key Constraints, Referential Cascades, Business-Rule Enforcement, and Orphan-Record Prevention  
**Baseline Files:** `apps/database/stage_1/schema/04_tables.sql`, `05_circular_fks.sql`, `10_alterations.sql`, `apps/backend/prisma/schema.prisma`

---

## 1. Executive Summary

This forensic audit evaluates all 101 foreign-key constraints across the 33 Stage-1 core database entities.

While the schema adheres strictly to Third Normal Form (3NF) by avoiding data duplication (such as computing current grade dynamically from enrollments rather than storing it on the student profile), **the database constraints rely entirely on single-column surrogate keys (UUIDs) without composite relational integrity checks**.

As a consequence, **the database engine cannot physically prevent cross-entity, cross-grade, or cross-tenant data corruption** if application validation is bypassed. The integrity of the academic structure and tenant boundaries is enforced exclusively at the Node.js application layer.

---

## 2. Foreign-Key Hierarchy & Integrity Audit by Domain

### A. Organization & Identity Hierarchy

```
organizations (org_id)
  ├── users (org_id)
  │     ├── user_roles (user_id) ── [role_id] ── roles (org_id)
  │     └── staff (user_id, org_id)
  │           ├── departments (org_id)
  │           └── designations (org_id)
  └── roles (org_id)
```

#### Relational Analysis:

1. **User-Role Cross-Tenant Risk:**
   - Table `user_roles` has columns `(user_id, role_id)`.
   - `user_id` references `users(user_id) ON DELETE CASCADE`.
   - `role_id` references `roles(role_id) ON DELETE RESTRICT`.
   - **Vulnerability:** `user_roles` contains no `org_id` column. If application logic executes `INSERT INTO user_roles (user_id, role_id) VALUES ('user_from_org_A', 'role_from_org_B')`, PostgreSQL successfully inserts the record. A user belonging to School A can be granted administrative privileges of School B at the database level.
2. **Staff Hierarchy Integrity:**
   - Table `staff` references `users(user_id)`, `departments(department_id)`, and `designations(designation_id)`.
   - Each referenced table has its own `org_id`.
   - **Vulnerability:** The database does NOT enforce that `staff.org_id = departments.org_id = designations.org_id = users.org_id`. If an admin assigns Department B to Staff A, the foreign key check passes because the department UUID exists.

---

### B. Academic Structure Hierarchy

```
organizations (org_id)
  ├── academic_years (org_id)
  │     └── academic_year_grades (academic_year_id)
  │           └── sections (academic_year_grade_id)
  └── grades (org_id)
        └── academic_year_grades (grade_id)
```

#### Relational Analysis:

1. **Cross-Tenant Academic Grade Pairing:**
   - `academic_year_grades` references `academic_years(academic_year_id)` and `grades(grade_id)`.
   - It has `UNIQUE(academic_year_id, grade_id)`.
   - **Vulnerability:** `academic_year_grades` does not store `org_id`. There is no check ensuring that `academic_years.org_id == grades.org_id`. An academic year from Organization 1 could theoretically be mapped to a Grade defined under Organization 2.
2. **Section Class Teacher Tenant Boundary:**
   - Table `sections` references `staff(class_teacher_id)`.
   - Neither table enforces tenant equality at the constraint level. A staff member from a different school can be assigned as the class teacher of a section.

---

### C. Admission & CRM Workflow Hierarchy

```
leads (lead_id, org_id, academic_year_grade_id)
  ├── lead_activities (lead_id)
  ├── lead_visits (lead_id, staff_id)
  └── admissions_applications (lead_id, org_id, academic_year_id)
        ├── admission_documents (application_id, document_type_id)
        ├── assessment_configurations (academic_year_grade_id)
        ├── application_assessments (application_id, config_id, assessed_by)
        ├── admission_decisions (application_id, decided_by)
        └── admission_fee_payments (application_id)
```

#### Relational Analysis:

1. **Missing Grade on Admissions Applications:**
   - In `04_tables.sql:754-796`, `admissions_applications` contains `academic_year_id UUID NOT NULL REFERENCES academic_years(academic_year_id)` and `lead_id UUID NOT NULL REFERENCES leads(lead_id)`.
   - In `10_alterations.sql:159`, `lead_id` was altered to **DROP NOT NULL** (allowing direct parent applications without a pre-existing lead).
   - **CRITICAL ARCHITECTURAL GAP:** `admissions_applications` has **NO `grade_id` or `academic_year_grade_id` column**. When `lead_id` is null, the application record stores only `academic_year_id`. The database schema has **NO WAY to know which grade the student applied for** unless derived from an external application payload or lead.
2. **Application ↔ Lead Tenant Mismatch:**
   - `admissions_applications` stores `org_id` and `lead_id`.
   - If `lead_id` belongs to School A and `org_id` is set to School B, the foreign key constraint `FOREIGN KEY (lead_id) REFERENCES leads(lead_id)` passes because it only validates that `lead_id` exists.
3. **Assessment Configuration Mismatch:**
   - `application_assessments` references `admissions_applications(application_id)` and `assessment_configurations(config_id)`.
   - `assessment_configurations` is scoped to `academic_year_grade_id`.
   - Nothing prevents an application for Grade 1 from being assessed using the configuration for Grade 12.

---

### D. Student & Enrollment Relational Integrity

```
students (student_id, org_id, application_id, user_id)
  ├── student_parents (student_id, parent_id)
  └── student_enrollments (student_id, academic_year_grade_id, section_id)
```

#### Relational Analysis:

1. **Grade vs. Section Relational Desynchronization:**
   - `student_enrollments` stores both `academic_year_grade_id` AND `section_id`.
   - `sections` itself stores `academic_year_grade_id`.
   - **Vulnerability:** `student_enrollments` defines two independent foreign keys:
     - `FOREIGN KEY (academic_year_grade_id) REFERENCES academic_year_grades(academic_year_grade_id)`
     - `FOREIGN KEY (section_id) REFERENCES sections(section_id)`
   - There is NO composite foreign key: `FOREIGN KEY (section_id, academic_year_grade_id) REFERENCES sections(section_id, academic_year_grade_id)`.
   - **Business Risk:** A student can be enrolled in Grade 9 (`academic_year_grade_id = AYG_Grade_9`), but assigned to Section A of Grade 10 (`section_id = SEC_Grade_10_A`). The database permits this relational contradiction without error.
2. **Dual Active Enrollments in Same Academic Year:**
   - `student_enrollments` defines: `UNIQUE(student_id, academic_year_grade_id)`.
   - It does NOT define `UNIQUE(student_id, academic_year_id)` (in fact, `academic_year_id` is not even present as a column on `student_enrollments`).
   - **Business Risk:** If an institution has multiple grades in an academic year, a student can have an `active` enrollment record in Grade 5 AND an `active` enrollment record in Grade 6 concurrently. The database cannot enforce that a student belongs to at most one grade per academic year.
3. **Roll Number Uniqueness Scope:**
   - Table `student_enrollments` defines: `UNIQUE(section_id, roll_number)`.
   - Under PostgreSQL standard rules, multiple rows with `roll_number IS NULL` are permitted within the same section.
   - However, once a roll number is assigned (e.g. `'1'`), no two students in that section can share it. This constraint is properly scoped to the section.
4. **Cross-Tenant Student Enrollment:**
   - Table `student_enrollments` has no `org_id`.
   - If Student A (belonging to School 1) is enrolled in `academic_year_grade_id` (belonging to School 2), the database allows it.

---

## 3. Referential Action (`ON DELETE`) Forensic Review

| Foreign Key Relationship                                             |     SQL `ON DELETE` Action      | Forensic Assessment & Lifecycle Risk                                                                                                                       |
| :------------------------------------------------------------------- | :-----------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users.org_id -> organizations`                                      |            `CASCADE`            | **High Impact**: Deleting an organization wipes all users. Appropriate for root tenant teardown.                                                           |
| `staff.user_id -> users`                                             |           `RESTRICT`            | **Protective**: Prevents deleting a user if active staff records exist.                                                                                    |
| `user_roles.user_id -> users`                                        |            `CASCADE`            | **Appropriate**: Removing a user automatically revokes their roles.                                                                                        |
| `user_roles.role_id -> roles`                                        |           `RESTRICT`            | **Protective**: Prevents deleting a role while assigned to active users.                                                                                   |
| `leads.org_id -> organizations`                                      |            `CASCADE`            | **High Impact**: Tenant cascade.                                                                                                                           |
| `leads.academic_year_grade_id -> academic_year_grades`               |           `RESTRICT`            | **Protective**: Prevents deleting an academic grade if leads are linked.                                                                                   |
| `admissions_applications.lead_id -> leads`                           | `SET NULL` (Altered in file 10) | **Safe**: Original `04_tables.sql` had `CASCADE`; altered to `SET NULL` in file 10 so deleting a lead does not delete formal legal admission applications. |
| `admissions_applications.academic_year_id -> academic_years`         |            `CASCADE`            | **DESTRUCTIVE RISK**: Deleting an academic year cascades and **DELETES ALL HISTORICAL ADMISSIONS APPLICATIONS**! Should be `RESTRICT`.                     |
| `students.application_id -> admissions_applications`                 |           `SET NULL`            | **Safe**: Preserves student record if application is archived.                                                                                             |
| `student_enrollments.student_id -> students`                         |            `CASCADE`            | **DESTRUCTIVE RISK**: Deleting a student deletes their entire academic enrollment history.                                                                 |
| `student_enrollments.academic_year_grade_id -> academic_year_grades` |            `CASCADE`            | **DESTRUCTIVE RISK**: Deleting an academic year grade wipes all student enrollments. Should be `RESTRICT`.                                                 |
| `student_enrollments.section_id -> sections`                         |           `SET NULL`            | **Safe**: Deleting a section unassigns students from section without deleting enrollment.                                                                  |
| `admission_fee_payments.application_id -> admissions_applications`   |            `CASCADE`            | **FINANCIAL AUDIT VIOLATION**: Deleting an application deletes financial payment transaction records! Financial records must NEVER cascade delete.         |

---

## 4. Relational Integrity Findings

### FIND-REL-01: Destructive Cascade Delete on Academic Year Applications & Payments

- **Severity:** HIGH
- **Location:** [`04_tables.sql:764`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L764) & [`04_tables.sql:1106`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L1106)
- **Evidence:** `admissions_applications.academic_year_id` specifies `ON DELETE CASCADE`. In turn, `admission_fee_payments.application_id` specifies `ON DELETE CASCADE`.
- **Expected Behavior:** Academic years and applications tied to financial transactions must be protected against accidental deletion via `ON DELETE RESTRICT`.
- **Actual Behavior:** An administrative delete of an `academic_years` record cascades downward, destroying applications, assessment records, decisions, and fee payment receipts.
- **Business Impact:** Catastrophic data loss and financial compliance failure.
- **Recommendation:** When database freeze is lifted, change `ON DELETE CASCADE` to `ON DELETE RESTRICT` on `admissions_applications.academic_year_id` and `admission_fee_payments.application_id`. Ensure application service enforces soft deletes.

### FIND-REL-02: Absence of Direct Grade Reference on `admissions_applications`

- **Severity:** HIGH
- **Location:** [`04_tables.sql:754-796`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L754-L796)
- **Evidence:** `admissions_applications` contains `academic_year_id`, but has no `grade_id` or `academic_year_grade_id`. In `10_alterations.sql:159`, `lead_id` was made nullable.
- **Expected Behavior:** Every admission application must be deterministically tied to the grade applied for.
- **Actual Behavior:** If an application is created directly (with `lead_id = NULL`), the database cannot record which grade the applicant is applying for.
- **Business Impact:** Direct applications cannot identify target grade at database level. Application code must work around this by reading from unmapped DTO fields or requiring a dummy lead.
- **Recommendation:** Document architectural limitation. Stage-2 schema must add `academic_year_grade_id UUID NOT NULL REFERENCES academic_year_grades` to `admissions_applications`.

### FIND-REL-03: Relational Mismatch Permitted Between Section and Grade in `student_enrollments`

- **Severity:** MEDIUM
- **Location:** [`04_tables.sql:1240-1285`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L1240-L1285)
- **Evidence:** `student_enrollments` has independent foreign keys for `academic_year_grade_id` and `section_id`.
- **Expected Behavior:** `section_id` must belong to the exact `academic_year_grade_id` referenced in the enrollment.
- **Actual Behavior:** Database accepts an enrollment record pairing Grade 9 with a Grade 10 section.
- **Business Impact:** Corrupted class rosters, invalid timetable assignments, and grading confusion.
- **Recommendation:** Application service (`student.enrollment.service.ts`) must strictly validate that `section.academic_year_grade_id === enrollment.academic_year_grade_id` prior to persisting.
