# EduTrack ERP — Stage 3 Security, Tenant Isolation & RBAC Audit

> **Phase:** Stage 3, Phase 1 — Read-Only Security & Authorization Audit  
> **Scope:** Express Security Middleware, Authentication, Session Handling, RBAC, PostgreSQL RLS, Stored Procedure Role Checks, File Upload Safety & AI Data Governance.

---

## 1. Executive Risk Summary

Phase 1 identified **four CRITICAL**, **three HIGH**, and **multiple MEDIUM** security/integrity gaps that would compromise multi-tenant isolation, authorization correctness, or student data privacy if left unresolved before Stage 3 implementation:

| ID         |   Severity   | Vulnerability / Defect                                                                                                                                                  | Location                                                               |
| :--------- | :----------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------- |
| **SEC-01** | **CRITICAL** | Unauthenticated public endpoint `/public/inspect-rbac` exposes RBAC structure                                                                                           | `apps/backend/src/routes.ts` (`L590–615`)                              |
| **SEC-02** | **CRITICAL** | `/v1/academic`, `/v1/students`, `/v1/parents`, `/v1/parent` omit `resolveTenantMiddleware`; silent org fallback picks active/default org                                | `routes.ts` (`L785–857`), `middlewares/tenant.middleware.ts`           |
| **SEC-03** | **CRITICAL** | Stale `@prisma/client` DMMF sends all `39` Stage 3 models to volatile RAM `fallbackStores` `Map`; `FINANCIAL_PERSISTENCE_MODELS` blocks writes                          | `apps/backend/src/lib/prismaClient.ts` (`L26–120`, `L123`, `L183–425`) |
| **SEC-04** | **CRITICAL** | PG role check case-sensitivity bug blocks `'Administrator'`, `'Principal'`, `'Super Admin'` inside `auth_is_academic_admin`, `s35_*`, `s36_*`                           | PG `public.roles` vs PG functions/procs                                |
| **SEC-05** |   **HIGH**   | PostgreSQL `auth.uid()` evaluates `NULL` over Express `pg`/`postgres` (`rolbypassrls: true`); `assessment_rubrics` has RLS ON & `0` policies                            | PG `pg_roles`, `pg_policies`, `public.auth_*`                          |
| **SEC-06** |   **HIGH**   | `students` table lacks linked `user_id` on **`527` / `733` (`71.9%`)** rows; `SessionService` lacks verified `studentId`/`staffId` resolution & uses RAM `sessionCache` | Live PG `students`, `auth/session.service.ts` (`L29–30`)               |
| **SEC-07** |   **HIGH**   | Hardcoded JWT secret fallbacks in config + broken startup RBAC self-healer targeting non-existent Supabase tables                                                       | `config/env.ts`, `server.ts` (`L120–169`)                              |
| **SEC-08** |  **MEDIUM**  | `p_assessment_attachments_select` RLS policy references disallowed status `'results_reviewed'` (violates `assessments_status_check`)                                    | PG `public.assessment_attachments` policy                              |

---

## 2. Express Middleware, Routing & Tenant Isolation Audit

### 2.1 Global HTTP Baseline (`apps/backend/src/app.ts`)

Express initializes `compression`, `requestIdMiddleware`, `helmet`, CORS, `express.json({ limit: '10mb' })`, and rate limiters before mounting `/api`. While transport hardening is present, route-level controls in `routes.ts` exhibit severe inconsistencies:

### 2.2 Public Route Leak (`SEC-01`)

- `apps/backend/src/routes.ts` (`L590–615`) registers `/public/inspect-rbac` **before** the global `authenticate` + `checkLoginApproval` middleware (`L620–621`).
- **Action Required:** Immediately delete `/public/inspect-rbac` or lock it strictly behind `authenticate`, Super Admin role verification, and non-production runtime checks before deploying Stage 3.

### 2.3 Inconsistent Tenant Boundary Enforcement (`SEC-02`)

- **Verified Gap:** In `apps/backend/src/routes.ts` (`L785–857`), `/v1/fees` and `/v1/communication` explicitly apply `resolveTenantMiddleware`, whereas **`/v1/academic`, `/v1/students`, `/v1/parents`, and `/v1/parent` do NOT mount `resolveTenantMiddleware`**.
- **Dangerous Fallback (`middlewares/tenant.middleware.ts`):** When explicit tenant headers/tokens are absent or malformed, `tenant.middleware.ts` falls back to `DEFAULT_ORG_ID`, `DEV_DEFAULT_ORG_ID`, or the **first active organization record** in PostgreSQL!
- **Stage 3 Impact:** Without `resolveTenantMiddleware` + strict org matching between JWT claims and route resources, an authenticated user or malformed request could silently cross into a fallback org (`7` live orgs exist in PG).
- **Mandate:** Enforce `resolveTenantMiddleware` globally across all `/api/v1/*` authenticated Stage 3 routers, disable first-org DB fallback outside explicit local single-tenant test harnesses, and require every repository query to filter by `(org_id = req.orgId)`.

---

## 3. Authentication, Session Cache & Persona Identity Resolution

