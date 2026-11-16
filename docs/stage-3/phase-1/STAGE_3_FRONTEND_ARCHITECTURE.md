# EduTrack ERP — Stage 3 Frontend Architecture Blueprint

> **Phase:** Stage 3, Phase 1 — Read-Only Architecture Planning  
> **Applications Covered:** `@edutrack/web` (`apps/web_app`) & `@edutrack/mobile` (`apps/mobile_app`)  
> **Shared Packages:** `@edutrack/types`, `@edutrack/validation`, `@edutrack/config`, `@edutrack/ui`  
> **Governing Rule:** Strictly bind UI API layers to verified Backend API endpoints via unified RTK Query (`apiSlice.ts`).

---

## 1. Current Frontend & Monorepo Baseline Health

Baseline verification executed during Phase 1 established clear technical debt across web and mobile clients:

| Package / Check                  | Command Executed                                     | Latest Result                                                                                                      | Impact on Stage 3 Phase 2                                                                                                                       |
| :------------------------------- | :--------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| **`@edutrack/types`**            | `pnpm --filter @edutrack/types typecheck`            | **PASS** (Exit `0`)                                                                                                | Safe baseline for adding Stage 3 DTO contracts                                                                                                  |
| **`@edutrack/validation`**       | `pnpm --filter @edutrack/validation typecheck`       | **PASS** (Exit `0`)                                                                                                | Safe baseline for adding Zod Stage 3 request/form validators                                                                                    |
| **`@edutrack/web`**              | `pnpm --filter @edutrack/web typecheck`              | **PASS** (Exit `0`)                                                                                                | TypeScript build healthy, though runtime state layers are fragmented                                                                            |
| **`@edutrack/web` Nav Tests**    | `node apps/web_app/scripts/run-navigation-tests.mjs` | **6/6** LandingResolver + **13/13** Academic nav groups passed, **then hung on open Vite handle** (`vite.close()`) | Needs CI handle-cleanup fix to avoid timed pipeline stalls                                                                                      |
| **`@edutrack/mobile` Jest**      | `pnpm --filter @edutrack/mobile test`                | **23 suites, 256 tests PASSED** (Exit `0`, 2.08s)                                                                  | Jest unit runner healthy                                                                                                                        |
| **`@edutrack/mobile` Typecheck** | `pnpm --filter @edutrack/mobile typecheck`           | **FAIL** (Exit `2`, **4 TS errors**)                                                                               | **Build Blocker** (`src/api/endpoints.ts:106` TS1117 duplicate `HELPDESK`; `src/api/helpdesk.api.ts:59,79,92` TS2339 missing `BY_ID`/`REPLIES`) |

---

## 2. Web Application Architecture (`apps/web_app`) — Consolidation Mandate

### 2.1 Resolving State & HTTP Fragmentation

Phase 1 identified **four overlapping API/state patterns** in `apps/web_app`:

1. Modern RTK Query: `apps/web_app/src/app/store/apiSlice.ts` (`baseQueryWithReauth.ts` injecting `Authorization` and `x-tenant-id`, `rootReducer.ts`), defining `24` `tagTypes` (`User`..`ParentPortal`).
2. Legacy Redux store: `apps/web_app/src/store/app.store.ts`.
3. Imperative HTTP client: `apps/web_app/src/lib/api-client.ts`.
4. Parallel endpoint registry: `apps/web_app/src/shared/api/endpoints.ts`.

**Stage 3 Mandate (per `.agents/AGENTS.md`):**

- All Stage 3 data fetching, caching, optimistic updates, and cache invalidation MUST be authored **exclusively** as RTK Query injected endpoints extending `apps/web_app/src/app/store/apiSlice.ts` (`injectEndpoints`).
- Extend `apiSlice.ts`'s `24` `tagTypes` with Stage 3 resource tags (`ClassroomSession`, `LearningActivity`, `ActivitySubmission`, `CopilotRequest`, `CopilotMaterial`, `Assessment`, `AssessmentResult`, `LearningGap`, `InterventionPlan`, `CompetencyAnalytics`, `ProgressCard`) so mutations (e.g., submitting a project, closing an assessment, approving a Copilot draft, resolving an intervention) deterministically invalidate related lists and analytics dashboards.
- Do NOT introduce new feature-specific Redux slices or direct calls via `lib/api-client.ts` for Stage 3 workflows.

### 2.2 Auth, Routing, Tenant Header & Localization Integration

