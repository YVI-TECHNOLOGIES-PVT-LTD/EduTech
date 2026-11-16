# EduTrack ERP — Stage 2 Database Architecture

# Report 05: Stage 2 Entity-Relationship & Relational Schema Design

**Document ID:** STG2-DB-ERD-05  
**Date:** November 10, 2026  
**Author:** Principal Database Architect & PostgreSQL Data Modeler  
**Target Package:** Proposed `apps/database/stage_2/schema/`  
**Governing Rule:** `.agents/AGENTS.md` (Stage-1 Database Freeze)

---

## 1. Executive Summary

This document specifies the technical entity-relationship (ER) architecture and PostgreSQL DDL specifications for all **34 Stage-2 tables**.

Key relational principles enforced in this design:

1. **Surrogate UUID Primary Keys:** All tables use `UUID PRIMARY KEY DEFAULT gen_random_uuid()`.
2. **Standardized Audit Envelope:** Every primary table includes `created_at`, `created_by`, `updated_at`, `updated_by`.
3. **Strict Delete Governance:** Historical curriculum records, published calendars, and approved outcomes use `ON DELETE RESTRICT` to prevent catastrophic cascade deletions.
4. **Referential Decoupling:** Stage-2 tables link to Stage-1 entities (`academic_years`, `grades`, `sections`, `staff`, `organizations`) via strict foreign keys without modifying any Stage-1 table definitions.

---

## 2. Relational Specifications by Domain

### Group A: Academic Calendar & Terms

#### 1. `academic_calendars`

- **Purpose:** Anchors operational calendars per academic year.
- **Primary Key:** `academic_calendar_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- **Organization Ownership:** Indirect via `academic_years(academic_year_id)`.
- **Foreign Keys:**
  - `academic_year_id UUID NOT NULL REFERENCES academic_years(academic_year_id) ON DELETE CASCADE`
  - `published_by UUID REFERENCES users(user_id) ON DELETE SET NULL`
  - `created_by UUID REFERENCES users(user_id) ON DELETE SET NULL`
  - `updated_by UUID REFERENCES users(user_id) ON DELETE SET NULL`
- **Columns & Constraints:**
  - `status academic_calendar_status NOT NULL DEFAULT 'draft'`
  - `version INT NOT NULL DEFAULT 1`
  - `published_at TIMESTAMPTZ`
  - `UNIQUE(academic_year_id, version)`
- **Audit Columns:** `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`.

#### 2. `academic_terms`

- **Purpose:** Semesters / Terms within a calendar.
- **Primary Key:** `academic_term_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- **Foreign Keys:**
  - `academic_calendar_id UUID NOT NULL REFERENCES academic_calendars(academic_calendar_id) ON DELETE CASCADE`
  - Audit FKs to `users(user_id) ON DELETE SET NULL`.
- **Columns & Constraints:**
  - `term_name VARCHAR(100) NOT NULL`
  - `term_number INT NOT NULL`
  - `start_date DATE NOT NULL`
  - `end_date DATE NOT NULL`
  - `is_active BOOLEAN NOT NULL DEFAULT TRUE`
  - `CONSTRAINT chk_term_dates CHECK (end_date >= start_date)`
  - `UNIQUE(academic_calendar_id, term_number)`

#### 3. `academic_calendar_entries`

- **Purpose:** Holidays, events, and closures.
- **Primary Key:** `academic_calendar_entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- **Foreign Keys:**
  - `academic_calendar_id UUID NOT NULL REFERENCES academic_calendars(academic_calendar_id) ON DELETE CASCADE`
  - `academic_term_id UUID REFERENCES academic_terms(academic_term_id) ON DELETE SET NULL`
- **Columns & Constraints:**
  - `entry_name VARCHAR(150) NOT NULL`
  - `entry_type academic_calendar_entry_type NOT NULL`
  - `start_date DATE NOT NULL`
  - `end_date DATE NOT NULL`
  - `is_all_day BOOLEAN NOT NULL DEFAULT TRUE`
  - `start_time TIME`
  - `end_time TIME`
  - `description TEXT`
  - `CONSTRAINT chk_entry_dates CHECK (end_date >= start_date)`

#### 4. `academic_calendar_entry_grades`

- **Purpose:** Scopes events to specific grades.
- **Primary Key:** `PRIMARY KEY (academic_calendar_entry_id, academic_year_grade_id)`
- **Foreign Keys:**
  - `academic_calendar_entry_id UUID NOT NULL REFERENCES academic_calendar_entries(academic_calendar_entry_id) ON DELETE CASCADE`
  - `academic_year_grade_id UUID NOT NULL REFERENCES academic_year_grades(academic_year_grade_id) ON DELETE CASCADE`

#### 5. `academic_calendar_working_days`

- **Purpose:** Operational weekdays per calendar.
- **Primary Key:** `PRIMARY KEY (academic_calendar_id, weekday)`
- **Foreign Keys:**
  - `academic_calendar_id UUID NOT NULL REFERENCES academic_calendars(academic_calendar_id) ON DELETE CASCADE`
- **Columns & Constraints:**
  - `weekday INT NOT NULL CHECK (weekday BETWEEN 1 AND 7)` (1 = Monday, 7 = Sunday).

#### 6. `academic_calendar_publication_history`

- **Purpose:** Immutable audit log for publications.
- **Primary Key:** `publication_history_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- **Foreign Keys:**
  - `academic_calendar_id UUID NOT NULL REFERENCES academic_calendars(academic_calendar_id) ON DELETE RESTRICT`
  - `actor_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL`
