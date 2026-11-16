# EduTrack ERP — Stage 2 Database Architecture

# Report 12: Stage 2 Master Database Architecture Decision Record (ADR)

**Document ID:** ADR-EDUTRACK-STG2-001  
**Date:** November 10, 2026  
**Status:** PROPOSED (Awaiting Architectural Board Approval)  
**Authors:** Principal Database Architect, PostgreSQL Specialist, Prisma Architect, Data Governance Engineer  
**Context:** EduTrack ERP Stage 2 Academic Planning Persistence Architecture  
**Governing Rule:** `.agents/AGENTS.md` (Stage-1 Database Freeze)

---

## 1. Executive Summary & Verdict

This Architecture Decision Record (ADR) provides the definitive, evidence-based governance evaluation for the **Stage 2 Academic Planning** database design in EduTrack ERP.

### Core Architecture Verdict:

- **The finalized Stage-1 database is INSUFFICIENT for Stage 2 Academic Planning.**
- Stage 1 physically implements only foundational academic entities (`academic_years`, `grades`, `academic_year_grades`, `sections`). It contains **zero physical persistence** for curriculum frameworks, competency outcomes, AI curriculum plans, unit breakdowns, lesson plans, differentiation strategies, digital library assets, or publication snapshots.
- Although 34 Stage-2 models already exist in `apps/backend/prisma/schema.prisma` (introspected from Supabase), **they lack physical DDL backing in the Stage-1 SQL suite and lack backend services**.
- Attempting to implement Stage-2 services under the current codebase creates a **critical risk of silent data loss**: the production Prisma client proxy (`apps/backend/src/lib/prismaClient.ts`) intercepts unmapped models and silently stores records in Node.js RAM (`Map`), wiping all data on server restart.
- **Implementation Status:** `ARCHITECTURE READY WITH BLOCKERS`. Implementation is blocked pending formal governance sign-off to lift the Stage-1 freeze and authorize the Stage-2 DDL migration package.

---

## 2. Answers to the 12 Mandatory Architecture Questions

### Question 1: Is the Stage-1 database sufficient for all six Stage-2 modules?

- **Answer:** **NO.**
- **Evidence:** The Stage-1 SQL suite (`apps/database/stage_1/schema/`) contains exactly 33 physical tables dedicated to core tenancy, HR, CRM, admission workflows, and basic grade/section groupings. None of the 6 Stage-2 capabilities (calendars, frameworks, curriculum designer, digital resources, lesson plans, publishing) have physical schema support in the Stage-1 baseline.

### Question 2: Which capabilities can reuse existing Stage-1 tables?

- **Answer:** **Foundational Academic Hierarchy only.**
- **Reused Tables:**
  - `organizations`: Root tenant anchor.
  - `academic_years`: Annual calendar anchor.
  - `grades`: Base grade offerings (e.g. Grade 1 to 12).
  - `academic_year_grades`: Annual grade offerings.
  - `sections`: Classroom cohorts.
  - `staff`: Teacher assignment profiles.
  - `users`: Author and publisher identities.

### Question 3: Which capabilities require new physical tables?

- **Answer:** **All 6 Stage-2 modules require dedicated physical tables (34 tables total):**
  1. _Academic Calendar:_ `academic_calendars`, `academic_terms`, `academic_calendar_entries`, `academic_calendar_entry_grades`, `academic_calendar_working_days`, `academic_calendar_publication_history` (6 tables).
  2. _Framework & Subjects:_ `curriculum_frameworks`, `curriculum_framework_versions`, `curriculum_learning_outcomes`, `academic_year_curriculum_mappings`, `subject_categories`, `subjects`, `academic_year_grade_subjects`, `subject_selection_groups`, `subject_selection_group_options`, `staff_subject_qualifications`, `section_subject_faculty_assignments` (11 tables).
  3. _AI Curriculum Designer:_ `curriculum_plans`, `curriculum_plan_units` (2 tables).
  4. _Digital Resource Library:_ `resource_categories`, `resource_tags`, `learning_resources`, `learning_resource_grades`, `learning_resource_subjects`, `learning_resource_tags`, `learning_resource_shares`, `learning_resource_share_sections`, `learning_resource_recipients` (9 tables).
  5. _AI Lesson Planning:_ `lesson_plans`, `lesson_activities`, `lesson_differentiation_strategies`, `lesson_exit_tickets`, `lesson_plan_outcomes`, `lesson_plan_resources` (6 tables).

