# EduTrack ERP — Stage-2 Phase 1: Database Feature Mapping

**Document ID:** `docs/stage-2/phase-1/04_stage2_database_feature_mapping.md`  
**Phase:** Stage-2 Phase 1: Foundation & Database Contract Verification  
**Author:** Lead ERP Data-Integrity Engineer & PostgreSQL Architect  
**Date:** November 2026  
**Status:** COMPLETE / EVIDENCE-BASED

---

## 1. Executive Summary

This document establishes the granular feature-to-database mapping for all six Stage-2 functional modules under **Academic Planning & Digital Campus Setup**.

The mapping assesses whether each business capability can be persisted durably using existing Stage-1 physical tables or if it relies on unmigrated Stage-2 models currently operating in volatile memory.

---

## 2. Reusable Existing Stage-1 Database Entities

Stage-2 can directly reuse several mature, physically persisted Stage-1 tables:

| Existing Table         | Primary Key              | Organization FK            | Key Columns                                                            | Reusable Capabilities in Stage 2                             |
| ---------------------- | ------------------------ | -------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| `organizations`        | `org_id`                 | PK                         | `name`, `org_code`, `status`, `timezone`                               | Root tenant context for all academic configurations          |
| `academic_years`       | `academic_year_id`       | `org_id`                   | `academic_year_name`, `start_date`, `end_date`, `status`, `is_current` | Primary session container for Module 1 & Module 6            |
| `grades`               | `grade_id`               | `org_id`                   | `grade_name`, `grade_code`, `display_order`, `board`                   | Grade levels, board categorization for Module 1 & 2          |
| `academic_year_grades` | `academic_year_grade_id` | Via `academic_years`       | `academic_year_id`, `grade_id`, `capacity`                             | Active grade offerings per session for Module 1              |
| `sections`             | `section_id`             | Via `academic_year_grades` | `section_name`, `capacity`, `class_teacher_id`, `room_no`              | Section rosters and homeroom faculty assignment for Module 1 |
| `staff`                | `staff_id`               | `org_id`                   | `first_name`, `last_name`, `email`, `department_id`, `status`          | Faculty member assignments across modules                    |
| `users`                | `user_id`                | `org_id`                   | `email`, `status`, `is_active`                                         | Author, reviewer, and publisher user identities              |

---

## 3. Module-by-Module Feature Mapping

### Module 1: Academic Year Configuration

_Scope: Academic years, curriculum, grades, sections, timetable configuration, faculty configuration, academic calendars, assessment policies._

| Feature                    | Required Entity                               | Existing Table              | Prisma Model                                  | Existing API                        | Persistence Status              | Gap / Limitation                                                                                                         | Status Classification              |
| -------------------------- | --------------------------------------------- | --------------------------- | --------------------------------------------- | ----------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| Academic Year Lifecycle    | `academic_years`                              | `academic_years`            | `academic_years`                              | `GET/POST /v1/academic/years`       | Durable PostgreSQL              | None. Fully modeled in Stage-1.                                                                                          | **FULLY SUPPORTED**                |
| Grade Master Management    | `grades`                                      | `grades`                    | `grades`                                      | `GET/POST /v1/academic/grades`      | Durable PostgreSQL              | Column `board` exists as varchar.                                                                                        | **FULLY SUPPORTED**                |
| Session Grade Offerings    | `academic_year_grades`                        | `academic_year_grades`      | `academic_year_grades`                        | `GET/POST /v1/academic/year-grades` | Durable PostgreSQL              | None. Fully modeled in Stage-1.                                                                                          | **FULLY SUPPORTED**                |
| Section Rostering          | `sections`                                    | `sections`                  | `sections`                                    | `GET/POST /v1/academic/sections`    | Durable PostgreSQL              | Class teacher FK references `staff`.                                                                                     | **FULLY SUPPORTED**                |
| Faculty Section Assignment | `sections.class_teacher_id`                   | `sections`                  | `sections`                                    | `PATCH /v1/academic/sections/:id`   | Durable PostgreSQL              | Limited to 1 class teacher per section. Granular subject-teacher assignment needs `section_subject_faculty_assignments`. | **PARTIALLY SUPPORTED**            |
| Academic Calendar Master   | `academic_calendars`                          | None                        | `academic_calendars`                          | None                                | Volatile RAM Proxy              | Physical table missing in Stage-1 SQL.                                                                                   | **NOT SUPPORTED BY FROZEN SCHEMA** |
| Calendar Terms & Events    | `academic_terms`, `academic_calendar_entries` | None                        | `academic_terms`, `academic_calendar_entries` | None                                | Volatile RAM Proxy              | Physical tables missing in Stage-1 SQL.                                                                                  | **NOT SUPPORTED BY FROZEN SCHEMA** |
| Assessment Policies        | `assessment_configurations`                   | `assessment_configurations` | `assessment_configurations`                   | `GET /v1/admission/assessment`      | Durable PostgreSQL (Admissions) | Stage-1 assessment configuration is admission-specific. General academic assessment policy entity missing.               | **NOT SUPPORTED BY FROZEN SCHEMA** |

---

### Module 2: Board / Framework Mapping

