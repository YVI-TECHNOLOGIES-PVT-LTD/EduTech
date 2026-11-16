# EduTrack ERP — Stage 2 Database Architecture

# Report 04: Stage 2 Domain Data Model Specification

**Document ID:** STG2-DB-MDL-04  
**Date:** November 10, 2026  
**Author:** Principal Database Architect & Academic Planning Domain Specialist  
**Scope:** Functional Specification & Domain Entity Models for Stage 2 Capabilities  
**Governing Rule:** `.agents/AGENTS.md` (Stage-1 Database Freeze)

---

## 1. Executive Summary

This document specifies the domain data model for the **six Stage-2 Academic Planning capabilities**:

1. **Academic Year Configuration**
2. **Board / Framework Mapping**
3. **AI Curriculum Designer**
4. **Digital Resource Library**
5. **AI Lesson Planning**
6. **Academic Setup Publishing**

The domain model bridges high-level educational requirements with low-level PostgreSQL relational structures, establishing lifecycle states, pedagogical relationships, and AI collaboration workflows.

---

## 2. Module 1: Academic Year Configuration Domain Model

### Functional Goals:

- Multi-term academic calendars per institution.
- Precise date boundaries for Terms (e.g. Term 1, Term 2, Summer Session).
- Instructional working days vs. weekend cycles.
- School-wide holidays, emergency closures, and grade-specific event days (e.g. Senior Board Exam Prep).

```
[organizations]
       │
       ▼
[academic_years] ── (1:1) ──► [academic_calendars] ── (1:N) ──► [academic_terms]
                                     │                                  │
                                     ├────── (1:N) ──► [academic_calendar_working_days]
                                     │                                  │
                                     ├────── (1:N) ──► [academic_calendar_entries]
                                     │                        │
                                     │                        └── (N:M) ──► [academic_year_grades]
                                     │
                                     └────── (1:N) ──► [academic_calendar_publication_history]
```

### Key Entity Specifications:

1. **`academic_calendars`**:
   - Represents the operational calendar for a specific `academic_year_id`.
   - Fields: `status` (`draft`, `published`, `archived`), `version` (INT), `published_at`, `published_by`.
   - State Machine: `draft` -> `published` -> `archived`.
2. **`academic_terms`**:
   - Defines academic periods within the calendar.
   - Fields: `term_name`, `term_number`, `start_date`, `end_date`, `is_active`.
   - Constraint: `CHECK (end_date >= start_date)`. Non-overlapping term dates within calendar.
3. **`academic_calendar_entries`**:
   - Stores non-instructional and special days.
   - Fields: `entry_name`, `entry_type` (`holiday`, `vacation`, `exam`, `school_event`, `school_closure`), `start_date`, `end_date`, `is_all_day`, `start_time`, `end_time`.
4. **`academic_calendar_entry_grades`**:
   - Polymorphic grade targeter: links calendar entries to specific `academic_year_grade_id` records when an event only applies to certain grades.

---

## 3. Module 2: Board / Framework Mapping Domain Model

### Functional Goals:

- Support national and international education boards (CBSE, ICSE, Cambridge, IB, State Boards).
- Versioned curriculum frameworks (e.g. NEP 2020 v2.1, Cambridge Primary 2026).
- Standardized taxonomy of competencies and learning outcomes mapped to Bloom's taxonomy.
- Binding framework versions to institutional subject offerings.

```
[organizations]
       │
       ├──────► [curriculum_frameworks] ── (1:N) ──► [curriculum_framework_versions]
       │                                                      │
       │                                                      ├── (1:N) ──► [curriculum_learning_outcomes]
       │                                                      │
       │                                                      └── (1:N) ──► [academic_year_curriculum_mappings]
       │                                                                                   ▲
       ├──────► [subject_categories]                                                       │
       │               │                                                                   │
       │               ▼                                                                   │
       └──────► [subjects] ── (1:N) ──► [academic_year_grade_subjects] ────────────────────┘
```

### Key Entity Specifications:

1. **`curriculum_frameworks`**:
   - Master board definition. Fields: `framework_code` (`CBSE`, `IB_PYP`), `framework_name`, `jurisdiction_country`.
2. **`curriculum_framework_versions`**:
   - Immutable versioned framework releases. Fields: `version_code` (`2026.1`), `effective_year_start`, `effective_year_end`, `is_active`.
3. **`curriculum_learning_outcomes`**:
   - Pedagogical competencies. Fields: `outcome_code`, `bloom_level` (`remember`, `understand`, `apply`, `analyze`, `evaluate`, `create`), `statement`, `success_criteria`.
4. **`academic_year_curriculum_mappings`**:
   - Binds the framework version to an `academic_year_grade_subjects` record, establishing the authoritative learning objectives for that grade-subject.

---

## 4. Module 3: AI Curriculum Designer Domain Model

### Functional Goals:

- Year-long and semester-long curriculum maps.
- Thematic units/chapters with duration, sequencing, and weightage.
- AI draft generation: AI generates draft unit breakdowns, lesson allocations, and competency mappings.
- Human review: Academic Coordinators or Department Heads must approve AI-generated plans before publishing.

```
[academic_year_curriculum_mappings]
                 │
                 ▼
         [curriculum_plans] ── (1:N) ──► [curriculum_plan_units]
                                                   │
                                                   └── (N:M via outcomes) ──► [curriculum_learning_outcomes]
```

### Key Entity Specifications:

1. **`curriculum_plans`**:
   - Annual subject curriculum blueprint.
   - Fields: `plan_name`, `status` (`draft`, `review`, `approved`, `published`, `archived`), `version`, `ai_generated` (BOOLEAN), `ai_prompt_snapshot`, `review_notes`.
   - Governance: AI-generated plans start strictly in `draft` status. Only approved plans can transition to `published`.
2. **`curriculum_plan_units`**:
   - Modular unit / chapter breakdown.
   - Fields: `unit_title`, `sequence_number`, `estimated_periods`, `unit_summary`, `target_start_week`, `target_end_week`.

---

## 5. Module 4: Digital Resource Library Domain Model

### Functional Goals:

- Secure digital pedagogical repository for teachers and students.
- Storage of metadata and bucket references, NEVER binary BLOBs inside PostgreSQL.
- Hierarchical categories, keyword tags, and grade/subject associations.
- Granular sharing model: Private to teacher, Shared with Grade Faculty, Shared with Students of Section.

```
[organizations]
       │
       ├──────► [resource_categories] (Self-referencing tree)
       │
       ├──────► [resource_tags]
       │
       └──────► [learning_resources]
                      │
                      ├── (N:M) ──► [learning_resource_grades]
                      ├── (N:M) ──► [learning_resource_subjects]
                      ├── (N:M) ──► [learning_resource_tags]
                      │
                      └── (1:N) ──► [learning_resource_shares]
                                            │
                                            ├── (N:M) ──► [learning_resource_share_sections]
                                            └── (N:M) ──► [learning_resource_recipients]
```

### Key Entity Specifications:

1. **`learning_resources`**:
   - Core asset metadata.
   - Fields: `title`, `description`, `resource_type` (`file`, `external_link`), `file_storage_path` (Supabase Storage Key), `file_mime_type`, `file_size_bytes`, `external_url`, `owner_staff_id`, `status` (`draft`, `published`, `archived`).
   - Storage Architecture: Files reside in Supabase Storage bucket `academic-resources` under path `{org_id}/{resource_id}/{filename}`. Short-lived signed URLs are generated on read.
2. **`learning_resource_shares`**:
   - Access control policy.
   - Fields: `audience_scope` (`all_teachers`, `selected_teachers`, `all_students`, `selected_sections`, `selected_students`), `valid_from`, `valid_until`.

---

## 6. Module 5: AI Lesson Planning Domain Model

### Functional Goals:

- Granular day-to-day lesson delivery plans.
- Structured pedagogical sections: Direct Instruction, Guided Practice, Group Activities, Exit Tickets.
- Differentiation strategies: Remedial scaffolding, Enrichment tasks, English Language Learner (ELL) accommodations.
- Attaching learning resources directly to lesson steps.
- AI co-planning: Teachers enter learning objectives; AI drafts lesson sequences and checks for understanding.

```
[curriculum_plan_units]
           │
           ▼
     [lesson_plans] (Created by teacher or AI)
           │
           ├── (1:N) ──► [lesson_activities] (Sequenced in-class activities)
           ├── (1:N) ──► [lesson_differentiation_strategies] (Remedial & Advanced)
           ├── (1:N) ──► [lesson_exit_tickets] (Check for understanding criteria)
           ├── (N:M) ──► [lesson_plan_outcomes] ──► [curriculum_learning_outcomes]
           └── (N:M) ──► [lesson_plan_resources] ──► [learning_resources]
```

### Key Entity Specifications:

1. **`lesson_plans`**:
   - Core lesson entity. Fields: `lesson_title`, `sequence_number`, `planned_date`, `duration_minutes`, `teaching_approach`, `prerequisite_knowledge`, `teacher_staff_id`, `is_active`.
2. **`lesson_activities`**:
   - In-class activity breakdown. Fields: `activity_type` (`direct_instruction`, `discussion`, `group_work`, `practical`, etc.), `duration_minutes`, `activity_description`, `sequence_number`.
3. **`lesson_differentiation_strategies`**:
   - Targeted adaptations. Fields: `target_student_group` (`remedial`, `advanced`, `special_needs`), `strategy_description`.
4. **`lesson_exit_tickets`**:
   - Formative checks. Fields: `prompt`, `expected_response_or_criteria`.

---

## 7. Module 6: Academic Setup Publishing Domain Model

### Functional Goals:

- Pre-publication integrity gate: Ensures calendar terms, frameworks, subject allocations, and curriculum units are complete and non-conflicting.
- Publication snapshot: Locks published versions against accidental modification.
- Historical audit trail: Records who published what version, at what timestamp, with validation notes.
- Rollback capability: Reverts to previously published versions without data destruction.

```
                               PUBLICATION WORKFLOW
                                        │
                                        ▼
                  Run Pre-Publication Integrity Validators
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 │                                             │
           VALIDATION FAILED                             VALIDATION PASSED
                 │                                             │
                 ▼                                             ▼
       Return Detailed Errors                    Create Published Snapshot
       [Draft Remains Unchanged]                 Update Status -> 'published'
                                                 Insert Record -> publication_history
```

### Key Entity Specifications:

1. **`academic_calendar_publication_history`**:
   - Fields: `calendar_version`, `action` (`published`, `rolled_back`, `re-published`), `event_at`, `actor_user_id`, `notes`.
2. **`curriculum_plans` & `curriculum_framework_versions` Version Fields**:
   - Fields: `version_number`, `published_at`, `published_by`, `status`.
   - Immutable Rule: When status is `published`, database triggers prevent `UPDATE` on pedagogical content columns (`unit_title`, `duration`, `learning_outcomes`). Any change requires incrementing version and creating a new draft.
