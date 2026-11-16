# EDUTRACK ERP — STAGE 3, PHASE 1

# 02. Prisma & Physical Database Forensic Audit

> **Sole Source of Truth**: `apps/backend/prisma/schema.prisma`  
> **Database Freeze Status**: STRICTLY UNMODIFIED (Zero schema/SQL/migration edits performed)  
> **Live PostgreSQL Inspection**: Executed read-only via `pg_catalog` & `information_schema` (`current_user: postgres`, `rolsuper: false`, `rolbypassrls: true`)

---

## 1. Schema vs Physical PostgreSQL Summary Metrics

| Metric                 | `apps/backend/prisma/schema.prisma`                                                                                                                           | Live PostgreSQL (`public` schema)                                                                                                                                            | Parity Status                                                                                          |
| :--------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Physical Tables**    | **148 models**                                                                                                                                                | **148 base tables** (`relkind = 'r'`)                                                                                                                                        | **100% Exact Match** (0 missing, 0 extra)                                                              |
| **Database Views**     | Not modeled in Prisma DMMF                                                                                                                                    | **7 SQL Views** (`relkind = 'v'` — incl. `student_assessment_question_options`)                                                                                              | Verified in PG                                                                                         |
| **PostgreSQL Enums**   | **92 enums**                                                                                                                                                  | **92 `pg_enum` types**                                                                                                                                                       | **100% Exact Match** (**10** unused in table columns)                                                  |
| **Foreign Keys**       | Defined across relations                                                                                                                                      | **547 FK constraints** (`information_schema.table_constraints`)                                                                                                              | Verified in PG                                                                                         |
| **User Triggers**      | Not native to Prisma DSL                                                                                                                                      | **223 trigger definitions** (`pg_trigger WHERE NOT tgisinternal`)                                                                                                            | Verified in PG                                                                                         |
| **Row-Level Security** | Not native to Prisma DSL                                                                                                                                      | **148 / 148 tables** have `rowsecurity = true`                                                                                                                               | **CRITICAL**: Only **40** tables have policies (`68` total policies); **108** tables have `0` policies |
| **Stage Distribution** | Stage 1/Core: **67** models<br>Stage 2 Academic: **32** models<br>Stage 2.3/3 Timetable: **10** models _(corrs. "8")_<br>Stage 3 (`S3.1–S3.9`): **39** models | Live data populated in Stage 1 & 2 (`1,241` users, `733` students, `91` published curriculum plans, `1,440` timetable entries); **ALL 39 pure Stage 3 tables have `0` rows** | Ready for Stage 3 writes (subject to DMMF & RLS fixes)                                                 |

> **Correction of Prior Stage 2 Audit Assumption**: The older Stage 2 classification cited _8 timetable/bell-schedule models_. Forensic verification of `schema.prisma` and `public` schema confirms **10 models** in the Scheduling, Bell Schedule, Faculty Workload & Classroom domain (`bell_schedules`, `bell_schedule_days`, `bell_schedule_periods`, `classrooms`, `section_subject_faculty_assignments`, `staff_subject_qualifications`, `staff_unavailable_slots`, `timetable_versions`, `timetable_entries`, `timetable_publication_history`).

---

## 2. Stage 1 Core Entities & Identity Ownership (Selected Critical Tables)

Live PG row counts demonstrate a **major identity provisioning gap on `students`** that directly affects Stage 3 student portals and RLS helpers:

| Model / Table                                               | PK                            | Key Columns & Constraints                                                                                                                               | Foreign Keys / Parent-Child Ownership                                                                      | Live PG Rows & Notes                                                                                                                    |
| :---------------------------------------------------------- | :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| **`organizations`**                                         | `org_id`                      | `org_code` (`UNIQUE`), `org_name`, `board_affiliation`, `subscription_tier`, `status`                                                                   | Root tenant table; `created_by`, `updated_by` → `users`                                                    | `7` orgs (`RLS=true`, `0` policies)                                                                                                     |
| **`users`**                                                 | `user_id`                     | `org_id`, `email` (`UQ(org_id,email)`), `phone`, `password_hash`, `status`, `country_id`; `UQ(org_id,user_id)`                                          | Belongs to `organizations` (`CASCADE`)                                                                     | `1,241` users (`RLS=true`, `0` policies)                                                                                                |
| **`roles`**                                                 | `role_id`                     | `org_id`, `role_name` (`UQ(org_id,role_name)`), `is_active`                                                                                             | Belongs to `organizations` (`CASCADE`)                                                                     | `13` distinct `role_name` strings in PG (`Administrator`, `Principal`, `Teacher`, `Student`, `Parent`, `PARENT`, etc.)                  |
| **`user_roles`**                                            | `(user_id, role_id)`          | Composite PK; `granted_at`, `granted_by`                                                                                                                | `users` (`CASCADE`), `roles` (`RESTRICT`)                                                                  | Drives RBAC & PG `auth_is_academic_admin`                                                                                               |
| **`staff`**                                                 | `staff_id`                    | `org_id`, `user_id` (`UQ(user_id)`, `UQ(org_id,user_id)`), `employee_code` (`UQ(org_id,employee_code)`), `department_id`, `designation_id`, `is_active` | Links `users` ↔ `organizations` (`RESTRICT` / `CASCADE`)                                                   | `175` staff, **`175` have `user_id`** (100% login-linked)                                                                               |
| **`parents`**                                               | `parent_id`                   | `org_id`, `user_id` (`UQ(user_id)`), `first_name`, `last_name`, `phone`, `email`                                                                        | Belongs to `organizations`; optional `user_id` (`SET NULL`)                                                | `810` parents, **`806` have `user_id`** (99.5% login-linked)                                                                            |
| **`students`**                                              | `student_id`                  | `org_id`, `application_id` (`UNIQUE`), `user_id` (`NULLABLE`), `admission_no` (`UQ(org_id,admission_no)`), `status`; `UQ(org_id,student_id)`            | Belongs to `organizations`; `user_id` → `users` (`SET NULL`); `application_id` → `admissions_applications` | `733` students, **ONLY `206` have `user_id`** (**`527` students have `user_id = NULL` — cannot log in or satisfy `auth_is_student()`**) |
| **`student_parents`**                                       | `(student_id, parent_id)`     | `relationship` (`relationship_type`), `is_primary_contact`                                                                                              | `students` (`CASCADE`), `parents` (`CASCADE`)                                                              | Used by `auth_is_parent_of_student(student_id)`                                                                                         |
| **`student_enrollments`**                                   | `enrollment_id`               | `student_id`, `academic_year_grade_id`, `section_id`, `roll_number` (`UQ(section_id,roll_number)`), `UQ(student_id,academic_year_grade_id)`, `status`   | `students` (`CASCADE`), `academic_year_grades` (`CASCADE`), `sections` (`SET NULL`)                        | `733` enrollments; parent FK target for Stage 3 attendance/submissions/assessments                                                      |
| **`academic_years`**                                        | `academic_year_id`            | `org_id`, `academic_year_name` (`UQ`), `start_date`, `end_date` (`end_date > start_date`), `status` (`academic_year_status`)                            | `organizations` (`CASCADE`)                                                                                | `23` rows                                                                                                                               |
| **`grades`**                                                | `grade_id`                    | `org_id`, `grade_code` (`UQ`), `grade_name` (`UQ`), `board`, `display_order`                                                                            | `organizations` (`CASCADE`)                                                                                | Parent of `academic_year_grades`                                                                                                        |
| **`academic_year_grades`**                                  | `academic_year_grade_id`      | `academic_year_id`, `grade_id` (`UQ`), `intake_capacity`, `is_active`                                                                                   | `academic_years` (`CASCADE`), `grades` (`CASCADE`)                                                         | Parent of `sections` & `academic_year_grade_subjects`                                                                                   |
| **`sections`**                                              | `section_id`                  | `academic_year_grade_id`, `section_name` (`UQ(ayg,section_name)`), `class_teacher_id` (`staff`), `room_no`, `capacity`                                  | `academic_year_grades` (`CASCADE`), `staff` (`SET NULL`)                                                   | Directly referenced by `classroom_sessions`, `learning_activities`, `assessments`, `student_progress_cards`                             |
| **`notifications`**                                         | `notification_id`             | `org_id`, `recipient_user_id`, `category`, `type`, `priority`, `entity_type`, `entity_id`, `action_url`, `is_read`                                      | `organizations` (`CASCADE`), `users` (`CASCADE`)                                                           | Reused for Stage 3 workflow alerts                                                                                                      |
| **`chatbot_sessions` / `chatbot_messages`**                 | `session_id` / `message_id`   | Only Stage 1 tables with RLS policies (`1` policy each: `tenant_isolation_chatbot_*`)                                                                   | `organizations`, `users`, `staff`, `leads`                                                                 | Preserves RAG Q&A history                                                                                                               |
| **`document_chunks`**                                       | `chunk_id`                    | `org_id`, `document_name`, `chunk_index` (`UQ`), `content`, `embedding Unsupported("vector")?`, `metadata`                                              | `organizations` (`CASCADE`)                                                                                | `38` rows; **lacks ANN (`hnsw`/`ivfflat`) index** (only B-tree on `org_id`)                                                             |
| **`assessment_configurations` / `application_assessments`** | `config_id` / `assessment_id` | Stage 1 **Admissions Entrance** tests scoped to `academic_year_grade_id` and `admissions_applications`                                                  | `academic_year_grades` / `admissions_applications`                                                         | **DO NOT CONFUSE WITH STAGE 3 `assessments`**                                                                                           |

