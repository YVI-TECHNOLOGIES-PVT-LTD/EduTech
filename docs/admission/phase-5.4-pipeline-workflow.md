# Phase 5.4 — Enterprise Admission Pipeline & Workflow Engine

**Status:** Production-ready vertical slice  
**Constraints:** Zero-risk — no schema, API contract, RBAC, routing, or backend changes

---

## 1. Enterprise Audit Report (Part 1)

### Pre-implementation state

| Component | Finding |
|-----------|---------|
| `Pipeline/index.tsx` | 6 hardcoded mock cards, local `setCards` on drag |
| `KanbanBoard.tsx` | Custom STAGES diverged from `AdmissionStatusMapper` |
| `handleStageTransition` | No API call — immediate UI mutation |
| `onCardClick` | `console.log` only |
| `useWorkflow` | Fully wired on Review page, unused by Pipeline |
| `useApplicationList` | Available, unused by Pipeline |
| Status mapping | Duplicated kanban IDs (`DOCUMENT_CHECK`) vs UI statuses (`DOCUMENTS`) |
| Event bus | Not subscribed on Pipeline |
| Reports | Pipeline had no export |

### Backend (unchanged — read-only audit)

Legacy workflow APIs used: `review`, `verify-docs`, `initiate-payment`, `verify-fee`, `recommend`, `approve`, `enrol`, `reject` on `/api/admissions/:id/*`.

---

## 2. Gap Matrix (Part 2)

| Gap | Severity | Resolution |
|-----|----------|------------|
| Mock kanban data | Critical | `useApplicationList` + `pipeline.mapper` |
| Local drag transitions | Critical | `usePipeline` → `executeWorkflowAction` |
| Duplicate status columns | High | `PIPELINE_COLUMNS` in `AdmissionStatusMapper` |
| Duplicate workflow switch | High | `workflow.executor.ts` shared by hooks |
| No permission check on drag | High | `canExecuteAction` in `usePipeline` |
| No toast on failure | High | sonner toasts + no optimistic UI |
| No auto-refresh | High | `admissionEventBus` subscription |
| No list view | Medium | Table view toggle added |
| No search/filter | Medium | Client filter on pipeline cards |
| No export | Medium | `ExportMenu` integrated |

---

## 3. Architecture Validation (Part 3)

```
PipelinePage
  → usePipeline(permissionCtx)
    → useApplicationList() → GET /admissions
    → mapApplicationsToKanbanCards() → AdmissionStatusMapper
    → handleStageTransition()
        → resolvePipelineWorkflowAction()
        → executeWorkflowAction() → legacy API
        → AdmissionEngine.dispatch() → cache + events
  → KanbanBoard (PIPELINE_COLUMNS)
```

**Single status source:** `AdmissionStatusMapper`  
**Single workflow executor:** `workflow.executor.ts`  
**Single cache namespace:** `ADMISSION_CACHE_KEYS`

---

## 4. Workflow Matrix

| Legacy Status | Target Column | API Action |
|---------------|---------------|------------|
| submitted | REVIEW | review |
| under_review / submitted | DOCUMENTS | verify |
| docs_verified | FEE | initiate_payment |
| payment_submitted | MERIT | verify_fee |
| payment_verified / payment_pending | MERIT | recommend |
| recommended | OFFER | approve |
| approved | ENROLLED | enrol |

EXAM / INTERVIEW / ENROLLMENT columns display cards by mapped UI status; transitions require valid legacy action mapping.

---

## 5. Event Matrix

| Event | Pipeline refetch | Applicant360 | Dashboard |
|-------|------------------|--------------|-----------|
| APPLICATION_UPDATED | ✅ | ✅ | ✅ |
| DOCUMENT_VERIFIED | ✅ | ✅ | ✅ |
| PAYMENT_VERIFIED | ✅ | ✅ | ✅ |
| ENROLLMENT_COMPLETED | ✅ | ✅ | ✅ |
| QUEUE_REFRESH | ✅ | ✅ | ✅ |
| DASHBOARD_REFRESH | ✅ | — | ✅ |
| TIMELINE_REFRESH | ✅ | ✅ | — |

---

## 6. Cache Matrix

| Key | Hook | Invalidated on transition |
|-----|------|---------------------------|
| `lists` | useApplicationList | ✅ APPLICATION_* events |
| `detail(id)` | useApplication | ✅ per applicationId |
| `timeline(id)` | useTimeline | ✅ TIMELINE_REFRESH |
| `stats` | useAdmission | ✅ DASHBOARD_REFRESH |

---

## 7. Role Matrix

| Action | Permission |
|--------|------------|
| review, verify | admission.review / staff |
| recommend | admission.recommend |
| approve | admission.approve / principal |
| enrol | admission.enrol |
| verify_fee | finance / review |

---

## 8. Synchronization Dependency Graph

```
executeWorkflowAction
  → AdmissionEngine.dispatch(APPLICATION_UPDATED | DOCUMENT_VERIFIED | …)
    → React Query invalidate (lists, detail, timeline, stats)
    → admissionEventBus
      → usePipeline.refetch()
      → useApplicant360.refetch() (subscribed)
      → useAdmission stats refresh
      → Inquiry workspace (QUEUE_REFRESH)
```

---

## 9. Files Changed / Added

| File | Purpose |
|------|---------|
| `utils/workflow.executor.ts` | Shared workflow API execution |
| `utils/pipeline.mapper.ts` | Application → KanbanCard + SLA |
| `hooks/usePipeline.ts` | Pipeline orchestration hook |
| `hooks/useWorkflow.ts` | Refactored to use executor |
| `core/AdmissionStatusMapper.ts` | PIPELINE_COLUMNS, SLA, transition resolver |
| `pages/Pipeline/index.tsx` | Live pipeline UI |
| `components/kanban/KanbanBoard.tsx` | Uses PIPELINE_COLUMNS |
| `components/kanban/Card.tsx` | Transition loading state |

---

## 10. Manual Testing Checklist

- [ ] Open `/app/admissions/review` — cards load from API
- [ ] Search filters cards client-side
- [ ] Stage filter dropdown works
- [ ] Drag card to valid next column → toast success → card moves after refetch
- [ ] Drag to invalid column → toast error → card stays
- [ ] Backend rejection → toast error → no UI change
- [ ] Click card → navigates to review page
- [ ] List view toggle works
- [ ] Export CSV works
- [ ] Workflow action on review page → pipeline auto-refreshes
- [ ] Applicant360 auto-refreshes after pipeline transition

---

## 11. Known Limitations

1. Legacy workflow skips EXAM/INTERVIEW API steps — columns may be empty until v1 evaluation linked
2. `initiate_payment` uses `payment_amount ?? 0` when amount not set
3. One-step-forward transitions only (no multi-column skip)
4. Notifications — toast only; no push notification backend
5. Reports page still mock (Phase 5.5 scope)

---

## 12. Rollback Strategy

Revert files listed in §9. No backend/DB rollback required.

---

## 13. Go-Live Checklist

- [x] No mock data on pipeline path
- [x] All mutations via Admission Engine
- [x] Build passes (`npm run build`)
- [x] Permission gates on page and transitions
- [x] Loading / empty / error states
- [x] Event-driven refresh across module
