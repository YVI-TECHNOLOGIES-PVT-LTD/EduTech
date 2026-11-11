# EduTrack ERP — Stage 2 Database Architecture

# Report 03: Comprehensive Prisma Model Classification Matrix

**Document ID:** STG2-DB-CLS-03  
**Date:** November 10, 2026  
**Author:** Principal Prisma Architect & Database Governance Specialist  
**Target File:** `apps/backend/prisma/schema.prisma` (109 Models Total)  
**Governing Rule:** `.agents/AGENTS.md` (Stage-1 Database Freeze)

---

## 1. Executive Summary

This report establishes the definitive classification of **all 109 Prisma models** declared in `apps/backend/prisma/schema.prisma`.

A critical architectural finding of this audit is that **the Prisma schema contains models spanning 4 distinct stages of the ERP lifecycle**:

- **Stage 1 (Core Foundation & Admission):** 33 Models (100% physically present in Stage-1 SQL DDL suite).
- **Stage 2 (Academic Planning & Curriculum):** 34 Models (Present in Prisma; physical DDL missing from Stage-1 suite).
- **Stage 3 (Timetable, Bell Schedules & Classroom Infrastructure):** 8 Models.
- **Stage 4 (Finance, Billing, Feed Communication & Helpdesk):** 34 Models.

### Distribution by Lifecycle Stage

```
                            ALL 109 PRISMA MODELS BY STAGE
 ┌───────────────────────────┬───────┬────────────────────────────────────────────┐
 │ Stage Classification      │ Count │ Physical DDL Presence                      │
 ├───────────────────────────┼───────┼────────────────────────────────────────────┤
 │ Stage 1 (Core Foundation) │  33   │ Present in apps/database/stage_1/schema/   │
 │ Stage 2 (Academic Plan)   │  34   │ Present in Prisma; Proposed for Stage 2 DDL│
 │ Stage 3 (Timetable/Sched) │   8   │ Present in Prisma; Stage 3 roadmap         │
 │ Stage 4 (Finance/Comm)    │  34   │ Present in Prisma; Stage 4 roadmap         │
 ├───────────────────────────┼───────┼────────────────────────────────────────────┤
 │ TOTAL                     │  109  │ Complete Schema Accounted For (100%)       │
 └───────────────────────────┴───────┴────────────────────────────────────────────┘
```

---

## 2. Complete Classification Matrix (All 109 Models)

### Stage 1: Core Foundation, HR & Admission Workflow (33 Models)