- **Columns:** `calendar_version INT NOT NULL`, `action VARCHAR(50) NOT NULL`, `event_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `notes TEXT`.

---

### Group B: Boards, Frameworks & Subject Catalog

#### 7. `curriculum_frameworks`

- **Primary Key:** `framework_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- **Organization Ownership:** `org_id UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE`
- **Columns & Constraints:**
  - `framework_code VARCHAR(50) NOT NULL`
  - `framework_name VARCHAR(150) NOT NULL`
  - `jurisdiction_country VARCHAR(100)`
  - `UNIQUE(org_id, framework_code)`

#### 8. `curriculum_framework_versions`

- **Primary Key:** `framework_version_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- **Organization Ownership:** `org_id UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE`
- **Foreign Keys:** `framework_id UUID NOT NULL REFERENCES curriculum_frameworks(framework_id) ON DELETE RESTRICT`
- **Columns:** `version_code VARCHAR(50) NOT NULL`, `is_active BOOLEAN NOT NULL DEFAULT TRUE`, `effective_year_start INT`, `effective_year_end INT`, `UNIQUE(framework_id, version_code)`.

#### 9. `curriculum_learning_outcomes`

- **Primary Key:** `learning_outcome_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- **Organization Ownership:** `org_id UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE`
- **Foreign Keys:** `framework_version_id UUID NOT NULL REFERENCES curriculum_framework_versions(framework_version_id) ON DELETE CASCADE`
- **Columns:** `outcome_code VARCHAR(50) NOT NULL`, `bloom_level learning_outcome_bloom_level NOT NULL`, `statement TEXT NOT NULL`, `success_criteria TEXT`.

#### 10. `subject_categories`

- **Primary Key:** `subject_category_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- **Organization Ownership:** `org_id UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE`
- **Columns:** `category_name VARCHAR(100) NOT NULL`, `display_order INT DEFAULT 0`, `UNIQUE(org_id, category_name)`.

#### 11. `subjects`

- **Primary Key:** `subject_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- **Organization Ownership:** `org_id UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE`
- **Foreign Keys:** `category_id UUID REFERENCES subject_categories(subject_category_id) ON DELETE SET NULL`
- **Columns:** `subject_code VARCHAR(30) NOT NULL`, `subject_name VARCHAR(150) NOT NULL`, `is_active BOOLEAN NOT NULL DEFAULT TRUE`, `UNIQUE(org_id, subject_code)`.

#### 12. `academic_year_grade_subjects`

- **Primary Key:** `ayg_subject_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- **Foreign Keys:**
  - `academic_year_grade_id UUID NOT NULL REFERENCES academic_year_grades(academic_year_grade_id) ON DELETE CASCADE`
  - `subject_id UUID NOT NULL REFERENCES subjects(subject_id) ON DELETE RESTRICT`
- **Columns:** `requirement_type subject_requirement NOT NULL DEFAULT 'mandatory'`, `credits NUMERIC(4,2)`, `UNIQUE(academic_year_grade_id, subject_id)`.

#### 13. `academic_year_curriculum_mappings`

- **Primary Key:** `mapping_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- **Foreign Keys:**
  - `ayg_subject_id UUID NOT NULL REFERENCES academic_year_grade_subjects(ayg_subject_id) ON DELETE CASCADE`
  - `framework_version_id UUID NOT NULL REFERENCES curriculum_framework_versions(framework_version_id) ON DELETE RESTRICT`
- **Columns:** `is_active BOOLEAN NOT NULL DEFAULT TRUE`, `mapping_notes TEXT`, `UNIQUE(ayg_subject_id, framework_version_id)`.