---

## 3. Stage 2 Academic Dependencies (32 Tables — `RLS=true`, `0` Policies)

All 32 Stage 2 tables exist physically in PostgreSQL and act as immutable or guarded foundations for Stage 3:

- **Calendars & Terms (6 tables)**: `academic_calendars` (1 published row; `UQ(academic_year_id)`), `academic_terms` (`ex_academic_terms_no_overlap` GIST constraint; FK target for `student_progress_cards` when `reporting_period = 'term'`), `academic_calendar_entries` (`holiday`/`vacation`/`exam`/`school_event`/`school_closure` — checked by `s31_generate_classroom_sessions_for_date_range`), `academic_calendar_entry_grades`, `academic_calendar_working_days`, `academic_calendar_publication_history`.
- **Subjects & Frameworks (6 tables)**: `subject_categories`, `subjects` (`UQ(subject_id, org_id)` — referenced by `assessment_questions`), `academic_year_grade_subjects` (core subject-offering FK across Stage 3), `subject_selection_groups`, `subject_selection_group_options`, `curriculum_frameworks`, `curriculum_framework_versions`, `academic_year_curriculum_mappings` _(8 tables including electives & frameworks — exact total with calendar/resources/lessons = 32)_.
- **Curriculum & Outcomes (3 tables)**:
  - `curriculum_plans` (`91` rows, **all `91` `status = 'published'`**; `ai_copilot_generation_requests` trigger `s34_validate_generation_request` strictly enforces `status = 'published'`).
  - `curriculum_plan_units` (FK parent of `lesson_plans` & `ai_copilot_intervention_recommendations`).
  - `curriculum_learning_outcomes` (`bloom_level` enum: `remember|understand|apply|analyze|evaluate|create`; FK parent of `lesson_plan_outcomes`, `ai_copilot_*_outcomes`, `assessment_competency_mappings`, `student_learning_gaps`, `student_competency_analytics`).
- **Digital Resources (7 tables)**: `learning_resources` (`file|external_link`, 100MB DB cap), `resource_categories`, `resource_tags`, `learning_resource_tags`, `learning_resource_grades`, `learning_resource_subjects`, `learning_resource_shares`, `learning_resource_share_sections`, `learning_resource_recipients`.
- **Lesson Planning (6 tables)**: `lesson_plans` (`91` rows; optional FK from `classroom_sessions` & `learning_activities`), `lesson_activities`, `lesson_differentiation_strategies`, `lesson_exit_tickets`, `lesson_plan_outcomes`, `lesson_plan_resources`. _(Trigger `s26_guard_lesson_content_mutation` protects published context mutations.)_

---

## 4. Stage 2.3 / Stage 3 Timetable, Bell Schedule & Faculty Infrastructure (10 Tables)

All **10** models exist physically (`RLS=true`, `0` policies). All publish-locked by `trg_s23_*` triggers once a timetable version is `'review'`/`'published'`/`'archived'`:

| Model / Table                             | PK                                 | Important Columns, Uniques & GIST Indexes                                                                                                                                     | FKs / Ownership             | Stage 3 Use Cases                                                                                                           |
| :---------------------------------------- | :--------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------- | :-------------------------------------------------------------------------------------------------------------------------- |
| **`bell_schedules`**                      | `bell_schedule_id`                 | `academic_year_grade_id`, `schedule_name`, `is_active`; `UQ(bell_schedule_id, academic_year_grade_id)`                                                                        | → `academic_year_grades`    | Grade bell template driving period start/end times                                                                          |
| **`bell_schedule_days`**                  | `bell_schedule_day_id`             | `academic_year_grade_id`, `bell_schedule_id`, `weekday` (`1..7`); `UQ(ayg_id, weekday)`                                                                                       | → `bell_schedules`          | Maps weekdays to bell schedules                                                                                             |
| **`bell_schedule_periods`**               | `bell_schedule_period_id`          | `bell_schedule_id`, `period_number` (>0), `period_name`, `period_type` (`teaching                                                                                             | break                       | lunch                                                                                                                       | assembly                                                                                             | activity                                                                                                               | other`), `start_time`, `end_time` (`end > start`); GIST index `ex_bell_schedule_periods_no_overlap` | → `bell_schedules` | Provides period slots for `timetable_entries` |
| **`classrooms`**                          | `classroom_id`                     | `org_id`, `room_code`, `room_name`, `room_type`, `capacity` (>0); `UQ(org_id, lower(room_code))`, `UQ(classroom_id, org_id)`                                                  | → `organizations`           | `53` live rooms; FK target for physical/hybrid `classroom_sessions` & `timetable_entries`                                   |
| **`staff_subject_qualifications`**        | `staff_subject_qualification_id`   | `staff_id`, `subject_id` (`UQ`), `is_verified`, `verified_by`, `verified_at`                                                                                                  | → `staff`, `subjects`       | Teacher eligibility check for subject assignments                                                                           |
| **`staff_unavailable_slots`**             | `staff_unavailable_slot_id`        | `staff_id`, `academic_year_id`, `weekday` (`1..7`), `start_time`, `end_time`; GIST `ex_staff_unavailable_slots_no_overlap`                                                    | → `staff`, `academic_years` | Availability constraint for scheduling & ad-hoc session creation                                                            |
| **`section_subject_faculty_assignments`** | `faculty_assignment_id`            | `section_id`, `academic_year_grade_subject_id`, `staff_id`, `assignment_role` (`primary                                                                                       | co_teacher                  | substitute`), `is_qualification_override`, `effective_from`, `effective_to`; partial UQs for active primary teacher & staff | → `sections`, `aygs`, `staff`                                                                        | **CRITICAL ANCHOR**: Primary FK & RLS ownership root (`auth_is_teacher_of_assignment()`) across S3.1, S3.2, S3.4, S3.5 |
| **`timetable_versions`**                  | `timetable_version_id`             | `academic_year_id`, `version_number` (`UQ`), `status` (`draft                                                                                                                 | review                      | published                                                                                                                   | archived`); partial `uq_timetable_one_published_per_year`                                            | → `academic_years`                                                                                                     | `1` published live version; prerequisite for `s31_generate_classroom_sessions_for_date_range()`     |
| **`timetable_entries`**                   | `timetable_entry_id`               | `timetable_version_id`, `section_id`, `academic_year_grade_subject_id`, `faculty_assignment_id`, `bell_schedule_period_id`, `weekday`, `classroom_id`, `lesson_type` (`theory | practical                   | other`), `lesson_topic`                                                                                                     | Composite FK `(faculty_assignment_id, section_id, aygs_id)`, → `classrooms`, `bell_schedule_periods` | `1,440` live entries; auto-generates `classroom_sessions`                                                              |
| **`timetable_publication_history`**       | `timetable_publication_history_id` | `timetable_version_id`, `action`, `previous_status`, `new_status`, `actor_user_id`; immutable triggers (`prevent_s23_timetable_history_mutation`)                             | → `timetable_versions`      | Audit log for timetable lifecycle                                                                                           |

---

## 5. Stage 3 Teaching, Learning & Holistic Assessment Models (39 Tables)

All 39 pure Stage 3 tables exist physically in PostgreSQL, have `0` live rows, and have `rls_enabled = true` (38 have active RLS policies; **1 table `assessment_rubrics` has `0` policies**).

### S3.1 — Classroom Sessions & Hybrid Attendance (3 Tables)

1. **`classroom_sessions`** (PK `session_id`; Tenant `org_id` + `UQ(org_id, session_id)`)
   - **Key Fields**: `academic_year_id`, `timetable_entry_id?`, `creation_method` (`automatic|manual`), `section_id`, `academic_year_grade_subject_id`, `faculty_assignment_id`, `lesson_plan_id?`, `classroom_id?`, `session_date`, `scheduled_start_time`, `scheduled_end_time`, `actual_start_at?`, `actual_end_at?`, `delivery_mode` (`physical|online|hybrid`), `teaching_approach` (`traditional|flipped`), `meeting_url?`, `session_status` (`scheduled|in_progress|completed|not_conducted|cancelled`), `topics_covered?`, `teacher_remarks?`, `not_conducted_reason?`.
   - **FKs (10)**: Composite FK `fk_classroom_sessions_classroom_org` (`classroom_id, org_id`), composite FK `fk_classroom_sessions_faculty_assignment`, plus `academic_years`, `lesson_plans`, `sections`, `academic_year_grade_subjects`, `timetable_entries`, `organizations`, `created_by`, `updated_by`.
   - **Check Constraints (6)**: Enforces `delivery_mode IN ('physical','hybrid') <=> classroom_id IS NOT NULL` and `online <=> classroom_id IS NULL` (`ck_classroom_sessions_delivery_location`); strict status/timestamp pairs (`ck_classroom_sessions_status_timestamps`); `creation_method = 'automatic' => timetable_entry_id IS NOT NULL`; non-blank `not_conducted_reason`.
   - **Partial Unique Index**: `uq_classroom_sessions_timetable_date` (`(timetable_entry_id, session_date) WHERE timetable_entry_id IS NOT NULL`) guarantees idempotent session generation.
   - **Triggers & PG Functions**: `s31_validate_classroom_session`, `s31_validate_session_transition`, `s31_write_classroom_audit`, `s31_set_updated_at`.
   - **RLS (3 policies)**: `SELECT`, `INSERT`, `UPDATE` (staff/admin/enrolled student/linked parent scoped).