|  #  | Prisma Model                |            Physical SQL Table Exists?            |  Stage  | Domain              | Tenant Scope                  |  Persistence Status  | Required Action               |
| :-: | :-------------------------- | :----------------------------------------------: | :-----: | :------------------ | :---------------------------- | :------------------: | :---------------------------- |
|  1  | `organizations`             |    Present in Stage-1 SQL (`04_tables.sql:5`)    | Stage 1 | Core Root Tenant    | **Root Anchor**               | Verified Physical DB | Maintain frozen baseline.     |
|  2  | `users`                     |   Present in Stage-1 SQL (`04_tables.sql:53`)    | Stage 1 | Identity & Auth     | Direct (`org_id`)             | Verified Physical DB | Maintain frozen baseline.     |
|  3  | `roles`                     |   Present in Stage-1 SQL (`04_tables.sql:99`)    | Stage 1 | Identity & RBAC     | Direct (`org_id`)             | Verified Physical DB | Maintain frozen baseline.     |
|  4  | `user_roles`                |   Present in Stage-1 SQL (`04_tables.sql:138`)   | Stage 1 | Identity & RBAC     | Indirect (`users`)            | Verified Physical DB | Enforce service tenant check. |
|  5  | `designations`              |   Present in Stage-1 SQL (`04_tables.sql:163`)   | Stage 1 | HR Master           | Direct (`org_id`)             | Verified Physical DB | Maintain frozen baseline.     |
|  6  | `departments`               |   Present in Stage-1 SQL (`04_tables.sql:194`)   | Stage 1 | HR Master           | Direct (`org_id`)             | Verified Physical DB | Maintain frozen baseline.     |
|  7  | `staff`                     |   Present in Stage-1 SQL (`04_tables.sql:224`)   | Stage 1 | HR Master           | Direct (`org_id`)             | Verified Physical DB | Maintain frozen baseline.     |
|  8  | `parents`                   |   Present in Stage-1 SQL (`04_tables.sql:268`)   | Stage 1 | Parent Portal       | Direct (`org_id`)             | Verified Physical DB | Maintain frozen baseline.     |
|  9  | `academic_years`            |   Present in Stage-1 SQL (`04_tables.sql:311`)   | Stage 1 | Academic Setup      | Direct (`org_id`)             | Verified Physical DB | Maintain frozen baseline.     |
| 10  | `admission_configurations`  |   Present in Stage-1 SQL (`04_tables.sql:352`)   | Stage 1 | Admission Setup     | Direct (`org_id`)             | Verified Physical DB | Maintain frozen baseline.     |
| 11  | `grades`                    |   Present in Stage-1 SQL (`04_tables.sql:411`)   | Stage 1 | Academic Setup      | Direct (`org_id`)             | Verified Physical DB | Maintain frozen baseline.     |
| 12  | `academic_year_grades`      |   Present in Stage-1 SQL (`04_tables.sql:453`)   | Stage 1 | Academic Setup      | Indirect (`academic_years`)   | Verified Physical DB | Maintain frozen baseline.     |
| 13  | `sections`                  |   Present in Stage-1 SQL (`04_tables.sql:491`)   | Stage 1 | Academic Setup      | Indirect (`ayg`)              | Verified Physical DB | Maintain frozen baseline.     |
| 14  | `leads`                     |   Present in Stage-1 SQL (`04_tables.sql:534`)   | Stage 1 | CRM Enquiry         | Direct (`org_id`)             | Verified Physical DB | Maintain frozen baseline.     |
| 15  | `lead_activities`           |   Present in Stage-1 SQL (`04_tables.sql:618`)   | Stage 1 | CRM Enquiry         | Indirect (`leads`)            | Verified Physical DB | Maintain frozen baseline.     |
| 16  | `chatbot_sessions`          |   Present in Stage-1 SQL (`04_tables.sql:659`)   | Stage 1 | AI Admissions       | Direct (`org_id`)             | Verified Physical DB | Maintain frozen baseline.     |
| 17  | `chatbot_messages`          |   Present in Stage-1 SQL (`04_tables.sql:688`)   | Stage 1 | AI Admissions       | Indirect (`chatbot_sessions`) | Verified Physical DB | Maintain frozen baseline.     |
| 18  | `lead_visits`               |   Present in Stage-1 SQL (`04_tables.sql:707`)   | Stage 1 | CRM Enquiry         | Indirect (`leads`)            | Verified Physical DB | Maintain frozen baseline.     |
| 19  | `admissions_applications`   |   Present in Stage-1 SQL (`04_tables.sql:754`)   | Stage 1 | Admission Workflow  | Direct (`org_id`)             | Verified Physical DB | Maintain frozen baseline.     |
| 20  | `document_types`            |   Present in Stage-1 SQL (`04_tables.sql:802`)   | Stage 1 | Admission Workflow  | Direct (`org_id`)             | Verified Physical DB | Maintain frozen baseline.     |
| 21  | `admission_documents`       |   Present in Stage-1 SQL (`04_tables.sql:846`)   | Stage 1 | Admission Workflow  | Indirect (`applications`)     | Verified Physical DB | Maintain frozen baseline.     |
| 22  | `assessment_configurations` |   Present in Stage-1 SQL (`04_tables.sql:896`)   | Stage 1 | Assessment Engine   | Indirect (`ayg`)              | Verified Physical DB | Maintain frozen baseline.     |
| 23  | `application_assessments`   |   Present in Stage-1 SQL (`04_tables.sql:968`)   | Stage 1 | Assessment Engine   | Indirect (`applications`)     | Verified Physical DB | Maintain frozen baseline.     |
| 24  | `admission_decisions`       |  Present in Stage-1 SQL (`04_tables.sql:1050`)   | Stage 1 | Admission Workflow  | Indirect (`applications`)     | Verified Physical DB | Maintain frozen baseline.     |
| 25  | `admission_fee_payments`    |  Present in Stage-1 SQL (`04_tables.sql:1101`)   | Stage 1 | Temp Fee Receipt    | Indirect (`applications`)     | Verified Physical DB | Maintain frozen baseline.     |
| 26  | `students`                  |  Present in Stage-1 SQL (`04_tables.sql:1144`)   | Stage 1 | Student Master      | Direct (`org_id`)             | Verified Physical DB | Maintain frozen baseline.     |
| 27  | `student_parents`           |  Present in Stage-1 SQL (`04_tables.sql:1202`)   | Stage 1 | Student Master      | Indirect (`students`)         | Verified Physical DB | Maintain frozen baseline.     |
| 28  | `student_enrollments`       |  Present in Stage-1 SQL (`04_tables.sql:1240`)   | Stage 1 | Enrollment Master   | Indirect (`students`)         | Verified Physical DB | Maintain frozen baseline.     |
| 29  | `notifications`             |  Present in Stage-1 SQL (`04_tables.sql:1288`)   | Stage 1 | Notification Center | Direct (`org_id`)             | Verified Physical DB | Maintain frozen baseline.     |
| 30  | `countries`                 |  Present in Stage-1 SQL (`04_tables.sql:1331`)   | Stage 1 | Global Master       | Global Shared                 | Verified Physical DB | Maintain frozen baseline.     |
| 31  | `lead_query_types`          | Present in Stage-1 SQL (`10_alterations.sql:12`) | Stage 1 | CRM Enquiry         | Direct (`org_id`)             | Verified Physical DB | Maintain frozen baseline.     |
| 32  | `lead_query_type_mappings`  | Present in Stage-1 SQL (`10_alterations.sql:46`) | Stage 1 | CRM Enquiry         | Indirect (`leads`)            | Verified Physical DB | Maintain frozen baseline.     |
| 33  | `document_chunks`           |    Present in Stage-1 SQL (`11_vector.sql:9`)    | Stage 1 | AI Vector RAG       | Direct (`org_id`)             | Verified Physical DB | Maintain frozen baseline.     |