- **Route Guards & Persona Landing:** Reuse `apps/web_app/src/app/router.tsx`, `app/router/ProtectedRoute.tsx`, and `services/LandingResolver.ts` to isolate Teacher, Student, Parent, and Admin workspaces cleanly by role and permission.
- **Tenant Header Propagation:** `baseQueryWithReauth.ts` attaches `x-tenant-id` automatically on outgoing RTK Query requests; ensure switching active tenant or student ward (for Parents with multiple enrolled children) triggers RTK Query state reset (`apiSlice.util.resetApiState()`).
- **Internationalization (`AutoTranslator.tsx`):**
  - Existing UI translation pipeline (`AutoTranslator.tsx` using `TranslationManager` + `LibreTranslateClient` + `TranslationCache` + `TranslationProtector`) translates rendered UI copy.
  - Because `ai_copilot_generation_requests` is strictly constrained to `generation_language = 'en'` (`ck_s34_request_language_english`), Teacher Copilot preview panes may pass generated English material through `AutoTranslator` for teacher/parent reading assistance while keeping persisted database content strictly English and avoiding corrupting JSON/LaTeX/code blocks via `TranslationProtector`.

### 2.3 Fixing `StudentDashboard.tsx` & Missing Student Portal Links (P0 Remediation)

Phase 1 audited `apps/web_app/src/modules/dashboard/pages/StudentDashboard.tsx` and found it entirely driven by mock placeholders:

- Hardcoded fake metrics (`87`, `12500`, `3`, `2`).
- Hardcoded fake `todaySchedule` (`Mr. Ramesh`, `Mrs. Lakshmi`).
- Dead navigation links pointing to nonexistent routes (`/app/attendance/my`, `/app/student/exams/dashboard`, `/app/student/assignments`).

**Phase 2 Plan:**

1. Replace all mock arrays and static figures in `StudentDashboard.tsx` with live RTK Query selectors reading Stage 3 endpoints (`GET /v1/classroom-sessions/my-schedule`, `GET /v1/learning-activities/my`, `GET /v1/assessments/my`, `GET /v1/competency-analytics/student/:studentId`).
2. Register the target `/app/student/*` child routes inside `app/router.tsx` behind `ProtectedRoute`.
3. Coordinate with backend P0 remediation to provision `students.user_id` accounts (`527` of `733` existing PostgreSQL student rows currently have `user_id = NULL` and cannot authenticate).

---

## 3. Reusable Component Inventory & Extension Plan

Do **not** create duplicate table grids, approval queues, charts, or viewers. Stage 3 features must compose existing `@edutrack/web` building blocks:

| Existing Component / Module                     | Verified Path                                                                           | Stage 3 Reuse Targets                                                                                                                   |
| :---------------------------------------------- | :-------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| **`DataTableFramework` & `EnterpriseDataGrid`** | `apps/web_app/src/components/tables/DataTableFramework.tsx` / `modules/common/index.ts` | Session rosters, homework/project lists, question bank catalog, intervention registers, academic admin oversight tables                 |
| **`ApprovalInbox`**                             | `modules/common/index.ts`                                                               | AI Copilot `ready_for_review` approval queue, post-publish `assessment_result_approvals` queue, `student_progress_cards` approval queue |
| **`ChartBuilder`**                              | `modules/common/index.ts`                                                               | S3.8 Competency Analytics (`concept_mastery` & `bloom_level` distributions), attendance/participation split, grade mastery trends       |
| **`ReportViewer`**                              | `modules/common/index.ts`                                                               | Previewing approved AI Copilot materials/blueprints and S3.9 `student_progress_card_versions` signed PDFs / JSON snapshots              |
| **`TeacherLessonPlansPage` patterns**           | `apps/web_app/src/modules/teacher/pages/TeacherLessonPlansPage.tsx`                     | Workspace split-pane, curriculum-plan selector, and AI prompt drawer patterns extended cleanly to S3.4 Teacher Copilot                  |
| **`AutoTranslator`**                            | `apps/web_app/src/components/i18n/AutoTranslator.tsx`                                   | Translated parent views for S3.9 progress cards and S3.7 parent-visible intervention notes                                              |

---

## 4. Persona Workspace Blueprint & Database-Gated UI Scope

### 4.1 Teacher Workspace (`/app/teacher/...`)

- **Daily Schedule & Hybrid Classroom Delivery (S3.1):** Calendar/timetable view synced to `classroom_sessions`; Start Session (`scheduled -> in_progress`), join/share `meeting_url`, mark attendance + `participation_mode` (`physical`/`online` required for `present`/`late`) strictly while `'in_progress'`, Complete Session (`completed`). **Read-only guard** immediately locks attendance grid outside `'in_progress'` to mirror PG trigger `s31_validate_session_attendance`.
- **Learning Activities Studio (S3.2):** Create `'homework'` or `'project'` items. Dynamically hide submission-inbox and digital rubric grading tabs for `'homework'` (with clear helper text explaining homework is track-only due to DB policy); enable student submission review, signed file preview (`<= 5` files, `<= 10MB`, PDF/JPEG/PNG/WEBP), and immutable review grading for `'project'`.
- **AI Teacher Copilot Workspace (S3.4):** Select **published** curriculum plan + learning outcomes -> choose generation type (`worksheet`, `quiz`, `question_paper`, `question_paper_blueprint`; `'en'` locked) -> track status (`queued` -> `generating` -> `ready_for_review` via WebSocket/polling) -> Approve/Reject in `ApprovalInbox` (creating immutable `ai_copilot_material_versions`).
- **Assessment & Question Bank Manager (S3.5 & S3.6):** Author MCQ-only single-correct items in reusable bank; compose `formative`/`summative`/`diagnostic`/etc. assessments; upload attachments; manage `physical`/`online`/`hybrid` delivery; trigger batch MCQ evaluation when `'closed'`; enter component & rubric scores; review competency alignment (`concept_mastery` / `bloom_level`); submit post-publish result correction requests.
- **Learning Gaps, Interventions & Progress Cards (S3.7–S3.9):** Confirm/dismiss automatic assessment gaps or log teacher gaps (optionally accepting Copilot recommendations); create 1:1 `intervention_plans` (`remedial_teaching`, `additional_practice`, `revision`); append immutable `intervention_progress_notes` (`is_parent_visible` toggle); monitor `student_competency_analytics`; submit teacher contributions (`academic`, `competency`, `attendance`, `learning_activities`, `overall`) to `student_progress_cards`.

