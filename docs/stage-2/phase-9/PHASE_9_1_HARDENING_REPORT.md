# EduTrack ERP — Stage 2, Phase 9.1: RBAC Security Hardening & Final Role Segregation Report

**Document Version:** 1.0.0  
**Phase:** Stage 2, Phase 9.1 (Security Hardening & Role Segregation Corrections)  
**Status:** COMPLETED & VERIFIED  
**Date:** 2026-11-11  
**Auditor / Architect:** Principal Software Architect & Security Lead

---

## Executive Summary

Following the completion of the Phase 9 independent security audit, Phase 9.1 was initiated to remediate all 3 actionable audit findings (`SEC-PHASE9-001`, `SEC-PHASE9-002`, `SEC-PHASE9-003`) and to address the informational finding (`SEC-PHASE9-004`).

All remediations were executed under strict database freeze governance:

- **Zero database DDL, zero migrations, zero Prisma schema changes, zero Prisma generation**.
- **Zero mock or in-memory persistence**.
- **100% test pass rate**: Expanded Phase 9 test suite achieved **47 passed, 0 failed**, and Phase 8 regression suite achieved **26 passed, 0 failed**.
- **Zero TypeScript errors** across `@edutrack/api` and `@edutrack/web`.

---

## 1. Audit Findings Resolution Matrix

| Finding ID           | Classification | Severity | Description                                                                                              | Status       | Verification                                                |
| :------------------- | :------------- | :------- | :------------------------------------------------------------------------------------------------------- | :----------- | :---------------------------------------------------------- |
| **`SEC-PHASE9-001`** | Actionable     | Medium   | Inconsistent `faculty` role normalization in `SessionService` and frontend landing resolution            | **RESOLVED** | Unit & Integration Tests in Suite 2                         |
| **`SEC-PHASE9-002`** | Actionable     | High     | `canAccessTeacherWorkspace()` used `ACADEMIC_VIEW`, allowing non-teaching `STAFF` into teacher workspace | **RESOLVED** | Router Middleware & Suite 2B Tests (403 Forbidden verified) |
| **`SEC-PHASE9-003`** | Actionable     | High     | Lesson-plan list query (`/v1/academic/lesson-planning/plans`) lacked caller ownership checks             | **RESOLVED** | Controller & Service hardened; Suite 5B Tests               |
| **`SEC-PHASE9-004`** | Informational  | Low      | Admin teacher workspace drill-down required URL `staff_id` parameter plumbing                            | **RESOLVED** | Web app pages plumb `staff_id` to API endpoints             |

---

## 2. Detailed Technical Corrections

### 2.1 SEC-PHASE9-001: Canonical Faculty & Teacher Role Normalization

#### Problem Identified:

- `SessionService.normalizeRoleName` previously grouped `lower === 'staff' || lower === 'faculty'` together, returning `'STAFF'`.
- In `LandingResolver.ts`, the faculty landing check was placed after Front Office/Finance fallbacks, causing faculty members to land on non-teaching portals.

#### Solution Implemented:

1. **Backend (`apps/backend/src/auth/session.service.ts`):**
   ```typescript
   // BEFORE:
   if (lower === 'staff' || lower === 'faculty') {
     return 'STAFF';
   }

   // AFTER:
   if (lower === 'teacher' || lower === 'faculty') {
     return 'TEACHER';
   }
   if (lower === 'staff') {
     return 'STAFF';
   }
   ```
2. **Frontend (`apps/web_app/src/services/LandingResolver.ts`):**
   Reordered landing route evaluation priority:
   1. `SUPERADMIN` $\rightarrow$ `/app/super-admin/dashboard`
   2. `ADMIN` $\rightarrow$ `/app/academic/dashboard`
   3. `TEACHER` / `FACULTY` $\rightarrow$ `/app/teacher/dashboard` _(prioritized before administrative staff)_
   4. `FINANCE` $\rightarrow$ `/app/finance/dashboard`
   5. `FRONT_OFFICE` / `STAFF` $\rightarrow$ `/app/front-office/dashboard`
   6. `STUDENT` $\rightarrow$ `/app/student/dashboard`