---

### Group C: AI Curriculum Designer

#### 14. `curriculum_plans`

- **Primary Key:** `curriculum_plan_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- **Foreign Keys:** `mapping_id UUID NOT NULL REFERENCES academic_year_curriculum_mappings(mapping_id) ON DELETE RESTRICT`
- **Columns & Constraints:**
  - `plan_name VARCHAR(150) NOT NULL`
  - `status curriculum_plan_status NOT NULL DEFAULT 'draft'`
  - `version INT NOT NULL DEFAULT 1`
  - `ai_generated BOOLEAN NOT NULL DEFAULT FALSE`
  - `ai_prompt_snapshot TEXT`
  - `review_notes TEXT`
  - `UNIQUE(mapping_id, version)`

#### 15. `curriculum_plan_units`

- **Primary Key:** `curriculum_unit_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- **Foreign Keys:** `curriculum_plan_id UUID NOT NULL REFERENCES curriculum_plans(curriculum_plan_id) ON DELETE CASCADE`
- **Columns:** `unit_title VARCHAR(150) NOT NULL`, `sequence_number INT NOT NULL`, `estimated_periods INT`, `unit_summary TEXT`, `UNIQUE(curriculum_plan_id, sequence_number)`.

---

### Group D: Digital Resource Library

#### 16. `resource_categories`

- **Primary Key:** `category_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- **Organization Ownership:** `org_id UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE`
- **Foreign Keys:** `parent_category_id UUID REFERENCES resource_categories(category_id) ON DELETE CASCADE`
- **Columns:** `category_name VARCHAR(100) NOT NULL`, `category_code VARCHAR(50)`, `display_order INT DEFAULT 0`, `UNIQUE(org_id, category_name)`.

#### 17. `resource_tags`

- **Primary Key:** `tag_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- **Organization Ownership:** `org_id UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE`
- **Columns:** `tag_name VARCHAR(50) NOT NULL`, `UNIQUE(org_id, tag_name)`.

#### 18. `learning_resources`

- **Primary Key:** `resource_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- **Organization Ownership:** `org_id UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE`
- **Foreign Keys:**
  - `owner_staff_id UUID NOT NULL REFERENCES staff(staff_id) ON DELETE RESTRICT`
  - `category_id UUID REFERENCES resource_categories(category_id) ON DELETE SET NULL`
- **Columns:**
  - `title VARCHAR(200) NOT NULL`
  - `description TEXT`
  - `resource_type resource_type NOT NULL`
  - `file_storage_path VARCHAR(500)` (Storage bucket path)
  - `file_mime_type VARCHAR(100)`
  - `file_size_bytes BIGINT`
  - `external_url TEXT`
  - `status resource_status NOT NULL DEFAULT 'draft'`

#### 19–21. Resource Joins (`grades`, `subjects`, `tags`)

- `learning_resource_grades`: `PRIMARY KEY (resource_id, grade_id)`
- `learning_resource_subjects`: `PRIMARY KEY (resource_id, subject_id)`
- `learning_resource_tags`: `PRIMARY KEY (resource_id, tag_id)`
- All use `ON DELETE CASCADE` from `resource_id`.

#### 22. `learning_resource_shares`

- **Primary Key:** `share_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- **Organization Ownership:** `org_id UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE`
- **Foreign Keys:** `resource_id UUID NOT NULL REFERENCES learning_resources(resource_id) ON DELETE CASCADE`
- **Columns:** `audience_scope resource_share_audience NOT NULL`, `valid_from TIMESTAMPTZ`, `valid_until TIMESTAMPTZ`.

#### 23–24. Share Targets (`sections`, `recipients`)

- `learning_resource_share_sections`: `PRIMARY KEY (share_id, section_id)`
- `learning_resource_recipients`: `PRIMARY KEY (share_id, user_id)`

---

### Group E: AI Lesson Planning

#### 25. `lesson_plans`

- **Primary Key:** `lesson_plan_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- **Foreign Keys:**
  - `curriculum_unit_id UUID NOT NULL REFERENCES curriculum_plan_units(curriculum_unit_id) ON DELETE RESTRICT`
  - `teacher_staff_id UUID NOT NULL REFERENCES staff(staff_id) ON DELETE RESTRICT`
- **Columns:** `lesson_title VARCHAR(200) NOT NULL`, `sequence_number INT NOT NULL`, `planned_date DATE`, `duration_minutes INT`, `teaching_approach TEXT`, `prerequisite_knowledge TEXT`, `is_active BOOLEAN NOT NULL DEFAULT TRUE`, `UNIQUE(curriculum_unit_id, sequence_number)`.

#### 26. `lesson_activities`

- **Primary Key:** `activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- **Foreign Keys:** `lesson_plan_id UUID NOT NULL REFERENCES lesson_plans(lesson_plan_id) ON DELETE CASCADE`
- **Columns:** `activity_type lesson_activity_type NOT NULL`, `activity_title VARCHAR(150)`, `activity_description TEXT NOT NULL`, `duration_minutes INT`, `sequence_number INT NOT NULL`.