### Question 4: Which Prisma models are currently unsupported by verified physical persistence?

- **Answer:** **All 34 Stage-2 Prisma models** listed in Question 3 are unsupported by the verified Stage-1 SQL suite (`apps/database/stage_1/schema/`). In addition, 8 Stage-3 models and 34 Stage-4 models in `schema.prisma` are also unbacked by the Stage-1 SQL baseline.

### Question 5: What database changes are mandatory?

- **Answer:**
  1. Execution of `apps/database/stage_2/schema/00_stage1_compatibility_patch.sql` to resolve 6 Stage-1 bootstrap defects (missing enum `notification_priority`, missing column `lead_activity_id`, syntax blocks).
  2. Execution of the 34 Stage-2 table DDL scripts with composite foreign keys and 38 performance indexes.
  3. Activation of `pg_trgm` extension for digital library full-text search.

### Question 6: What changes can be implemented at the application level without database changes?

- **Answer:**
  1. **Strict Fail-Closed Prisma Client:** Remove the in-memory `Map` fallback in `apps/backend/src/lib/prismaClient.ts` to throw hard exceptions on unmapped model calls.
  2. **Zod Validation DTOs:** Build Stage-2 request/response schemas.
  3. **AI Prompt Orchestration Services:** Integrate Anthropic/OpenAI/Gemini APIs for curriculum and lesson draft generation without persisting to DB yet.
  4. **RBAC Middleware Policies:** Define permission scopes for Academic Coordinators and Teachers.

### Question 7: What tenant isolation risks remain?

- **Answer:**
  - PostgreSQL connections currently execute as superuser `postgres`, bypassing Row Level Security.
  - Until the backend runs under unprivileged role `edutrack_app` with session variable `app.current_org_id` injected per transaction, tenant isolation is enforced **strictly at the application layer**.

### Question 8: What is the recommended Prisma integration architecture?

- **Answer:** **Option 2: Controlled Governance Unfreeze & Unified Schema Evolution.** Maintain a single AST model graph in `apps/backend/prisma/schema.prisma` after formally lifting the Stage-1 freeze. This preserves native relations, avoids model duplication, and enables atomic `$transaction` blocks across academic boundaries.

### Question 9: What is the recommended Stage-2 migration structure?

- **Answer:** A modular, decoupled SQL package in `apps/database/stage_2/schema/` (00 to 09) executed sequentially via an automated migration runner script. Stage-1 SQL files remain 100% untouched.

### Question 10: What is the exact backend implementation order?

- **Answer:**
  1. Phase 1: Master Subjects & Framework Catalog (Modules 1 & 2 Foundations).
  2. Phase 2: Academic Calendars & Operational Terms (Module 1 Scheduling).
  3. Phase 3: AI Curriculum Designer (Module 3 Plans, Units, Outcomes).
  4. Phase 4: Digital Resource Library (Module 4 Storage & Access Grants).
  5. Phase 5: AI Lesson Planning (Module 5 Daily Plans & Activities).
  6. Phase 6: Academic Setup Publishing Engine (Module 6 Pre-Flight Validators & Snapshots).

### Question 11: What must be approved before backend implementation begins?

- **Answer:**
  1. Formal sign-off on lifting the Stage-1 database freeze (`.agents/AGENTS.md`).
  2. Approval to provision physical Stage-2 DDL in PostgreSQL.
  3. Approval of the Stage-1 compatibility patch script (`00_stage1_compatibility_patch.sql`).
  4. Approval to decommission the in-memory fallback proxy in `prismaClient.ts`.

### Question 12: What are the remaining blockers?

- **Answer:**
  1. **Blocker 1 (Governance):** Strict Stage-1 freeze rule prohibits DDL execution.
  2. **Blocker 2 (Persistence Hazard):** In-memory proxy in `prismaClient.ts` must be disabled before developers write Stage-2 code.
  3. **Blocker 3 (Bootstrap Defects):** Target databases must apply the Stage-1 compatibility patch before Stage-2 tables can link to them.

