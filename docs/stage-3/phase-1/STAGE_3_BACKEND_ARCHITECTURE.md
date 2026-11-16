# EduTrack ERP — Stage 3 Backend Architecture Blueprint

> **Phase:** Stage 3, Phase 1 — Read-Only Architecture Planning  
> **Governing Contracts:** `.agents/AGENTS.md` | `apps/backend/prisma/schema.prisma` (FROZEN)  
> **Scope:** Modular backend design across S3.1–S3.9 grounded in verified database capabilities, triggers, stored procedures, and existing backend infrastructure.

---

## 1. Governing Architectural Rules & Target Layering

Per `.agents/AGENTS.md`, all Stage 3 backend development MUST strictly follow the Prisma-first source-of-truth hierarchy and layered module convention:

```text
schema.prisma (Sole DB Source of Truth — ZERO DDL / Schema Changes)
   │
   ▼
PostgreSQL Constraints, Triggers, Views & Stored Procedures (s31_*, s32_*, s34_*, s35_*, s36_*, s37_*, s39_*)
   │
   ▼
repositories/   ── Prisma delegates (rawPrisma / synced DMMF) & parameterized $queryRaw/$executeRaw calls
   │
   ▼
queries/        ── Read-only aggregations, competency analytics, search, parent/student portals
services/       ── Transactional writes, state transitions, stored-procedure orchestration, AI/storage integration
   │
   ▼
controllers/    ── Request parsing, DTO validation, HttpError mapping, policy authorization checks
   │
   ▼
routes/         ── Express router + authenticate + checkLoginApproval + resolveTenantMiddleware + RBAC
```

### Mandatory Engineering Constraints

1. **No Domain Entity Layers:** Operate directly on Prisma models and mapped response DTOs.
2. **Decoupled Read & Write Paths:** Keep read projections, dashboards, and competency analytics inside dedicated `queries/` modules, matching the `apps/backend/src/modules/academic-management/queries/` pattern (`3` existing query classes alongside `19` controllers, `20` services, `19` repositories, `11` spec files).
3. **Database-First Invariants:** Never re-implement or contradict PostgreSQL trigger rules silently in memory; enforce validation at the API boundary **and** propagate PostgreSQL `P2002` / `P0001` / `check_violation` errors cleanly as HTTP `400`/`403`/`409`/`422` domain errors.
4. **No Fake Persistence:** Never store Stage 3 operational state in `in-memory Map`s, local JSON files, or the `prismaClient.ts` fallback store. Features lacking PostgreSQL persistence MUST be flagged as **DATABASE BLOCKERS** and deferred until an approved future schema milestone.

---

## 2. Critical Pre-Phase-2 Backend Prerequisites (Blockers to Clear First)

Before writing a single Stage 3 endpoint, five structural defects discovered during Phase 1 MUST be resolved cleanly in Phase 2 Task 0:

| #      | Defect Verified in Phase 1                                                               | File / PG Location                                                                                                                              | Impact on Stage 3                                                                                                                                                                                                                                                                                                                                                                                                                                    | Required Remediation                                                                                                                                                                                                                                           |
| :----- | :--------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **B1** | **Stale `@prisma/client` DMMF (`109` models / `78` enums) + RAM `fallbackStores` Proxy** | `apps/backend/src/lib/prismaClient.ts` (`L123`, `L183–409`)                                                                                     | All `39` Stage 3 models are absent from DMMF; `wrapWithFallbackProxy` (`L389–404`) redirects every Stage 3 read/write into RAM `fallbackStores` `Map`. Additionally `FINANCIAL_PERSISTENCE_MODELS` (`L26–72`, `L344–362`) throws write blocks.                                                                                                                                                                                                       | Execute `prisma generate` against frozen `schema.prisma` (syncing all `148` models / `92` enums). Remove/disable the `fallbackStores` silent RAM fallback so unmapped delegates fail fast. Use `rawPrisma` (`L412–425`) or fixed singleton for `$transaction`. |
| **B2** | **Unauthenticated RBAC Inspection Leak**                                                 | `apps/backend/src/routes.ts` (`L590–615`)                                                                                                       | `/public/inspect-rbac` exposes RBAC internals publicly prior to global `authenticate` (`L620–621`).                                                                                                                                                                                                                                                                                                                                                  | Remove `/public/inspect-rbac` or gate it strictly behind admin auth + non-production guard.                                                                                                                                                                    |
| **B3** | **Missing Tenant Middleware & Silent Fallback**                                          | `apps/backend/src/routes.ts` (`L785–857`), `middlewares/tenant.middleware.ts`                                                                   | `/v1/academic`, `/v1/students`, `/v1/parents`, `/v1/parent` omit `resolveTenantMiddleware` (unlike `/v1/fees` & `/v1/communication`); `tenant.middleware.ts` falls back to `DEFAULT_ORG_ID` / `DEV_DEFAULT_ORG_ID` / first active DB org.                                                                                                                                                                                                            | Attach strict `resolveTenantMiddleware` to all Stage 3, academic, student, and parent routers; disable silent first-org fallback on authenticated multi-tenant requests.                                                                                       |
| **B4** | **PG Stored Proc / RLS Case-Sensitive Role Mismatch & Auth Context Gap**                 | PG `public.roles` vs `auth_is_academic_admin`, `s35_apply_result_correction_approval`, `s36_evaluate_assessment_mcq`, `auth/session.service.ts` | `public.roles.role_name` contains `'Administrator'`, `'Principal'`, `'Super Admin'`, `'Teacher'`, `'Student'`, `'Parent'`, `'PARENT'`. PG functions strictly check `('admin', 'principal', 'coordinator', 'academic_coordinator')`, rejecting Admins/Principals. Also `527/733` `students` have `user_id = NULL`, and `session.service.ts` does not resolve unified `staff_id`/`student_id` claims or set PG session `auth.uid()` (`NULL` via `pg`). | Resolve role comparison case/naming alignment in PG/Express authorization path before invoking `s35`/`s36` procs; provision `user_id` for student logins; attach verified `staffId` / `studentId` / `parentStudentIds` on `req.user` in `SessionService`.      |
| **B5** | **Broken Startup RBAC Self-Healer & Volatility of `WorkerService` / `sessionCache`**     | `apps/backend/src/server.ts` (`L120–169`), `jobs/worker.service.ts`, `auth/session.service.ts` (`L29–30`)                                       | `runRBACSelfHealing()` queries nonexistent `permissions`, `role_permissions`, `roles(id, name)` via Supabase; `WorkerService` only logs stub jobs from in-memory `queueAdapter`; `sessionCache` lives in single-process RAM (`5`-min TTL).                                                                                                                                                                                                           | Remove/align `runRBACSelfHealing()` to real PG schema (`roles.role_id, role_name`); back Stage 3 async states (Copilot queue, MCQ grading) in PG status columns rather than transient memory queues.                                                           |

---

## 3. Recommended Stage 3 Backend Module Topology

Building directly upon `apps/backend/src/modules/academic-management` (`19` controllers, `20` services, `19` repositories, `3` queries, `AcademicPolicy`), `apps/backend/src/modules/parent-management` (`ParentPortalPolicy`), `apps/backend/src/modules/student`, and `apps/backend/src/modules/notifications`, Stage 3 maps cleanly to **7 cohesive backend sub-domains** (avoiding any `0`-table phantom modules for S3.3 or S3.6):