---

### Stage 2: Academic Planning, Curriculum & Digital Resources (34 Models)

|  #  | Prisma Model                            | Physical SQL Table Exists? |  Stage  | Domain             | Tenant Scope                    |  Persistence Status   | Required Action         |
| :-: | :-------------------------------------- | :------------------------: | :-----: | :----------------- | :------------------------------ | :-------------------: | :---------------------- |
| 34  | `academic_calendars`                    |   Present only in Prisma   | Stage 2 | Academic Calendar  | Indirect (`academic_years`)     | **RAM Fallback Risk** | Propose in Stage 2 DDL. |
| 35  | `academic_terms`                        |   Present only in Prisma   | Stage 2 | Academic Calendar  | Indirect (`academic_calendars`) | **RAM Fallback Risk** | Propose in Stage 2 DDL. |
| 36  | `academic_calendar_entries`             |   Present only in Prisma   | Stage 2 | Academic Calendar  | Indirect (`academic_calendars`) | **RAM Fallback Risk** | Propose in Stage 2 DDL. |
| 37  | `academic_calendar_entry_grades`        |   Present only in Prisma   | Stage 2 | Academic Calendar  | Indirect (`calendar_entries`)   | **RAM Fallback Risk** | Propose in Stage 2 DDL. |
| 38  | `academic_calendar_working_days`        |   Present only in Prisma   | Stage 2 | Academic Calendar  | Indirect (`academic_calendars`) | **RAM Fallback Risk** | Propose in Stage 2 DDL. |
| 39  | `academic_calendar_publication_history` |   Present only in Prisma   | Stage 2 | Setup Publishing   | Indirect (`academic_calendars`) | **RAM Fallback Risk** | Propose in Stage 2 DDL. |
| 40  | `curriculum_frameworks`                 |   Present only in Prisma   | Stage 2 | Framework Mapping  | Direct (`org_id`)               | **RAM Fallback Risk** | Propose in Stage 2 DDL. |
| 41  | `curriculum_framework_versions`         |   Present only in Prisma   | Stage 2 | Framework Mapping  | Direct (`org_id`)               | **RAM Fallback Risk** | Propose in Stage 2 DDL. |
| 42  | `curriculum_learning_outcomes`          |   Present only in Prisma   | Stage 2 | Framework Mapping  | Direct (`org_id`)               | **RAM Fallback Risk** | Propose in Stage 2 DDL. |
| 43  | `academic_year_curriculum_mappings`     |   Present only in Prisma   | Stage 2 | Framework Mapping  | Indirect (`ayg_subjects`)       | **RAM Fallback Risk** | Propose in Stage 2 DDL. |
| 44  | `subject_categories`                    |   Present only in Prisma   | Stage 2 | Subject Master     | Direct (`org_id`)               | **RAM Fallback Risk** | Propose in Stage 2 DDL. |
| 45  | `subjects`                              |   Present only in Prisma   | Stage 2 | Subject Master     | Direct (`org_id`)               | **RAM Fallback Risk** | Propose in Stage 2 DDL. |
| 46  | `academic_year_grade_subjects`          |   Present only in Prisma   | Stage 2 | Subject Master     | Indirect (`ayg`)                | **RAM Fallback Risk** | Propose in Stage 2 DDL. |
| 47  | `subject_selection_groups`              |   Present only in Prisma   | Stage 2 | Elective Planning  | Indirect (`ayg`)                | **RAM Fallback Risk** | Propose in Stage 2 DDL. |
| 48  | `subject_selection_group_options`       |   Present only in Prisma   | Stage 2 | Elective Planning  | Indirect (`groups`)             | **RAM Fallback Risk** | Propose in Stage 2 DDL. |
| 49  | `staff_subject_qualifications`          |   Present only in Prisma   | Stage 2 | Teacher Allocation | Indirect (`staff`)              | **RAM Fallback Risk** | Propose in Stage 2 DDL. |
| 50  | `section_subject_faculty_assignments`   |   Present only in Prisma   | Stage 2 | Teacher Allocation | Indirect (`sections`)           | **RAM Fallback Risk** | Propose in Stage 2 DDL. |
| 51  | `curriculum_plans`                      |   Present only in Prisma   | Stage 2 | AI Curriculum      | Indirect (`mappings`)           | **RAM Fallback Risk** | Propose in Stage 2 DDL. |
| 52  | `curriculum_plan_units`                 |   Present only in Prisma   | Stage 2 | AI Curriculum      | Indirect (`curriculum_plans`)   | **RAM Fallback Risk** | Propose in Stage 2 DDL. |
| 53  | `resource_categories`                   |   Present only in Prisma   | Stage 2 | Digital Resources  | Direct (`org_id`)               | **RAM Fallback Risk** | Propose in Stage 2 DDL. |
| 54  | `resource_tags`                         |   Present only in Prisma   | Stage 2 | Digital Resources  | Direct (`org_id`)               | **RAM Fallback Risk** | Propose in Stage 2 DDL. |
| 55  | `learning_resources`                    |   Present only in Prisma   | Stage 2 | Digital Resources  | Direct (`org_id`)               | **RAM Fallback Risk** | Propose in Stage 2 DDL. |
| 56  | `learning_resource_grades`              |   Present only in Prisma   | Stage 2 | Digital Resources  | Indirect (`resources`)          | **RAM Fallback Risk** | Propose in Stage 2 DDL. |
| 57  | `learning_resource_subjects`            |   Present only in Prisma   | Stage 2 | Digital Resources  | Indirect (`resources`)          | **RAM Fallback Risk** | Propose in Stage 2 DDL. |
| 58  | `learning_resource_tags`                |   Present only in Prisma   | Stage 2 | Digital Resources  | Indirect (`resources`)          | **RAM Fallback Risk** | Propose in Stage 2 DDL. |
| 59  | `learning_resource_shares`              |   Present only in Prisma   | Stage 2 | Digital Resources  | Direct (`org_id`)               | **RAM Fallback Risk** | Propose in Stage 2 DDL. |
| 60  | `learning_resource_share_sections`      |   Present only in Prisma   | Stage 2 | Digital Resources  | Indirect (`shares`)             | **RAM Fallback Risk** | Propose in Stage 2 DDL. |
| 61  | `learning_resource_recipients`          |   Present only in Prisma   | Stage 2 | Digital Resources  | Indirect (`shares`)             | **RAM Fallback Risk** | Propose in Stage 2 DDL. |
| 62  | `lesson_plans`                          |   Present only in Prisma   | Stage 2 | AI Lesson Plans    | Indirect (`units`)              | **RAM Fallback Risk** | Propose in Stage 2 DDL. |
| 63  | `lesson_activities`                     |   Present only in Prisma   | Stage 2 | AI Lesson Plans    | Indirect (`lesson_plans`)       | **RAM Fallback Risk** | Propose in Stage 2 DDL. |
| 64  | `lesson_differentiation_strategies`     |   Present only in Prisma   | Stage 2 | AI Lesson Plans    | Indirect (`lesson_plans`)       | **RAM Fallback Risk** | Propose in Stage 2 DDL. |
| 65  | `lesson_exit_tickets`                   |   Present only in Prisma   | Stage 2 | AI Lesson Plans    | Indirect (`lesson_plans`)       | **RAM Fallback Risk** | Propose in Stage 2 DDL. |
| 66  | `lesson_plan_outcomes`                  |   Present only in Prisma   | Stage 2 | AI Lesson Plans    | Indirect (`lesson_plans`)       | **RAM Fallback Risk** | Propose in Stage 2 DDL. |
| 67  | `lesson_plan_resources`                 |   Present only in Prisma   | Stage 2 | AI Lesson Plans    | Direct (`org_id`)               | **RAM Fallback Risk** | Propose in Stage 2 DDL. |