### 3.1 JWT Configuration & Startup RBAC (`SEC-07`)

- **`apps/backend/src/config/env.ts`:** Contains hardcoded default fallback secrets (`'edutrack-enterprise-jwt-secret-2026'` and `'edutrack-enterprise-jwt-refresh-secret-2026'`) alongside mandatory `SUPABASE_URL`/`SUPABASE_KEY`. Startup validation in non-dev environments MUST fail fast if production JWT secrets fall back to defaults.
- **`apps/backend/src/server.ts` (`L120–169`):** `runRBACSelfHealing()` attempts to upsert `NEW_PERMISSIONS` & `ROLE_PERMISSIONS_MAPPING` into Supabase tables (`permissions`, `role_permissions`, `roles(id, name)`). In reality, PostgreSQL `public.roles` uses columns `(role_id, role_name)`, and these Supabase RBAC tables do not exist in `schema.prisma`, rendering the startup RBAC sync broken.

### 3.2 `SessionService` & Identity Gaps (`SEC-06`)

Auditing `apps/backend/src/auth/session.service.ts` (`L1–250`) and live PostgreSQL counts revealed three concrete persona risks:

1. **RAM `sessionCache` (`L29–30`):** Caches validated sessions in a single-process `Map` with a `5`-minute TTL. Role revocations, suspended accounts, or multi-instance horizontal deployments do not immediately propagate across processes.
2. **Hardcoded Stage 1 Permissions & Partial Persona Context:** `SessionService` validates roles (failing closed when `0` roles exist) and queries `parents` (`hasEnrolledStudent`), yet does **not** deterministically hydrate `staff_id`, `student_id`, or explicit scoped `studentIds` across all routes.
3. **Critical Live Data Student Auth Gap:**
   - `staff`: `175` / `175` have `user_id` (`100%`)
   - `parents`: `806` / `810` have `user_id` (`99.5%`)
   - **`students`: ONLY `206` / `733` (`28.1%`) have `user_id`; `527` (`71.9%`) have `user_id = NULL`!**
   - Unless user accounts are provisioned/linked cleanly in `students.user_id`, nearly three-quarters of enrolled students cannot authenticate to view Stage 3 schedules, submit projects, or sit online MCQs.

### 3.3 Express RBAC & Reusable Policies

Stage 3 authorization must reuse and harden existing RBAC infrastructure (`rbac/rbac.middleware.ts`, `rbac/role-normalization.ts`, `rbac/permissions.ts`) and module policies:

- **`AcademicPolicy`** (`modules/academic-management/policies/academic.policy.ts`): Provides `canView()`, `canCreate()`, `canUpdate()`, `canDelete()`, `canAssignFaculty()`, `canViewTimetable()`, `canManageTimetable()`, `canViewLessonPlan()`, `canGenerateLessonPlan()`, `canManageLessonPlan()`, `canViewReadiness()`, `canPublishAcademic()`, `canAccessTeacherWorkspace()`, `canManageAsSuperAdmin()`. Stage 3 Teacher/Academic endpoints should extend `AcademicPolicy` + add strict `faculty_assignment_id` ownership verification (matching `section_subject_faculty_assignments.staff_id` to `req.user.staffId` unless Admin/Super Admin).
- **`ParentPortalPolicy`** (`modules/parent-management/policies/parent-portal.policy.ts`): `requireParentRole()` permits `ALLOWED_PARENT_PORTAL_ROLES = ['PARENT', 'GUARDIAN', 'ENROLLED_PARENT']` and calls `extractParentSessionContext(req)`. Every Stage 3 Parent endpoint MUST also verify active linkage in `student_parents` + active `student_enrollments` so no Parent IDOR can inspect another family's attendance, marks, intervention notes, or progress cards.

---

## 4. PostgreSQL RLS, Stored Procedures & Role Naming Audit

### 4.1 PG Connection Role vs RLS Context (`SEC-05`)

Live `pg_roles` inspection confirms Express connects via PostgreSQL role **`postgres`** (`rolsuper: false`, **`rolbypassrls: true`**):

- Every one of PostgreSQL's `148` ordinary tables has `rowsecurity = true`.
- Because `postgres` holds `BYPASSRLS`, **Express currently bypasses all PG RLS policies at runtime**, making Express application-layer tenant + ownership filters (`org_id`, `faculty_assignment_id`, `student_id`, `parent_id`) the **sole** runtime enforcement barrier.
- Meanwhile, all `7` PostgreSQL RLS helper functions (`auth_is_academic_admin`, `auth_is_parent_of_student`, `auth_is_staff`, `auth_is_student`, `auth_is_teacher_of_assignment`, `auth_org_id`, `auth_uid`) depend on Supabase JWT `auth.uid()`, which is **`NULL`** for direct Express connections unless connection-local claims are explicitly propagated.

### 4.2 RLS Policy Coverage Gaps & Defects

Across `148` PG tables (`rowsecurity = true` on all `148`):

