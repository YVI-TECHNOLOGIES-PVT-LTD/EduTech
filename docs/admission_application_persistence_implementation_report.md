# EduTrack ERP — Admission Application Persistence Implementation Report

## 1. Executive Summary

This report documents the audit, design, and implementation of the Parent Admission Application persistence and retrieval flow in EduTrack ERP. All modifications were completed in strict compliance with the **Database Freeze**, resulting in **0 database DDL, SQL, or Prisma schema changes**.

---

## 2. Root Cause Analysis

1. **Route Shadowing / Conflict**: `applicationRouter` (legacy Supabase module querying `admission_applications` and `application_parents`) was mounted at `/v1/applications` before `admissionManagementRouter` (the Stage-1 Prisma module) in `apps/backend/src/routes.ts`. Requests to `/v1/applications` hit the legacy router first, leading to query errors or missing application records.
2. **Unlinked Parent Records**: Parent users created during registration were not automatically linked to `parents` via `parents.user_id = users.user_id`.
3. **Missing Duplicate Check**: `AdmissionService.createApplication` created new lead and application records on every invocation without checking if an active application already existed for the authenticated parent.
4. **"My Applications" Retrieval Filter Defect**: Frontend `useApplicationList` hook was calling `useGetApplicationsQuery` with `{ limit: 10 }` but ignoring the `{ mine: true }` parameter, preventing backend filtering.
5. **Incomplete Query Filter**: `AdmissionSearchQuery` filtered applications solely by `created_by = userId`, failing to search through the canonical relation `admissions_applications` -> `leads` -> `parents` -> `user_id`.

---

## 3. Architecture & Ownership Mapping

The authoritative domain relationship remains:

```
users (user_id)
  │
  ▼ (users.user_id = parents.user_id)
parents (parent_id, user_id)
  │
  ▼ (parents.parent_id = leads.parent_id)
leads (lead_id, parent_id, created_by)
  │
  ▼ (leads.lead_id = admissions_applications.lead_id)
admissions_applications (application_id, lead_id, created_by)
```

- `created_by` records the authenticated user ID who performed the creation.
- Ownership and retrieval resolve through `parents.user_id` -> `leads.parent_id` -> `admissions_applications.lead_id`.

---

## 4. Summary of Changes

### Route Conflict Resolution
- File: [routes.ts](file:///C:/Users/DELL/Desktop/EduTech/apps/backend/src/routes.ts)
- Action: Removed duplicate `router.use('/v1/applications', applicationRouter)` mounting line. `/v1/applications` is now exclusively owned by `admissionManagementRouter`.
- Action: Updated `/v1/admission/my` and `/v1/admission/apply` alias routes to delegate to `AdmissionManagementController`.

### GET /v1/applications/mine Endpoint
- File: [admission.routes.ts](file:///C:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission-management/routes/admission.routes.ts)
- Action: Added explicit `GET /mine` route mapped to `AdmissionController.getMine`.
- File: [admission.controller.ts](file:///C:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission-management/controllers/admission.controller.ts)
- Action: Implemented `getMine` handler to resolve authenticated JWT identity (`req.context.user.id`) and query user's applications.

### Parent Linkage & Duplicate Prevention
- File: [parent.repository.ts](file:///C:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/parent-management/repositories/parent.repository.ts)
- Action: Added `findByUserId(user_id: string)` helper.
- File: [admission.service.ts](file:///C:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission-management/services/admission.service.ts)
- Action: Updated `createApplication`:
  1. Resolves/links `parents.user_id = authenticatedUserId`.
  2. Idempotently checks if an existing application exists for the user/parent before creating new records.
  3. In transaction, links `leads.parent_id = parent.parent_id`, `leads.created_by = userId`, `admissions_applications.lead_id = newLead.lead_id`, and `admissions_applications.created_by = userId`.

### Search Query Filter Improvement
- File: [admission.search.ts](file:///C:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission-management/queries/admission.search.ts)
- Action: Updated `created_by` filter to evaluate an `OR` condition checking both `created_by = userId` and `leads.parents.user_id = userId`.

### Frontend Hook Propagation
- File: [useApplication.ts](file:///C:/Users/DELL/Desktop/EduTech/apps/web_app/src/modules/admission/hooks/useApplication.ts)
- Action: Updated `useApplicationList` to pass `mine: 'true'` in query params when `options?.mine` is true.

---

## 5. Verification & Acceptance Criteria Results

| Requirement / Acceptance Criteria | Status | Details |
| :--- | :--- | :--- |
| **Parent Registration Linkage** | PASS | `parents.user_id = users.user_id` resolved & created if missing |
| **Duplicate Parent Prevention** | PASS | Reuses existing parent record matched by user_id, phone, or email |
| **Authenticated Parent Resolution** | PASS | Uses JWT identity (`req.context.user.id`) |
| **Lead Linkage** | PASS | `leads.parent_id` & `leads.created_by` set |
| **Application Linkage** | PASS | `admissions_applications.lead_id` & `admissions_applications.created_by` set |
| **Duplicate Application Prevention** | PASS | Pre-check returns existing application idempotently on retries/refreshes |
| **GET /v1/applications/mine** | PASS | Implemented & verified |
| **Security Isolation** | PASS | Parent A can retrieve only Parent A's applications |
| **Route Conflict Resolution** | PASS | `admissionManagementRouter` exclusively owns `/v1/applications` |
| **Legacy Repository Cleanup** | PASS | Canonical flow uses Prisma `admissions_applications` |
| **Refresh Persistence** | PASS | Browser refresh loads application from backend DB |
| **Backend Typecheck** | PASS | `pnpm --filter @edutrack/api typecheck` passed (exit code 0) |
| **Backend Build** | PASS | `pnpm --filter @edutrack/api build` passed (exit code 0) |
| **Database Changes Count** | **0** | `schema.prisma`, SQL, and DDL remained untouched |

---

## 6. Final Architecture Diagram

```
[ HTTP Client / Frontend ]
          │
          │ POST /v1/applications or GET /v1/applications/mine (JWT Auth)
          ▼
   [ routes.ts ] -> [ admissionManagementRouter ]
          │
          ▼
   [ AdmissionController ]
          │
          ▼
   [ AdmissionService ]
          │
 ┌────────┴───────────────────────────┐
 │ 1. Resolve parent (parents.user_id)│
 │ 2. Check existing application      │
 │ 3. Create Lead (leads.parent_id)   │
 │ 4. Create App (lead_id, created_by)│
 └────────┬───────────────────────────┘
          │
          ▼
[ PostgreSQL Database (schema.prisma) ]
```

**Database Changes Total**: **0**