---

### Stage 3: Timetable Scheduling & Classroom Infrastructure (8 Models)

|  #  | Prisma Model                    | Physical SQL Table Exists? |  Stage  | Domain                  | Tenant Scope                |  Persistence Status   | Required Action  |
| :-: | :------------------------------ | :------------------------: | :-----: | :---------------------- | :-------------------------- | :-------------------: | :--------------- |
| 68  | `bell_schedules`                |   Present only in Prisma   | Stage 3 | Timetable Schedule      | Indirect (`ayg`)            | **RAM Fallback Risk** | Stage 3 Roadmap. |
| 69  | `bell_schedule_days`            |   Present only in Prisma   | Stage 3 | Timetable Schedule      | Indirect (`bell_schedules`) | **RAM Fallback Risk** | Stage 3 Roadmap. |
| 70  | `bell_schedule_periods`         |   Present only in Prisma   | Stage 3 | Timetable Schedule      | Indirect (`bell_schedules`) | **RAM Fallback Risk** | Stage 3 Roadmap. |
| 71  | `classrooms`                    |   Present only in Prisma   | Stage 3 | Facility Infrastructure | Direct (`org_id`)           | **RAM Fallback Risk** | Stage 3 Roadmap. |
| 72  | `staff_unavailable_slots`       |   Present only in Prisma   | Stage 3 | Faculty Constraints     | Indirect (`staff`)          | **RAM Fallback Risk** | Stage 3 Roadmap. |
| 73  | `timetable_versions`            |   Present only in Prisma   | Stage 3 | Timetable Schedule      | Indirect (`academic_years`) | **RAM Fallback Risk** | Stage 3 Roadmap. |
| 74  | `timetable_entries`             |   Present only in Prisma   | Stage 3 | Timetable Schedule      | Indirect (`versions`)       | **RAM Fallback Risk** | Stage 3 Roadmap. |
| 75  | `timetable_publication_history` |   Present only in Prisma   | Stage 3 | Timetable Schedule      | Indirect (`versions`)       | **RAM Fallback Risk** | Stage 3 Roadmap. |