| Stage 3 Module                             | Recommended Location (`apps/backend/src/modules/...`)                                                                      | Reuse Existing Modules / Policies                                                                                                                |
| :----------------------------------------- | :------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- |
| **S3.1 Hybrid Classroom Delivery**         | `academic-management/` extension or `classroom-delivery/` (`routes`, `controllers`, `services`, `queries`, `repositories`) | `AcademicPolicy` (`canAccessTeacherWorkspace`, `canViewTimetable`, `canManageTimetable`), `academic-management` timetable/lesson-plan repos      |
| **S3.2 Learning Activities & Submissions** | `learning-activities/` (`routes`, `controllers`, `services`, `queries`, `repositories`)                                    | `upload.middleware.ts`, `StorageService`, `AcademicPolicy`, `ParentPortalPolicy`                                                                 |
| **S3.3 Adaptive Learning Engine**          | **NOT IMPLEMENTED IN PHASE 2 (0 PG Tables)**                                                                               | Documented Database Blocker — zero mock/in-memory stores permitted                                                                               |
| **S3.4 AI Teacher Copilot**                | `ai-copilot/` (or extension under `academic-management/` alongside `AiProviderFactory` & `LessonPromptBuilder`)            | `AiProviderFactory` (`GoogleGenAiProvider`, `OpenAiProvider`), `LessonPromptBuilder.sanitizeInput()`, `RagRetrievalService`, `ChatbotLlmService` |
| **S3.5 Assessment Management & Bank**      | `assessments/` (`routes`, `controllers`, `services`, `queries`, `repositories`)                                            | `AcademicPolicy`, `StudentPortal` (`student`), `ParentPortalPolicy`, `StorageService`                                                            |
| **S3.6 Evaluation Engine (MCQ Only)**      | `assessments/` evaluation sub-service (`mcq-evaluation.service.ts`, `rubric-evaluation.service.ts`)                        | Calls PG proc `s36_evaluate_assessment_mcq` (`'closed'` state); AI free-text evaluation blocked (`0` tables)                                     |
| **S3.7 Learning Gaps & Interventions**     | `learning-gaps/` (`routes`, `controllers`, `services`, `queries`, `repositories`)                                          | Integrates with `assessments`, `ai_copilot_intervention_recommendations`, `ParentPortalPolicy` (`is_parent_visible`)                             |
| **S3.8 Competency Analytics**              | `competency-analytics/` (`routes`, `controllers`, `queries`, `services`, `repositories`)                                   | Read-heavy `queries/` layer aggregating `assessment_competency_mappings` + `student_competency_analytics`                                        |
| **S3.9 Holistic Progress Cards**           | `progress-cards/` (`routes`, `controllers`, `services`, `queries`, `repositories`)                                         | Reuses `AcademicPolicy`, `ParentPortalPolicy`, `StorageService` (PDF archival), headless PDF export pipeline                                     |

> **Note on Legacy Modules:** `apps/backend/src/modules/academic/academic.service.ts` and `apps/backend/src/modules/compatibility/compatibility.repository.ts` should NOT be extended for Stage 3; new code must adhere to the modern `academic-management` layered layout.

---

## 4. Module-by-Module Service & Data Flow Design (DB-Aligned)

### 4.1 S3.1 Hybrid Classroom Delivery (`classroom_sessions`, `classroom_session_attendance`, `classroom_session_audit_history`)

- **Session Generation (Admin / Coordinator / Scheduler):**
  - Service invokes PG stored procedure `s31_generate_classroom_sessions_for_date_range(...)` inside a parameterized `$executeRaw` call to bulk-generate sessions from published `timetable_versions` while respecting `academic_calendars` holidays/closures and `uq_classroom_sessions_timetable_date`.
  - Manual ad-hoc session creation must enforce `ck_classroom_sessions_delivery_location`: require `classroom_id` for `physical` and `hybrid` delivery modes; force `classroom_id = NULL` for `online`.
- **Teacher Live Session Lifecycle & Attendance Guardrails:**
  - Trigger `s31_validate_session_attendance` enforces two non-negotiable rules on `classroom_session_attendance`:
    1. `classroom_sessions.session_status` MUST equal `'in_progress'`.
    2. `recorded_by` MUST equal the assigned teacher's `staff.user_id`.
  - **Architectural Impact:** Admin attendance backfill or editing attendance after `'completed'` is explicitly rejected by PostgreSQL. Services must transition sessions cleanly (`scheduled -> in_progress -> completed | not_conducted | cancelled`), record teacher attendance exclusively during `'in_progress'`, and enforce `ck_classroom_session_attendance_participation` (`participation_mode` IN `'physical'|'online'` for `'present'|'late'`; `NULL` for `'absent'|'excused'`).
- **Blocked Capabilities:** Live WebRTC/Zoom/Meet SDK token brokerage, room webhooks, recordings, live polls/chat/whiteboard, and session-level resource/note attachments have no Stage 3 tables (`meeting_url` string only).

### 4.2 S3.2 Learning Activities & Submissions (`learning_activities*`)

