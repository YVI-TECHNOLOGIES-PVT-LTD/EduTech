# AMAT Stage 3.3 — Parent Portal + Legacy Elimination Certification Report

**Generated:** 2026-07-05  
**Environment:** Local development  
**Overall verdict:** **CONDITIONAL FAIL** (browser certification + legacy backend retirement incomplete)

---

## Executive Summary

Stage 3.3 closes the parent portal gap by routing public apply, authenticated parent apply, staff lists, workflow actions, and dashboard reads through the **CRM pipeline** (`admission_enquiries` → `admission_leads` → `admission_applications`). Frontend legacy `/admissions/*` API calls are eliminated from the admission module facade; backend legacy routes remain mounted for compatibility.

**Backend and frontend builds pass.** Full **PASS** requires browser certification (Part 19), migration application (096–097), and removal of the legacy `/admissions` compatibility stack.

---

## Certification Matrix

| Area | Result | Evidence |
|------|--------|----------|
| Public apply → CRM | **PASS** | `PublicApplicationService.executeCrmApply` |
| Authenticated parent apply | **PASS** | `POST /v1/admission/apply` |
| GET /v1/admission/my | **PASS** | `ApplicationController.listMine` |
| Parent dashboard CRM data | **PASS** | `ParentDashboard`, `MyApplications`, `/dashboard/parent/overview` |
| Applicant360 parent read-only | **PASS** | Fees/Exam/Interview summary panels |
| Frontend legacy API elimination | **PASS** | `admission.api.ts` CRM wrappers |
| workflow.executor CRM-only | **PASS** | No `/admissions/*` fallbacks (except `decideLogin`) |
| Backend legacy route removal | **FAIL** | `compatibility.routes.ts` still mounts `/admissions/*` |
| RBAC migration 096 | **PARTIAL** | File exists; apply to DB required |
| RBAC migration 097 | **PARTIAL** | Parent fee/enrollment view; apply to DB required |
| Browser certification | **NOT RUN** | Part 19 manual walkthrough |
| Backend build | **PASS** | `npm run build` |
| Frontend build | **PASS** | `npm run build` |

---

## Architecture Report

### Target pipeline (implemented)

```
Parent Apply (public or authenticated)
  → admission_enquiries
  → admission_leads (+ counselor assignment)
  → admission_applications
  → Applicant360 (role-based)
  → Documents / Interview / Exam / Fees
  → Principal Approval
  → ERP Student Provisioning (Stage 3.2)
  → Student Dashboard
```

### Dual-system status

| Layer | CRM | Legacy |
|-------|-----|--------|
| Parent portal reads | ✅ | ❌ removed from frontend |
| Parent portal writes | ✅ | ❌ removed from frontend |
| Staff workflow (frontend) | ✅ | ❌ removed from frontend |
| Backend HTTP routes | ✅ active | ⚠️ still mounted via `compatibilityRouter` |
| ERP provisioning bridge | ✅ | Minimal `admissions` row (095 hybrid — KEEP) |

---

## Workflow Report

| Step | CRM path | Status |
|------|----------|--------|
| Public apply | `POST /v1/admission/public-apply` | ✅ |
| Auth parent apply | `POST /v1/admission/apply` | ✅ NEW |
| List mine | `GET /v1/admission/my` | ✅ |
| Staff list | `GET /v1/admission/application` | ✅ NEW |
| Staff stats | `GET /v1/admission/application/stats` | ✅ NEW |
| Submit | `POST /v1/admission/application/:id/submit` | ✅ |
| Review | `POST /v1/admission/application/:id/review` | ✅ |
| Approve | `POST /v1/admission/application/:id/approve` | ✅ |
| Reject | `POST /v1/admission/application/:id/reject` | ✅ NEW |
| Verify docs (app-level) | `POST /v1/admission/application/:id/verify-docs` | ✅ NEW |
| Enroll | `POST /v1/admission/enrollment/enroll` | ✅ |
| Workflow orchestrator events | `ApplicationWorkflowOrchestrator.publish` | ✅ |

---

## Database Report

| Table | Role | FK integrity |
|-------|------|--------------|
| `admission_enquiries` | CRM entry | ✅ |
| `admission_leads` | CRM lead | ✅ |
| `admission_applications` | CRM application | ✅ |
| `application_parents` | Parent linking | ✅ auto via apply |
| `application_workflow` | Timeline | ✅ |
| `application_documents` | Document engine | ✅ |
| `document_checklists` | Progress % | ✅ auto via orchestrator |
| `admissions` (legacy) | ERP bridge only | ⚠️ hybrid — not eliminated |

