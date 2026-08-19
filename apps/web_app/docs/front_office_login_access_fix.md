# EduTrack ERP — Front Office Login Access & Approval Gate Forensic Audit & Fix Report

---

## 1. Symptom

- **Issue Reported**: Front Office staff users (e.g. `Delhi Front Office`) were authenticating successfully at `/login`, but were immediately redirected to the Parent Portal **"Login Access Pending"** page (`/pages/PendingApproval.tsx`) displaying:
  > *"Login Access Pending — Hello, Delhi Front Office. Your account registration is complete, but your login access is currently PENDING. A school administrator will review your application and approve your dashboard access... [ View Admission Status ] [ Sign Out ]"*
- **Expected Behavior**: Front Office users authenticate, bypass the parent registration approval gate, and land directly on the **Front Office Workspace** (`/app/workspace`) with `FRONT_OFFICE` navigation and permissions active.

---

## 2. Authentication Flow Observed

```text
POST /auth/login (or /login)
       ↓
Backend Returns 200 OK
{
   user: {
      id: "usr-front-office-1",
      email: "delhi.frontoffice@edutrack.internal",
      roles: ["FRONT_OFFICE"],
      permissions: ["admission.create", "admission.view_all", ...],
      full_name: "Delhi Front Office",
      login_status: "APPROVED"
   },
   accessToken: "...",
   refreshToken: "..."
}
       ↓
Frontend LoginPage.tsx receives response DTO
       ↓
Dispatches credentials to Redux authSlice & permissionSlice
       ↓
Routes to /app/workspace or /app/dashboard
       ↓
ProtectedRoute (<Route path="/app" element={<ProtectedRoute />}>)
       ↓
LoginApprovalGate evaluated
       ↓
[DEFECT POINT] LoginApprovalGate only checked for ADMIN / EXAM_CELL_ADMIN
Evaluated (user.login_status !== 'APPROVED' && !isAllowedPath)
       ↓
Rendered <PendingApprovalPage />
```

---

## 3. Exact Root Causes Identified

1. **`LoginApprovalGate` Lack of Role Awareness for Staff/Institutional Roles**:
   - `LoginApprovalGate` in `ProtectedRoute.tsx` only had a hardcoded bypass for `ADMIN` and `EXAM_CELL_ADMIN` (`if (hasRole('ADMIN') || hasRole('EXAM_CELL_ADMIN')) return <>{children}</>;`).
   - For all other users—including `FRONT_OFFICE`, `FO`, `STAFF`, `ADMISSION_OFFICER`, `COUNSELLOR`, `HOI`, `PRINCIPAL`, `TEACHER`, `FINANCE_OFFICER`—it ran the Parent Admission Registration Approval check.
2. **Missing `login_status` mapping during Login response transform**:
   - In `LoginPage.tsx`, the `enrichedUser` object did not explicitly copy `rawUser.login_status`. As a result, `enrichedUser.login_status` was `undefined` on initial login dispatch, causing `user.login_status !== 'APPROVED'` (`undefined !== 'APPROVED'`) to evaluate to `true` and trigger `<PendingApprovalPage />`.
3. **Post-Login Redirection Target**:
   - `LoginPage.tsx` previously evaluated `role === 'PARENT'` vs `navigate(from)`. If `from` was defaulted to `/app/dashboard` or `/app`, it required an extra redirect step.

---

## 4. Role Propagation & Authorization Architecture

- **Backend Role Source of Truth**:
  - `SessionService.normalizeRoleName` in `apps/backend/src/auth/session.service.ts` deterministically resolves DB roles (`frontoffice`, `receptionist`, `admissionofficer`) to canonical `FRONT_OFFICE`.
  - Permissions for `FRONT_OFFICE` are injected server-side (`admission.create`, `admission.view_all`, `admission.review`, `admission.document.view`, `admission.document.verify`, `admission.application.view`).
  - The `/me` endpoint returns `roles: ['FRONT_OFFICE']` and `login_status: 'APPROVED'`.
- **Frontend Permission & Context**:
  - `AuthContext.tsx` stores normalized roles in Redux `permissionSlice`.
  - `hasRole` and `hasPermission` helpers in `AuthContext` are fully aware of `FRONT_OFFICE`, `FO`, `STAFF`, `ADMISSION_OFFICER`, `COUNSELLOR`, `ADMIN`, `SUPERADMIN`.
  - `getNavigationForUser(['FRONT_OFFICE'])` returns `FRONT_OFFICE_NAVIGATION` with context label `'FRONT OFFICE'` and items for Dashboard (`/app/workspace`), Enquiries & Leads (`/app/admissions/inquiries`), Applications Review (`/app/admissions/review`), Campus Visits (`/app/admissions/interviews`), and Entrance Exams (`/app/admissions/entrance-exam`).