_Scope: NEP, Bloom's Taxonomy, CBSE, ICSE, IB, Cambridge, State Board, Higher Education, framework versions, subject and grade mapping._

| Feature                     | Required Entity                          | Existing Table     | Prisma Model                     | Existing API | Persistence Status  | Gap / Limitation                                                                   | Status Classification              |
| --------------------------- | ---------------------------------------- | ------------------ | -------------------------------- | ------------ | ------------------- | ---------------------------------------------------------------------------------- | ---------------------------------- |
| Educational Boards          | `grades.board` / `curriculum_frameworks` | `grades` (partial) | `curriculum_frameworks`          | None         | Partial / RAM Proxy | `grades.board` stores string value; full framework entity is missing physical DDL. | **PARTIALLY SUPPORTED**            |
| Framework Versions          | `curriculum_framework_versions`          | None               | `curriculum_framework_versions`  | None         | Volatile RAM Proxy  | Version history, guidelines, active flag missing physical DDL.                     | **NOT SUPPORTED BY FROZEN SCHEMA** |
| Framework Competencies      | `curriculum_learning_outcomes`           | None               | `curriculum_learning_outcomes`   | None         | Volatile RAM Proxy  | Competency levels & taxonomy levels missing physical DDL.                          | **NOT SUPPORTED BY FROZEN SCHEMA** |
| Subject Taxonomy Master     | `subjects`, `subject_categories`         | None               | `subjects`, `subject_categories` | None         | Volatile RAM Proxy  | No physical table for institutional subjects in Stage-1.                           | **NOT SUPPORTED BY FROZEN SCHEMA** |
| Grade-Subject Framework Map | `academic_year_grade_subjects`           | None               | `academic_year_grade_subjects`   | None         | Volatile RAM Proxy  | Junction mapping subjects to grades missing physical DDL.                          | **NOT SUPPORTED BY FROZEN SCHEMA** |

---

### Module 3: AI Curriculum Designer

_Scope: Courses, curriculum structures, units, learning outcomes, curriculum mapping, lesson plans._

| Feature                     | Required Entity                     | Existing Table | Prisma Model                        | Existing API | Persistence Status | Gap / Limitation                                                                                 | Status Classification              |
| --------------------------- | ----------------------------------- | -------------- | ----------------------------------- | ------------ | ------------------ | ------------------------------------------------------------------------------------------------ | ---------------------------------- |
| Curriculum Plans Master     | `curriculum_plans`                  | None           | `curriculum_plans`                  | None         | Volatile RAM Proxy | Physical table missing in Stage-1 SQL.                                                           | **NOT SUPPORTED BY FROZEN SCHEMA** |
| Curriculum Units & Modules  | `curriculum_plan_units`             | None           | `curriculum_plan_units`             | None         | Volatile RAM Proxy | Hierarchy of units, weeks, hours missing physical DDL.                                           | **NOT SUPPORTED BY FROZEN SCHEMA** |
| Learning Outcomes Mapping   | `curriculum_learning_outcomes`      | None           | `curriculum_learning_outcomes`      | None         | Volatile RAM Proxy | Measurable outcomes & Bloom levels missing physical DDL.                                         | **NOT SUPPORTED BY FROZEN SCHEMA** |
| AI Generation of Curriculum | AI LLM Service (`gemini-3-flash`)   | None           | Stateless / Runtime                 | None         | Stateless LLM      | Backend has `@google/genai` client, but persistence of generated draft needs `curriculum_plans`. | **PARTIALLY SUPPORTED**            |
| Session Curriculum Mapping  | `academic_year_curriculum_mappings` | None           | `academic_year_curriculum_mappings` | None         | Volatile RAM Proxy | Linking curriculum to active academic year missing physical DDL.                                 | **NOT SUPPORTED BY FROZEN SCHEMA** |

---

### Module 4: Digital Resource Library

_Scope: Teacher uploads, AI-generated resources, OER, YouTube resources, AR/VR resources, STEM lab resources, coding platform resources._

| Feature                        | Required Entity                                                  | Existing Table                  | Prisma Model                                                     | Existing API                               | Persistence Status | Gap / Limitation                                                                                   | Status Classification              |
| ------------------------------ | ---------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------- | ------------------------------------------ | ------------------ | -------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Resource Metadata Master       | `learning_resources`                                             | None                            | `learning_resources`                                             | None                                       | Volatile RAM Proxy | Physical table missing in Stage-1 SQL.                                                             | **NOT SUPPORTED BY FROZEN SCHEMA** |
| Binary File Uploads            | Supabase Bucket                                                  | `admission-documents` (private) | `admission_documents`                                            | `POST /v1/admission/application/documents` | Durable Supabase   | Storage service exists, but bucket is admission-scoped and upload middleware restricts MIME types. | **PARTIALLY SUPPORTED**            |
| Resource Categories & Tags     | `resource_categories`, `resource_tags`, `learning_resource_tags` | None                            | `resource_categories`, `resource_tags`, `learning_resource_tags` | None                                       | Volatile RAM Proxy | Categorization entities missing physical DDL.                                                      | **NOT SUPPORTED BY FROZEN SCHEMA** |
| Resource Sharing (Sections)    | `learning_resource_shares`, `learning_resource_share_sections`   | None                            | `learning_resource_shares`, `learning_resource_share_sections`   | None                                       | Volatile RAM Proxy | Access control sharing rules missing physical DDL.                                                 | **NOT SUPPORTED BY FROZEN SCHEMA** |
| External URLs (YouTube/OER/VR) | `learning_resources.external_url`                                | None                            | `learning_resources`                                             | None                                       | Volatile RAM Proxy | URL storage entity missing physical DDL.                                                           | **NOT SUPPORTED BY FROZEN SCHEMA** |