**Migrations to apply:**

| Migration | Purpose |
|-----------|---------|
| 096 | Parent portal RBAC |
| 097 | Parent fee/enrollment view permissions |

---

## API Report

### New / extended CRM endpoints (Stage 3.3)

```
POST /v1/admission/apply                          — authenticated parent apply
GET  /v1/admission/application                    — staff application list
GET  /v1/admission/application/stats              — staff stats
POST /v1/admission/application/:id/reject         — CRM reject
POST /v1/admission/application/:id/verify-docs    — app-level document verify
```

### Frontend CRM facade (`admission.api.ts`)

All former `/admissions/*` methods now route to `/v1/admission/*` except:

- `decideLogin` → still `/admissions/:id/decide-login` (login approval — legacy user table)

### Legacy still active (backend — DELETE target)

```
POST/GET/PUT /admissions/*
POST /admissions/:id/submit|review|verify-docs|billing|pay|approve|reject|enrol|...
```

Mounted via `backend/src/modules/compatibility/compatibility.routes.ts`.

---

## Frontend Report

| Component | Status |
|-----------|--------|
| `AdmissionForm` | ✅ CRM — `publicApply` (guest), `parentApply` (auth parent) |
| `MyApplications` | ✅ `GET /v1/admission/my` |
| `ParentDashboard` (workspace) | ✅ CRM hooks |
| `Applicant360Page` | ✅ Parent read-only tabs |
| `workflow.executor` | ✅ CRM-only |
| `useApplication` / `useApplicationList` | ✅ CRM list + my |
| `StudentDashboard` | ✅ `/v1/admission/my` |
| `ApplicationWizardPage` | ⚠️ Uses CRM wrappers via `admission.api` — needs browser test |
| `AdmissionDashboardService` | ✅ CRM stats |
| `useGlobalSearch` | ✅ CRM application search |

---

## RBAC Report

| Role | Parent portal | Notes |
|------|---------------|-------|
| PARENT | view_own, apply, upload docs, view fees (097), view enrollment (097) | Patch routes now enforce `enforceAccess` |
| COUNSELOR | Applicant360, CRM | Unchanged |
| ADMISSION_OFFICER | Full workflow | Unchanged |
| PRINCIPAL | Approve | Unchanged |

**Fix applied:** `checkLoginApproval` whitelist extended for `/v1/admission/*` paths.

---

## Applicant360 Report

| Tab | Parent view | Staff view |
|-----|-------------|------------|
| Overview | ✅ | ✅ |
| Timeline | ✅ | ✅ |
| Documents | ✅ upload (no verify) | ✅ full |
| Interview | ✅ summary only | ✅ full |
| Exam | ✅ summary only | ✅ full |
| Fees | ✅ summary only | ✅ full |
| Internal notes / CRM controls | Hidden | ✅ |

---

## Timeline Report

- Single source: `application_workflow` + evaluation/enrollment timeline APIs
- No duplicate parent timeline implementation
- `AdmissionEngine` invalidates timeline/progress/document caches on events

---

## Document Report

- Parent: upload, preview, download, delete, version history via `/v1/admission/application/documents/*`
- Staff: verify/reject via document controller
- App-level verify: `POST /v1/admission/application/:id/verify-docs` → orchestrator `DOCUMENT_VERIFIED`
- Checklist/progress auto-update via `ApplicationProgressService` + orchestrator

---

## Notification Report

- Backend: `AdmissionNotificationService.notifyPipelineEvent` on status transitions
- Frontend: `AdmissionEngine` + `admissionEventBus` for React Query invalidation
- **Not browser-verified** in this session

---

## Legacy Removal Report

### Classification

| Asset | Action | Status |
|-------|--------|--------|
| `admission.api.ts` legacy methods | MIGRATE → CRM wrappers | ✅ Done |
| `workflow.executor.ts` legacy fallbacks | MIGRATE | ✅ Done |
| `AdmissionForm` legacy create | MIGRATE | ✅ Done |
| `compatibility.routes.ts` | DELETE | ❌ Not removed |
| `admission.controller.ts` | DELETE | ❌ Not removed |
| `admission.service.ts` | KEEP (resolveContext) / DELETE (CRUD) | ⚠️ Partial |
| `AdmissionRepository.ts` (legacy) | DELETE | ❌ Not removed |
| ERP `admissions` bridge row (095) | KEEP | Required for hybrid students |
| `decideLogin` endpoint | MIGRATE | ❌ Still legacy |
| `ApplicationWizardPage` | MIGRATE (via API wrappers) | ⚠️ Needs test |
| `temp_structure.tsx` | DELETE | ❌ Dev artifact — direct `/admissions` |

