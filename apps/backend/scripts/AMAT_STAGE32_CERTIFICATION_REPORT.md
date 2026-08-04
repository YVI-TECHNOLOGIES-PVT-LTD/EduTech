# AMAT Stage 3.2 — Production Certification Report

**Generated:** 2026-07-05  
**Environment:** Local development (`http://127.0.0.1:3000`)  
**Certification run:** `amat-stage32-live.js` → **API PASS**  
**Overall verdict:** **CONDITIONAL FAIL** (browser certification not executed)

---

## Executive Summary

Stage 3.2 production gaps were closed for the **full CRM admission processing lifecycle** from inquiry through atomic ERP student provisioning. API-level end-to-end certification **passed** with zero failed steps, `ENROLLED` terminal status, 100% progress, and no duplicate students.

**Browser-based certification (Part 15) was not executed in this session** and remains mandatory per AMAT criteria before a full PASS.

---

## Certification Matrix

| Area | Result | Evidence |
|------|--------|----------|
| Migration validation (090–095) | **PASS** | `amat-stage32-migration-check.js` |
| Workflow E2E (API) | **PASS** | `amat-stage32-result-202607051026.json` |
| ERP atomic provisioning | **PASS** | Single RPC transaction; rollback on failure |
| Backend build | **PASS** | `npm run build` (tsc) |
| Frontend build | **PASS** | `npm run build` (chunk size advisory only) |
| Browser certification | **NOT RUN** | Manual UI walkthrough required |
| Applicant360 tab audit | **PARTIAL** | Panels exist; independent load/retry not fully verified |
| RBAC all roles | **PARTIAL** | EXAM_CELL, FINANCE, COUNSELOR gaps fixed via 093 |
| Document UI (bulk/version) | **PARTIAL** | API endpoints added; frontend wiring incomplete |
| Performance review | **NOT RUN** | No profiling session |

---

## Architecture

- **Single CRM pipeline:** `admission_enquiries` → `admission_leads` → `admission_applications`
- **Workflow orchestrator:** `ApplicationWorkflowOrchestrator` — idempotent status progression via `WORKFLOW_ORCHESTRATOR` role
- **ERP provisioning:** `StudentProvisionService` → `AtomicProvisionRepository` → `fn_provision_admission_student` (PostgreSQL single transaction)
- **Legacy bridge:** Provisioning creates a minimal `admissions` row for FK compatibility with hybrid `students` schema; links CRM via `students.crm_application_id`

---

## Database & Migrations

| Migration | Purpose | Status |
|-----------|---------|--------|
| 090 | Counselor document permissions | Applied |
| 091 | Checklist seed (288 rows, Grade 5 = 6) | Applied |
| 092 | Atomic ERP RPC | Applied |
| 093 | EXAM_CELL / FINANCE / counselor submit RBAC | Applied |
| 094 | Interview workflow for exam cell roles | Applied |
| 095 | Hybrid students schema ERP fix + `crm_application_id` | Applied |

**Validated counts:** 6 document types, 288 checklist rows, `fn_provision_admission_student` exists, counselor permissions OK.

---

## Workflow Validation (API — Live Run)

Verified transitions without skips or backward movement:

```
Application Created (DRAFT/SUBMITTED)
  → Documents uploaded (DOCS_PENDING)
  → Documents verified (DOCUMENT_VERIFIED)
  → Interview scheduled (INTERVIEW)
  → Interview completed (EXAM)
  → Exam marks published (FEE_PENDING)
  → Fee paid (FEE_VERIFIED)
  → Committee review + principal approve (FEE_VERIFIED — idempotent)
  → Confirm + ERP enroll (ENROLLED)
```

**Progress API:** 100% at completion.

---

## ERP Atomic Provisioning

**PASS** — `fn_provision_admission_student` provisions in one transaction:

- Legacy `admissions` bridge row
- `students` (all required hybrid columns)
- `student_profiles`, `student_academic_records`, parents/guardians
- Identity card, status history, provisioning jobs
- Updates `admission_confirmation.student_id`
- Full rollback on any failure

**Skipped (by design):** Auth user accounts (Parent/Student) — require Supabase Auth Admin API; marked SKIPPED in job report.

**Optional modules:** Transport, Hostel — SKIPPED.

