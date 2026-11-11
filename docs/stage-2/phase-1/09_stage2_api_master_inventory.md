# EduTrack ERP — Stage-2 Phase 1: API Master Inventory

**Document ID:** `docs/stage-2/phase-1/09_stage2_api_master_inventory.md`  
**Phase:** Stage-2 Phase 1: Foundation & Database Contract Verification  
**Author:** Backend Architecture Lead & API Design Lead  
**Date:** November 2026  
**Status:** COMPLETE / PROPOSED SPECIFICATION

---

## 1. Executive Summary

This document presents the complete master inventory of proposed REST API endpoints required to support all six functional modules of Stage 2 (**Academic Planning & Digital Campus Setup**).

> [!IMPORTANT]
> **Implementation Governance:** These endpoints represent the target contract specification. None of these endpoints have been implemented in code during Phase 1. Endpoints that depend on unmigrated Stage-2 physical tables are explicitly flagged with their persistence blockers.

---

## 2. API Master Inventory

### 2.1 Module 1: Academic Year Configuration

| Method  | Proposed Route                       | Purpose                               | Role / Permission | Org Scope         | Entities Involved                      | Persistence Status           |
| ------- | ------------------------------------ | ------------------------------------- | ----------------- | ----------------- | -------------------------------------- | ---------------------------- |
| `GET`   | `/v1/academic/overview`              | Summary metrics of academic setup     | `ACADEMIC_VIEW`   | Tenant (`org_id`) | `academic_years`, `grades`, `sections` | **Durable PostgreSQL**       |
| `GET`   | `/v1/academic/years`                 | List all academic years for tenant    | `ACADEMIC_VIEW`   | Tenant (`org_id`) | `academic_years`                       | **Durable PostgreSQL**       |
| `POST`  | `/v1/academic/years`                 | Create new academic session           | `ACADEMIC_SETUP`  | Tenant (`org_id`) | `academic_years`                       | **Durable PostgreSQL**       |
| `PATCH` | `/v1/academic/years/:id`             | Update academic session dates/status  | `ACADEMIC_SETUP`  | Tenant (`org_id`) | `academic_years`                       | **Durable PostgreSQL**       |
| `GET`   | `/v1/academic/year-grades`           | List grade offerings in session       | `ACADEMIC_VIEW`   | Tenant (`org_id`) | `academic_year_grades`, `grades`       | **Durable PostgreSQL**       |
| `POST`  | `/v1/academic/year-grades`           | Map grades to academic session        | `ACADEMIC_SETUP`  | Tenant (`org_id`) | `academic_year_grades`                 | **Durable PostgreSQL**       |
| `GET`   | `/v1/academic/sections`              | List class sections                   | `ACADEMIC_VIEW`   | Tenant (`org_id`) | `sections`, `staff`                    | **Durable PostgreSQL**       |
| `POST`  | `/v1/academic/sections`              | Create new section with class teacher | `ACADEMIC_SETUP`  | Tenant (`org_id`) | `sections`                             | **Durable PostgreSQL**       |
| `GET`   | `/v1/academic/calendars`             | List academic calendars               | `ACADEMIC_VIEW`   | Tenant (`org_id`) | `academic_calendars`                   | **Blocked: In-Memory Proxy** |
| `POST`  | `/v1/academic/calendars`             | Create institutional calendar         | `ACADEMIC_SETUP`  | Tenant (`org_id`) | `academic_calendars`                   | **Blocked: In-Memory Proxy** |
| `POST`  | `/v1/academic/calendars/:id/entries` | Add holiday/exam event to calendar    | `ACADEMIC_SETUP`  | Tenant (`org_id`) | `academic_calendar_entries`            | **Blocked: In-Memory Proxy** |

---

### 2.2 Module 2: Board / Framework Mapping

