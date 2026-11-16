# STAGE 3 PHASE 5 — EXISTING IMPLEMENTATION AUDIT

## AI Teacher Copilot & Intelligent Learning Assistance

**Repository:** `/Users/sathish/Documents/GitHub/EduTech`  
**Governance:** `apps/backend/prisma/schema.prisma` (Frozen SHA-256: `73d98492b3a7f2cbfd9348de94a0373ef530be966d6d00c3a4008bc0974d6c39`, 445,174 bytes)  
**Execution Phase:** Stage 3 — Phase 5: Audit & Foundation

---

## 1. Existing AI Functionality Audit

| Component                 | Location                                                                      | Existing Capabilities                                                                                                                              | Limitations & Action for Phase 5                                                                                                                                                                                             |
| :------------------------ | :---------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`GoogleGenAiProvider`** | `apps/backend/src/modules/academic-management/services/ai-provider.client.ts` | Uses `@google/genai` (^2.18.0) `GoogleGenAI` client; supports JSON generation with timeout, token counts, and error translation (`AcademicError`). | Targeted for academic curriculum plan generation in Stage 2. Primary model string is configured as `gemini-2.5-flash` with fallbacks. Leaked API key detection in dev environment must fail gracefully without crashing app. |
| **`OpenAiProvider`**      | `apps/backend/src/modules/academic-management/services/ai-provider.client.ts` | Axios-based OpenAI `chat/completions` client with `response_format: { type: 'json_object' }`.                                                      | Functional alternative when `OPENAI_API_KEY` is provided.                                                                                                                                                                    |
| **`MockAiProvider`**      | `apps/backend/src/modules/academic-management/services/ai-provider.client.ts` | In-memory mock with customizable result, delay, or error simulation.                                                                               | Ideal for deterministic automated testing.                                                                                                                                                                                   |
| **`AiProviderFactory`**   | `apps/backend/src/modules/academic-management/services/ai-provider.client.ts` | Singleton factory reading `GEMINI_API_KEY` or `OPENAI_API_KEY`.                                                                                    | Can be extended or unified into `ai-teacher-copilot` provider abstraction.                                                                                                                                                   |
| **Chatbot & Ingestion**   | `apps/backend/src/modules/chatbot/`                                           | RAG retrieval, vector search (`document_chunks`), knowledge ingestion.                                                                             | Student/applicant admissions assistant; separate domain from teacher curriculum copilot.                                                                                                                                     |

---

## 2. Existing Lesson Planning & Curriculum Infrastructure

- **Curriculum Plans (`curriculum_plans`)**: Models exist in `schema.prisma` and live PG; records published curriculum outlines mapped to `academic_year_grade_subject_id`.
- **Curriculum Plan Units (`curriculum_plan_units`)**: Sequential units with planned periods, dates, and unit codes.
- **Curriculum Learning Outcomes (`curriculum_learning_outcomes`)**: Specific learning outcome objectives per unit.
- **Lesson Plans (`lesson_plans`)**: Teacher-authored lesson plans linking `curriculum_unit_id`, `teacher_staff_id`, `lesson_title`, `planned_date`, `duration_minutes`, `teaching_approach`, and `prerequisite_knowledge`.
- **Reuse Strategy**: AI Copilot will consume these published structures as authoritative academic context and allow teachers to generate or export drafts directly into `lesson_plans`.

---

## 3. Existing Learning Content & Resources

- **`learning_resources`**: Models exist for approved educational assets with `resource_type`, `title`, `url`, `file_path`, and `academic_year_grade_subject_id`.
- **`ai_copilot_materials` & `ai_copilot_material_versions`**: Pre-existing PostgreSQL tables and Prisma models dedicated to approved AI-generated educational materials (`material_type`: `worksheet`, `quiz`, `question_paper`, `question_paper_blueprint`).
- **Reuse Strategy**: Reusable teaching materials (worksheets, quizzes, question papers) can be persisted through the approved `ai_copilot_materials` and `ai_copilot_material_versions` tables when approved by the assigned subject teacher.

---

## 4. Existing Assessment Infrastructure

- **`assessments` (`S3.5`)**: Assessments table exists in `schema.prisma` with `assessment_type`, `maximum_marks`, `passing_marks`, `assessment_date`, and section offerings.
- **`assessment_questions`**: Questions table exists in `schema.prisma` supporting multiple question formats (`mcq`, `descriptive`, `true_false`, `short_answer`).
- **Reuse Strategy**: AI question generator generates structured drafts (questions, answer keys, explanations, difficulty, blooms taxonomy) that teachers can preview, refine, and export.

---

## 5. Existing Student Performance Analytics

- **`learning_activity_submissions` & `reviews` (`S3.2`)**: Project submission attempts, status (`submitted`, `under_review`, `resubmission_requested`, `reviewed`), `obtained_marks`, `feedback`.
- **`classroom_attendance` (`S3.1`)**: Session-level attendance (`present`, `absent`, `late`, `excused`).
- **`ai_copilot_intervention_recommendations`**: Dedicated database table in `schema.prisma` for student-level academic recommendations (`student_id`, `academic_year_grade_subject_id`, `recommendation_type`, `recommendation_text`, `evidence_snapshot`).
- **Reuse Strategy**: AI Learning Gap & Performance analysis derives strictly from these real tables. When data is sparse, the system must truthfully report insufficient data rather than fabricating metrics.

---

## 6. Supporting Infrastructure & Reusable Assets

1. **Authentication & RBAC**:
   - `extractLearningActivityAuthContext` and `ClassroomPolicy` establish fail-closed role verification (`TEACHER`, `FACULTY`, `ADMIN`, `STUDENT`, `PARENT`).
   - `NativeJwt` and `sessionService` provide cryptographically verified session context (`userId`, `orgId`, `roles`).
2. **Realtime & Notifications**:
   - `NotificationService.sendBulkNotifications` and `realtimeNotificationServer` (`ws`) support real-time delivery and database notifications.
3. **Storage & Documents**:
   - `uploadMultipleMiddleware` + `validateFileBufferSignature` + `StorageService` provide secure private bucket storage and signed download URLs.
4. **Web Frontend (`apps/web_app`)**:
   - `TEACHER_NAVIGATION` in `navigation.ts` with layout dashboard shell.
   - `ROUTE_REGISTRY` with `guardType: 'teacher'`, `guardType: 'admin'`, and `permission` checks.
   - RTK Query `baseQueryWithReauth` with tag invalidation patterns.

---

## 7. Technical, Security & Governance Limitations

1. **Database Freeze**: `apps/backend/prisma/schema.prisma` is 100% frozen. No DDL, no new tables, no column changes.
2. **Pre-existing S3.4 Database Objects**:
   The physical schema in PostgreSQL and `schema.prisma` ALREADY includes:
   - `ai_copilot_generation_requests`
   - `ai_copilot_generation_request_outcomes`
   - `ai_copilot_materials`
   - `ai_copilot_material_versions`
   - `ai_copilot_material_version_outcomes`
   - `ai_copilot_intervention_recommendations`
     These tables feature strict triggers (`s34_validate_generation_request`, `s34_validate_material`, `s34_protect_material_identity`, etc.) that enforce that only assigned teachers in active faculty assignments can approve materials.
3. **Provider Availability**:
   The development `GEMINI_API_KEY` in `.env` is flagged as leaked by Google's backend (`403 PERMISSION_DENIED`). The backend must report service status gracefully via `GET /status` and provide full deterministic fallback/mocking for automated tests.
