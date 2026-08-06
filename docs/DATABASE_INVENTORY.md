# EduTrack ERP — Database Schema Inventory Ledger

**Generated Date:** August 5, 2026  
**Source of Truth:** Parsing of Stage-1 SQL DDL scripts in [`apps/database/stage_1/schema/`](file:///c:/Program%20Files/EduTech/apps/database/stage_1/schema) and [`apps/backend/prisma/schema.prisma`](file:///c:/Program%20Files/EduTech/apps/backend/prisma/schema.prisma).

---

## 1. Core Platform Tables (26 Normalized 3NF Tables)

| Table Name                  | Primary Key            | Audit Fields                                           | Key Foreign Relationships                      | Business Purpose                            |
| :-------------------------- | :--------------------- | :----------------------------------------------------- | :--------------------------------------------- | :------------------------------------------ |
| `organizations`             | `org_id` (UUID)        | `created_at`, `updated_at`, `created_by`, `updated_by` | Root Entity                                    | Multi-tenant organization boundaries        |
| `roles`                     | `role_id` (UUID)       | `created_at`, `updated_at`, `created_by`, `updated_by` | `org_id` -> `organizations`                    | User permission roles per tenant            |
| `users`                     | `user_id` (UUID)       | `created_at`, `updated_at`                             | `org_id` -> `organizations`                    | Multi-tenant user identity accounts         |
| `user_roles`                | Composite PK           | `created_at`                                           | `user_id` -> `users`, `role_id` -> `roles`     | User-to-Role assignments                    |
| `departments`               | `department_id`        | `created_at`, `updated_at`                             | `org_id` -> `organizations`                    | Academic and administrative departments     |
| `designations`              | `designation_id`       | `created_at`, `updated_at`                             | `org_id` -> `organizations`                    | Employee job titles                         |
| `staff`                     | `staff_id` (UUID)      | `created_at`, `updated_at`                             | `user_id`, `department_id`, `designation_id`   | HR employee profiles                        |
| `parents`                   | `parent_id` (UUID)     | `created_at`, `updated_at`                             | `user_id` -> `users`                           | Guardian / Parent user records              |
| `academic_years`            | `academic_year_id`     | `created_at`, `updated_at`                             | `org_id` -> `organizations`                    | School academic year calendars              |
| `admission_configurations`  | `config_id`            | `created_at`, `updated_at`                             | `academic_year_id`                             | Admission intake rules and limits           |
| `grades`                    | `grade_id`             | `created_at`, `updated_at`                             | `org_id` -> `organizations`                    | Standard school grades/classes              |
| `academic_year_grades`      | `ay_grade_id`          | `created_at`, `updated_at`                             | `academic_year_id`, `grade_id`                 | Grade configurations per academic year      |
| `sections`                  | `section_id`           | `created_at`, `updated_at`                             | `ay_grade_id` -> `academic_year_grades`        | Class section divisions (A, B, C)           |
| `leads`                     | `lead_id` (UUID)       | `created_at`, `updated_at`                             | `org_id`, `assigned_to` -> `staff`             | CRM sales and inquiry leads                 |
| `lead_activities`           | `activity_id`          | `created_at`, `updated_at`                             | `lead_id` -> `leads`                           | CRM communication call/email logs           |
| `lead_visits`               | `visit_id`             | `created_at`, `updated_at`                             | `lead_id` -> `leads`                           | Scheduled campus visit tracking             |
| `admissions_applications`   | `application_id`       | `created_at`, `updated_at`                             | `lead_id`, `ay_grade_id`                       | Student admission application forms         |
| `document_types`            | `doc_type_id`          | `created_at`, `updated_at`                             | `org_id` -> `organizations`                    | Master document category definitions        |
| `admission_documents`       | `document_id`          | `created_at`, `updated_at`                             | `application_id`, `doc_type_id`                | Uploaded applicant proof documents          |
| `assessment_configurations` | `assessment_config_id` | `created_at`, `updated_at`                             | `ay_grade_id` -> `academic_year_grades`        | Entrance exam scoring rules                 |
| `application_assessments`   | `assessment_id`        | `created_at`, `updated_at`                             | `application_id`, `assessment_config_id`       | Actual applicant entrance exam marks        |
| `admission_decisions`       | `decision_id`          | `created_at`, `updated_at`                             | `application_id`                               | Final admission approval / rejection status |
| `admission_fee_payments`    | `payment_id`           | `created_at`, `updated_at`                             | `application_id`                               | Admission confirmation fee transactions     |
| `students`                  | `student_id` (UUID)    | `created_at`, `updated_at`                             | `org_id`, `user_id`                            | Permanent student master entity             |
| `student_parents`           | Composite PK           | `created_at`, `updated_at`                             | `student_id`, `parent_id`                      | Student-to-Parent relationship matrix       |
| `student_enrollments`       | `enrollment_id`        | `created_at`, `updated_at`                             | `student_id`, `academic_year_id`, `section_id` | Active class and section enrollment record  |

---

## 2. PostgreSQL Functions, Triggers & Extensions

- **Extensions:** `uuid-ossp` ([`01_extensions.sql`](file:///c:/Program%20Files/EduTech/apps/database/stage_1/schema/01_extensions.sql))
- **Stored Functions:** `set_updated_at()` ([`03_functions.sql`](file:///c:/Program%20Files/EduTech/apps/database/stage_1/schema/03_functions.sql))
- **Triggers:** 24 `BEFORE UPDATE` triggers ([`07_triggers.sql`](file:///c:/Program%20Files/EduTech/apps/database/stage_1/schema/07_triggers.sql)) executing `set_updated_at()` across all transactional tables.
- **Circular Foreign Keys:** Deferred FK constraints on `organizations` <-> `users` ([`05_circular_fks.sql`](file:///c:/Program%20Files/EduTech/apps/database/stage_1/schema/05_circular_fks.sql)).
