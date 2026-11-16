# EduTrack ERP — Stage 2 Database Architecture

# Report 01: Stage 2 Database Inventory & Object Catalog

**Document ID:** STG2-DB-INV-01  
**Date:** November 10, 2026  
**Author:** Principal Database Architect & Backend Data Governance Engineer  
**Status:** Architecture Blueprint (READ-ONLY ASSESSMENT)  
**Governing Rule:** `.agents/AGENTS.md` (Stage-1 Database Freeze)

---

## 1. Executive Summary

This inventory catalogs the database objects required to support **Stage 2 Academic Planning** within the EduTrack ERP multi-tenant architecture.

Stage 2 introduces 6 major functional capabilities:

1. **Academic Year Configuration** (Calendars, Terms, Working Days, Holidays)
2. **Board / Framework Mapping** (Boards, Frameworks, Versions, Competencies, Subjects)
3. **AI Curriculum Designer** (Curriculum Plans, Units, Learning Outcomes, Versioning)
4. **Digital Resource Library** (Teaching Assets, Categories, Tags, Granular Sharing)
5. **AI Lesson Planning** (Lesson Plans, Activities, Differentiation, Exit Tickets)
6. **Academic Setup Publishing** (Publication Snapshots, Validation Rules, Historical Auditing)

The Stage-1 SQL DDL suite (`apps/database/stage_1/schema/*.sql`) contains **33 tables**, none of which natively support the deep pedagogical structures required for Stage 2. Conversely, `apps/backend/prisma/schema.prisma` contains **109 models**, of which **34 models** directly define the Stage-2 Academic Planning domain. However, these 34 models are currently unsupported by verified Stage-1 physical tables or backend services.

---

## 2. Master Inventory by Academic Domain

```
                                 STAGE 2 DOMAIN HIERARCHY
                                             │
      ┌─────────────────┬────────────────────┼───────────────────┬─────────────────┐
      │                 │                    │                   │                 │
┌─────▼─────┐     ┌─────▼─────┐        ┌─────▼─────┐       ┌─────▼─────┐     ┌─────▼─────┐
│ Academic  │     │ Framework │        │ AI Curric │       │  Digital  │     │ AI Lesson │
│ Calendar  │     │ & Subject │        │  Designer │       │ Resources │     │ Planning  │
│ (6 Tables)│     │(11 Tables)│        │ (2 Tables)│       │ (9 Tables)│     │ (6 Tables)│
└───────────┘     └───────────┘        └───────────┘       └───────────┘     └───────────┘
```

### Domain A: Academic Calendar, Terms & Operational Schedule (6 Entities)

|  #  | Proposed Physical Table                 | Existing Prisma Model                   | Primary Key                         | Root Tenant Anchor                | Purpose                                                                         |
| :-: | :-------------------------------------- | :-------------------------------------- | :---------------------------------- | :-------------------------------- | :------------------------------------------------------------------------------ |
|  1  | `academic_calendars`                    | `academic_calendars`                    | `academic_calendar_id` (UUID)       | Indirect (`academic_year_id`)     | Master institutional calendar per academic year; tracks draft/published states. |
|  2  | `academic_terms`                        | `academic_terms`                        | `academic_term_id` (UUID)           | Indirect (`academic_calendar_id`) | Semesters, trimesters, or terms with explicit start/end dates.                  |
|  3  | `academic_calendar_entries`             | `academic_calendar_entries`             | `academic_calendar_entry_id` (UUID) | Indirect (`academic_calendar_id`) | Holidays, vacations, examinations, and school closures.                         |
|  4  | `academic_calendar_entry_grades`        | `academic_calendar_entry_grades`        | Composite: `(entry_id, ayg_id)`     | Indirect (`ayg_id`)               | Scopes calendar entries to specific grades (e.g. Senior exam days).             |
|  5  | `academic_calendar_working_days`        | `academic_calendar_working_days`        | Composite: `(calendar_id, weekday)` | Indirect (`calendar_id`)          | Defines instructional days (e.g. Monday–Friday or Saturday cycles).             |
|  6  | `academic_calendar_publication_history` | `academic_calendar_publication_history` | `publication_history_id` (UUID)     | Indirect (`academic_calendar_id`) | Immutable audit trail of calendar publications and revisions.                   |

---

### Domain B: Board, Curriculum Framework & Subject Mapping (11 Entities)