| Method | Proposed Route                          | Purpose                                 | Role / Permission | Org Scope         | Entities Involved                 | Persistence Status           |
| ------ | --------------------------------------- | --------------------------------------- | ----------------- | ----------------- | --------------------------------- | ---------------------------- |
| `GET`  | `/v1/academic/frameworks`               | List supported curriculum frameworks    | `ACADEMIC_VIEW`   | Tenant (`org_id`) | `curriculum_frameworks`, `grades` | **Blocked: In-Memory Proxy** |
| `POST` | `/v1/academic/frameworks`               | Register institutional board framework  | `ACADEMIC_SETUP`  | Tenant (`org_id`) | `curriculum_frameworks`           | **Blocked: In-Memory Proxy** |
| `GET`  | `/v1/academic/frameworks/:id/versions`  | List framework versions (e.g. NEP 2020) | `ACADEMIC_VIEW`   | Tenant (`org_id`) | `curriculum_framework_versions`   | **Blocked: In-Memory Proxy** |
| `POST` | `/v1/academic/frameworks/:id/versions`  | Create framework version standard       | `ACADEMIC_SETUP`  | Tenant (`org_id`) | `curriculum_framework_versions`   | **Blocked: In-Memory Proxy** |
| `GET`  | `/v1/academic/subjects`                 | List institutional subjects taxonomy    | `ACADEMIC_VIEW`   | Tenant (`org_id`) | `subjects`, `subject_categories`  | **Blocked: In-Memory Proxy** |
| `POST` | `/v1/academic/subjects`                 | Create new curriculum subject           | `ACADEMIC_SETUP`  | Tenant (`org_id`) | `subjects`                        | **Blocked: In-Memory Proxy** |
| `POST` | `/v1/academic/year-grades/:id/subjects` | Map subjects to grade offerings         | `ACADEMIC_SETUP`  | Tenant (`org_id`) | `academic_year_grade_subjects`    | **Blocked: In-Memory Proxy** |

---

### 2.3 Module 3: AI Curriculum Designer

| Method | Proposed Route                                             | Purpose                           | Role / Permission | Org Scope         | Entities Involved               | Persistence Status           |
| ------ | ---------------------------------------------------------- | --------------------------------- | ----------------- | ----------------- | ------------------------------- | ---------------------------- |
| `GET`  | `/v1/academic/curriculum-plans`                            | List curriculum plans             | `ACADEMIC_VIEW`   | Tenant (`org_id`) | `curriculum_plans`              | **Blocked: In-Memory Proxy** |
| `POST` | `/v1/academic/curriculum-plans`                            | Create blank curriculum plan      | `ACADEMIC_SETUP`  | Tenant (`org_id`) | `curriculum_plans`              | **Blocked: In-Memory Proxy** |
| `POST` | `/v1/academic/curriculum-plans/ai-generate`                | AI generation of curriculum units | `ACADEMIC_SETUP`  | Tenant (`org_id`) | Gemini LLM + `curriculum_plans` | **Blocked: In-Memory Proxy** |
| `GET`  | `/v1/academic/curriculum-plans/:id/units`                  | List units in curriculum plan     | `ACADEMIC_VIEW`   | Tenant (`org_id`) | `curriculum_plan_units`         | **Blocked: In-Memory Proxy** |
| `POST` | `/v1/academic/curriculum-plans/:id/units`                  | Add manual or reviewed unit       | `ACADEMIC_SETUP`  | Tenant (`org_id`) | `curriculum_plan_units`         | **Blocked: In-Memory Proxy** |
| `POST` | `/v1/academic/curriculum-plans/:id/units/:unitId/outcomes` | Add Bloom's learning outcome      | `ACADEMIC_SETUP`  | Tenant (`org_id`) | `curriculum_learning_outcomes`  | **Blocked: In-Memory Proxy** |

---

### 2.4 Module 4: Digital Resource Library