#### 27. `lesson_differentiation_strategies`

- **Primary Key:** `strategy_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- **Foreign Keys:** `lesson_plan_id UUID NOT NULL REFERENCES lesson_plans(lesson_plan_id) ON DELETE CASCADE`
- **Columns:** `target_group VARCHAR(100) NOT NULL`, `strategy_description TEXT NOT NULL`, `sequence_number INT NOT NULL`.

#### 28. `lesson_exit_tickets`

- **Primary Key:** `exit_ticket_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- **Foreign Keys:** `lesson_plan_id UUID NOT NULL REFERENCES lesson_plans(lesson_plan_id) ON DELETE CASCADE`
- **Columns:** `prompt TEXT NOT NULL`, `expected_response_or_criteria TEXT`, `sequence_number INT NOT NULL`.

#### 29. `lesson_plan_outcomes`

- **Primary Key:** `PRIMARY KEY (lesson_plan_id, learning_outcome_id)`
- **Foreign Keys:**
  - `lesson_plan_id UUID NOT NULL REFERENCES lesson_plans(lesson_plan_id) ON DELETE CASCADE`
  - `learning_outcome_id UUID NOT NULL REFERENCES curriculum_learning_outcomes(learning_outcome_id) ON DELETE RESTRICT`
- **Columns:** `coverage_notes TEXT`.

#### 30. `lesson_plan_resources`

- **Primary Key:** `PRIMARY KEY (lesson_plan_id, resource_id)`
- **Foreign Keys:**
  - `lesson_plan_id UUID NOT NULL REFERENCES lesson_plans(lesson_plan_id) ON DELETE CASCADE`
  - `resource_id UUID NOT NULL REFERENCES learning_resources(resource_id) ON DELETE RESTRICT`
  - `org_id UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE`
- **Columns:** `usage_notes TEXT`, `sequence_number INT`.

---

### Group F: Subject Allocation & Faculty Qualifications

#### 31. `staff_subject_qualifications`

- **Primary Key:** `PRIMARY KEY (staff_id, subject_id)`
- **Foreign Keys:**
  - `staff_id UUID NOT NULL REFERENCES staff(staff_id) ON DELETE CASCADE`
  - `subject_id UUID NOT NULL REFERENCES subjects(subject_id) ON DELETE CASCADE`
- **Columns:** `qualification_level VARCHAR(50)`, `is_primary BOOLEAN NOT NULL DEFAULT TRUE`.

#### 32. `section_subject_faculty_assignments`

- **Primary Key:** `assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- **Foreign Keys:**
  - `section_id UUID NOT NULL REFERENCES sections(section_id) ON DELETE CASCADE`
  - `ayg_subject_id UUID NOT NULL REFERENCES academic_year_grade_subjects(ayg_subject_id) ON DELETE CASCADE`
  - `faculty_staff_id UUID NOT NULL REFERENCES staff(staff_id) ON DELETE RESTRICT`
- **Columns:** `role faculty_assignment_role NOT NULL DEFAULT 'primary'`, `UNIQUE(section_id, ayg_subject_id, faculty_staff_id)`.

#### 33. `subject_selection_groups`

- **Primary Key:** `group_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- **Foreign Keys:** `academic_year_grade_id UUID NOT NULL REFERENCES academic_year_grades(academic_year_grade_id) ON DELETE CASCADE`
- **Columns:** `group_name VARCHAR(100) NOT NULL`, `min_selections INT NOT NULL DEFAULT 1`, `max_selections INT NOT NULL DEFAULT 1`.

#### 34. `subject_selection_group_options`

- **Primary Key:** `option_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- **Foreign Keys:**
  - `group_id UUID NOT NULL REFERENCES subject_selection_groups(group_id) ON DELETE CASCADE`
  - `ayg_subject_id UUID NOT NULL REFERENCES academic_year_grade_subjects(ayg_subject_id) ON DELETE CASCADE`
- **Columns:** `is_default BOOLEAN NOT NULL DEFAULT FALSE`, `UNIQUE(group_id, ayg_subject_id)`.