---

## 3. Evidence-Based Finding Classifications

| Finding ID       | Classification               |  Severity  | Description                                                                                                                           |
| :--------------- | :--------------------------- | :--------: | :------------------------------------------------------------------------------------------------------------------------------------ |
| **FIND-SEC-01**  | Verified Repository Fact     | `CRITICAL` | PostgreSQL RLS is inoperative; superuser connection bypasses policies; `app.current_org_id` is never injected.                        |
| **FIND-APP-01**  | Verified Repository Fact     | `CRITICAL` | Prisma proxy in `prismaClient.ts` routes unmapped model writes to Node.js RAM (`fallbackStores`), risking total data loss on restart. |
| **FIND-SQL-01**  | Verified Repository Fact     |   `HIGH`   | Missing comma in `organizations` DDL (`04_tables.sql:41`) halts bootstrap.                                                            |
| **FIND-SQL-02**  | Verified Repository Fact     |   `HIGH`   | Missing comma in `student_enrollments` DDL (`04_tables.sql:1284`) halts bootstrap.                                                    |
| **FIND-SQL-03**  | Verified Repository Fact     |   `HIGH`   | Missing enum `notification_priority` in `02_enums.sql` halts `notifications` table creation.                                          |
| **FIND-SQL-05**  | Verified Repository Fact     |   `HIGH`   | Dangling token `Create` in `07_triggers.sql:194` aborts trigger attachment.                                                           |
| **FIND-PSC-01**  | Verified Repository Fact     |   `HIGH`   | Index `ix_chatbot_sessions_lead_activity` in `06_indexes.sql` references column absent from table DDL.                                |
| **FIND-REL-01**  | Verified Repository Fact     |   `HIGH`   | Destructive `ON DELETE CASCADE` on `admissions_applications` and `admission_fee_payments`.                                            |
| **FIND-REL-02**  | Verified Repository Fact     |   `HIGH`   | `admissions_applications` lacks grade column, failing direct parent application persistence.                                          |
| **FIND-STG2-01** | Verified Repository Fact     |   `HIGH`   | Stage 2 Academic Planning persistence is absent from Stage-1 SQL baseline.                                                            |
| **FIND-SEC-03**  | Verified Repository Fact     |   `HIGH`   | Controller silently defaults to first organization on missing tenant context.                                                         |
| **FIND-REL-03**  | Verified Repository Fact     |  `MEDIUM`  | `student_enrollments` permits section-to-grade mismatch due to lack of composite foreign key.                                         |
| **FIND-REL-04**  | Verified Repository Fact     |  `MEDIUM`  | Student dual enrollment in same academic year is permitted by current database constraints.                                           |
| **FIND-IDX-02**  | Verified Repository Fact     |  `MEDIUM`  | Unindexed foreign keys on `staff(user_id)`, `admission_decisions(application_id)`, `admission_fee_payments(application_id)`.          |
| **FIND-TRG-01**  | Verified Repository Fact     |  `MEDIUM`  | 4 tables with `updated_at` lack `set_updated_at` trigger attachment.                                                                  |
| **FIND-APP-02**  | Verified Repository Fact     |  `MEDIUM`  | Concurrency race condition on `admission_no` generation via `count(*) + 1`.                                                           |
| **REC-ROL-01**   | Architectural Recommendation |   `HIGH`   | Transition backend runtime to unprivileged PostgreSQL role `edutrack_app` with automated session tenant context injection.            |

---

## 4. Final Architecture Governance Sign-Off

- **Audit Completion:** 100% Complete.
- **Repository Modification Check:** Zero application source files, Stage-1 SQL files, or Prisma models were modified during this assessment.
- **Documentation Deliverables:** All 12 Stage-2 architecture blueprints created under `docs/database/stage-2/`.
- **Status:** **`ARCHITECTURE READY WITH BLOCKERS`**.
- **Next Step:** Present this ADR to the Architectural Review Board to authorize the Stage-2 unfreeze and approve the Stage-2 DDL package.
