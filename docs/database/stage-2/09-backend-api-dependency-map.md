# EduTrack ERP — Stage 2 Database Architecture

# Report 09: Backend API Dependency Map & Implementation Sequence

**Document ID:** STG2-DB-API-09  
**Date:** November 10, 2026  
**Author:** Principal Software Architect & Backend Systems Engineer  
**Scope:** Backend Service Architecture, Repository Layering, DTO Contracts, and Endpoint Dependency Graph  
**Governing Rule:** `.agents/AGENTS.md` (Stage-1 Database Freeze)

---

## 1. Executive Summary

This document establishes the backend API domain architecture, service layer boundaries, repository interfaces, and implementation order for the **6 Stage-2 Academic Planning modules**.

All proposed APIs adhere strictly to EduTrack Enterprise Architectural Guidelines:

1. **Prisma-First Domain Model:** Operates directly on Prisma models and typed response DTOs.
2. **Decoupled Read/Write Operations:** High-volume searches and analytics live in dedicated `queries/` classes; transactional writes and state transitions reside in dedicated services.
3. **Fail-Closed Context:** Tenancy (`org_id`) and actor identity (`user_id`) are derived strictly from verified JWT claims via `session.service.ts`, never from untrusted request bodies.

---

## 2. Master Module Dependency & Implementation Graph

```
                               STAGE 2 IMPLEMENTATION SEQUENCE
                                              │
                      ┌───────────────────────▼───────────────────────┐
                      │  PHASE 1: Master Subjects & Framework Catalog │
                      │  (Modules 1 & 2 Foundations)                  │
                      └───────────────────────┬───────────────────────┘
                                              │
                      ┌───────────────────────▼───────────────────────┐
                      │  PHASE 2: Academic Calendars & Operational    │
                      │  Terms (Module 1 Scheduling)                  │
                      └───────────────────────┬───────────────────────┘
                                              │
                      ┌───────────────────────▼───────────────────────┐
                      │  PHASE 3: AI Curriculum Designer              │
                      │  (Module 3 Plans, Units, Outcomes)            │
                      └───────────────────────┬───────────────────────┘
                                              │
                      ┌───────────────────────▼───────────────────────┐
                      │  PHASE 4: Digital Resource Library            │
                      │  (Module 4 Cloud Storage & Access Grants)     │
                      └───────────────────────┬───────────────────────┘
                                              │
                      ┌───────────────────────▼───────────────────────┐
                      │  PHASE 5: AI Lesson Planning                  │
                      │  (Module 5 Daily Plans, Activities, Diff)     │
                      └───────────────────────┬───────────────────────┘
                                              │
                      ┌───────────────────────▼───────────────────────┐
                      │  PHASE 6: Academic Setup Publishing Engine    │
                      │  (Module 6 Pre-Flight Validators & Snapshots) │
                      └───────────────────────────────────────────────┘
```

---

## 3. Module-by-Module API Specification