- **Dual Activity Modes Governed by DB Triggers:**
  - `activity_type` (`s32_activity_type`) accepts ONLY `'homework'` and `'project'`.
  - Triggers `s32_validate_submission`, `s32_validate_submission_file`, and `s32_validate_review` **prohibit digital submissions, file uploads, and digital reviews when `activity_type = 'homework'`**.
  - **Backend Enforcement:** The controller/service layer MUST expose `'homework'` strictly as a teacher-published assignment brief + deadline visible to Students and Parents (`is_published` / calendar tracking), while routing digital student upload workflows, attempt tracking, file attachment persistence (`1..10485760` bytes via `ck_s32_file_size`, max `5` files per attempt via trigger), and immutable review grading (`s32_prevent_submission_mutation`, `s32_prevent_review_mutation`) strictly to `'project'` activities.
- **File Upload & Storage Pipeline Reuse:**
  - Route multipart uploads through `apps/backend/src/middlewares/upload.middleware.ts` (`<= 5` files, `10MB` limit, magic-byte inspection restricting to `application/pdf`, `image/jpeg`, `image/png`, `image/webp`) -> `StorageService.uploadFile()` -> private Supabase Storage bucket -> store storage key in `learning_activity_submission_files`, issuing `3600s` signed URLs via `StorageService.getSignedUrl()` on authorized Teacher/Student/Parent read.
  - **Scheduled Auto-Closure:** Cron / job calls `s32_close_due_activities()` safely to close expired activities.
- **Blocked Capabilities:** Video/audio MIME uploads (`mp4`, `mp3`, `webm`), `.docx`, digital homework turn-in, and interactive activity variants (orphan enum `assignment_type` is unwired).

### 4.3 S3.4 AI Teacher Copilot (`ai_copilot_*`)

- **Published Curriculum & English-Only Guardrails:**
  - Before enqueuing a generation request (`worksheet | quiz | question_paper | question_paper_blueprint`), service validates:
    - Target `curriculum_plans.status = 'published'` (`s34_validate_generation_request` — `91/91` live plans currently meet this).
    - `generation_language = 'en'` (`ck_s34_request_language_english` blocks non-English requests at PG constraint level; localized UI preview/output must happen transiently via LibreTranslate in presentation rather than non-`'en'` DB request rows).
- **Async Pipeline & Transactional Approval State Machine:**
  - Request starts `'queued'` -> `'generating'` -> `'ready_for_review'` (or `'failed'`/`'expired'`).
  - Prompt construction MUST reuse `LessonPromptBuilder.sanitizeInput()` for prompt-injection defense and `AiProviderFactory.getProvider()` (`GoogleGenAiProvider` `gemini-2.5-flash` primary, `OpenAiProvider` `gpt-4o-mini` fallback), optionally enriched by `RagRetrievalService.retrieveGroundedContext()` over `document_chunks` filtered strictly by `org_id`.
  - **Transactional Approval:** Trigger `s34_validate_request_transition` enforces that transitioning a request to `'approved'` occurs in the **same Prisma `$transaction`** as inserting permanent `ai_copilot_materials`, immutable `ai_copilot_material_versions` (`s34_reject_material_version_mutation`), `ai_copilot_material_version_outcomes`, and clearing temporary request payload (`ck_s34_request_payload_cleared_after_decision`).

### 4.4 S3.5 Assessment Management & S3.6 Evaluation (`assessments`, `assessment_*`, `student_assessment_question_options`)

- **Single-Correct MCQ Engine & Question Bank:**
  - Reusable question bank entries are persisted in `assessment_questions` with `assessment_id = NULL` and `source_question_id = NULL`. Cloned exam items reference `source_question_id`.
  - `assessment_questions_question_type_check` permits **`question_type = 'mcq'` ONLY**, and `uq_assessment_question_one_correct_option` enforces **exactly one correct option** per question.
- **Anti-Cheating Student Exam Delivery:**
  - Student endpoints MUST NEVER select from `assessment_question_options` directly via Prisma if `is_correct` could leak; student option reads MUST query the SQL view `student_assessment_question_options` (or project strictly without `is_correct`) while `assessments.status = 'published'`.