### 4.2 Student Workspace (`/app/student/...`)

- **Live Student Dashboard:** Replaces hardcoded `StudentDashboard.tsx` with real schedule, upcoming due dates, active online quizzes/MCQs, and personal mastery summary.
- **Classes & Attendance (S3.1):** View timetable sessions, join `meeting_url` for `online`/`hybrid` classes, view verified `present`/`late`/`absent`/`excused` history.
- **Activities & Project Turn-In (S3.2):** View `'homework'` briefs & due dates; upload up to `5` `<=10MB` files (`PDF`/`JPEG`/`PNG`/`WEBP` enforced client-side before upload to match `upload.middleware.ts`) on `'project'` activities and view immutable teacher reviews.
- **Online Assessment Runner (S3.5):** Single-correct MCQ test player fetching sanitized options from backend (`student_assessment_question_options` — zero `is_correct` field in network payload) and viewing published results/progress cards (S3.9 PDF download).

### 4.3 Parent & Admin Workspaces (`/app/parent/...`, `/app/academic/...`)

- **Parent Portal:** Child selector (`student_parents` context); read-only monitoring of attendance, homework/project deadlines & project submission status, published assessment results, `is_parent_visible` intervention progress notes, `student_competency_analytics`, and published S3.9 Holistic Progress Card PDFs.
- **Admin / Academic Management Workspace:** Timetable -> bulk session generation (`s31_generate_classroom_sessions_for_date_range`), due-activity closure monitoring, `learning_gap_thresholds` & `competency_analytics_thresholds` configuration, institutional competency dashboards (`ChartBuilder`), post-publish `assessment_result_approvals` & `student_progress_cards` approval workflows (`ApprovalInbox`).
  - _UI Guard:_ Respect DB invariant preventing admins from editing `classroom_session_attendance` directly (`s31_validate_session_attendance`).

---

## 5. Mobile Application Readiness (`apps/mobile_app`)

1. **Current State:** `apps/mobile_app/app/(teacher)/index.tsx` and `apps/mobile_app/app/(student)/index.tsx` contain placeholder UI screens only, while `src/api/endpoints.ts` and `src/api/helpdesk.api.ts` fail TypeScript compilation (`4` errors).
2. **Phase 2 Sequencing:**
   - **Step M0 (Gate):** Fix `endpoints.ts:106` duplicate `HELPDESK` key and add `BY_ID`/`REPLIES` keys required by `helpdesk.api.ts:59,79,92` so `pnpm --filter @edutrack/mobile typecheck` exits `0` alongside its existing `23` Jest suites (`256` tests).
   - **Step M1 (Web-First Parity, Mobile Second):** Focus primary Stage 3 UI delivery on `@edutrack/web` using shared `@edutrack/types` and `@edutrack/validation` schemas, then expose high-value mobile views (`(teacher)` live attendance & project review summary; `(student)` schedule, due dates, MCQ runner & results; `(parent)` attendance/results/progress card notifications).

---

## 6. Frontend Flows Excluded / Deferred Due to Database Blockers

To honor the strict database freeze and prevent mock-UI illusions, the following UI features MUST NOT be built with fake local state in Phase 2:

- **S3.3 Adaptive Learning Path UI / Personalized Recommendation Cards** (`0` adaptive DB tables).
- **S3.6 AI Grading Review Queue / OCR Handwriting Grader / Plagiarism Report UI** (`0` AI evaluation / plagiarism DB tables).
- **Digital Homework Upload Button & Interactive Multi-Type Activity Players** (`quiz` player inside S3.2, `video_presentation`, `audio_submission`, `draw_and_answer`, `code_simulator`) — DB rejects digital homework submissions and Express restricts uploads to PDF/JPEG/PNG/WEBP.
- **In-App Live Video Room / Whiteboard / Live Polls / Chat (S3.1)** — render external `meeting_url` launch button only.
- **Student/Parent Self-Reflection & Co-Curricular Badge Forms inside S3.9 Progress Cards** — contributor table restricts submissions to `staff` (`subject_teacher`, `class_teacher`).