| Module                                    | Required Entities                                                                                                                                                                               | Required Services                                                                 | Required Repositories                                                                | Proposed API Endpoints                                                                                                                                                                                                                | Upstream Dependencies                                              |
| :---------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :----------------------------------------------------------------- |
| **Module 1: Academic Year Configuration** | `academic_calendars`, `academic_terms`, `academic_calendar_entries`, `academic_calendar_working_days`, `academic_calendar_entry_grades`                                                         | `AcademicCalendarService`, `AcademicTermService`, `CalendarEntryService`          | `AcademicCalendarRepository`, `AcademicTermRepository`, `CalendarEntryRepository`    | `POST /api/v1/academic/calendars`<br>`GET /api/v1/academic/calendars/:yearId`<br>`POST /api/v1/academic/terms`<br>`GET /api/v1/academic/terms`<br>`POST /api/v1/academic/calendar-entries`<br>`GET /api/v1/academic/calendar-entries` | `academic_years`, `academic_year_grades` (Stage 1)                 |
| **Module 2: Board / Framework Mapping**   | `curriculum_frameworks`, `curriculum_framework_versions`, `curriculum_learning_outcomes`, `subject_categories`, `subjects`, `academic_year_grade_subjects`, `academic_year_curriculum_mappings` | `CurriculumFrameworkService`, `SubjectCatalogService`, `CurriculumMappingService` | `CurriculumFrameworkRepository`, `SubjectRepository`, `CurriculumMappingRepository`  | `GET /api/v1/curriculum/frameworks`<br>`POST /api/v1/curriculum/frameworks`<br>`GET /api/v1/curriculum/subjects`<br>`POST /api/v1/curriculum/subjects`<br>`POST /api/v1/curriculum/mappings`<br>`GET /api/v1/curriculum/mappings`     | `organizations`, `grades`, `academic_year_grades` (Stage 1)        |
| **Module 3: AI Curriculum Designer**      | `curriculum_plans`, `curriculum_plan_units`, `curriculum_learning_outcomes`                                                                                                                     | `CurriculumPlanService`, `CurriculumUnitService`, `AICurriculumGenerationService` | `CurriculumPlanRepository`, `CurriculumUnitRepository`, `LearningOutcomeRepository`  | `POST /api/v1/curriculum/plans/ai-draft`<br>`POST /api/v1/curriculum/plans`<br>`GET /api/v1/curriculum/plans/:id`<br>`PATCH /api/v1/curriculum/plans/:id/status`<br>`POST /api/v1/curriculum/plans/:id/units`                         | Module 2 Framework Mappings, AI Gateway Integration                |
| **Module 4: Digital Resource Library**    | `learning_resources`, `resource_categories`, `resource_tags`, `learning_resource_grades`, `learning_resource_subjects`, `learning_resource_shares`                                              | `DigitalResourceService`, `ResourceShareService`, `ResourceCategoryService`       | `DigitalResourceRepository`, `ResourceCategoryRepository`, `ResourceShareRepository` | `POST /api/v1/resources/upload-init`<br>`POST /api/v1/resources`<br>`GET /api/v1/resources/:id`<br>`GET /api/v1/resources/search`<br>`POST /api/v1/resources/:id/shares`                                                              | Supabase Private Storage Bucket `academic-resources`               |
| **Module 5: AI Lesson Planning**          | `lesson_plans`, `lesson_activities`, `lesson_differentiation_strategies`, `lesson_exit_tickets`, `lesson_plan_outcomes`, `lesson_plan_resources`                                                | `LessonPlanService`, `AILessonCoPlannerService`, `LessonActivityService`          | `LessonPlanRepository`, `LessonActivityRepository`, `LessonResourceRepository`       | `POST /api/v1/lessons/ai-generate`<br>`POST /api/v1/lessons`<br>`GET /api/v1/lessons/:id`<br>`PUT /api/v1/lessons/:id`<br>`POST /api/v1/lessons/:id/activities`<br>`POST /api/v1/lessons/:id/exit-tickets`                            | Module 3 Curriculum Units, Module 4 Learning Resources, AI Gateway |
| **Module 6: Academic Setup Publishing**   | `academic_calendar_publication_history`, `academic_calendars`, `curriculum_plans`                                                                                                               | `AcademicPublishingOrchestrator`, `AcademicPreFlightValidatorService`             | `AcademicPublishingRepository`, `CalendarValidationRepository`                       | `POST /api/v1/academic/setup/validate`<br>`POST /api/v1/academic/setup/publish`<br>`GET /api/v1/academic/setup/history/:yearId`<br>`POST /api/v1/academic/setup/rollback`                                                             | Modules 1, 2, 3, 5 Validated Data Sets                             |

---

## 4. Architectural Rules for API Implementation

1. **Transaction Scoping for Composite Writes:**
   - Multi-step writes (such as saving a curriculum plan alongside its 10 child units and outcome associations) MUST be wrapped in `prisma.$transaction(async (tx) => { ... })`.
2. **DTO Strictness:**
   - Every input payload must be parsed via Zod schemas in `dto/request/*.dto.ts` before reaching the service layer.
   - Strip unknown fields; enforce ISO-8601 date formats and UUID syntax.
3. **RBAC Guarding Matrix:**
   - **Academic Setup Publishing:** Restricted to `ADMIN` and `SUPERADMIN`.
   - **Curriculum Plans Approval:** Restricted to `ADMIN`, `ACADEMIC_COORDINATOR`, and `HEAD_OF_DEPARTMENT`.
   - **Lesson Plan Authoring:** Accessible by `TEACHER` and `STAFF` (scoped to `teacher_staff_id`).
   - **Digital Resource Management:** All teachers can upload; student viewing is scoped via `learning_resource_shares`.