2. **`classroom_session_attendance`** (PK `session_attendance_id`; Tenant `org_id`)
   - **Key Fields**: `session_id`, `student_id`, `enrollment_id`, `attendance_status` (`present|absent|late|excused`), `participation_mode?` (`physical|online`), `recorded_by`, `recorded_at`, `remarks?`.
   - **Unique**: `uq_classroom_session_attendance_session_student` `(session_id, student_id)`.
   - **Check**: `ck_classroom_session_attendance_participation` (`present|late => participation_mode NOT NULL`, `absent|excused => NULL`).
   - **Triggers**: `s31_validate_session_attendance` (blocks attendance mutations unless `session_status = 'in_progress'` and actor is assigned teacher), `s31_write_classroom_audit`, `s31_set_updated_at`.
   - **RLS (3 policies)**: `SELECT`, `INSERT`, `UPDATE`.

3. **`classroom_session_audit_history`** (PK `audit_id`; Tenant `org_id`)
   - **Key Fields**: `entity_type` (`classroom_session|session_attendance`), `entity_id`, `action` (`INSERT|UPDATE|DELETE`), `old_values`, `new_values`, `actor_user_id`, `occurred_at`.
   - **RLS (1 policy)**: `SELECT`.

### S3.2 — Learning Activities, Submissions & Reviews (4 Tables)

4. **`learning_activities`** (PK `activity_id`; Tenant `org_id` + `UQ(org_id, activity_id)`)
   - **Key Fields**: `faculty_assignment_id`, `section_id`, `academic_year_grade_subject_id`, `created_by_staff_id`, `lesson_plan_id?`, `activity_type` (`s32_activity_type`: **`homework|project` ONLY**), `title`, `instructions`, `assigned_at`, `due_at`, `late_submission_authorized_until?`, `grading_enabled`, `maximum_marks?`, `activity_status` (`s32_activity_status`: `draft|published|closed`), `published_at?`, `closed_at?`, `closure_reason?`.
   - **Constraints & Triggers**: `due_at > assigned_at`, grading check, `s32_validate_activity`, `s32_audit_activity`, `s32_touch_updated_at`.

5. **`learning_activity_audit_history`** (PK `audit_id`; Tenant `org_id`) — Audit log (`RLS: SELECT`).

6. **`learning_activity_submissions`** (PK `submission_id`; Tenant `org_id` + `UQ(org_id, activity_id, student_id, attempt_number)`)
   - **Key Fields**: `activity_id`, `student_id`, `enrollment_id`, `attempt_number`, `text_content?`, `submitted_at`, `is_late`, `submission_status` (`s32_submission_status`: `submitted|under_review|resubmission_requested|reviewed`).
   - **Critical Database Restriction**: Triggers `s32_validate_submission` and `s32_prevent_submission_mutation` enforce **append-only attempts** and **BLOCK submissions unless parent `activity_type = 'project'`**. Also `s32_deferred_check_submission_content` requires either non-blank `text_content` or attached files.

7. **`learning_activity_submission_files`** (PK `submission_file_id`; Tenant `org_id`)
   - **Key Fields**: `submission_id`, `storage_bucket`, `storage_path` (`UQ(storage_bucket,storage_path)`), `original_file_name`, `mime_type`, `file_size_bytes` (`CHECK (1 .. 10485760)` = 10MB cap).
   - **Triggers**: `s32_validate_submission_file` (blocks non-project activities and enforces max **5 files/attempt**), `s32_deferred_check_submission_content`.

8. **`learning_activity_submission_reviews`** (PK `review_id`; Tenant `org_id`)
   - **Key Fields**: `submission_id`, `reviewed_by_staff_id`, `review_decision` (`reviewed|resubmission_requested`), `obtained_marks?`, `feedback?`, `resubmission_allowed_until?`.
   - **Triggers**: `s32_validate_review` (project-only), `s32_apply_review_decision`, `s32_prevent_review_mutation` (immutable once inserted). _(Note: Total S3.2 tables = **5 tables** counting audit history: `learning_activities`, `learning_activity_audit_history`, `learning_activity_submissions`, `learning_activity_submission_files`, `learning_activity_submission_reviews`!)_

### S3.4 — AI Teacher Copilot (6 Tables)