---

### 2.2 SEC-PHASE9-002: Restrict Teacher Workspace to Teaching Personnel

#### Problem Identified:

- `AcademicPolicy.canAccessTeacherWorkspace()` returned `PERMISSIONS.ACADEMIC_VIEW`.
- In `ROLE_ALIASES`, `STAFF` was aliased to `TEACHER`, allowing non-teaching employees (administrative assistants, clerks) to enter teacher workspaces.

#### Solution Implemented:

1. **Role Aliases (`apps/backend/src/rbac/rbac.middleware.ts`):**
   Decoupled `STAFF` from `TEACHER`/`FACULTY`:
   ```typescript
   TEACHER: ['TEACHER', 'FACULTY'],
   FACULTY: ['TEACHER', 'FACULTY'],
   STAFF: ['STAFF'],
   ```
2. **Permission Gate (`apps/backend/src/modules/academic-management/policies/academic.policy.ts`):**
   ```typescript
   static canAccessTeacherWorkspace(): PermissionCode {
     return (PERMISSIONS.DASHBOARD_VIEW_FACULTY || PERMISSIONS.FACULTY_DASHBOARD_VIEW) as PermissionCode;
   }
   ```
3. **Middleware Evaluation (`apps/backend/src/rbac/rbac.middleware.ts`):**
   Added dedicated authorization handler for `DASHBOARD_VIEW_FACULTY` / `faculty.dashboard.view`:
   - Permitted: `['TEACHER', 'FACULTY', 'ADMIN', 'SUPERADMIN', 'PRINCIPAL', 'HOI', 'SUPER_ADMIN', 'ORG_ADMIN']`.
   - Explicitly Rejected: `STAFF`, `FRONT_OFFICE`, `RECEPTIONIST`, `ACCOUNTANT`, `STUDENT`, `PARENT` with HTTP 403 Forbidden.
4. **Frontend Route Guard (`apps/web_app/src/components/auth/ProtectedRoute.tsx`):**
   Updated `TeacherRouteGuard` so `isTeacherOrAdmin` no longer includes `'STAFF'`. Non-teaching staff attempting direct URL entry are redirected to `/app/unauthorized`.

---

### 2.3 SEC-PHASE9-003: Lesson Plan List Ownership Enforcement

#### Problem Identified:

- Endpoint `GET /v1/academic/lesson-planning/plans` accepted an unverified query parameter `teacher_staff_id`.
- An ordinary teacher could pass another teacher's `teacher_staff_id` or query without parameters to view all organization lesson plans.

#### Solution Implemented:

1. **Controller (`apps/backend/src/modules/academic-management/controllers/lesson-planning.controller.ts`):**
   Extracted authenticated `user` context from `req.context` and passed `requestingUser` to `LessonPlanningService.listSavedPlans`.
2. **Service (`apps/backend/src/modules/academic-management/services/lesson-planning.service.ts`):**
   Implemented strict fail-closed identity resolution:
   - **Teachers:** Resolves teacher's own `staff.staff_id` from their authenticated `user_id`. **Forces** `params.teacher_staff_id = staff.staff_id`, silently discarding any client-supplied override. If the teacher has 0 plans, returns an empty array `[]` (fail-closed, zero leakage).
   - **Administrators (Admin/SuperAdmin):** Authorized for institutional oversight. If a specific `teacher_staff_id` is supplied in the query, verifies that the target staff member belongs to the caller's `orgId`. If cross-tenant, returns `[]`.
   - **Non-Teaching Staff:** Throws HTTP 403 `FORBIDDEN`.

---

### 2.4 SEC-PHASE9-004: Administrator Teacher Drill-Down Plumbing

#### Problem Identified:

- When an administrator views a specific teacher's workspace via `/app/teacher/dashboard?staff_id=<uuid>`, child sub-pages (Classes, Timetable, Workload) did not propagate the `staff_id` query parameter to the backend API.