---

### Module 5: AI Lesson Planning

_Scope: Lesson objectives, activities, differentiated learning, inclusive learning support, Bloom's Taxonomy mapping, exit tickets._

| Feature                         | Required Entity                     | Existing Table | Prisma Model                        | Existing API | Persistence Status | Gap / Limitation                                                   | Status Classification              |
| ------------------------------- | ----------------------------------- | -------------- | ----------------------------------- | ------------ | ------------------ | ------------------------------------------------------------------ | ---------------------------------- |
| Lesson Plan Master              | `lesson_plans`                      | None           | `lesson_plans`                      | None         | Volatile RAM Proxy | Physical table missing in Stage-1 SQL.                             | **NOT SUPPORTED BY FROZEN SCHEMA** |
| Lesson Activities & Timing      | `lesson_activities`                 | None           | `lesson_activities`                 | None         | Volatile RAM Proxy | Sequential learning steps missing physical DDL.                    | **NOT SUPPORTED BY FROZEN SCHEMA** |
| Differentiated Learning         | `lesson_differentiation_strategies` | None           | `lesson_differentiation_strategies` | None         | Volatile RAM Proxy | Remedial and enrichment strategies missing physical DDL.           | **NOT SUPPORTED BY FROZEN SCHEMA** |
| Exit Tickets & Formative Checks | `lesson_exit_tickets`               | None           | `lesson_exit_tickets`               | None         | Volatile RAM Proxy | Quick check prompts missing physical DDL.                          | **NOT SUPPORTED BY FROZEN SCHEMA** |
| Resource Attachments            | `lesson_plan_resources`             | None           | `lesson_plan_resources`             | None         | Volatile RAM Proxy | Linking digital resources to lesson plans missing physical DDL.    | **NOT SUPPORTED BY FROZEN SCHEMA** |
| AI Generation of Plans          | AI LLM Service (`gemini-3-flash`)   | None           | Stateless / Runtime                 | None         | Stateless LLM      | Can generate structured JSON, but persistence routes to RAM proxy. | **PARTIALLY SUPPORTED**            |

---

### Module 6: Academic Setup Published

_Scope: Academic setup validation, publication eligibility, publishing, publication history, published setup retrieval, revision and republishing behavior._

| Feature                         | Required Entity                         | Existing Table   | Prisma Model                            | Existing API                   | Persistence Status | Gap / Limitation                                             | Status Classification              |
| ------------------------------- | --------------------------------------- | ---------------- | --------------------------------------- | ------------------------------ | ------------------ | ------------------------------------------------------------ | ---------------------------------- |
| Setup Validation Engine         | Rule engine service                     | None             | N/A                                     | None                           | Stateless Backend  | Validates completeness across years, grades, and sections.   | **FULLY SUPPORTED**                |
| Academic Year Status Transition | `academic_years.status`                 | `academic_years` | `academic_years`                        | `PATCH /v1/academic/years/:id` | Durable PostgreSQL | Enum supports `planning` -> `open`. Transition is durable.   | **FULLY SUPPORTED**                |
| Publication Audit History       | `academic_calendar_publication_history` | None             | `academic_calendar_publication_history` | None                           | Volatile RAM Proxy | Dedicated snapshot and history entity missing physical DDL.  | **NOT SUPPORTED BY FROZEN SCHEMA** |
| Version Snapshotting            | Setup snapshot log                      | None             | None                                    | None                           | None               | No schema table exists for published setup freeze snapshots. | **NOT SUPPORTED BY FROZEN SCHEMA** |

---

## 4. Summary Matrix of Readiness

```text
+------------------------------------------+-----------------------+-------------------------+
| Module                                   | Supported by Stage-1  | Blocked by Frozen DDL   |
+------------------------------------------+-----------------------+-------------------------+
| Module 1: Academic Year Configuration   | 80% (Core Sessions)   | 20% (Calendars, Terms)  |
| Module 2: Board / Framework Mapping      | 15% (String boards)   | 85% (Framework Master)  |
| Module 3: AI Curriculum Designer         | 10% (LLM Client)      | 90% (Curriculum DDL)    |
| Module 4: Digital Resource Library       | 25% (Supabase Client) | 75% (Resource DDL)      |
| Module 5: AI Lesson Planning             | 10% (LLM Client)      | 90% (Lesson Plan DDL)   |
| Module 6: Academic Setup Published       | 60% (Year Status)     | 40% (Publish History)   |
+------------------------------------------+-----------------------+-------------------------+
```