| Method | Proposed Route                            | Purpose                             | Role / Permission | Org Scope         | Entities Involved               | Persistence Status           |
| ------ | ----------------------------------------- | ----------------------------------- | ----------------- | ----------------- | ------------------------------- | ---------------------------- |
| `GET`  | `/v1/academic/resources`                  | List/Search learning resources      | `ACADEMIC_VIEW`   | Tenant (`org_id`) | `learning_resources`            | **Blocked: In-Memory Proxy** |
| `POST` | `/v1/academic/resources/upload`           | Upload binary resource (PDF/PPT)    | `ACADEMIC_SETUP`  | Tenant (`org_id`) | Supabase + `learning_resources` | **Blocked: In-Memory Proxy** |
| `POST` | `/v1/academic/resources/link`             | Save external link (YouTube/OER/VR) | `ACADEMIC_SETUP`  | Tenant (`org_id`) | `learning_resources`            | **Blocked: In-Memory Proxy** |
| `GET`  | `/v1/academic/resources/:id/download-url` | Generate signed download URL        | `ACADEMIC_VIEW`   | Tenant (`org_id`) | Supabase Storage Service        | **Supported via Supabase**   |
| `POST` | `/v1/academic/resources/:id/share`        | Share resource with grade/section   | `ACADEMIC_SETUP`  | Tenant (`org_id`) | `learning_resource_shares`      | **Blocked: In-Memory Proxy** |
| `GET`  | `/v1/academic/resources/categories`       | List resource categories            | `ACADEMIC_VIEW`   | Tenant (`org_id`) | `resource_categories`           | **Blocked: In-Memory Proxy** |

---

### 2.5 Module 5: AI Lesson Planning

| Method  | Proposed Route                               | Purpose                           | Role / Permission | Org Scope         | Entities Involved           | Persistence Status           |
| ------- | -------------------------------------------- | --------------------------------- | ----------------- | ----------------- | --------------------------- | ---------------------------- |
| `GET`   | `/v1/academic/lesson-plans`                  | List teacher's lesson plans       | `ACADEMIC_VIEW`   | Tenant (`org_id`) | `lesson_plans`              | **Blocked: In-Memory Proxy** |
| `POST`  | `/v1/academic/lesson-plans`                  | Create draft lesson plan          | `ACADEMIC_SETUP`  | Tenant (`org_id`) | `lesson_plans`              | **Blocked: In-Memory Proxy** |
| `POST`  | `/v1/academic/lesson-plans/ai-generate`      | AI generate complete lesson draft | `ACADEMIC_SETUP`  | Tenant (`org_id`) | Gemini LLM + `lesson_plans` | **Blocked: In-Memory Proxy** |
| `PATCH` | `/v1/academic/lesson-plans/:id`              | Update / Review lesson plan       | `ACADEMIC_SETUP`  | Tenant (`org_id`) | `lesson_plans`              | **Blocked: In-Memory Proxy** |
| `POST`  | `/v1/academic/lesson-plans/:id/activities`   | Add activity step to plan         | `ACADEMIC_SETUP`  | Tenant (`org_id`) | `lesson_activities`         | **Blocked: In-Memory Proxy** |
| `POST`  | `/v1/academic/lesson-plans/:id/exit-tickets` | Create formative exit ticket      | `ACADEMIC_SETUP`  | Tenant (`org_id`) | `lesson_exit_tickets`       | **Blocked: In-Memory Proxy** |

---

### 2.6 Module 6: Academic Setup Published

| Method | Proposed Route                     | Purpose                               | Role / Permission | Org Scope         | Entities Involved                       | Persistence Status           |
| ------ | ---------------------------------- | ------------------------------------- | ----------------- | ----------------- | --------------------------------------- | ---------------------------- |
| `GET`  | `/v1/academic/setup/validate`      | Audit validation rules before publish | `ACADEMIC_SETUP`  | Tenant (`org_id`) | `academic_years`, `grades`, `sections`  | **Durable PostgreSQL**       |
| `POST` | `/v1/academic/setup/publish`       | Execute atomic publish transition     | `ACADEMIC_SETUP`  | Tenant (`org_id`) | `academic_years` (`status='open'`)      | **Durable PostgreSQL**       |
| `GET`  | `/v1/academic/setup/history`       | List publication history audit trail  | `ACADEMIC_VIEW`   | Tenant (`org_id`) | `academic_calendar_publication_history` | **Blocked: In-Memory Proxy** |
| `GET`  | `/v1/academic/setup/published/:id` | Retrieve locked published snapshot    | `ACADEMIC_VIEW`   | Tenant (`org_id`) | Setup snapshot repository               | **Blocked: In-Memory Proxy** |
