# EduTrack ERP — Stage 3 AI & Integration Architecture

> **Phase:** Stage 3, Phase 1 — Read-Only AI & Integration Audit  
> **Scope:** LLM Providers, RAG Vector Retrieval, S3.4 Teacher Copilot Pipeline, S3.6 AI Evaluation Blocker, S3.3 Adaptive Blocker, Translation, Storage, WebSockets, PDF Export & Background Workers.

---

## 1. Existing AI & LLM Infrastructure Inventory

EduTrack ERP already ships working multi-provider AI clients and prompt/RAG primitives inside `apps/backend/src/modules/academic-management/services/` and `apps/backend/src/modules/chatbot/`:

| Component                                                                             | Verified Path                                                                                                     | Implemented Configuration & Behavior                                                                                                                                                                                                                                            |
| :------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`AiProviderFactory` & `GoogleGenAiProvider` / `OpenAiProvider` / `MockAiProvider`** | `apps/backend/src/modules/academic-management/services/ai-provider.client.ts` (`L1–326`)                          | Primary Google Gemini model: **`gemini-2.5-flash`** (fallback models: `'gemini-1.5-flash'`, `'gemini-1.5-pro'`; `25s` timeout; `responseMimeType: 'application/json'`). Secondary fallback provider: **`OpenAiProvider`** (`gpt-4o-mini`). Offline/test stub: `MockAiProvider`. |
| **`LessonPromptBuilder`**                                                             | `apps/backend/src/modules/academic-management/services/lesson-prompt.builder.ts`                                  | Provides `sanitizeInput()` prompt-sanitization helper and structured lesson generation prompt construction. Reusable directly by Stage 3 Copilot builders.                                                                                                                      |
| **`ChatbotLlmService`**                                                               | `apps/backend/src/modules/chatbot/services/chatbot.llm.service.ts`                                                | Conversational LLM orchestrator (`PRIMARY_MODEL = 'gemini-3-flash-preview'`, fallbacks `['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-flash-lite-latest']`).                                                                                                              |
| **`RagRetrievalService` & `ChatbotVectorRepository`**                                 | `apps/backend/src/modules/chatbot/services/rag.retrieval.service.ts`, `repositories/chatbot.vector.repository.ts` | Embeds queries with **`gemini-embedding-001`** (`3072`-dim, `10s` timeout) and runs parameterized `$queryRaw` cosine similarity (`<=>`) against `public.document_chunks` (`38` live rows in PG).                                                                                |

### Critical RAG Vector Indexing Finding

Live PostgreSQL catalog inspection on `public.document_chunks` confirms only three B-tree/unique indexes exist: `document_chunks_pkey`, `uq_document_chunks_org_doc_index`, and `ix_document_chunks_org`. There is **NO pgvector `hnsw` or `ivfflat` ANN index** on the embedding column. While latency is trivial at `38` rows, scanning large Stage 3 curriculum/school document corpora will degrade linearly without careful `org_id`-first filtering or a future indexed schema optimization (e.g., dimensionality / `halfvec`, noting standard pgvector ANN limits `< 2000` dims on full `vector` vs `3072`-dim `gemini-embedding-001`).

---

## 2. S3.4 AI Teacher Copilot Target Pipeline

Unlike S3.3 and S3.6, **S3.4 AI Teacher Copilot has a complete 6-table PostgreSQL contract** (`ai_copilot_generation_requests`, `ai_copilot_generation_request_outcomes`, `ai_copilot_materials`, `ai_copilot_material_versions`, `ai_copilot_material_version_outcomes`, `ai_copilot_intervention_recommendations`):

