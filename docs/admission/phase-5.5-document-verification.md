# Phase 5.5 — Enterprise Document Verification Workspace

**Status:** Production-ready vertical slice  
**Route:** `/app/admissions/verification`  
**Constraints:** Zero-risk — no schema, API, RBAC, routing, or backend changes

---

## 1. Enterprise Audit Report (Part 1)

| Area | Before | After |
|------|--------|-------|
| `DocumentVerificationPage` | Mock queue fallback, mock docs URLs | Live queue + real `admission_documents` |
| Verification actions | Direct `useDocuments.verifyDocuments` | `useDocumentVerification` → `useWorkflow` → `executeWorkflowAction` |
| Preview | Legacy `DocumentViewer` only | Reused via `documents/DocumentPreview.tsx` |
| History | None | Parsed from `admission_audit_logs` |
| Permissions | None | `AdmissionPermissions.canVerifyDocuments` |
| Events | Partial invalidation | Full cascade: DOCUMENT_VERIFIED, QUEUE, DASHBOARD, TIMELINE |

---

## 2. Gap Matrix (Part 2)

| Gap | Severity | Resolution |
|-----|----------|------------|
| Mock queue apps | Critical | `useVerificationQueue` |
| Mock document URLs | Critical | `mapApplicationDocuments` from API |
| Bypass workflow engine | Critical | `verification.workflow.ts` → `useWorkflow` |
| No permission gates | High | Role checks in hook + workspace |
| No auto-refresh | High | `admissionEventBus` subscriptions |
| Duplicate verify logic | High | Single path via `workflow.executor.ts` |

---

## 3. Architecture

```
DocumentVerificationWorkspace
  → useVerificationQueue (submitted + under_review)
  → useDocumentVerification(appId)
      → useApplication (documents + audit logs)
      → useWorkflow (all mutations)
      → planVerificationWorkflow()
      → executeWorkflowAction()
      → AdmissionEngine.dispatch()
  → DocumentGrid / DocumentPreview / VerificationToolbar
```

---

## 4. Workflow Matrix

| UI Action | Workflow Action | API |
|-----------|-----------------|-----|
| Complete Verification | verify | POST `/admissions/:id/verify-docs` |
| Approve All | verify | same |
| Reject All | reject | POST `/admissions/:id/reject` |
| Request Re-upload | review | POST `/admissions/:id/review` |
| Verify Document (per-doc note) | review | audit remark, status → under_review |
| Reject Document | review | re-upload remark |

**Note:** Legacy backend verifies all documents in one `verify-docs` call. Per-document verify records review remarks; **Complete Verification** sets `docs_verified`.

---

## 5. Permission Matrix

| Role | View | Verify | Reject | Request Re-upload |
|------|------|--------|--------|-------------------|
| Admission Officer | ✅ | ✅ | ✅ | ✅ |
| Principal / Staff | ✅ | ✅ | ✅ | ✅ |
| Counselor | ✅ | ❌* | ❌* | ❌* |
| Parent | ❌ | ❌ | ❌ | ❌ |

*Unless granted `admission.review`

---

## 6. Event Matrix

| Event | Queue | Applicant360 | Pipeline | Dashboard | Timeline |
|-------|-------|--------------|----------|-----------|----------|
| DOCUMENT_VERIFIED | ✅ | ✅ | ✅ | ✅ | ✅ |
| APPLICATION_UPDATED | ✅ | ✅ | ✅ | ✅ | ✅ |
| QUEUE_REFRESH | ✅ | — | ✅ | — | — |
| DASHBOARD_REFRESH | — | — | — | ✅ | — |
| TIMELINE_REFRESH | — | ✅ | — | — | ✅ |

---

## 7. Document Lifecycle

```
Upload (parent/staff)
  → admission_documents row
  → status: pending
  → Officer reviews per-doc (review API + audit remark)
  → Complete Verification (verify-docs)
  → status: docs_verified
  → Pipeline column: DOCUMENTS → FEE
  → Applicant360 checklist: verified
```

---

## 8. Files Delivered

```
modules/admission/documents/
  DocumentVerificationWorkspace.tsx
  DocumentGrid.tsx
  DocumentCard.tsx
  DocumentPreview.tsx
  VerificationToolbar.tsx
  VerificationFilters.tsx
  VerificationHistory.tsx
  VerificationSummary.tsx
  index.ts

hooks/
  useDocumentVerification.ts
  useVerificationQueue.ts

utils/
  documentVerification.mapper.ts
  verification.workflow.ts
```

---

## 9. Testing Checklist

- [ ] Open `/app/admissions/verification` — queue loads from API
- [ ] Select application — documents from `admission_documents`
- [ ] Preview image/PDF with zoom/download
- [ ] Complete Verification → status `docs_verified`, pipeline refreshes
- [ ] Request re-upload → review API + toast
- [ ] Reject All → reject API
- [ ] Applicant360 document checklist updates without reload
- [ ] Permission denied for unauthorized roles

---

## 10. Known Limitations

1. No per-document verify API on legacy stack — complete verification is application-level
2. Per-doc "Verify" creates review audit note, not individual doc status in DB
3. v1 document endpoints (`/v1/admission/application/documents/*`) not wired (zero-risk)
4. Document checklist on Applicant360 derives status from app status + audit logs

---

## 11. Rollback

Revert `documents/*`, hooks, utils, and `DocumentVerificationPage.tsx` wrapper. No backend changes.

---

## 12. Go-Live Checklist

- [x] No mock data on verification path
- [x] All mutations via useWorkflow
- [x] Build passes
- [x] Event-driven sync across module
- [x] Permission gates
- [x] Loading / empty / error states