- **Evaluation & Result Lifecycle:**
  - **MCQ Auto-Grading (S3.6):** Only transitions on `assessments.status = 'closed'`; service calls PG proc `s36_evaluate_assessment_mcq(...)` (subject to resolving PG admin/role check alignment in Pre-Condition B4).
  - **Component & Rubric Grading:** Physical/viva/portfolio/project assessments support `assessment_components` / `assessment_component_marks` and `assessment_rubrics` / `assessment_rubric_criteria` / `assessment_rubric_evaluations`. (Pre-Condition: remediate `0` RLS policies on `assessment_rubrics`!)
  - **Result Publishing & Post-Publish Correction Workflow:** Once `assessments.status = 'results_published'`, trigger `s35_protect_published_results` blocks direct edits to `assessment_results`. Corrections MUST insert into `assessment_result_approvals` and apply via `s35_apply_result_correction_approval()`. Note: `p_assessment_attachments_select` contains an invalid `'results_reviewed'` status check and must be accounted for/fixed in DB maintenance.
- **Blocked Capabilities:** Subjective/essay/coding questions, MSQ multi-select, negative marking, per-student question randomization/timers, and S3.6 AI free-text/OCR evaluation + plagiarism detection (`0` persistence support).

### 4.5 S3.7 Learning Gaps & Interventions (`learning_gap_thresholds`, `student_learning_gaps`, `intervention_*`)

- **Evidence & Cardinality Constraints:**
  - `learning_gap_thresholds` configures org/subject detection cutoffs; `'automatic'` gap detection requires valid `assessment_id` (`ck_student_learning_gaps_evidence`). `'teacher_identified'` gaps may originate manually or linked from `ai_copilot_intervention_recommendations`.
  - Each `student_learning_gaps` row accepts at most **one** `intervention_plans` row (`UNIQUE(learning_gap_id)`), and `s37_validate_intervention_plan` requires `gap_status = 'confirmed'`.
  - Available `intervention_type` values: `'remedial_teaching' | 'additional_practice' | 'revision'`.
  - Trigger `s37_validate_gap_lifecycle` prevents transitioning a gap to `'resolved'` until the linked intervention plan reaches `'completed'`, and forbids reopening resolved gaps. Progress notes (`intervention_progress_notes`) are append-only (`s37_prevent_progress_notes_mutation`) and filtered cleanly for parents via `is_parent_visible = true`.

### 4.6 S3.8 Competency Analytics (`competency_analytics_thresholds`, `student_competency_analytics`)

- **Dimension-Scoped Read Layer (`queries/`):**
  - Strictly supports two `analytics_dimension` values: `'concept_mastery'` (`learning_outcome_id NOT NULL`) and `'bloom_level'` (`bloom_level NOT NULL`), bucketed into `'needs_improvement' | 'developing' | 'proficient' | 'mastered'`.
  - Assessment links require approved mappings in `assessment_competency_mappings` (`is_approved = true`).
  - **Aggregation Strategy:** Because school-wide/grade-wide rollup snapshot tables and automatic recomputation triggers do not exist, implement transactional recompute hooks upon MCQ evaluation / result publication / result correction approval, and serve section/grade/org institutional dashboards via parameterized read `queries/` aggregating `student_competency_analytics` + `student_enrollments` with short-TTL tenant-scoped caching (`CacheAdapter`).

### 4.7 S3.9 Holistic Progress Cards (`student_progress_cards*`)

- **Multi-Contributor Compilation & Snapshot Versioning:**
  - Supports `'term'` and `'annual'` `reporting_period`, enforcing term-to-year consistency (`s39_validate_progress_card`).
  - Contributions in `student_progress_card_contributions` are restricted to `staff` (`subject_teacher | class_teacher`) across sections `('academic' | 'competency' | 'attendance' | 'learning_activities' | 'overall')`. Student self-reflections, peer feedback, and parent sign-offs are **DATABASE BLOCKERS** outside the JSON snapshot.
  - Approval compiles an immutable JSON `report_snapshot` + generated PDF uploaded via `StorageService` (`pdf_file_url`) into `student_progress_card_versions`. Once published (`workflow_status = 'published'`), trigger `s39_protect_progress_card_versions_immutable` prevents mutation or deletion.

---

## 5. Stage 3 API Route Contract Blueprint

All routes mount behind `/api/v1/...`, guarded sequentially by `authenticate` -> `checkLoginApproval` -> `resolveTenantMiddleware` -> `authorize(permission)` / persona policy (`AcademicPolicy`, `ParentPortalPolicy`, Student/Teacher ownership guard).