#### Solution Implemented:

- Updated the following Web App components:
  1. [`TeacherDashboard.tsx`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/dashboard/pages/TeacherDashboard.tsx)
  2. [`TeacherClassesPage.tsx`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/teacher/pages/TeacherClassesPage.tsx)
  3. [`TeacherTimetablePage.tsx`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/teacher/pages/TeacherTimetablePage.tsx)
  4. [`TeacherWorkloadPage.tsx`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/teacher/pages/TeacherWorkloadPage.tsx)
- Each component inspects `searchParams.get('staff_id')` and appends it to RTK Query and service calls, enabling seamless administrative inspection while ordinary teachers remain strictly constrained to their own identity.

---

## 3. Files Modified

```text
apps/backend/src/auth/session.service.ts
apps/backend/src/rbac/rbac.middleware.ts
apps/backend/src/modules/academic-management/policies/academic.policy.ts
apps/backend/src/modules/academic-management/controllers/lesson-planning.controller.ts
apps/backend/src/modules/academic-management/services/lesson-planning.service.ts
apps/backend/src/modules/academic-management/tests/academic-phase9.spec.ts
apps/web_app/src/services/LandingResolver.ts
apps/web_app/src/components/auth/ProtectedRoute.tsx
apps/web_app/src/modules/dashboard/pages/TeacherDashboard.tsx
apps/web_app/src/modules/teacher/pages/TeacherClassesPage.tsx
apps/web_app/src/modules/teacher/pages/TeacherTimetablePage.tsx
apps/web_app/src/modules/teacher/pages/TeacherWorkloadPage.tsx
```

---

## 4. Verification & Test Evidence

### 4.1 Phase 9 Security Suite Execution