```text
Teacher Request (POST /v1/ai-copilot/requests)
   │  Verify: faculty_assignment ownership, curriculum_plans.status = 'published',
   │          generation_language = 'en' (ck_s34_request_language_english)
   ▼
Insert ai_copilot_generation_requests (status = 'queued') + outcomes
   │
   ▼  [Async PG-Backed Worker + WebSocket Event Notification]
Transition status -> 'generating'
   │  1. LessonPromptBuilder.sanitizeInput(teacher_instructions)
   │  2. Optional RagRetrievalService.retrieveGroundedContext(org_id) from document_chunks
   │  3. AiProviderFactory.getProvider() -> JSON schema output (content + answer_key)
   ▼
Update request: status = 'ready_for_review', generated_content, generated_answer_key
   │  -> Emit RealtimeNotificationServer WS notice to Teacher
   ▼
Teacher Decision (POST /v1/ai-copilot/requests/:id/decision)
   │  Inside single Prisma $transaction (enforced by trigger s34_validate_request_transition):
   ├─► Approve: Create ai_copilot_materials + immutable ai_copilot_material_versions
   │            + material_version_outcomes -> clear generated_* JSON on request
   │            (ck_s34_request_payload_cleared_after_decision) -> status = 'approved'
   └─► Reject:  Clear generated_* JSON -> status = 'rejected'
```

### Hard Constraints Enforced by PostgreSQL on S3.4

1. **English-Only Persistence:** `ck_s34_request_language_english` strictly enforces `generation_language = 'en'`. Multilingual teacher prompts or localized outputs **cannot** be persisted as non-`'en'` Copilot requests; localization must happen transiently at presentation time (Section 4.1).
2. **Published Curriculum Mandate:** Trigger `s34_validate_generation_request` rejects requests linked to draft curriculum plans (`91/91` live plans are currently `'published'`).
3. **Supported Generation Types:** `generation_type` enum accepts ONLY `'worksheet'`, `'quiz'`, `'question_paper'`, `'question_paper_blueprint'`. Generating full lesson plans remains inside Stage 2 `academic-management` services (`lesson_plans`).
4. **Version Immutability:** Trigger `s34_reject_material_version_mutation` forbids modifying or deleting approved `ai_copilot_material_versions`; iterations require creating a new generation request referencing `source_material_id` / `source_material_version_id`.

### Copilot Recommendation Bridge into S3.7

`ai_copilot_intervention_recommendations` persists teacher-facing recommendation cards (`recommendation_type`, `recommendation_text`, `evidence_snapshot`, `source_data_as_of`, `recommendation_status`: `active|dismissed|expired`) optionally tied to `curriculum_plans` / `curriculum_plan_units`. Phase 2 should generate these recommendations strictly **after** deterministic assessment / analytics runs using PII-minimized aggregates, never modifying `student_learning_gaps` without explicit teacher confirmation.

---

## 3. Explicit AI & Adaptive DATABASE BLOCKERS (`S3.3` & `S3.6`)

Under `.agents/AGENTS.md` and the Phase 1 Database Freeze, **no Phase 2 AI service may invent mock tables, local JSON files, or RAM caches to simulate missing persistence**:

### 3.1 S3.6 AI Evaluation Engine — **COMPLETE DATABASE BLOCKER**

- **Original Scope:** AI evaluation of subjective/short-answer/written responses, handwritten script OCR grading, rubric score suggestions with confidence scores/rationale, human-in-the-loop teacher override tracking, and similarity/plagiarism detection.
- **Database Reality:**
  - `assessment_questions_question_type_check` permits **`'mcq'` ONLY**.
  - `assessment_student_answers` contains **ONLY `selected_option_id`** (`answer_status`, `evaluation_status`, `is_correct`, `marks_awarded`). It lacks text/essay answers, uploaded answer sheet file keys, OCR extracts, LLM confidence/rationale JSON, teacher override history, and plagiarism scores.
- **Phase 2 Scope Boundary:** S3.6 is restricted strictly to deterministic MCQ auto-evaluation via PostgreSQL stored procedure `s36_evaluate_assessment_mcq()` (once PG admin role matching is aligned) plus manual component/rubric entry (`assessment_component_marks`, `assessment_rubric_evaluations`). All AI grading / OCR / plagiarism features are **DEFERRED** as DB blockers.

### 3.2 S3.3 Adaptive Learning Engine — **COMPLETE DATABASE BLOCKER**