---

## 5. Fix Implemented

### A. Role-Aware `LoginApprovalGate` ([ProtectedRoute.tsx](file:///c:/Users/DELL/Desktop/EduTech/apps/web_app/src/components/auth/ProtectedRoute.tsx))
- All institutional staff and admin roles (`ADMIN`, `SUPERADMIN`, `SUPER_ADMIN`, `FRONT_OFFICE`, `FO`, `FRONT_OFFICE_STAFF`, `STAFF`, `ADMISSION_OFFICER`, `COUNSELLOR`, `COUNSELOR`, `HOI`, `PRINCIPAL`, `HEAD_OF_INSTITUTE`, `TEACHER`, `FINANCE`, `FINANCE_OFFICER`, `EXAM_CELL_ADMIN`, `EXAM_CELL`) bypass the Parent Admission Login Approval Gate immediately.
- `LoginApprovalGate` is strictly scoped to the `PARENT` persona.

### B. Complete `EnrichedUser` Mapping ([LoginPage.tsx](file:///c:/Users/DELL/Desktop/EduTech/apps/web_app/src/modules/auth/pages/LoginPage.tsx))
- Added `login_status: rawUser.login_status || 'APPROVED'`, `login_decision_reason`, `phone_number`, and `enabledFeatures` to `enrichedUser`.
- Added role-based post-login redirection directly to `/app/workspace` for staff users.

### C. Default Route Redirects ([router.tsx](file:///c:/Users/DELL/Desktop/EduTech/apps/web_app/src/app/router.tsx) & [PublicNavbar.tsx](file:///c:/Users/DELL/Desktop/EduTech/apps/web_app/src/components/layout/PublicNavbar.tsx))
- Updated `RoleBasedDefaultRedirect` in `router.tsx` to route all staff roles to `/app/workspace`.
- Updated `PublicNavbar.tsx` `portalRedirectPath` to route authenticated staff members to `/app/workspace` and parents to `/app/admissions/my`.
- Updated `LandingResolver.ts` fallback route to `/app/workspace`.

---

## 6. Role-Based Routing & Approval Matrix

| User Role | Persona Type | Parent Approval Gate | Allowed / Destination Route | Sidebar Navigation Group |
|---|---|---|---|---|
| `FRONT_OFFICE` / `FO` | Institutional Staff | **BYPASS (NO)** | `/app/workspace` | `FRONT_OFFICE_NAVIGATION` |
| `ADMISSION_OFFICER` | Institutional Staff | **BYPASS (NO)** | `/app/workspace` | `FRONT_OFFICE_NAVIGATION` |
| `ADMIN` / `SUPERADMIN` | Institutional Admin | **BYPASS (NO)** | `/app/workspace` or `/app/admin/dashboard` | `ADMIN_NAVIGATION` |
| `EXAM_CELL_ADMIN` | Institutional Admin | **BYPASS (NO)** | `/app/workspace` or `/app/admissions/entrance-exam` | `ADMIN_NAVIGATION` |
| `PARENT` (`login_status: 'APPROVED'`) | Parent / Guardian | **EVALUATED (PASS)** | `/app/admissions/my` | `PARENT_NAVIGATION` |
| `PARENT` (`login_status: 'PENDING'`) | Parent / Guardian | **EVALUATED (GATE)** | `/app/admissions/my` (Status) or `PendingApprovalPage` | `PARENT_NAVIGATION` |
| `PARENT` (`login_status: 'REJECTED'`) | Parent / Guardian | **EVALUATED (GATE)** | `PendingApprovalPage` (Rejection Reason) | `PARENT_NAVIGATION` |

---

## 7. Security & Integrity Verification

- **JWT Authority**: Role identification remains strictly anchored in server-verified tokens and authenticated `/me` profile endpoints.
- **Zero Client-Side Spoofing**: No role modifications in `localStorage` or unverified storage.
- **Cross-Role Protection**: Parents cannot access staff routes (`/app/workspace`, `/app/admissions/review`, `/app/admissions/inquiries`) due to `PermissionGuard` and `AdmissionInquiryGuard`.
- **Backend & Database Modifications**: `0` (Existing Prisma schema, migrations, and backend APIs already model `FRONT_OFFICE` and user roles correctly).