|  #  | Proposed Physical Table               | Existing Prisma Model                 | Primary Key                         | Root Tenant Anchor          | Purpose                                                                    |
| :-: | :------------------------------------ | :------------------------------------ | :---------------------------------- | :-------------------------- | :------------------------------------------------------------------------- |
|  7  | `curriculum_frameworks`               | `curriculum_frameworks`               | `framework_id` (UUID)               | Direct (`org_id`)           | Education boards and frameworks (e.g. CBSE, ICSE, Cambridge, IB).          |
|  8  | `curriculum_framework_versions`       | `curriculum_framework_versions`       | `framework_version_id` (UUID)       | Direct (`org_id`)           | Framework versions (e.g. NEP 2020 v2.1, Cambridge 2026).                   |
|  9  | `curriculum_learning_outcomes`        | `curriculum_learning_outcomes`        | `learning_outcome_id` (UUID)        | Direct (`org_id`)           | Granular competencies and learning objectives mapped to Bloom's taxonomy.  |
| 10  | `academic_year_curriculum_mappings`   | `academic_year_curriculum_mappings`   | `mapping_id` (UUID)                 | Indirect (`ayg_subject_id`) | Binds a framework version to an institutional subject offering.            |
| 11  | `subject_categories`                  | `subject_categories`                  | `subject_category_id` (UUID)        | Direct (`org_id`)           | Subject classifications (e.g. Languages, STEM, Humanities, Co-curricular). |
| 12  | `subjects`                            | `subjects`                            | `subject_id` (UUID)                 | Direct (`org_id`)           | Master subject catalogue (e.g. Mathematics, English Literature).           |
| 13  | `academic_year_grade_subjects`        | `academic_year_grade_subjects`        | `ayg_subject_id` (UUID)             | Indirect (`ayg_id`)         | Links specific subjects to specific grade levels in an academic year.      |
| 14  | `subject_selection_groups`            | `subject_selection_groups`            | `group_id` (UUID)                   | Indirect (`ayg_id`)         | Elective choice groups (e.g. "Choose 1 of French/German/Sanskrit").        |
| 15  | `subject_selection_group_options`     | `subject_selection_group_options`     | `option_id` (UUID)                  | Indirect (`group_id`)       | Specific subject options available within an elective group.               |
| 16  | `staff_subject_qualifications`        | `staff_subject_qualifications`        | Composite: `(staff_id, subject_id)` | Indirect (`staff_id`)       | Verifies teacher subject competencies and eligibility.                     |
| 17  | `section_subject_faculty_assignments` | `section_subject_faculty_assignments` | `assignment_id` (UUID)              | Indirect (`section_id`)     | Maps primary and co-teachers to section subjects.                          |

---

### Domain C: AI Curriculum Designer (2 Entities)

|  #  | Proposed Physical Table | Existing Prisma Model   | Primary Key                 | Root Tenant Anchor              | Purpose                                                                       |
| :-: | :---------------------- | :---------------------- | :-------------------------- | :------------------------------ | :---------------------------------------------------------------------------- |
| 18  | `curriculum_plans`      | `curriculum_plans`      | `curriculum_plan_id` (UUID) | Indirect (`mapping_id`)         | High-level annual subject plan; tracks AI draft, review, and approval states. |
| 19  | `curriculum_plan_units` | `curriculum_plan_units` | `curriculum_unit_id` (UUID) | Indirect (`curriculum_plan_id`) | Thematic units/chapters with duration, weightage, and target periods.         |

---

### Domain D: Digital Resource Library (9 Entities)

|  #  | Proposed Physical Table            | Existing Prisma Model              | Primary Key                            | Root Tenant Anchor       | Purpose                                                                         |
| :-: | :--------------------------------- | :--------------------------------- | :------------------------------------- | :----------------------- | :------------------------------------------------------------------------------ |
| 20  | `resource_categories`              | `resource_categories`              | `category_id` (UUID)                   | Direct (`org_id`)        | Hierarchical taxonomy tree for digital assets (e.g. Lesson Slides, Worksheets). |
| 21  | `resource_tags`                    | `resource_tags`                    | `tag_id` (UUID)                        | Direct (`org_id`)        | Searchable multi-tenant tagging master.                                         |
| 22  | `learning_resources`               | `learning_resources`               | `resource_id` (UUID)                   | Direct (`org_id`)        | Core asset metadata, external links, or private Supabase storage keys.          |
| 23  | `learning_resource_grades`         | `learning_resource_grades`         | Composite: `(resource_id, grade_id)`   | Indirect (`resource_id`) | Associates resources with target grade levels.                                  |
| 24  | `learning_resource_subjects`       | `learning_resource_subjects`       | Composite: `(resource_id, subject_id)` | Indirect (`resource_id`) | Associates resources with relevant subjects.                                    |
| 25  | `learning_resource_tags`           | `learning_resource_tags`           | Composite: `(resource_id, tag_id)`     | Indirect (`resource_id`) | Relational join for resource keywords.                                          |
| 26  | `learning_resource_shares`         | `learning_resource_shares`         | `share_id` (UUID)                      | Direct (`org_id`)        | Granular access grants (All Teachers, Selected Sections, Students).             |
| 27  | `learning_resource_share_sections` | `learning_resource_share_sections` | Composite: `(share_id, section_id)`    | Indirect (`share_id`)    | Links access share grants to specific classroom sections.                       |
| 28  | `learning_resource_recipients`     | `learning_resource_recipients`     | Composite: `(share_id, user_id)`       | Indirect (`share_id`)    | Direct user-level access override grants.                                       |