---

## Browser Report

**NOT EXECUTED** — mandatory Part 19 walkthrough:

```
Parent Apply → Receptionist Inquiry → Counselor Follow-up → Convert
→ Applicant360 → Parent Upload → Officer Verify → Interview → Exam
→ Fees → Principal → ERP Student → Parent Dashboard → Student Dashboard
```

---

## Build Report

```
Backend:  npm run build  → PASS
Frontend: npm run build  → PASS (chunk size advisory)
```

---

## Performance Report

**NOT RUN** — no profiling session in this stage.

---

## Risk Report

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| 1 | Legacy `/admissions` routes still accept writes | HIGH | Remove compatibility router after soak period |
| 2 | Migrations 096/097 not applied | HIGH | Run `apply-stage32-migrations.js` pattern for 096–097 |
| 3 | Browser certification not run | HIGH | Execute Part 19 before feature freeze |
| 4 | `decideLogin` still legacy | MEDIUM | Migrate to user admin API |
| 5 | Bulk approve endpoint missing | MEDIUM | Implement or remove bulk config entry |
| 6 | Parent `collectPayment` RBAC | MEDIUM | Grant `admission.payments.record` for parent self-pay or dedicated endpoint |
| 7 | Auth provisioning post-ERP | MEDIUM | Document as accepted SKIPPED (Stage 3.2) |
| 8 | `APPLICATION_APPROVED` → `OFFERED` rank | LOW | Known Stage 3.2 idempotent behavior |

---

## Remaining Blockers (for full PASS)

1. **Browser certification** — zero console errors, zero failed API calls, live Applicant360 updates
2. **Apply migrations 096 + 097** to database
3. **Remove legacy backend stack** — `compatibilityRouter`, `admission.routes.ts`, legacy controller/service CRUD
4. **Migrate `decideLogin`** off legacy `admissions` table
5. **Parent payment permission** — verify parent can view/pay fees end-to-end
6. **Bulk approve API** — implement or remove from `bulkOperations.config.ts`

---

## Files Modified (Stage 3.3)

### Backend
- `auth/auth.middleware.ts` — v1 admission path whitelist
- `services/application/PublicApplicationService.ts` — authenticated parent apply
- `services/application/ApplicationService.ts` — list, stats, reject, verify
- `repositories/application/ApplicationRepository.ts` — paginated list, stats
- `controllers/application/ApplicationController.ts` — list, stats, parentApply, reject, verify, patch access
- `application.routes.ts` — new routes
- `routes.ts` — `POST /v1/admission/apply`
- `enrollment.routes.ts` — parent fee/status view permissions
- `rbac/rbac.middleware.ts` — parent fee/enrollment bypass
- `dashboard/dashboard.routes.ts` — admin counts from CRM
- `domain/application/AdmissionApplication.ts` — REJECTED/WITHDRAWN status
- `database/migrations/097_admission_parent_portal_fees_rbac.sql` — NEW

### Frontend
- `admission.api.ts` — CRM-only facade
- `workflow.executor.ts` — CRM-only
- `pages/AdmissionForm.tsx` — CRM apply paths
- `components/profile360/Applicant360*Panel.tsx` — parent read-only summaries
- `dashboard/pages/StudentDashboard.tsx` — CRM my applications
- `dashboard/services/AdmissionDashboardService.ts` — CRM stats
- `common/search/useGlobalSearch.ts` — CRM search
- `common/bulk/bulkOperations.config.ts` — CRM document bulk verify

---

## Verdict

### **CONDITIONAL FAIL**

**Reason:** Parent portal and frontend legacy elimination are **substantially complete**. Backend legacy routes remain active. Browser certification and DB migrations were **not completed** in this session.

**Estimated completion:** ~85% — core CRM parent portal implemented; certification and legacy retirement remain.

**Stage 4 (SIS) must NOT begin until full PASS including browser certification and legacy backend removal.**

---

## Artifacts

- Stage 3.2 baseline: `AMAT_STAGE32_CERTIFICATION_REPORT.md`
- This report: `AMAT_STAGE33_CERTIFICATION_REPORT.md`