```text
===============================================================
  EDUTRACK ERP — PHASE 9: RBAC, DASHBOARDS & ACADEMIC WORKFLOWS
===============================================================

[Suite 1: Request DTOs & Validation Schemas]
  ✓ teacherScheduleQuerySchema parses valid weekday integer
  ✓ teacherScheduleQuerySchema rejects invalid weekday out of range (1-7)
  ✓ teacherScheduleQuerySchema parses optional academic_year_id UUID
  ✓ teacherWorkspaceQuerySchema validates optional staff_id UUID

[Suite 2: Role Normalization & Dynamic Aliasing]
  ✓ SessionService.normalizeRoleName normalizes Super Admin to SUPERADMIN
  ✓ SessionService.normalizeRoleName normalizes Administrator to ADMIN
  ✓ SessionService.normalizeRoleName normalizes Teacher and Faculty to TEACHER
  ✓ SessionService.normalizeRoleName preserves STAFF and FRONT_OFFICE
  ✓ getEffectiveRoles expands TEACHER to include FACULTY without leaking STAFF
  ✓ getEffectiveRoles for STAFF does not grant TEACHER privileges
  ✓ getEffectiveRoles expands SUPERADMIN to include SUPER_ADMIN
  ✓ getEffectiveRoles expands ADMIN to include ORG_ADMIN

[Suite 2B: Teacher Workspace Access Restrictions (SEC-PHASE9-002)]
  ✓ TEACHER can access teacher workspace (Allowed)
  ✓ FACULTY can access teacher workspace (Allowed)
  ✓ Non-teaching STAFF is rejected from teacher workspace (403 FORBIDDEN)
  ✓ FRONT_OFFICE is rejected from teacher workspace (403 FORBIDDEN)
  ✓ RECEPTIONIST is rejected from teacher workspace (403 FORBIDDEN)
  ✓ ACCOUNTANT (Finance) is rejected from teacher workspace (403 FORBIDDEN)
  ✓ ADMIN has authorized institutional oversight to teacher workspace (Allowed)
  ✓ SUPERADMIN has enterprise oversight to teacher workspace (Allowed)

[Suite 3: Teacher Staff Profile Resolution & Tenant Scoping]
  ✓ TeacherContextService.resolveTeacherStaff resolves active teacher staff record
  ✓ TeacherContextService.resolveTeacherStaff fails closed for unknown user (Throws 404)
  ✓ Multi-Tenant Isolation: Teacher in Tenant A cannot be resolved in Tenant B (Throws 404)
  ✓ Teacher caller cannot impersonate another staff via requestedStaffId (Forced to own profile)
  ✓ Admin caller with requestedStaffId can view target teacher workspace

[Suite 4: Teacher Assigned Data Access & Zero Leakage]
  ✓ TeacherContextService.getTeacherClasses returns only assigned sections
  ✓ TeacherContextService.getTeacherSubjects returns only assigned disciplines
  ✓ TeacherContextService.getTeacherCurriculum returns curriculum for assigned subjects
  ✓ TeacherContextService.getTeacherLessonPlans returns only authored plans
  ✓ Teacher Yogesh with 0 authored plans returns exactly 0 plans (Fail-closed, no leak)
  ✓ TeacherContextService.getTeacherWorkload calculates teaching periods metrics

[Suite 5: Lesson Plan Ownership Boundaries]
  ✓ Retrieve sample saved lesson plan for ownership tests
  ✓ Authoring teacher can access their own lesson plan (Allowed 200)
  ✓ Another teacher cannot access Aarav plan (Rejected 403 FORBIDDEN)
  ✓ Institutional Administrator has oversight to view any teacher plan (Allowed 200)
  ✓ Super Administrator has enterprise oversight to view any plan (Allowed 200)

[Suite 5B: Lesson Plan List Ownership Filtering (SEC-PHASE9-003)]
  ✓ Teacher Aarav calling listSavedPlans receives strictly his own authored plans
  ✓ Teacher Aarav attempting to override teacher_staff_id is ignored and receives own plans
  ✓ Teacher Yogesh with 0 authored plans receives exactly 0 plans
  ✓ Non-teaching STAFF calling listSavedPlans throws 403 FORBIDDEN
  ✓ Institutional Administrator calling listSavedPlans receives organization-wide plans
  ✓ Institutional Administrator calling listSavedPlans with target teacher_staff_id receives target plans
  ✓ Institutional Administrator calling listSavedPlans with cross-tenant teacher_staff_id receives 0 plans
  ✓ Super Administrator calling listSavedPlans receives organizational plans

[Suite 6: Super Admin Academic Oversight]
  ✓ SuperAdminRepository.getAcademicOverview aggregates organization-wide metrics
  ✓ SuperAdminController rejects non-superadmin access (Throws 403 FORBIDDEN)
  ✓ SuperAdminController allows Super Administrator access (Returns 200 OK)

===============================================================
  PHASE 9 TEST RESULTS: 47 PASSED, 0 FAILED
===============================================================
```

### 4.2 Phase 8 Regression Suite Execution

```text
===============================================================
  PHASE 8 TEST RESULTS: 26 PASSED, 0 FAILED
===============================================================
```

### 4.3 Monorepo TypeScript Verification

```bash
pnpm --filter @edutrack/api run typecheck
# Exit Code: 0 (No errors)

pnpm --filter @edutrack/web run typecheck
# Exit Code: 0 (No errors)
```

---

## 5. Database Governance & Freeze Compliance Confirmation

- **Database Structure:** Unchanged. Zero DDL executed. Zero migrations created.
- **Prisma Schema:** `schema.prisma` was not altered. Zero `prisma generate` executed.
- **Persistence Integrity:** All role resolution, tenant scoping, and authorization checks rely exclusively on PostgreSQL physical tables (`users`, `user_roles`, `roles`, `staff`, `designations`, `lesson_plans`). Zero mock or in-memory persistence used.

---

## 6. Final Sign-Off Verdict

```text
========================================================================================
  STAGE 2, PHASE 9.1: RBAC SECURITY HARDENING & SEGREGATION CORRECTIONS — VERDICT:

  [x] APPROVED — ALL ACTIONABLE FINDINGS FULLY RESOLVED AND VERIFIED
========================================================================================
```