9. **`ai_copilot_generation_requests`** (PK `generation_request_id`; Tenant `org_id`)
   - **Key Fields**: `created_by_user_id`, `faculty_assignment_id`, `section_id`, `academic_year_grade_subject_id`, `curriculum_plan_id`, `generation_type` (`worksheet|quiz|question_paper|question_paper_blueprint`), `title`, `teacher_instructions?`, `generation_language`, `generation_config` (`Json` object), `generated_content?` (`Json` object), `generated_answer_key?` (`Json` object), `generation_metadata` (`Json`), `request_status` (`queued|generating|ready_for_review|approved|rejected|failed|expired`), `reviewed_by_staff_id?`, `reviewed_at?`, `expires_at?`, `source_material_id?`, `source_material_version_id?`.
   - **Critical Constraints**: `ck_s34_request_language_english` (**`generation_language = 'en'` ONLY**), `ck_s34_request_payload_cleared_after_decision` (generated JSON cleared after approve/reject once copied into permanent version), `s34_validate_generation_request` (requires **`curriculum_plans.status = 'published'`**), `s34_validate_request_transition` (requires permanent `ai_copilot_materials` + `ai_copilot_material_versions` on approve).

10. **`ai_copilot_generation_request_outcomes`** (PK `(generation_request_id, learning_outcome_id)`) — Maps request to `curriculum_plan_units` & `curriculum_learning_outcomes`.

11. **`ai_copilot_materials`** (PK `material_id`; Tenant `org_id`; `UQ(source_generation_request_id)`) — Permanent approved Copilot artifact header (`material_status`: `active|archived`). Triggers: `s34_protect_material_identity`, `s34_validate_material`.

12. **`ai_copilot_material_versions`** (PK `material_version_id`; Tenant `org_id`; `UQ(material_id, version_number)`, `UQ(source_generation_request_id)`) — Immutable JSON snapshot (`content`, `answer_key`, `based_on_version_id?`). Trigger `s34_reject_material_version_mutation` blocks `UPDATE`/`DELETE`.

13. **`ai_copilot_material_version_outcomes`** (PK `(material_version_id, learning_outcome_id)`) — Permanent outcome tags (`s34_validate_version_outcome`).

14. **`ai_copilot_intervention_recommendations`** (PK `recommendation_id`; Tenant `org_id`) — Student recommendation card (`recommendation_type`, `recommendation_text`, `evidence_snapshot` Json object, `source_data_as_of`, `recommendation_status`: `active|dismissed|expired`). Optional FKs to `curriculum_plans`, `curriculum_plan_units`.

### S3.5 & S3.6 — Assessments, Question Bank, Rubrics, Evaluation & Correction Workflow (13 Tables + 1 View)

15. **`assessments`** (PK `assessment_id`; Tenant `org_id` + `UQ(assessment_id, org_id)`)
    - **Key Fields**: `academic_year_id`, `academic_year_grade_subject_id`, `section_id`, `faculty_assignment_id`, `created_by_user_id`, `title`, `description?`, `assessment_type` (`formative|summative|diagnostic|competency|project|viva|portfolio`), `delivery_mode` (`physical|online|hybrid`), `assessment_date`, `start_time?`, `end_time?`, `location_or_meeting_url?`, `maximum_marks?`, `marks_required`, `grading_scale_snapshot?`, `status` (`draft|published|conducted|closed|results_entered|results_published`), `published_at?`, `conducted_at?`, `closed_at?`, `results_entered_at?`, `results_published_at?`, `retest_of_assessment_id?`, `retest_reason?`.
    - **Triggers**: `s35_validate_assessment`, `s35_write_assessment_audit`, `s35_set_updated_at`.
    - **Bug Detected in PG RLS Policy**: `p_assessment_attachments_select` references `'results_reviewed'` status, which is **disallowed** by `assessments_status_check`.

16. **`assessment_attachments`** (PK `assessment_attachment_id`) — `instruction` (`instruction_text`) or `file` (`storage_path`, `is_student_visible`).

17. **`assessment_audit_history`** (PK `assessment_audit_history_id`) — Audit trail (`RLS: SELECT`).

18. **`assessment_students`** (PK `assessment_student_id`; Tenant `org_id`; `UQ(assessment_id, student_id)`) — Snapshotted student roster (`enrollment_id?`). Trigger `s35_validate_assessment_student_roster`.

19. **`assessment_attendance`** (PK `assessment_attendance_id`; `UQ(assessment_student_id)`) — `present|absent|excused`, `attendance_source` (`manual|classroom_session`), conditional FK to `classroom_session_attendance`.

20. **`assessment_components`** (PK `assessment_component_id`; `UQ(assessment_id, sequence_number)`) — Multi-part mark breakdown.

21. **`assessment_rubrics`** (PK `assessment_rubric_id`; `UQ(assessment_id)`) — **SECURITY GAP: `rls_enabled = true` with `0` policies!** Blocks any non-`bypassrls` access.

22. **`assessment_rubric_criteria`** (PK `assessment_rubric_criterion_id`; `UQ(assessment_rubric_id, sequence_number)`) — Criterion + `performance_levels` (`Json`), `maximum_score?`.

23. **`assessment_results`** (PK `assessment_result_id`; `UQ(assessment_student_id)`) — `total_marks_obtained?`, `grade_code?`, `grading_scale_snapshot?`, `teacher_remark?`, `result_status` (`pending|entered|absent|withheld`). Trigger `s35_protect_published_results` prevents direct updates after `results_published`.

