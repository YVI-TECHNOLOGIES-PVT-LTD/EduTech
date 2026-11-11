# EduTrack ERP — Database Forensic Audit

# Report 09: Stage 2 Academic Planning Compatibility Assessment

**Audit Date:** November 10, 2026  
**Auditor:** Senior Enterprise Database Architect & Academic Planning Domain Specialist  
**Audit Scope:** Functional & Persistence Feasibility Analysis of Stage 2 Academic Planning Requirements against the Frozen Database  
**Baseline Artifacts:** `apps/database/stage_1/schema/*.sql`, `apps/backend/prisma/schema.prisma`, `apps/backend/src/modules/`

---

## 1. Executive Summary

This assessment evaluates whether the current database implementation supports the 6 functional requirements of **Stage 2 Academic Planning**:

1. **Academic Year Configuration**
2. **Board / Framework Mapping**
3. **AI Curriculum Designer**
4. **Digital Resource Library**
5. **AI Lesson Planning**
6. **Academic Setup Publishing**

### Primary Verdict:

- The **frozen Stage-1 SQL database (`apps/database/stage_1/schema/`) DOES NOT SUPPORT Stage 2 Academic Planning** beyond basic foundational academic year, grade, and section records.
- Although 76 subsequent models (including curriculum plans, framework versions, learning resources, and lesson plans) have been introspected into `apps/backend/prisma/schema.prisma`, **ZERO backend services, controllers, repositories, or API routes exist to operate on them**.
- Under the governing database freeze (`.agents/AGENTS.md`), **zero DDL modifications or schema regenerations are permitted**. Therefore, implementing Stage 2 Academic Planning requires an **explicit architectural decision to unfreeze the database for Stage 2**.

---

## 2. Stage 2 Compatibility Matrix

|  #  | Stage 2 Requirement             | Existing SQL Support (`stage_1/schema/`)                                                        | Existing Prisma Model Support                                                                                                         | Existing Backend Support                                                              | Persistence Limitation                                                              |              Final Result              |
| :-: | :------------------------------ | :---------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------- | :------------------------------------: |
|  1  | **Academic Year Configuration** | Tables `academic_years`, `grades`, `academic_year_grades`, `sections` exist in `04_tables.sql`. | Models `academic_calendars`, `academic_calendar_entries`, `academic_terms`, `academic_calendar_working_days` exist.                   | Implemented for core structure in `academic-management/`. No calendar/terms services. | Lacks fine-grained term dates, cycle days, and vacation schedules in SQL DDL suite. |        **Partially Supported**         |
|  2  | **Board / Framework Mapping**   | Only unstructured string columns (`board_affiliation` on `organizations`).                      | Models `curriculum_frameworks`, `curriculum_framework_versions`, `curriculum_learning_outcomes`, `academic_year_curriculum_mappings`. | **ZERO** backend controllers, services, or repositories exist.                        | Stage-1 SQL has no framework tables. Prisma models are unserviced.                  | **Not Supported by Verified Database** |
|  3  | **AI Curriculum Designer**      | **ZERO** tables in `stage_1/schema/`.                                                           | Models `curriculum_plans`, `curriculum_plan_units`, `curriculum_learning_outcomes`.                                                   | **ZERO** backend controllers, services, or repositories exist.                        | No DDL in Stage-1 SQL. No backend implementation.                                   | **Not Supported by Verified Database** |
|  4  | **Digital Resource Library**    | **ZERO** tables in `stage_1/schema/`.                                                           | Models `learning_resources`, `learning_resource_grades`, `learning_resource_tags`, `learning_resource_shares`, `resource_categories`. | **ZERO** backend controllers, services, or repositories exist.                        | No DDL in Stage-1 SQL. No bucket or metadata mapping in backend.                    | **Not Supported by Verified Database** |
|  5  | **AI Lesson Planning**          | **ZERO** tables in `stage_1/schema/`.                                                           | Models `lesson_plans`, `lesson_activities`, `lesson_differentiation_strategies`, `lesson_exit_tickets`, `lesson_plan_outcomes`.       | **ZERO** backend controllers, services, or repositories exist.                        | No DDL in Stage-1 SQL. No backend implementation.                                   | **Not Supported by Verified Database** |
|  6  | **Academic Setup Publishing**   | **ZERO** tables in `stage_1/schema/`.                                                           | Models `academic_calendar_publication_history`, `timetable_publication_history`.                                                      | **ZERO** backend controllers, services, or repositories exist.                        | No DDL in Stage-1 SQL. No state machine or versioning service.                      | **Not Supported by Verified Database** |