---

### Domain E: AI Lesson Planning (6 Entities)

|  #  | Proposed Physical Table             | Existing Prisma Model               | Primary Key                           | Root Tenant Anchor              | Purpose                                                                        |
| :-: | :---------------------------------- | :---------------------------------- | :------------------------------------ | :------------------------------ | :----------------------------------------------------------------------------- |
| 29  | `lesson_plans`                      | `lesson_plans`                      | `lesson_plan_id` (UUID)               | Indirect (`curriculum_unit_id`) | Structured pedagogical daily/weekly lesson outline created by teacher or AI.   |
| 30  | `lesson_activities`                 | `lesson_activities`                 | `activity_id` (UUID)                  | Indirect (`lesson_plan_id`)     | Sequential in-class activities (Introduction, Group Work, Direct Instruction). |
| 31  | `lesson_differentiation_strategies` | `lesson_differentiation_strategies` | `strategy_id` (UUID)                  | Indirect (`lesson_plan_id`)     | Pedagogical adaptations for remedial, advanced, or SEN students.               |
| 32  | `lesson_exit_tickets`               | `lesson_exit_tickets`               | `exit_ticket_id` (UUID)               | Indirect (`lesson_plan_id`)     | Formative end-of-class check for understanding prompts and criteria.           |
| 33  | `lesson_plan_outcomes`              | `lesson_plan_outcomes`              | Composite: `(lesson_id, outcome_id)`  | Indirect (`lesson_plan_id`)     | Explicitly links lesson plan to curriculum learning competencies.              |
| 34  | `lesson_plan_resources`             | `lesson_plan_resources`             | Composite: `(lesson_id, resource_id)` | Direct (`org_id`)               | Attaches digital library assets directly to instructional lesson steps.        |

---

## 3. Required Stage-2 Enums Inventory

| Enum Type Name                 | Permitted Values                                                                                                                            | Domain Scope                    |
| :----------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------ |
| `academic_calendar_status`     | `draft`, `published`, `archived`                                                                                                            | Academic Calendar Lifecycle     |
| `academic_calendar_entry_type` | `holiday`, `vacation`, `exam`, `school_event`, `school_closure`                                                                             | Calendar Schedule Taxonomy      |
| `curriculum_plan_status`       | `draft`, `review`, `approved`, `published`, `archived`                                                                                      | AI Curriculum Approval Workflow |
| `learning_outcome_bloom_level` | `remember`, `understand`, `apply`, `analyze`, `evaluate`, `create`                                                                          | Pedagogical Competency Rigor    |
| `subject_requirement`          | `mandatory`, `optional`, `elective`                                                                                                         | Subject Selection Policy        |
| `faculty_assignment_role`      | `primary`, `co_teacher`                                                                                                                     | Teacher Staff Allocation        |
| `resource_type`                | `file`, `external_link`                                                                                                                     | Digital Library Asset Format    |
| `resource_status`              | `draft`, `published`, `archived`                                                                                                            | Digital Asset Governance        |
| `resource_share_audience`      | `all_teachers`, `selected_teachers`, `all_students`, `selected_sections`, `selected_students`                                               | Resource Access Visibility      |
| `lesson_activity_type`         | `direct_instruction`, `discussion`, `group_work`, `individual_work`, `practical`, `project`, `inquiry`, `assessment`, `reflection`, `other` | Lesson Plan Activity Pedagogy   |

---

## 4. Summary & Verification Status

- **Stage-1 Physical Tables:** 33 (100% Frozen and Untouched).
- **Stage-2 Proposed Tables:** 34 (Mapped to 34 existing models in `schema.prisma`).
- **Stage-2 Proposed Enums:** 10 (Mapped to Prisma enums).
- **Physical DDL Location:** To be proposed in `apps/database/stage_2/schema/`.
- **Current State:** Architecture and inventory ready; awaiting governance authorization to establish physical DDL.
