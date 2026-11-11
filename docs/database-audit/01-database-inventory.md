# EduTrack ERP — Database Forensic Audit

# Report 01: Complete Database Inventory & Catalog

**Audit Date:** November 10, 2026  
**Auditor:** Senior PostgreSQL Database Architect & Forensic Auditor  
**Audit Scope:** Finalized DDL SQL Scripts, Prisma Schema, Migration Framework, Functions, Triggers, Views, and Catalog Objects  
**Audit Baseline:** Stage-1 Design Freeze

---

## 1. Executive Summary

This inventory document establishes the complete, authoritative catalog of all database objects discovered across the EduTrack ERP repository.

Every database object is mapped to its physical source file, declaration type, object name, operational domain, and current implementation status.

### Summary Statistics

| Category                       | Authoritative SQL (`apps/database/stage_1/schema/`) | Prisma Schema (`apps/backend/prisma/schema.prisma`) | Delta / Investigation Note                                                |
| :----------------------------- | :-------------------------------------------------: | :-------------------------------------------------: | :------------------------------------------------------------------------ |
| **Physical SQL Files**         |                         11                          |                         N/A                         | DDL, alterations, extensions, RLS, views, triggers                        |
| **PostgreSQL Extensions**      |                          2                          |                         N/A                         | `pgcrypto`, `vector` (pgvector)                                           |
| **Tables / Models**            |                         33                          |                         109                         | 33 Stage-1 core tables; 76 additional models in Prisma (Stages 2–4)       |
| **Enums**                      |                         37                          |                         78                          | 37 defined in SQL (1 duplicated); 41 additional enums in Prisma           |
| **Indexes**                    |                         68                          |                        120+                         | 65 in `06_indexes.sql`, 2 in `10_alterations.sql`, 1 in `11_vector.sql`   |
| **Foreign Key Constraints**    |                         101                         |                   140+ relations                    | 99 in `04_tables.sql`, 2 in `05_circular_fks.sql`, alterations in file 10 |
| **Database Functions**         |                          1                          |                         N/A                         | `set_updated_at()` PL/pgSQL function                                      |
| **Database Triggers**          |                         25                          |                         N/A                         | 25 `BEFORE UPDATE` triggers in `07_triggers.sql`                          |
| **Database Views**             |                          1                          |                         N/A                         | `chatbot_transcripts` in `09_views.sql`                                   |
| **RLS Policies**               |                          2                          |                         N/A                         | Defined only for `chatbot_sessions` & `chatbot_messages`                  |
| **Migration Scripts (Runner)** |                         13                          |                         N/A                         | Custom Supabase migration runner scripts in `apps/backend/scripts/`       |

---

## 2. PostgreSQL Extensions Inventory