- **Database Reality:** **`0` tables exist** for adaptive learning paths, per-outcome spaced repetition schedules, or personalized remedial/challenge sequencing (only orphan unused enum `prediction_type` exists).
- **Phase 2 Scope Boundary:** Fully **DEFERRED** until future approved database design.

---

## 4. Non-AI Integrations & Infrastructure Audit

### 4.1 Frontend Translation Pipeline (`AutoTranslator`)

- **Existing Assets (`apps/web_app/src/components/i18n/AutoTranslator.tsx`):** Implements `AutoTranslator` powered by `TranslationManager`, `LibreTranslateClient`, `TranslationCache`, and `TranslationProtector`.
- **Stage 3 Role:** Enables regional language rendering across Parent Portals (Holistic Progress Cards, parent-visible intervention notes, homework instructions) and Copilot English preview translation without violating PostgreSQL `generation_language = 'en'` constraints. `TranslationProtector` safeguards formulas, numbers, and code tokens from MT corruption.

### 4.2 Private Object Storage (`StorageService` & `upload.middleware.ts`)

- **Upload Gate (`middlewares/upload.middleware.ts`):** Caps payloads at `<= 5` files, `<= 10MB` each, enforcing magic-byte MIME detection (`application/pdf`, `image/jpeg`, `image/png`, `image/webp`). Rejects `.mp4`, `.mp3`, `.webm`, `.docx`, `.zip`.
- **Object Storage (`services/storage.service.ts`):** Uploads buffers via `StorageService.uploadFile()` to Supabase private bucket (`admission-documents` default) and generates time-limited **`3600s`** signed download URLs via `StorageService.getSignedUrl()`.
- **Stage 3 Consumers:**
  1. `learning_activity_submission_files` (S3.2 `'project'` files — matches `10MB` & `5`-file PG constraints cleanly).
  2. `assessment_attachments` (S3.5 physical exam papers / reference sheets).
  3. `student_progress_card_versions.pdf_file_url` (S3.9 archived report card PDFs).

### 4.3 Real-Time WebSockets (`RealtimeNotificationServer`)

- **Existing Asset (`modules/notifications/realtime/notification.realtime.ts`):** Initialized alongside HTTP server in `server.ts`, listening on `/ws/notifications` and `/api/v1/notifications/ws` with token validation via `sessionService.validateSession(token)`.
- **Stage 3 Role:** Push live status notifications (`CLASSROOM_SESSION_STARTED` with `meeting_url`, `AI_COPILOT_READY_FOR_REVIEW`, `ASSESSMENT_RESULTS_PUBLISHED`, `PROGRESS_CARD_PUBLISHED`) directly to active browser/mobile sessions, paired with RTK Query tag invalidation triggers or polling fallbacks.

### 4.4 Background Worker, Scheduler & PDF Export Pipeline

- **Existing Worker Gap (`jobs/worker.service.ts` & `jobs/queue.adapter.ts`):** `WorkerService` polls `['email-queue', 'sms-queue', 'push-queue', 'report-queue', 'export-queue', 'import-queue', 'audit-queue']` every `3s` using an **in-memory `QueueAdapter`** with stub log handlers; `SchedulerService` only runs `cacheService.invalidatePattern('v1:cache:temp:*')` every `10` minutes.
- **Stage 3 Redesign Principle (Zero Lost Jobs):**
  - Never rely solely on an ephemeral RAM queue for long-running Stage 3 jobs (Copilot LLM generation, `s32_close_due_activities()` sweeps, `puppeteer` Holistic Progress Card PDF generation, S3.8 analytics recomputes).
  - Persist durable job lifecycles directly inside PG tables (`ai_copilot_generation_requests.request_status`, `student_progress_cards.workflow_status`, `assessments.status`) and execute worker tasks idempotently with startup/cron recovery for stalled `'queued'`/`'generating'`/`'compiling'` states.
- **PDF Rendering (`puppeteer`):** Use `puppeteer` in an isolated async report worker (strictly gated against arbitrary external network/file SSRF inside HTML templates) to render `student_progress_card_versions.report_snapshot` JSON into archival PDFs stored via `StorageService`.