| Prefix                         | Domain      | Primary Personas                | Key Endpoints (Non-Exhaustive Contract)                                                                                                                                                                                                                                                                          |
| :----------------------------- | :---------- | :------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/v1/classroom-sessions`   | S3.1        | Admin, Teacher, Student, Parent | `POST /generate` (`s31_*`), `GET /`, `PATCH /:id/status`, `PUT /:id/attendance` (Teacher + `in_progress` only), `GET /:id/audit`                                                                                                                                                                                 |
| `/api/v1/learning-activities`  | S3.2        | Teacher, Student, Parent, Admin | `POST /`, `GET /`, `PATCH /:id`, `POST /:id/submissions` (`project` only), `POST /:id/submissions/:subId/files` (Multer 5x10MB), `POST /:id/submissions/:subId/reviews`                                                                                                                                          |
| `/api/v1/ai-copilot`           | S3.4        | Teacher, Admin                  | `POST /requests` (`en` + `published` plan), `GET /requests/:id`, `POST /requests/:id/decision` (`approve`/`reject` transactional), `GET /materials`, `GET /materials/:id/versions`                                                                                                                               |
| `/api/v1/assessments`          | S3.5 & S3.6 | Teacher, Admin, Student, Parent | `POST /`, `GET /`, `PATCH /:id/status`, `/questions` (MCQ bank + clone), `GET /:id/student-paper` (uses `student_assessment_question_options` view), `POST /:id/answers`, `POST /:id/evaluate-mcq` (`s36_*`), `/rubrics`, `/results`, `POST /results/:resId/corrections` (`s35_*`), `PATCH /:id/publish-results` |
| `/api/v1/learning-gaps`        | S3.7        | Teacher, Admin, Parent          | `GET /thresholds`, `PUT /thresholds`, `POST /detect` / `POST /manual`, `PATCH /:id/status`, `POST /:id/intervention-plan`, `POST /intervention-plans/:planId/notes` (`is_parent_visible` filter on Parent read)                                                                                                  |
| `/api/v1/competency-analytics` | S3.8        | Teacher, Admin, Student, Parent | `GET /thresholds`, `GET /student/:studentId` (`concept_mastery` & `bloom_level`), `GET /class-summary`, `GET /institution-summary`, `POST /recompute`                                                                                                                                                            |
| `/api/v1/progress-cards`       | S3.9        | Teacher, Admin, Student, Parent | `POST /`, `PUT /:id/contributions`, `POST /:id/compile`, `POST /:id/publish` (creates immutable version + PDF), `GET /:id/versions/:vId/download` (signed URL)                                                                                                                                                   |

---

## 6. Event Bus, Notifications & Background Worker Strategy

1. **Event-Driven Notifications (`EventBus` + `RealtimeNotificationServer`):**
   - Domain events emitted inside services **after** database commit (never prior to `$transaction` completion):
     - `CLASSROOM_SESSION_STARTED` -> online/hybrid notification with `meeting_url` to enrolled students.
     - `LEARNING_ACTIVITY_PUBLISHED` / `ACTIVITY_SUBMISSION_REVIEWED` -> Student & Parent push/WS notification.
     - `AI_COPILOT_READY_FOR_REVIEW` / `FAILED` -> Teacher WS notification (`/ws/notifications`, `/api/v1/notifications/ws`).
     - `ASSESSMENT_RESULTS_PUBLISHED` -> Student & Parent notifications.
     - `INTERVENTION_PLAN_ASSIGNED` / `PROGRESS_CARD_PUBLISHED` -> Parent notification (`is_parent_visible` / `published`).
2. **Async Job Processing Hardening (`jobs/worker.service.ts`):**
   - Today `WorkerService` polls in-memory `queueAdapter` (`['email-queue', 'sms-queue', 'push-queue', 'report-queue', 'export-queue', 'import-queue', 'audit-queue']`) every `3s` with stub logging.
   - Because in-memory queues lose tasks on container restart, long-running Stage 3 operations (AI Copilot generation, PDF progress card compilation, batch MCQ evaluation / analytics rollups) MUST store durable job state in PG tables (`ai_copilot_generation_requests.request_status`, `student_progress_cards.workflow_status`, `assessments.status`) so any restarted worker or re-triggered endpoint can recover idempotently without RAM state loss.