| Extension Name | Declared In                                                                                                                                       | Purpose                                                  | Status in Frozen DDL            | Risk / Requirement                                                 |
| :------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------- | :------------------------------ | :----------------------------------------------------------------- |
| **`pgcrypto`** | [`01_extensions.sql:1`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/01_extensions.sql#L1)                         | Cryptographic functions and `gen_random_uuid()` fallback | Active                          | Low risk; standard PostgreSQL extension                            |
| **`vector`**   | [`11_document_chunks_vector.sql:6`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/11_document_chunks_vector.sql#L6) | Multi-tenant RAG vector embeddings (`vector(3072)`)      | Active (Chatbot Knowledge Base) | Requires `pgvector` shared library installed on PostgreSQL cluster |

---

## 3. Database Tables & Prisma Models Inventory

The repository contains 33 physical table definitions across the `apps/database/stage_1/schema/` SQL suite, and 109 models in `apps/backend/prisma/schema.prisma`. All 33 SQL tables have direct corresponding models in `schema.prisma`.

### Table-to-Model Mapping (33 Stage-1 Core Tables)

|  #  | SQL Table Name              | Source SQL File & Lines                                                                                                                                | Prisma Model Name           | Module Domain          | Primary Key                     | Has `org_id`? |
| :-: | :-------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------- | :--------------------- | :------------------------------ | :-----------: |
|  1  | `organizations`             | [`04_tables.sql:5-46`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L5-L46)                               | `organizations`             | Core Tenant Root       | `org_id` (UUID)                 |   **ROOT**    |
|  2  | `users`                     | [`04_tables.sql:53-93`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L53-L93)                             | `users`                     | Identity & RBAC        | `user_id` (UUID)                |    **YES**    |
|  3  | `roles`                     | [`04_tables.sql:99-131`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L99-L131)                           | `roles`                     | Identity & RBAC        | `role_id` (UUID)                |    **YES**    |
|  4  | `user_roles`                | [`04_tables.sql:138-156`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L138-L156)                         | `user_roles`                | Identity & RBAC        | `(user_id, role_id)`            |      NO       |
|  5  | `designations`              | [`04_tables.sql:163-187`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L163-L187)                         | `designations`              | HR Master              | `designation_id` (UUID)         |    **YES**    |
|  6  | `departments`               | [`04_tables.sql:194-218`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L194-L218)                         | `departments`               | HR Master              | `department_id` (UUID)          |    **YES**    |
|  7  | `staff`                     | [`04_tables.sql:224-262`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L224-L262)                         | `staff`                     | HR Master              | `staff_id` (UUID)               |    **YES**    |
|  8  | `parents`                   | [`04_tables.sql:268-305`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L268-L305)                         | `parents`                   | Parent Portal          | `parent_id` (UUID)              |    **YES**    |
|  9  | `academic_years`            | [`04_tables.sql:311-346`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L311-L346)                         | `academic_years`            | Academic Configuration | `academic_year_id` (UUID)       |    **YES**    |
| 10  | `admission_configurations`  | [`04_tables.sql:352-405`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L352-L405)                         | `admission_configurations`  | Admission Setup        | `admission_config_id` (UUID)    |    **YES**    |
| 11  | `grades`                    | [`04_tables.sql:411-447`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L411-L447)                         | `grades`                    | Academic Structure     | `grade_id` (UUID)               |    **YES**    |
| 12  | `academic_year_grades`      | [`04_tables.sql:453-485`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L453-L485)                         | `academic_year_grades`      | Academic Structure     | `academic_year_grade_id` (UUID) |      NO       |
| 13  | `sections`                  | [`04_tables.sql:491-528`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L491-L528)                         | `sections`                  | Academic Structure     | `section_id` (UUID)             |      NO       |
| 14  | `leads`                     | [`04_tables.sql:534-612`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L534-L612)                         | `leads`                     | CRM & Pipeline         | `lead_id` (UUID)                |    **YES**    |
| 15  | `lead_activities`           | [`04_tables.sql:618-653`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L618-L653)                         | `lead_activities`           | CRM & Pipeline         | `activity_id` (UUID)            |      NO       |
| 16  | `chatbot_sessions`          | [`04_tables.sql:659-683`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L659-L683)                         | `chatbot_sessions`          | AI Admissions Bot      | `session_id` (UUID)             |    **YES**    |
| 17  | `chatbot_messages`          | [`04_tables.sql:688-702`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L688-L702)                         | `chatbot_messages`          | AI Admissions Bot      | `message_id` (UUID)             |      NO       |
| 18  | `lead_visits`               | [`04_tables.sql:707-748`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L707-L748)                         | `lead_visits`               | CRM & Pipeline         | `visit_id` (UUID)               |      NO       |
| 19  | `admissions_applications`   | [`04_tables.sql:754-796`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L754-L796)                         | `admissions_applications`   | Admission Workflow     | `application_id` (UUID)         |    **YES**    |
| 20  | `document_types`            | [`04_tables.sql:802-840`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L802-L840)                         | `document_types`            | Admission Workflow     | `document_type_id` (UUID)       |    **YES**    |
| 21  | `admission_documents`       | [`04_tables.sql:846-890`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L846-L890)                         | `admission_documents`       | Admission Workflow     | `document_id` (UUID)            |      NO       |
| 22  | `assessment_configurations` | [`04_tables.sql:896-962`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L896-L962)                         | `assessment_configurations` | Assessment Engine      | `config_id` (UUID)              |      NO       |
| 23  | `application_assessments`   | [`04_tables.sql:968-1044`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L968-L1044)                       | `application_assessments`   | Assessment Engine      | `assessment_id` (UUID)          |      NO       |
| 24  | `admission_decisions`       | [`04_tables.sql:1050-1095`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L1050-L1095)                     | `admission_decisions`       | Admission Decision     | `decision_id` (UUID)            |      NO       |
| 25  | `admission_fee_payments`    | [`04_tables.sql:1101-1138`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L1101-L1138)                     | `admission_fee_payments`    | Fee Collection (Temp)  | `payment_id` (UUID)             |      NO       |
| 26  | `students`                  | [`04_tables.sql:1144-1196`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L1144-L1196)                     | `students`                  | Student Master         | `student_id` (UUID)             |    **YES**    |
| 27  | `student_parents`           | [`04_tables.sql:1202-1234`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L1202-L1234)                     | `student_parents`           | Student Master         | `(student_id, parent_id)`       |      NO       |
| 28  | `student_enrollments`       | [`04_tables.sql:1240-1285`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L1240-L1285)                     | `student_enrollments`       | Enrollment             | `enrollment_id` (UUID)          |      NO       |
| 29  | `notifications`             | [`04_tables.sql:1288-1328`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L1288-L1328)                     | `notifications`             | Notification Center    | `notification_id` (UUID)        |    **YES**    |
| 30  | `countries`                 | [`04_tables.sql:1331-1344`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/04_tables.sql#L1331-L1344)                     | `countries`                 | Common Master          | `country_id` (UUID)             |  NO (Global)  |
| 31  | `lead_query_types`          | [`10_alterations.sql:12-42`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/10_admission_enquiry_alterations.sql#L12-L42) | `lead_query_types`          | CRM Enquiry            | `query_type_id` (UUID)          |    **YES**    |
| 32  | `lead_query_type_mappings`  | [`10_alterations.sql:46-60`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/10_admission_enquiry_alterations.sql#L46-L60) | `lead_query_type_mappings`  | CRM Enquiry            | `(lead_id, query_type_id)`      |      NO       |
| 33  | `document_chunks`           | [`11_vector.sql:9-31`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/11_document_chunks_vector.sql#L9-L31)               | `document_chunks`           | AI RAG Vector Store    | `chunk_id` (UUID)               |    **YES**    |

---

## 4. Prisma-Only Models Inventory (76 Models Beyond Stage-1 SQL)

The following 76 models are defined in `apps/backend/prisma/schema.prisma` but have NO corresponding DDL in `apps/database/stage_1/schema/`. They represent subsequent stages (Stage 2 Academic Planning, Stage 3/4 Finance & Communication, Timetable, Helpdesk).

```text
1.  academic_calendar_entries
2.  academic_calendar_entry_grades
3.  academic_calendar_publication_history
4.  academic_calendar_working_days
5.  academic_calendars
6.  academic_terms
7.  academic_year_curriculum_mappings
8.  academic_year_grade_subjects
9.  bank_statement_entries
10. bell_schedule_days
11. bell_schedule_periods
12. bell_schedules
13. classrooms
14. curriculum_framework_versions
15. curriculum_frameworks
16. curriculum_learning_outcomes
17. curriculum_plan_units
18. curriculum_plans
19. fee_components
20. fee_structures
21. feed_comments
22. feed_post_academic_year_grade_targets
23. feed_post_allowed_reactions
24. feed_post_reactions
25. feed_post_section_targets
26. feed_post_student_targets
27. feed_posts
28. feed_reaction_types
29. gateway_settlement_items
30. gateway_settlements
31. helpdesk_attachments
32. helpdesk_categories
33. helpdesk_escalation_rules
34. helpdesk_messages
35. helpdesk_ticket_history
36. helpdesk_tickets
37. installment_plan_terms
38. installment_plans
39. learning_resource_grades
40. learning_resource_recipients
41. learning_resource_share_sections
42. learning_resource_shares
43. learning_resource_subjects
44. learning_resource_tags
45. learning_resources
46. lesson_activities
47. lesson_differentiation_strategies
48. lesson_exit_tickets
49. lesson_plan_outcomes
50. lesson_plan_resources
51. lesson_plans
52. payment_adjustments
53. payment_allocations
54. payment_orders
55. payment_reconciliation_matches
56. payment_reconciliation_runs
57. payment_refunds
58. payment_transactions
59. payment_webhook_events
60. resource_categories
61. resource_tags
62. scholarship_concession_approval_history
63. scholarship_concessions
64. section_subject_faculty_assignments
65. staff_subject_qualifications
66. staff_unavailable_slots
67. student_charge_dues
68. student_charges
69. student_fee_assignments
70. subject_categories
71. subject_selection_group_options
72. subject_selection_groups
73. subjects
74. timetable_entries
75. timetable_publication_history
76. timetable_versions
```

---

## 5. PostgreSQL Enums Inventory

### Enums Declared in Stage-1 SQL (`02_enums.sql` & `10_alterations.sql`)

|     #      | SQL Enum Name               | Defined Values                                                                                                                                                                                                              | File Location                                |            Mapped in Prisma?            |
| :--------: | :-------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------- | :-------------------------------------: |
|     1      | `user_status`               | `active`, `inactive`, `suspended`                                                                                                                                                                                           | `02_enums.sql:1`                             |                   YES                   |
|     2      | `gender_type`               | `male`, `female`, `other`, `undisclosed`                                                                                                                                                                                    | `02_enums.sql:7`                             |                   YES                   |
|     3      | `subscription_tier`         | `starter`, `standard`, `enterprise`                                                                                                                                                                                         | `02_enums.sql:14`                            |                   YES                   |
|     4      | `academic_year_status`      | `planning`, `open`, `admissions_open`, `teaching`, `examinations`, `closed`, `archived`                                                                                                                                     | `02_enums.sql:20`                            |                   YES                   |
|     5      | `lead_stage`                | `enquiry_received`, `qualified`, `counselling_scheduled`, `campus_visit`, `application_submitted`, `document_verification`, `assessment`, `admission_approved`, `waitlisted`, `rejected`, `fee_payment_pending`, `enrolled` | `02_enums.sql:30`                            |                   YES                   |
|     6      | `lead_source`               | `website`, `walk_in`, `referral`, `social_media`, `chatbot`, `qr_code`, `education_fair`, `phone_call`, `email`, `other`                                                                                                    | `02_enums.sql:45`                            |                   YES                   |
|     7      | `lead_priority`             | Original: `hot`, `warm`, `cold`. Renamed: `high`, `medium`, `low`                                                                                                                                                           | `02_enums.sql:58`, `10_alterations.sql:206`  |      YES (`high`, `medium`, `low`)      |
|     8      | `lead_activity_type`        | `phone_call`, `email`, `whatsapp`, `chatbot`, `follow_up`, `counselling`, `application_submitted`, `note`, `campus_visit`, `application_started`                                                                            | `02_enums.sql:64`, `10_alterations.sql:211`  |                   YES                   |
|     9      | `activity_status`           | `scheduled`, `completed`, `cancelled`                                                                                                                                                                                       | `02_enums.sql:75`                            |                   YES                   |
|     10     | `visit_type`                | `campus`, `virtual`                                                                                                                                                                                                         | `02_enums.sql:81`                            |                   YES                   |
|     11     | `visit_status`              | `scheduled`, `completed`, `cancelled`, `no_show`                                                                                                                                                                            | `02_enums.sql:86`                            |                   YES                   |
|     12     | `relationship_type`         | `father`, `mother`, `guardian`, `grandparent`, `other`                                                                                                                                                                      | `02_enums.sql:93`                            |                   YES                   |
|     13     | `document_verify_status`    | `pending`, `verified`, `rejected`, `resubmission_requested`                                                                                                                                                                 | `02_enums.sql:101`                           |                   YES                   |
|     14     | `assessment_mode`           | `written`, `online`, `oral`, `observation`, `practical`                                                                                                                                                                     | `02_enums.sql:108`                           |                   YES                   |
|     15     | `assessment_result_type`    | `marks`, `pass_fail`, `recommendation`                                                                                                                                                                                      | `02_enums.sql:116`                           |                   YES                   |
|     16     | `assessment_result`         | `pass`, `fail`, `recommended`, `not_recommended`, `conditional_pass`                                                                                                                                                        | `02_enums.sql:122`, `10_alterations.sql:217` |                   YES                   |
|     17     | `admission_decision_status` | `approved`, `waitlisted`, `rejected`, `withdrawn`                                                                                                                                                                           | `02_enums.sql:129`                           |                   YES                   |
|     18     | `admission_payment_status`  | `pending`, `partial`, `paid`, `failed`, `waived`, `refunded`                                                                                                                                                                | `02_enums.sql:136`                           |                   YES                   |
|     19     | `enrollment_status`         | `active`, `transferred_out`, `graduated`, `withdrawn`                                                                                                                                                                       | `02_enums.sql:145`                           |                   YES                   |
|     20     | `assignment_type`           | `written_response`, `video_presentation`, `audio_submission`, `quiz`, `draw_and_answer`, `match_pairs`, `fill_in_blanks`, `reading_assessment`, `public_speaking`, `code_simulator`                                         | `02_enums.sql:157`                           |                   YES                   |
|     21     | `submission_status`         | `not_submitted`, `submitted`, `under_review`, `evaluated`, `returned`                                                                                                                                                       | `02_enums.sql:170`                           |                   YES                   |
|     22     | `assessment_kind`           | `formative`, `summative`, `diagnostic`, `competency_based`, `skill_based`, `project_based`, `viva`, `portfolio`                                                                                                             | `02_enums.sql:179`                           |                   YES                   |
|     23     | `attendance_status`         | `present`, `absent`, `late`, `half_day`, `on_leave`                                                                                                                                                                         | `02_enums.sql:190`                           |                   YES                   |
|     24     | `payment_mode`              | `upi`, `credit_card`, `debit_card`, `net_banking`, `enach`, `qr`, `emi`, `cash`, `cheque`                                                                                                                                   | `02_enums.sql:202`                           |                   YES                   |
|     25     | `payment_status`            | `pending`, `partial`, `paid`, `overdue`, `failed`, `refunded`                                                                                                                                                               | `02_enums.sql:214`                           |                   YES                   |
|     26     | `loan_status`               | `applied`, `under_review`, `approved`, `disbursed`, `rejected`, `closed`                                                                                                                                                    | `02_enums.sql:223`                           |                   YES                   |
|     27     | `concern_status`            | `open`, `in_progress`, `escalated`, `resolved`, `closed`                                                                                                                                                                    | `02_enums.sql:236`                           | YES (+ `waiting_for_parent` in Prisma)  |
|     28     | `compliance_doc_status`     | `valid`, `expiring_soon`, `expired`, `renewal_in_progress`                                                                                                                                                                  | `02_enums.sql:248`                           |                   YES                   |
|     29     | `audit_type`                | `scheduled`, `unannounced`                                                                                                                                                                                                  | `02_enums.sql:255`                           |                   YES                   |
|     30     | `prediction_type`           | `dropout_risk`, `fee_default_risk`, `admission_conversion`, `teacher_attrition_risk`, `learning_gap`                                                                                                                        | `02_enums.sql:264`                           |                   YES                   |
|     31     | `application_status`        | `submitted`, `documents_pending`, `assessment_pending`, `under_review`, `approved`, `waitlisted`, `rejected`, `withdrawn`                                                                                                   | `02_enums.sql:273`                           |                   YES                   |
|     32     | `scholarship_type`          | `merit`, `sports`, `need_based`, `government`, `management`                                                                                                                                                                 | `02_enums.sql:292`                           |                   YES                   |
|     33     | `chatbot_channel`           | `web_widget`, `whatsapp`, `ivr`, `mobile_app`                                                                                                                                                                               | `02_enums.sql:301`                           |                   YES                   |
|     34     | `chatbot_status`            | `active`, `completed`, `escalated`, `abandoned`                                                                                                                                                                             | `02_enums.sql:308`                           |                   YES                   |
|     35     | `chatbot_sender`            | `user`, `bot`, `staff`                                                                                                                                                                                                      | `02_enums.sql:315`                           |                   YES                   |
|     36     | `admission_payment_mode`    | `cash`, `card`, `bank_transfer`, `upi`                                                                                                                                                                                      | `02_enums.sql:322`                           |                   YES                   |
|     37     | `notification_category`     | `ADMISSION`, `ATTENDANCE`, `FEE`, `EXAM`, `SYSTEM`                                                                                                                                                                          | `02_enums.sql:329` & `337` (**DUPLICATE**)   |                   YES                   |
| **DEFECT** | `notification_priority`     | Missing from `02_enums.sql`! (Referenced in `04_tables.sql:1296`)                                                                                                                                                           | **MISSING IN SQL**                           | YES (`LOW`, `NORMAL`, `HIGH`, `URGENT`) |

---

## 6. PostgreSQL Triggers & Functions Inventory

### Function

- **Name:** `set_updated_at()`
- **Language:** PL/pgSQL
- **Location:** [`03_functions.sql:5-13`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/03_functions.sql#L5-L13)
- **Implementation:**
  ```sql
  CREATE OR REPLACE FUNCTION set_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  ```

### Triggers (25 Attached `BEFORE UPDATE` Triggers in `07_triggers.sql`)

|  #  | Trigger Name                            | Target Table                | Event           | Function Invoked   |
| :-: | :-------------------------------------- | :-------------------------- | :-------------- | :----------------- |
|  1  | `trg_organizations_updated`             | `organizations`             | `BEFORE UPDATE` | `set_updated_at()` |
|  2  | `trg_roles_updated`                     | `roles`                     | `BEFORE UPDATE` | `set_updated_at()` |
|  3  | `trg_users_updated`                     | `users`                     | `BEFORE UPDATE` | `set_updated_at()` |
|  4  | `trg_designations_updated`              | `designations`              | `BEFORE UPDATE` | `set_updated_at()` |
|  5  | `trg_departments_updated`               | `departments`               | `BEFORE UPDATE` | `set_updated_at()` |
|  6  | `trg_staff_updated`                     | `staff`                     | `BEFORE UPDATE` | `set_updated_at()` |
|  7  | `trg_parents_updated`                   | `parents`                   | `BEFORE UPDATE` | `set_updated_at()` |
|  8  | `trg_academic_years_updated`            | `academic_years`            | `BEFORE UPDATE` | `set_updated_at()` |
|  9  | `trg_admission_configurations_updated`  | `admission_configurations`  | `BEFORE UPDATE` | `set_updated_at()` |
| 10  | `trg_grades_updated`                    | `grades`                    | `BEFORE UPDATE` | `set_updated_at()` |
| 11  | `trg_academic_year_grades_updated`      | `academic_year_grades`      | `BEFORE UPDATE` | `set_updated_at()` |
| 12  | `trg_sections_updated`                  | `sections`                  | `BEFORE UPDATE` | `set_updated_at()` |
| 13  | `trg_leads_updated`                     | `leads`                     | `BEFORE UPDATE` | `set_updated_at()` |
| 14  | `trg_lead_activities_updated`           | `lead_activities`           | `BEFORE UPDATE` | `set_updated_at()` |
| 15  | `trg_lead_visits_updated`               | `lead_visits`               | `BEFORE UPDATE` | `set_updated_at()` |
| 16  | `trg_admissions_applications_updated`   | `admissions_applications`   | `BEFORE UPDATE` | `set_updated_at()` |
| 17  | `trg_document_types_updated`            | `document_types`            | `BEFORE UPDATE` | `set_updated_at()` |
| 18  | `trg_admission_documents_updated`       | `admission_documents`       | `BEFORE UPDATE` | `set_updated_at()` |
| 19  | `trg_assessment_configurations_updated` | `assessment_configurations` | `BEFORE UPDATE` | `set_updated_at()` |
| 20  | `trg_application_assessments_updated`   | `application_assessments`   | `BEFORE UPDATE` | `set_updated_at()` |
| 21  | `trg_admission_decisions_updated`       | `admission_decisions`       | `BEFORE UPDATE` | `set_updated_at()` |
| 22  | `trg_admission_fee_payments_updated`    | `admission_fee_payments`    | `BEFORE UPDATE` | `set_updated_at()` |
| 23  | `trg_students_updated`                  | `students`                  | `BEFORE UPDATE` | `set_updated_at()` |
| 24  | `trg_student_parents_updated`           | `student_parents`           | `BEFORE UPDATE` | `set_updated_at()` |
| 25  | `trg_student_enrollments_updated`       | `student_enrollments`       | `BEFORE UPDATE` | `set_updated_at()` |

---

## 7. PostgreSQL Views Inventory

| View Name                 | Source File                                                                                                            | Base Tables                                     | Purpose                                                          |
| :------------------------ | :--------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------- | :--------------------------------------------------------------- |
| **`chatbot_transcripts`** | [`09_views.sql:1-19`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/09_views.sql#L1-L19) | `chatbot_sessions`, `chatbot_messages`, `leads` | Flattened chronological transcript view of chatbot conversations |

---

## 8. Row Level Security (RLS) Inventory

| Target Table            | Source File                                                                                                        | RLS Enabled?  | Policy Name                         | Policy Definition                                                                                                                  |
| :---------------------- | :----------------------------------------------------------------------------------------------------------------- | :-----------: | :---------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------- |
| `chatbot_sessions`      | [`08_rls.sql:1-4`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/08_rls.sql#L1-L4)   | YES (`FORCE`) | `tenant_isolation_chatbot_sessions` | `USING (org_id = current_setting('app.current_org_id', true)::UUID)`                                                               |
| `chatbot_messages`      | [`08_rls.sql:7-15`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/schema/08_rls.sql#L7-L15) | YES (`FORCE`) | `tenant_isolation_chatbot_messages` | `USING (session_id IN (SELECT session_id FROM chatbot_sessions WHERE org_id = current_setting('app.current_org_id', true)::UUID))` |
| **All other 31 tables** | N/A                                                                                                                |    **NO**     | None                                | No RLS policies defined in Stage-1 SQL suite                                                                                       |

---

## 9. Migration History Inventory

| Artifact                           | Location                                   | Type                       | Notes                                                                                |
| :--------------------------------- | :----------------------------------------- | :------------------------- | :----------------------------------------------------------------------------------- |
| `migration-report.md`              | `apps/backend/reports/migration-report.md` | Execution Report           | Simulated DRY-RUN execution dated 2026-07-24 for 139 migrations (`000` to `140`)     |
| `migration-2026-07-24T08-04.log`   | `apps/backend/logs/`                       | Log file                   | Evaluated 139 migrations, detected critical drop errors on core objects              |
| `run-migration-110.js` to `120.js` | `apps/backend/scripts/`                    | Standalone Node.js scripts | Individual migration runners targeting Supabase RPC `exec_transaction_queries`       |
| `database/migrations/`             | Missing directory                          | Migration scripts          | Scripts reference `../database/migrations/*.sql` which is absent from source control |

---

## 10. Audit Verification Verdict

- Total Stage-1 SQL tables verified: **33**
- Total Prisma models verified: **109** (all 33 SQL tables represented, plus 76 stage 2–4 models)
- Total SQL enums verified: **37** (1 duplicated, 1 missing)
- Total Prisma enums verified: **78**
- Total SQL triggers verified: **25**
- Total SQL functions verified: **1**
- Total SQL views verified: **1**
- Total SQL RLS policies verified: **2**
- Live database verification status: **PENDING (Read-only connection constraint enforced)**