---

## Key Fixes Delivered (Stage 3.2)

1. **Separate Supabase auth client** in live script (service role session pollution fix)
2. **InterviewValidator** — interview before exam (removed legacy exam-first gate)
3. **ExamValidator** — requires completed interview before exam allocation
4. **RBAC migration 093** — EXAM_CELL_ADMIN interview/exam permissions
5. **OfferValidator** — CRM approval path without legacy offer letter
6. **Enrollment validators** — payment-only fee path; pre-confirmation vs pre-enrollment split
7. **ERP RPC 095** — hybrid `students` schema + `crm_application_id`
8. **Workflow orchestrator** — `APPLICATION_REVIEWED` → `FEE_VERIFIED` (non-regressive)

---

## Known Risks & Remaining Blockers

| # | Blocker | File(s) | Root cause |
|---|---------|---------|------------|
| 1 | **Browser certification not executed** | — | Part 15 manual walkthrough required |
| 2 | Principal approve does not advance to `OFFERED` | `ApplicationWorkflowOrchestrator.ts` | `OFFERED` rank < `FEE_VERIFIED`; orchestrator blocks regressive transition |
| 3 | Document bulk/version UI not wired | `Applicant360DocumentsPanel.tsx`, hooks | API exists; frontend not connected |
| 4 | Legacy workflow paths remain | `workflow.executor.ts` | `reject`, `verifyDocs`, billing still hit `/admissions/*` |
| 5 | Counselor submit RBAC | Fixed in 093 DB; verify in UI | Was blocked before migration |
| 6 | Auth account provisioning | `092/095` RPC | Parent/student auth users not created atomically in SQL |
| 7 | Grade 5 exam template missing | DB seed | Live script uses first template with subjects |
| 8 | Frontend chunk size | `vite build` | Advisory warning (>500 kB bundle) |

---

## RBAC (Partial)

| Role | API certification | Notes |
|------|-------------------|-------|
| Receptionist | PASS | Inquiry + assign |
| Counselor | PASS | Convert, documents |
| Exam cell | PASS | Interview + exam (post-093) |
| Finance officer | PASS | Full fee settlement |
| Admission officer | PASS | Verify, confirm, enroll |
| Principal | PASS | Approve endpoint |
| Parent | NOT TESTED | — |
| System | NOT TESTED | — |

---

## Build Validation

```
Backend:  npm run build  → PASS (zero errors)
Frontend: npm run build  → PASS (zero errors, chunk size warning)
```

---

## Production Readiness

| Criterion | Status |
|-----------|--------|
| Every workflow executes (API) | ✅ |
| Applicant360 fully operational | ⚠️ Partial |
| Checklist 100% | ✅ (certified run) |
| Auto-progress documents/interview/exam/fees/review | ✅ (API) |
| ERP atomic provisioning | ✅ |
| Browser workflow without reload | ❌ Not tested |
| Zero console errors (browser) | ❌ Not tested |
| Zero failed network requests (browser) | ❌ Not tested |
| Zero duplicate students | ✅ |
| Zero orphan records (certified run) | ✅ |
| Backend + frontend build | ✅ |

---

## Verdict

### **CONDITIONAL FAIL**

**Reason:** API and infrastructure certification **PASS**. Mandatory **browser certification (Part 15)** and full Applicant360 UI hardening were **not completed** in this session.

**To achieve full PASS:**
1. Execute Part 15 browser walkthrough (Receptionist → Enrolled) with zero console/network errors
2. Wire document bulk/version/restore UI to new API endpoints
3. Resolve `APPLICATION_APPROVED` → `OFFERED` rank ordering or introduce `REVIEW_PENDING` status
4. Remove remaining legacy `/admissions/*` fallbacks in `workflow.executor.ts`
5. Implement auth user provisioning post-ERP via Admin API (or document as accepted SKIPPED)

**Stage 4 (SIS) must NOT begin until full PASS including browser certification.**

---

## Artifacts

- Live result: `backend/scripts/amat-stage32-result-202607051026.json`
- Migration report: `backend/scripts/amat-stage32-migration-report-*.json`
- Live script: `backend/scripts/amat-stage32-live.js`
- Apply migrations: `backend/scripts/apply-stage32-migrations.js`