- **Total Covered:** `40` tables carry `68` policies; **`108` tables have `0` policies** (meaning any future non-`bypassrls` DB role—such as direct Supabase client access—is **default-denied** on all `108` tables, including all `32` Stage 2 and `10` Timetable tables).
- **Stage 3 Anomaly (`SEC-05`):** `38` of `39` pure Stage 3 tables have active RLS policies, **EXCEPT `assessment_rubrics`, which has `rls_enabled = true` and `0` policies**. Even though `postgres` bypasses RLS today, any RLS-enforcing role cannot read/write rubrics.
- **Stage 3 Policy Logic Defect (`SEC-08`):** Policy `p_assessment_attachments_select` on `assessment_attachments` references assessment status `'results_reviewed'`, which cannot legally exist because `assessments_status_check` allows only `('draft'|'published'|'conducted'|'closed'|'results_entered'|'results_published')`.

### 4.3 Critical PG Role-Name Case Mismatch (`SEC-04`)

Verified directly from PostgreSQL `public.roles` and PG function definitions:

- **Live `public.roles.role_name` values (`13` rows):** `'Administrator'`, `'Admissions Officer'`, `'Counsellor'`, `'Finance'`, `'Front Office'`, `'HR'`, `'Parent'`, `'PARENT'`, `'Principal'`, `'Receptionist'`, `'Student'`, `'Super Admin'`, `'Teacher'`.
- **Exact PG Function Check inside `public.auth_is_academic_admin`, `public.s35_apply_result_correction_approval`, and `public.s36_evaluate_assessment_mcq`:**
  ```sql
  ro.role_name IN ('admin', 'principal', 'coordinator', 'academic_coordinator')
  ```
- **Security & Operational Impact:** Because PG `IN (...)` string equality is case-sensitive and compares against lowercase `'admin'`/`'principal'`, live users holding `'Administrator'`, `'Principal'`, or `'Super Admin'` **fail authorization inside PostgreSQL `s35_apply_result_correction_approval` and `s36_evaluate_assessment_mcq` stored procedures!**
- **Pre-Condition for Phase 2:** Documented schema/DB change request (outside frozen Phase 1) to align role matching in PG routines or resolve the exact permitted actor pattern before executing `s35`/`s36` approvals/grading in production.

---

## 5. Stage 3 Feature-Specific Security Controls

### 5.1 Online Assessment Answer-Key Protection (S3.5 / S3.6)

- **Threat:** Returning `assessment_question_options.is_correct` in API payloads lets students inspect network traffic to cheat on online MCQs.
- **Control:** Student-facing endpoints MUST read options exclusively via the SQL view **`public.student_assessment_question_options`** (which structurally omits `is_correct`) or an explicit safe DTO whitelist, and forbid answer submission once `assessments.status <> 'published'`.
- **Integrity:** Post-publish marks mutations MUST go through `assessment_result_approvals` + `s35_apply_result_correction_approval()` rather than raw updates (`s35_protect_published_results`).

### 5.2 Parent Visibility & Data Minimization (S3.7 / S3.9)

- **Progress Notes (`intervention_progress_notes`):** Parent queries MUST strictly enforce `WHERE is_parent_visible = true` alongside verified `student_parents` linkage.
- **Progress Cards (`student_progress_cards`):** Students and Parents MUST only view versions in `'published'` status (`student_progress_card_versions`); `'draft'`, `'compiling'`, and `'pending_approval'` notes remain teacher/admin internal.

### 5.3 File Upload & Storage Security (`upload.middleware.ts`, `StorageService`)

- Existing `apps/backend/src/middlewares/upload.middleware.ts` validates uploaded buffers via **magic-byte inspection (`detectBufferMimeType`)** allowing strictly `['application/pdf', 'image/jpeg', 'image/png', 'image/webp']`, max `5` files, max `10MB` per file (`ck_s32_file_size` enforces `1..10485760` bytes in DB).
- Files are stored in a **private** Supabase Storage bucket (`admission-documents` default) via `StorageService.uploadFile()` and served solely via authenticated, ownership-checked **`3600s` signed URLs** (`StorageService.getSignedUrl()`).
- **Rule:** Never switch Stage 3 buckets to public access and never expose permanent raw bucket paths directly without role + ownership verification.

### 5.4 AI Data Privacy & Prompt Injection Safeguards (S3.4)

- **Prompt Injection Defense:** Re-use `LessonPromptBuilder.sanitizeInput()` before passing teacher instructions or document RAG excerpts into `AiProviderFactory` / `ChatbotLlmService`.
- **PII Minimization:** Before invoking Gemini (`GoogleGenAiProvider`) or OpenAI (`OpenAiProvider`) for S3.4 worksheets or `ai_copilot_intervention_recommendations`, redact or substitute student PII (names, parent contacts, emails, raw `user_id`s) with anonymized identifiers/aggregates inside `evidence_snapshot` prompts.
- **RAG Tenant Isolation:** `ChatbotVectorRepository.searchSimilarChunks` raw SQL cosine queries over `public.document_chunks` MUST keep mandatory `org_id` predicates to prevent cross-school curriculum/document leakage.