---

### Stage 4: Finance, Billing, Feeds & Helpdesk (34 Models)

|  #  | Prisma Model                              | Physical SQL Table Exists? |  Stage  | Domain              | Tenant Scope                   |  Persistence Status   | Required Action  |
| :-: | :---------------------------------------- | :------------------------: | :-----: | :------------------ | :----------------------------- | :-------------------: | :--------------- |
| 76  | `fee_components`                          |   Present only in Prisma   | Stage 4 | Finance Master      | Direct (`org_id`)              |   **Guarded Proxy**   | Stage 4 Roadmap. |
| 77  | `fee_structures`                          |   Present only in Prisma   | Stage 4 | Finance Master      | Indirect (`ayg`)               |   **Guarded Proxy**   | Stage 4 Roadmap. |
| 78  | `installment_plans`                       |   Present only in Prisma   | Stage 4 | Finance Billing     | Indirect (`academic_years`)    |   **Guarded Proxy**   | Stage 4 Roadmap. |
| 79  | `installment_plan_terms`                  |   Present only in Prisma   | Stage 4 | Finance Billing     | Indirect (`installment_plans`) |   **Guarded Proxy**   | Stage 4 Roadmap. |
| 80  | `student_fee_assignments`                 |   Present only in Prisma   | Stage 4 | Finance Billing     | Indirect (`students`)          |   **Guarded Proxy**   | Stage 4 Roadmap. |
| 81  | `student_charges`                         |   Present only in Prisma   | Stage 4 | Finance Billing     | Direct (`org_id`)              |   **Guarded Proxy**   | Stage 4 Roadmap. |
| 82  | `student_charge_dues`                     |   Present only in Prisma   | Stage 4 | Finance Billing     | Direct (`org_id`)              |   **Guarded Proxy**   | Stage 4 Roadmap. |
| 83  | `scholarship_concessions`                 |   Present only in Prisma   | Stage 4 | Finance Concessions | Direct (`org_id`)              |   **Guarded Proxy**   | Stage 4 Roadmap. |
| 84  | `scholarship_concession_approval_history` |   Present only in Prisma   | Stage 4 | Finance Concessions | Indirect (`concessions`)       |   **Guarded Proxy**   | Stage 4 Roadmap. |
| 85  | `payment_orders`                          |   Present only in Prisma   | Stage 4 | Payment Gateway     | Direct (`org_id`)              |   **Guarded Proxy**   | Stage 4 Roadmap. |
| 86  | `payment_transactions`                    |   Present only in Prisma   | Stage 4 | Payment Gateway     | Direct (`org_id`)              |   **Guarded Proxy**   | Stage 4 Roadmap. |
| 87  | `payment_allocations`                     |   Present only in Prisma   | Stage 4 | Payment Gateway     | Direct (`org_id`)              |   **Guarded Proxy**   | Stage 4 Roadmap. |
| 88  | `payment_webhook_events`                  |   Present only in Prisma   | Stage 4 | Payment Gateway     | Direct (`org_id`)              |   **Guarded Proxy**   | Stage 4 Roadmap. |
| 89  | `payment_refunds`                         |   Present only in Prisma   | Stage 4 | Payment Gateway     | Direct (`org_id`)              |   **Guarded Proxy**   | Stage 4 Roadmap. |
| 90  | `payment_adjustments`                     |   Present only in Prisma   | Stage 4 | Payment Gateway     | Direct (`org_id`)              |   **Guarded Proxy**   | Stage 4 Roadmap. |
| 91  | `payment_reconciliation_runs`             |   Present only in Prisma   | Stage 4 | Reconciliation      | Direct (`org_id`)              |   **Guarded Proxy**   | Stage 4 Roadmap. |
| 92  | `payment_reconciliation_matches`          |   Present only in Prisma   | Stage 4 | Reconciliation      | Indirect (`runs`)              |   **Guarded Proxy**   | Stage 4 Roadmap. |
| 93  | `bank_statement_entries`                  |   Present only in Prisma   | Stage 4 | Reconciliation      | Direct (`org_id`)              |   **Guarded Proxy**   | Stage 4 Roadmap. |
| 94  | `gateway_settlements`                     |   Present only in Prisma   | Stage 4 | Reconciliation      | Direct (`org_id`)              |   **Guarded Proxy**   | Stage 4 Roadmap. |
| 95  | `gateway_settlement_items`                |   Present only in Prisma   | Stage 4 | Reconciliation      | Indirect (`settlements`)       |   **Guarded Proxy**   | Stage 4 Roadmap. |
| 96  | `feed_reaction_types`                     |   Present only in Prisma   | Stage 4 | Feed Communication  | Global Master                  | **RAM Fallback Risk** | Stage 4 Roadmap. |
| 97  | `feed_posts`                              |   Present only in Prisma   | Stage 4 | Feed Communication  | Direct (`org_id`)              | **RAM Fallback Risk** | Stage 4 Roadmap. |
| 98  | `feed_post_reactions`                     |   Present only in Prisma   | Stage 4 | Feed Communication  | Indirect (`posts`)             | **RAM Fallback Risk** | Stage 4 Roadmap. |
| 99  | `feed_post_allowed_reactions`             |   Present only in Prisma   | Stage 4 | Feed Communication  | Indirect (`posts`)             | **RAM Fallback Risk** | Stage 4 Roadmap. |
| 100 | `feed_post_academic_year_grade_targets`   |   Present only in Prisma   | Stage 4 | Feed Communication  | Indirect (`posts`)             | **RAM Fallback Risk** | Stage 4 Roadmap. |
| 101 | `feed_post_section_targets`               |   Present only in Prisma   | Stage 4 | Feed Communication  | Indirect (`posts`)             | **RAM Fallback Risk** | Stage 4 Roadmap. |
| 102 | `feed_post_student_targets`               |   Present only in Prisma   | Stage 4 | Feed Communication  | Indirect (`posts`)             | **RAM Fallback Risk** | Stage 4 Roadmap. |
| 103 | `feed_comments`                           |   Present only in Prisma   | Stage 4 | Feed Communication  | Indirect (`posts`)             | **RAM Fallback Risk** | Stage 4 Roadmap. |
| 104 | `helpdesk_categories`                     |   Present only in Prisma   | Stage 4 | Support Helpdesk    | Direct (`org_id`)              | **RAM Fallback Risk** | Stage 4 Roadmap. |
| 105 | `helpdesk_escalation_rules`               |   Present only in Prisma   | Stage 4 | Support Helpdesk    | Direct (`org_id`)              | **RAM Fallback Risk** | Stage 4 Roadmap. |
| 106 | `helpdesk_tickets`                        |   Present only in Prisma   | Stage 4 | Support Helpdesk    | Direct (`org_id`)              | **RAM Fallback Risk** | Stage 4 Roadmap. |
| 107 | `helpdesk_messages`                       |   Present only in Prisma   | Stage 4 | Support Helpdesk    | Indirect (`tickets`)           | **RAM Fallback Risk** | Stage 4 Roadmap. |
| 108 | `helpdesk_attachments`                    |   Present only in Prisma   | Stage 4 | Support Helpdesk    | Indirect (`messages`)          | **RAM Fallback Risk** | Stage 4 Roadmap. |
| 109 | `helpdesk_ticket_history`                 |   Present only in Prisma   | Stage 4 | Support Helpdesk    | Indirect (`tickets`)           | **RAM Fallback Risk** | Stage 4 Roadmap. |

---

## 3. Key Findings on Persistence Status

1. **Stage 1 (33 Models):** All 33 models are backed by physical tables in PostgreSQL.
2. **Stage 2 (34 Models):** **Zero physical tables exist in Stage-1 SQL**. Although models are introspected into `schema.prisma`, they lack backend service coverage and physical DDL scripts in `apps/database/`.
3. **Stage 4 Financial Models (20 Models):** Protected against in-memory writes by `createStrictFinancialDelegate` in `apps/backend/src/lib/prismaClient.ts`.
4. **Stage 2 & Feed Models (42 Models):** **UNPROTECTED**. Any write invocation on these models is caught by `createSafeModelDelegate` and saved into Node.js heap memory (`fallbackStores`), resulting in silent data loss upon restart.