24. **`assessment_component_marks`** (PK `assessment_component_mark_id`; `UQ(assessment_result_id, assessment_component_id)`) — Per-component score.

25. **`assessment_rubric_evaluations`** (PK `assessment_rubric_evaluation_id`; `UQ(assessment_result_id, assessment_rubric_criterion_id)`) — Selected level `Json`, numeric `score`, `evaluator_remark`.

26. **`assessment_result_approvals`** (PK `assessment_result_approval_id`) — Post-publish score correction approval queue (`pending|approved|rejected`, `old_values`, `proposed_values`). Applied via `s35_apply_result_correction_approval()`.

27. **`assessment_competency_mappings`** (PK `assessment_competency_mapping_id`; Tenant `org_id`) — Maps either `assessment_question_id` OR `assessment_component_id` (`ck_assessment_competency_mapping_target`) to `(learning_outcome_id, bloom_level)` with `admin_reviewed_by_user_id` & `is_approved`.

28. **`assessment_questions`** _(Question Bank + Assessment Questions — note S3.6 brings total S3.5+S3.6 tables to **15 tables + 1 view**, let's verify count below)_ (PK `assessment_question_id`)
    - Dual-scope via `ck_assessment_questions_scope`: Reusable Bank Item (`assessment_id IS NULL AND source_question_id IS NULL AND sequence_number IS NULL`) OR Assessment Copy (`assessment_id NOT NULL AND sequence_number > 0`).
    - **CRITICAL CONSTRAINT**: `assessment_questions_question_type_check` enforces **`question_type = 'mcq'` ONLY**. Free-text/short-answer/essay/coding questions cannot be stored.

29. **`assessment_question_options`** (PK `assessment_question_option_id`; `UQ(assessment_question_id, option_key)`)
    - **CRITICAL CONSTRAINT**: Partial unique index `uq_assessment_question_one_correct_option` (`WHERE is_correct = true`) restricts every question to **single-correct MCQ only** (multi-select MSQ blocked).
    - **View**: `public.student_assessment_question_options` exposes option fields to students **without `is_correct`**.

30. **`assessment_student_answers`** (PK `assessment_student_answer_id`; `UQ(assessment_student_id, assessment_question_id)`)
    - **Key Fields**: `selected_option_id?`, `answer_status` (`answered|unanswered`), `evaluation_status` (`pending|evaluated`), `is_correct?`, `marks_awarded?`.
    - **CRITICAL LIMITATION**: Only supports `selected_option_id` (foreign key to `assessment_question_options`). Has **NO columns** for written text responses, uploaded answer scripts/audio/video, AI confidence/rationale, teacher score overrides, or plagiarism metrics. Evaluated exclusively by PG function `s36_evaluate_assessment_mcq()`.

_(Exact pure Stage 3 table tally: 3 (S3.1) + 5 (S3.2) + 6 (S3.4) + 16 (S3.5+S3.6) + 3 (S3.7) + 2 (S3.8) + 3 (S3.9) ... wait let's check exact sum: `3 + 5 + 6 + 16` = 30? Wait: S3.5/S3.6 is `assessment_attachments`, `assessment_attendance`, `assessment_audit_history`, `assessment_competency_mappings`, `assessment_component_marks`, `assessment_components`, `assessment_question_options`, `assessment_questions`, `assessment_result_approvals`, `assessment_results`, `assessment_rubric_criteria`, `assessment_rubric_evaluations`, `assessment_rubrics`, `assessment_student_answers`, `assessment_students`, `assessments` = **16 tables**! Plus `3 + 5 + 6 + 16 + 3 + 2 + 3` = 38? Let's double check S3.9 = 3, S3.8 = 2, S3.7 = 3 (`learning_gap_thresholds`, `student_learning_gaps`, `intervention_plans`, `intervention_progress_notes` = **4 tables**!). So `3 + 5 + 6 + 16 + 4 + 2 + 3` = **39 tables**! Exact 100% count verified!)_

### S3.7 — Learning Gaps & Interventions (4 Tables)

31. **`learning_gap_thresholds`** (PK `threshold_id`; Tenant `org_id`) — Active org/year default (`assessment_id IS NULL`) OR per-assessment override (`assessment_id NOT NULL`), `threshold_percentage` `0..100`.
32. **`student_learning_gaps`** (PK `learning_gap_id`; Tenant `org_id` + `UQ(learning_gap_id, org_id)`) — `identification_method` (`automatic|teacher_identified`), `gap_status` (`potential|confirmed|dismissed|resolved`), `observed_percentage`, `threshold_snapshot`, `teacher_observation?`, `curriculum_learning_outcome_id?`. Trigger `s37_validate_gap_lifecycle` requires an associated completed `intervention_plans` row before marking `'resolved'`.
33. **`intervention_plans`** (PK `intervention_plan_id`; Tenant `org_id`; **`UNIQUE (learning_gap_id)`** = strict 1:1 gap-to-plan cardinality) — `assigned_teacher_staff_id`, `intervention_type` (`remedial_teaching|additional_practice|revision`), `intervention_description`, `status` (`not_started|in_progress|completed`).
34. **`intervention_progress_notes`** (PK `progress_note_id`) — `intervention_plan_id`, `recorded_by_user_id`, `progress_note`, `recorded_at`, `is_parent_visible`. Trigger `s37_prevent_progress_notes_mutation` makes notes **append-only & immutable**.

### S3.8 — Competency Analytics (2 Tables)

35. **`competency_analytics_thresholds`** (PK `competency_threshold_id`; `UQ(org_id)`) — Organization cutoffs (`developing_min_percentage < proficient_min_percentage < mastered_min_percentage`).
36. **`student_competency_analytics`** (PK `student_competency_analytics_id`; Tenant `org_id`) — Pre-aggregated table keyed by `analytics_dimension` (**`'concept_mastery'`** requiring `learning_outcome_id`, OR **`'bloom_level'`** requiring `bloom_level`), `average_percentage`, `mastery_level` (`needs_improvement|developing|proficient|mastered`), `evidence_count`, `calculation_version`. **Lacks 4Cs / behavioural / co-curricular dimensions.**

### S3.9 — Holistic Progress Cards (3 Tables)

37. **`student_progress_cards`** (PK `progress_card_id`; Tenant `org_id` + `UQ(org_id, academic_year_id, student_id, reporting_period[, academic_term_id])`) — `reporting_period` (`term|annual`), `academic_term_id?`, `workflow_status` (`draft|compiling|pending_approval|published|revision_in_progress`), `current_version_number`.
38. **`student_progress_card_contributions`** (PK `progress_card_contribution_id`) — `contributor_staff_id` ONLY (`contribution_role` = `'subject_teacher'` or `'class_teacher'`), `contribution_section` (`academic|competency|attendance|learning_activities|overall`), `strengths?`, `improvement_areas?`, `teacher_remarks?`. **Zero student self-reflection, peer feedback, parent feedback, or sports/club fields.**
39. **`student_progress_card_versions`** (PK `progress_card_version_id`; `UQ(progress_card_id, version_number)`; partial UQ 1 `'published'` version per card) — `version_status` (`pending_approval|approved|published|rejected|superseded`), `report_snapshot` (`Json` object), `source_data_as_of`, `pdf_file_url?`, `supersedes_version_id?`. Trigger `s39_protect_progress_card_versions_immutable` enforces **immutability** on update/delete _(must verify exact mutation exceptions if `published` transition occurs inside `student_progress_card_versions` trigger — noted for Phase 2 SQL review)_.

---

## 6. Enum Inventory Summary (`92` PG Enums & Unused Legacy Enums)

All **92** enums in `schema.prisma` match live PostgreSQL `pg_enum` labels 1:1. Key findings:

- **Actively Used Stage 3 Enums**:
  - S3.1: `classroom_session_creation_method`, `classroom_delivery_mode`, `classroom_teaching_approach`, `classroom_session_status`, `classroom_attendance_status`, `classroom_participation_mode`
  - S3.2: `s32_activity_type` (`homework|project`), `s32_activity_status`, `s32_submission_status`, `s32_review_decision`
  - S3.4: `ai_copilot_generation_type`, `ai_copilot_request_status`, `ai_copilot_material_status`, `ai_copilot_recommendation_status`
  - Stage 2/S3 Competency: `learning_outcome_bloom_level` (`remember|understand|apply|analyze|evaluate|create`)
- **Unused Orphan Enums in Database (`10` enums defined in PG/Prisma with ZERO referencing columns)**:
  - `assignment_type` (`written_response`, `video_presentation`, `audio_submission`, `quiz`, `draw_and_answer`, `match_pairs`, `fill_in_blanks`, `reading_assessment`, `public_speaking`, `code_simulator`)
  - `submission_status` (`not_submitted`, `submitted`, `under_review`, `evaluated`, `returned`)
  - `assessment_kind` (`formative`, `summative`, `diagnostic`, `competency_based`, `skill_based`, `project_based`, `viva`, `portfolio`)
  - Plus `attendance_status`, `audit_type`, `compliance_doc_status`, `loan_status`, `payment_mode`, `payment_status`, `prediction_type`.
  - **Architectural Warning**: Phase 2 engineers must **NOT** build code expecting `assignment_type` or `submission_status` enums to back `learning_activities`; those columns use `s32_activity_type` and `s32_submission_status` instead!