---

## 3. Deep-Dive Requirement Evaluation

### Requirement 1: Academic Year Configuration

- **Current State:** The system successfully manages `academic_years`, `grades`, `academic_year_grades`, and `sections` via [`academic-management`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/academic-management/).
- **Gap:** True academic planning requires operational term definitions (Term 1, Term 2, Semesters), weekly working day schedules, holiday entries, and bell schedules. While Prisma defines `academic_calendars`, `academic_terms`, and `academic_calendar_entries`, the Stage-1 SQL suite completely lacks these tables, and backend APIs do not expose endpoints for them.
- **Verdict:** **PARTIALLY SUPPORTED**.

### Requirement 2: Board / Framework Mapping

- **Current State:** An institution can only store a simple string in `organizations.board_affiliation` (e.g. `'CBSE'`, `'ICSE'`).
- **Gap:** Academic planning requires formal national curriculum standards (e.g., NEP 2020 competencies, Cambridge IGCSE learning goals, CBSE subject codes). While `schema.prisma` contains `curriculum_frameworks` and `curriculum_framework_versions`, no database migrations exist in `stage_1/schema/`, and no backend module exists.
- **Verdict:** **NOT SUPPORTED BY VERIFIED DATABASE**.

### Requirement 3: AI Curriculum Designer

- **Current State:** Completely absent from Stage-1 SQL and backend services.
- **Gap:** Designing annual curricula requires multi-unit syllabi planning, unit duration, weightage, and learning objectives. Models `curriculum_plans` and `curriculum_plan_units` exist in `schema.prisma` but have no active persistence service.
- **Critical Risk:** If a developer attempts to call `prisma.curriculum_plans.create(...)` without a physical database table, the Prisma Proxy fallback (`apps/backend/src/lib/prismaClient.ts`) will **silently store the curriculum in Node.js RAM**, destroying the curriculum plan upon server restart!
- **Verdict:** **NOT SUPPORTED BY VERIFIED DATABASE**.

### Requirement 4: Digital Resource Library

- **Current State:** Storage exists only for `admission_documents` (`admission-documents` Supabase bucket). No general academic resource storage bucket or metadata tables exist in Stage-1 SQL.
- **Gap:** Sharing teaching assets (PDFs, PPTs, videos, worksheets) across grades and sections requires digital resource entities.
- **Verdict:** **NOT SUPPORTED BY VERIFIED DATABASE**.

### Requirement 5: AI Lesson Planning

- **Current State:** Completely absent from Stage-1 SQL and backend services.
- **Gap:** Day-to-day lesson plans, pedagogical strategies, differentiation plans for remedial students, and exit tickets require dedicated persistence.
- **Verdict:** **NOT SUPPORTED BY VERIFIED DATABASE**.

### Requirement 6: Academic Setup Publishing

- **Current State:** The database does not support versioning or publication snapshots for academic configurations.
- **Gap:** Publishing an academic setup requires locking the curriculum, calendar, and class assignments into an immutable published version with audit history (`publication_history`).
- **Verdict:** **NOT SUPPORTED BY VERIFIED DATABASE**.

---

## 4. Stage 2 Architectural Roadmap & Next Actions

1. **Do NOT Attempt Workarounds:**
   - Under no circumstances should developers persist Stage 2 curriculum or lesson plans in browser local storage, mock JSON files, or overloaded generic tables.
2. **Explicit Governance Decision Required:**
   - The Stage-1 database freeze (`.agents/AGENTS.md`) prohibits schema changes.
   - To proceed with Stage 2 Academic Planning, the product owner and architectural board must formally authorize **Phase 2 Database Migration**, creating physical DDL scripts in `apps/database/stage_2/schema/` matching the introspected Prisma models.
3. **Decommission In-Memory Fallback:**
   - Before implementing Stage 2 services, remove the silent in-memory fallback in `apps/backend/src/lib/prismaClient.ts` to ensure missing tables fail loudly during integration testing.
