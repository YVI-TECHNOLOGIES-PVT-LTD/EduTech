# Backend Role-Based Architecture Discovery — Read-Only Audit Report

**Target System:** EduTrack ERP Backend (`apps/backend`)  
**Workspace:** `d:\EduTech\EduTech`  
**Audit Type:** Read-Only Source Code & Live Database Architecture Discovery  
**Audit Date:** November 11, 2026  
**Status:** Complete — Zero Code/Database Modifications Performed

---

## Table of Contents

1. [Section A: Executive Summary](#section-a-executive-summary)
2. [Section B: Authentication Architecture](#section-b-authentication-architecture)
3. [Section C: Database Role Inventory](#section-c-database-role-inventory)
4. [Section D: Permission Architecture](#section-d-permission-architecture)
5. [Section E: Admin Access Matrix](#section-e-admin-access-matrix)
6. [Section F: Teacher Access Matrix](#section-f-teacher-access-matrix)
7. [Section G: Parent Access Matrix](#section-g-parent-access-matrix)
8. [Section H: API Authorization Inventory](#section-h-api-authorization-inventory)
9. [Section I: Tenant Security Assessment](#section-i-tenant-security-assessment)
10. [Section J: Frontend / Backend Authorization Consistency](#section-j-frontend--backend-authorization-consistency)
11. [Section K: Security Findings](#section-k-security-findings)
12. [Section L: Missing Implementation](#section-l-missing-implementation)
13. [Section M: Recommended Next Steps](#section-m-recommended-next-steps)

---

## Section A: Executive Summary

This read-only audit provides an exhaustive technical analysis of the authentication, role management, permission system, and API authorization architecture across EduTrack ERP. The audit was conducted strictly against the authoritative source of truth: `apps/backend/prisma/schema.prisma`, live PostgreSQL database state, and the active backend implementation (`apps/backend/src`).

### Key Architectural Realities

1. **Pure In-Memory / Code-Defined Permissions (No DB Permissions Table):**
   Neither the database (`aws-0-ap-northeast-1.pooler.supabase.com:6543`) nor `schema.prisma` contains `permissions` or `role_permissions` tables. The Prisma models define only `roles` and `user_roles`. All 145 permissions exist strictly as TypeScript string constants in `apps/backend/src/rbac/permissions.ts`. Permissions are dynamically constructed in memory on every request during session validation (`SessionService.validateSession`) via hardcoded role string matching.

2. **Database Role Identity vs. Canonical Role Mapping:**
   The database contains **13 distinct role names** across 61 organization-scoped records and 753 assigned user roles (out of 1,241 total users). The database role for system administrators is named **`Administrator`** (not `Admin`). A normalization pipeline in `apps/backend/src/rbac/role-normalization.ts` maps database role names into uppercase canonical enums (`Administrator` → `ADMIN`, `Super Admin` → `SUPERADMIN`, `Principal` → `HOI` / `PRINCIPAL`, `Admissions Officer`/`Receptionist` → `FRONT_OFFICE`, etc.).

3. **Autonomous Custom JWT Authentication (Not Supabase Auth):**
   Although Supabase PostgreSQL is used as the relational datastore, authentication is custom-built. `AuthService.login` validates user credentials using `NativePassword.compare` (supporting bcrypt, PBKDF2, and legacy plaintext fallback), signs custom HS256 JWT tokens using Node.js `crypto` with `JWT_SECRET`, and verifies incoming Bearer tokens using an in-memory 5-minute cached `SessionService`. Supabase GoTrue / Auth is completely bypassed.

4. **Security Gaps Identified:**
   - **CRITICAL Privilege Escalation:** `POST /api/v1/users/:userId/roles` is guarded by `UserPolicy.canManageRoles()`, which resolves to `PERMISSIONS.ADMISSION_REVIEW`. Staff roles such as `FRONT_OFFICE`, `RECEPTIONIST`, and `COUNSELLOR` possess this permission and can assign `Administrator` or `Super Admin` roles to any account.
   - **HIGH Direct Object Reference (IDOR) & Cross-Tenant Leaks:** Endpoints such as `GET /api/v1/students/:id/timeline`, `GET /api/v1/students/:id/parents`, and `GET /api/v1/applications/:id/timeline` lack parent-child linkage verification and omit `org_id` filters in Prisma queries, allowing any authenticated parent to view personal details, contact information, and timelines of students and applicants across any organization.
   - **PostgreSQL Row Level Security (RLS) Bypass:** Prisma connects directly to PostgreSQL using database administrative credentials (`DATABASE_URL`). RLS policies are completely bypassed in application query execution.

---

## Section B: Authentication Architecture

### 1. Step-by-Step Login-to-Request Execution Flow

```text
[ Client (Browser / Postman) ]
             │
             │ 1. POST /api/auth/login or /api/v1/auth/login { email, password }
             ▼
[ apps/backend/src/auth/auth.controller.ts: AuthController.login ]
             │
             │ 2. Delegate to AuthService.login(dto)
             ▼
[ apps/backend/src/auth/auth.service.ts: AuthService.login ]
             │
             │ 3. User Lookup:
             │    prisma.users.findFirst({ where: { email, status: 'active' } })
             │
             │ 4. Credential Verification:
             │    NativePassword.compare(password, user.password_hash)
             │    (Bcrypt -> PBKDF2 -> Fallback Plaintext Comparison)
             │
             │ 5. Role Resolution:
             │    prisma.user_roles.findMany({ where: { user_id }, include: { roles: true } })
             │    Normalize role strings via normalizeRoleName()
             │    Auto-detect Parent: if prisma.parents.findFirst({ where: { user_id } }) exists,
             │    append 'PARENT' (and 'ENROLLED_PARENT' if linked child has active enrollment).
             │
             │ 6. Token Generation:
             │    NativeJwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
             │    NativeJwt.sign(refreshPayload, JWT_REFRESH_SECRET, { expiresIn: '7d' })
             ▼
[ HTTP 200 Response: { token, refreshToken, user: { id, email, roles, permissions } } ]
```

### 2. Authenticated Request Authorization Flow

```text
[ Incoming Request with Header: Authorization: Bearer <token> ]
             │
             │ 1. Intercepted by authenticate middleware
             ▼
[ apps/backend/src/auth/auth.middleware.ts: authenticate ]
             │
             │ 2. Delegate to SessionService.validateSession(token)
             ▼
[ apps/backend/src/auth/session.service.ts: SessionService.validateSession ]
             │
             │ 3. Verify JWT signature via NativeJwt.verify(token, JWT_SECRET)
             │ 4. Check in-memory sessionCache (5-minute TTL)
             │ 5. Re-fetch user status and user_roles from Prisma to ensure account active
             │ 6. If user has 0 active roles -> Throw 401 Unauthorized (Fail-Closed)
             │ 7. Construct in-memory permission Set based on normalized roles
             │ 8. Attach user context to Request: req.context = { user, token }
             ▼
[ apps/backend/src/auth/auth.middleware.ts: checkLoginApproval ]
             │
             │ 9. Verify req.context.user.login_status !== 'rejected'
             ▼
[ Route Handler / RBAC Guard: checkPermission(requiredPermission) ]
             │
             │ 10. apps/backend/src/rbac/rbac.middleware.ts:
             │     - If role is 'SUPERADMIN' -> Allow unconditionally
             │     - If role is 'PARENT' and permission is admission self-service -> Allow
             │     - If user.permissions.includes(requiredPermission) -> Allow
             │     - Evaluate role fallback rules (Academic/Fees/Teacher) -> Allow / 403 Forbidden
             ▼
[ Controller Execution & Response ]
```

### 3. Detailed Component Breakdown

| Step                           | Mechanism / Component                                | Source File & Functions                                                                                                                                                                                                                                 | Verification Evidence                                                                                                                                                                                                   |
| ------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Credential Submission**   | HTTP POST `/api/auth/login` and `/api/v1/auth/login` | [`apps/backend/src/auth/auth.routes.ts`](file:///d:/EduTech/EduTech/apps/backend/src/auth/auth.routes.ts#L9)<br>[`apps/backend/src/auth/auth.controller.ts`](file:///d:/EduTech/EduTech/apps/backend/src/auth/auth.controller.ts#L10-L60)               | Express routing mounted in `routes.ts` lines 91-92. Accepts `{ email, password }`.                                                                                                                                      |
| **2. User Lookup**             | Prisma query against `users` table                   | [`apps/backend/src/auth/auth.service.ts`](file:///d:/EduTech/EduTech/apps/backend/src/auth/auth.service.ts#L48-L62)                                                                                                                                     | `prisma.users.findFirst({ where: { email: normalizedEmail, status: 'active' } })`. Checks active status directly.                                                                                                       |
| **3. Password Validation**     | Multi-algorithm comparison utility                   | [`apps/backend/src/auth/crypto.utils.ts`](file:///d:/EduTech/EduTech/apps/backend/src/auth/crypto.utils.ts#L80-L102)                                                                                                                                    | `NativePassword.compare()` tests: (1) bcrypt hash prefix (`$2a$`, `$2b$`, `$2y$`), (2) PBKDF2 (`salt:hash`), (3) fallback plaintext string equality (`password === hash`).                                              |
| **4. Role Resolution**         | Prisma relational join on `user_roles` + `roles`     | [`apps/backend/src/auth/auth.service.ts`](file:///d:/EduTech/EduTech/apps/backend/src/auth/auth.service.ts#L82-L135)<br>[`apps/backend/src/rbac/role-normalization.ts`](file:///d:/EduTech/EduTech/apps/backend/src/rbac/role-normalization.ts#L25-L65) | Tries Supabase RPC `user_roles` with `role_permissions`, catches failure (table absent), falls back to `prisma.user_roles.findMany({ where: { user_id, is_active: true } })`. Strings mapped via `normalizeRoleName()`. |
| **5. Context Resolution**      | Tenant (`org_id`, `school_id`) extraction            | [`apps/backend/src/auth/auth.service.ts`](file:///d:/EduTech/EduTech/apps/backend/src/auth/auth.service.ts#L137-L148)                                                                                                                                   | Extracts `org_id` from user record, defaults `school_id = org_id`. Attached to user session payload.                                                                                                                    |
| **6. Token Minting**           | Node.js `crypto` HMAC-SHA256 signer                  | [`apps/backend/src/auth/crypto.utils.ts`](file:///d:/EduTech/EduTech/apps/backend/src/auth/crypto.utils.ts#L12-L55)                                                                                                                                     | Custom `NativeJwt.sign()` generates standard base64url encoded header, payload, signature. Access token expires in 24h; Refresh token in 7d.                                                                            |
| **7. Request Auth Middleware** | Bearer token extraction & verification               | [`apps/backend/src/auth/auth.middleware.ts`](file:///d:/EduTech/EduTech/apps/backend/src/auth/auth.middleware.ts#L15-L55)<br>[`apps/backend/src/auth/session.service.ts`](file:///d:/EduTech/EduTech/apps/backend/src/auth/session.service.ts#L45-L115) | Extracts header `Authorization: Bearer <token>`. Calls `sessionService.validateSession()`. In-memory cache hit short-circuits DB query. Populates `req.context`.                                                        |
| **8. Logout & Expiration**     | Client-side disposal (Server No-Op)                  | [`apps/backend/src/auth/auth.controller.ts`](file:///d:/EduTech/EduTech/apps/backend/src/auth/auth.controller.ts#L76-L78)                                                                                                                               | `AuthController.logout()` returns `{ success: true, message: 'Logged out successfully' }`. No token blacklist, Redis, or cache invalidation exists. Tokens remain valid until 24h expiration.                           |

---

## Section C: Database Role Inventory

### 1. Database Role Catalog & Canonical Mapping

Live inspection of PostgreSQL table `roles` across all organizations revealed **13 distinct role names** represented in **61 organization-scoped records**. In `schema.prisma`, roles are uniquely scoped by `@@unique([org_id, role_name])`.

| Database Role Name (`roles.role_name`) | Role Record IDs (Sample)                                                                             | Canonical Application Role (`normalizeRoleName`) | Assigned User Count (`user_roles`) | Active Status               | Actual Application Access & Responsibilities                                                                                                                                         |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------: | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`Administrator`**                    | `b08493cf-87b4-4b53-911e-b816ba794711` (ORG-001)<br>`4f085ec3-6331-482d-88fd-e999c011e4f4` (ORG-002) | `ADMIN`                                          |                                  5 | Active (`is_active = true`) | Full administrative access: Academic setups, fees & finance management, staff management, student enrollments, system auditing. _(Note: Role name is `Administrator`, NOT `Admin`)._ |
| **`Super Admin`**                      | `7d730a91-49fa-47cb-92a0-4598d975da64` (ORG-001)<br>`ef53cfb9-6cb8-47a3-b3c0-be3497e61a20` (ORG-002) | `SUPERADMIN`                                     |                                  5 | Active (`is_active = true`) | Unrestricted system-wide bypass across all routes via `checkPermission` override. Organization management.                                                                           |
| **`Teacher`**                          | `46e4fc34-ebce-4d51-87a4-e918510a7479` (ORG-001)<br>`8011c750-cf2a-4c28-9fdc-f37b9854737b` (ORG-002) | `TEACHER`                                        |                                 71 | Active (`is_active = true`) | Teacher workspace (`/v1/academic/teacher/*`): assigned classes, subjects, timetable, curriculum, lesson plans. Read-only academic access.                                            |
| **`Parent`**                           | `da388062-841f-4f24-aa69-c29dcabfa356` (ORG-001)<br>`e8db50fb-ef27-4632-a521-7dd2efb6d92f` (ORG-002) | `PARENT`                                         |                                301 | Active (`is_active = true`) | Parent portal: view linked children, self-service admission applications, fee payments, receipt downloads, communication feeds, helpdesk tickets.                                    |
| **`PARENT`**                           | `2c4df7ad-d28c-4c6d-96fb-64b1975e5330` (ORG-001)                                                     | `PARENT`                                         |                                 55 | Active (`is_active = true`) | Duplicate uppercase variant seeded in ORG-001. Functions identically to `Parent` after normalization.                                                                                |
| **`Principal`**                        | `85a1a1db-75ae-4933-ae6d-d195f269a8e9` (ORG-001)                                                     | `HOI` / `PRINCIPAL`                              |                                 12 | Active (`is_active = true`) | Academic leadership dashboard, admission reviews, academic structure oversight.                                                                                                      |
| **`Front Office`**                     | `68624237-773a-4efb-aa90-b146e2978051` (ORG-001)                                                     | `FRONT_OFFICE`                                   |                                  5 | Active (`is_active = true`) | Admissions desk, lead capture, visitor management, student inquiries.                                                                                                                |
| **`Receptionist`**                     | `04d6e9f6-1361-4c12-9cbb-9273f5a0fb70` (ORG-001)                                                     | `FRONT_OFFICE`                                   |                                 16 | Active (`is_active = true`) | Lead capture, visitor check-in, initial enquiry handling.                                                                                                                            |
| **`Admissions Officer`**               | `f6aee981-b586-4f51-b0fe-25e2972986f3` (ORG-001)                                                     | `FRONT_OFFICE`                                   |                                  6 | Active (`is_active = true`) | Application review, assessment scheduling, document verification, enrollment processing.                                                                                             |
| **`Counsellor`**                       | `3b5443fa-0d60-49c0-9a25-a130ae0bc646` (ORG-001)                                                     | `COUNSELLOR`                                     |                                 11 | Active (`is_active = true`) | Student counseling logs, admission lead interactions.                                                                                                                                |
| **`Finance`**                          | `5ca268df-469b-4e00-a579-242858823f6d` (ORG-001)                                                     | `FINANCE_OFFICER`                                |                                 14 | Active (`is_active = true`) | Fee structures, fee collection, invoice generation, payment transaction reconciliation.                                                                                              |
| **`HR`**                               | `c21d46b7-cbef-4573-b541-fcf05a61bfd1` (ORG-001)                                                     | `HR`                                             |                                  7 | Active (`is_active = true`) | Staff records, teacher profile assignments, department management.                                                                                                                   |
| **`Student`**                          | `e1f98d41-118f-4cfc-aee4-3a216443c22f` (ORG-001)                                                     | `STUDENT`                                        |                                250 | Active (`is_active = true`) | Student records exist in database. Student login is outside current application scope (fail-closed in portal).                                                                       |

---

## Section D: Permission Architecture

### 1. Mechanism of Definition, Assignment, and Enforcement

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 1. DEFINITION: apps/backend/src/rbac/permissions.ts                    │
│    - Pure TypeScript constants object (145 permission strings)          │
│    - No permissions or role_permissions table in PostgreSQL           │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. INJECTION: apps/backend/src/auth/session.service.ts                  │
│    - SessionService.validateSession() executes hardcoded 'if' branches │
│    - Matches user's normalized roles (e.g., ['ADMIN', 'TEACHER'])     │
│    - Injects permissions into req.context.user.permissions Set         │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. ENFORCEMENT: apps/backend/src/rbac/rbac.middleware.ts               │
│    - checkPermission(requiredPermission) checks:                       │
│      a) SUPERADMIN bypass                                              │
│      b) PARENT admission self-service bypass                           │
│      c) req.context.user.permissions.includes(requiredPermission)      │
│      d) Hardcoded role fallback logic (Academic, Teacher, Fees)        │
└────────────────────────────────────────────────────────────────────────┘
```

### 2. Operational Roles Permission Matrix

| Implemented Permission Key | Permission String Code         | Admin (`ADMIN`) | Teacher (`TEACHER`) | Parent (`PARENT`) | Assignment Source & Implementation Reality                                                       |
| -------------------------- | ------------------------------ | :-------------: | :-----------------: | :---------------: | ------------------------------------------------------------------------------------------------ |
| `ADMIN_DASHBOARD_VIEW`     | `admin.dashboard.view`         |     **YES**     |         NO          |        NO         | Hardcoded in `session.service.ts` line 161 for `ADMIN_DASHBOARD_ROLES`.                          |
| `FACULTY_DASHBOARD_VIEW`   | `faculty.dashboard.view`       |     **YES**     |       **YES**       |        NO         | Hardcoded in `session.service.ts` lines 166-172 for `TEACHER`, `FACULTY`.                        |
| `PARENT_DASHBOARD_VIEW`    | `parent.dashboard.view`        |       NO        |         NO          |      **YES**      | Hardcoded in `session.service.ts` line 140 for `PARENT`.                                         |
| `ACADEMIC_SETUP`           | `academic.setup`               |     **YES**     |         NO          |        NO         | Hardcoded in `session.service.ts` line 254 for `ADMIN`. Enables year/grade/subject creation.     |
| `ACADEMIC_VIEW`            | `academic.view`                |     **YES**     |       **YES**       |        NO         | Injected for `ADMIN`; Evaluated via fallback in `rbac.middleware.ts` line 84 for `TEACHER`.      |
| `TIMETABLE_VIEW`           | `timetable.view`               |     **YES**     |       **YES**       |        NO         | Evaluated via fallback in `rbac.middleware.ts` line 84 for `TEACHER`.                            |
| `CLASS_VIEW`               | `class.view`                   |     **YES**     |       **YES**       |        NO         | Evaluated via fallback in `rbac.middleware.ts` line 84 for `TEACHER`.                            |
| `SECTION_VIEW`             | `section.view`                 |     **YES**     |       **YES**       |        NO         | Evaluated via fallback in `rbac.middleware.ts` line 84 for `TEACHER`.                            |
| `FEES_VIEW`                | `fees.view`                    |     **YES**     |         NO          |        NO         | Injected for `ADMIN`; Blocked for Teacher; Parents use dedicated `/v1/fees/my` endpoints.        |
| `FEES_STRUCTURE_MANAGE`    | `fees.structure.manage`        |     **YES**     |         NO          |        NO         | Hardcoded in `session.service.ts` line 249 for `ADMIN`.                                          |
| `FEES_PAYMENT_COLLECT`     | `fees.payment.collect`         |     **YES**     |         NO          |        NO         | Hardcoded in `session.service.ts` line 237 for `ADMIN`.                                          |
| `FEES_PAY`                 | `fees.payment.view`            |     **YES**     |         NO          |      **YES**      | Hardcoded in `session.service.ts` line 150 for `PARENT`.                                         |
| `APPLICATION_CREATE`       | `admission.application.create` |     **YES**     |         NO          |      **YES**      | Hardcoded in `session.service.ts` line 135 for `PARENT` (self-service).                          |
| `APPLICATION_VIEW`         | `admission.application.view`   |     **YES**     |         NO          |      **YES**      | Hardcoded in `session.service.ts` line 134 for `PARENT`.                                         |
| `ADMISSION_VIEW_SELF`      | `admission.view_own`           |     **YES**     |         NO          |      **YES**      | Hardcoded in `session.service.ts` line 132 for `PARENT`.                                         |
| `ADMISSION_REVIEW`         | `admission.review`             |     **YES**     |         NO          |        NO         | Injected in `session.service.ts` lines 191-215 for Admin/Front Office/Faculty (Teacher omitted). |
| `STUDENT_CREATE`           | `STUDENT_CREATE`               |     **YES**     |         NO          |        NO         | Hardcoded in `session.service.ts` line 232 for `ADMIN`.                                          |
| `STUDENT_VIEW`             | `STUDENT_VIEW`                 |     **YES**     |         NO          |        NO         | Hardcoded in `session.service.ts` line 233 for `ADMIN`.                                          |
| `STUDENT_ASSIGN_SECTION`   | `STUDENT_ASSIGN_SECTION`       |     **YES**     |         NO          |        NO         | Hardcoded in `session.service.ts` line 235 for `ADMIN`.                                          |
| `COMMUNICATION_VIEW`       | `communication.view`           |     **YES**     |         NO          |      **YES**      | Hardcoded in `session.service.ts` line 153 for `PARENT`.                                         |
| `HELPDESK_VIEW`            | `helpdesk.view`                |     **YES**     |         NO          |      **YES**      | Hardcoded in `session.service.ts` line 154 for `PARENT`.                                         |

### 3. Critical Permission Architecture Discrepancies

1. **The Teacher Permission Omission Bug (`session.service.ts` lines 191–241):**
   In `apps/backend/src/auth/session.service.ts`, lines 165–172 explicitly check `['TEACHER', 'FACULTY']` to grant `DASHBOARD_VIEW_FACULTY` and `faculty.dashboard.view`. However, in the subsequent broad permissions block (lines 191–241), the role array contains `'FACULTY'`, `'STAFF'`, `'FRONT_OFFICE'`, etc., but **omits `'TEACHER'`**. Because database role `'Teacher'` normalizes to `'TEACHER'`, active teachers receive **only 2 permissions** in their session (`DASHBOARD_VIEW_FACULTY`, `faculty.dashboard.view`).
2. **The Middleware Bypass Compensation (`rbac.middleware.ts` lines 80–90):**
   To compensate for the missing session permissions, `checkPermission` in `apps/backend/src/rbac/rbac.middleware.ts` implements a hardcoded role fallback:
   ```typescript
   // apps/backend/src/rbac/rbac.middleware.ts (Lines 80-90)
   const academicReadOnly = [
     PERMISSIONS.ACADEMIC_VIEW,
     PERMISSIONS.CLASS_VIEW,
     PERMISSIONS.SECTION_VIEW,
     PERMISSIONS.TIMETABLE_VIEW,
   ];
   if (
     academicReadOnly.includes(requiredPermission as any) &&
     roles.some((r: string) => ['FACULTY', 'TEACHER'].includes(r))
   ) {
     return next();
   }
   ```
   This dual-layer architecture means that checking `req.context.user.permissions` directly produces false negatives unless routed through `checkPermission`.
3. **No Inheritance & Fail-Closed Behavior:**
   Roles do not inherit permissions hierarchically. If a user has no active roles in `user_roles`, `SessionService.validateSession` throws an `UnauthorizedError('Access denied: User has no active role assignments in this organization')`, closing access completely.

---

## Section E: Admin Access Matrix

Detailed audit of capabilities accessible to users possessing the **`Administrator`** (canonical `ADMIN`) role:

| Operational Functional Area      | Backend Route(s)                                                                                                         | Guard Mechanism                                             | Backend Implementation Status | Concrete Operational Capabilities & Observations                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Dashboard Access**             | `GET /api/admin/dashboard`<br>`GET /api/dashboard/summary`<br>`GET /api/dashboard/timeline`                              | `checkPermission(PERMISSIONS.ADMIN_DASHBOARD_VIEW)`         | **Implemented & Accessible**  | Comprehensive analytics: total student counts, lead conversions, active applications, revenue aggregations.                                |
| **Academic Year Management**     | `GET /api/academic-years`<br>`POST /api/academic-years`<br>`GET /api/v1/academic/years`<br>`POST /api/v1/academic/years` | Global Auth & `checkPermission(PERMISSIONS.ACADEMIC_SETUP)` | **Implemented & Accessible**  | Can create, list, and activate academic sessions and manage year dates.                                                                    |
| **Grade & Section Management**   | `POST /api/v1/academic/grades`<br>`POST /api/v1/academic/sections`<br>`GET /api/v1/academic/sections`                    | `checkPermission(PERMISSIONS.ACADEMIC_SETUP)`               | **Implemented & Accessible**  | Full CRUD on school grades, academic year grade mappings, and section capacity configurations.                                             |
| **Subject Management**           | `GET /api/v1/academic/subjects`<br>`POST /api/v1/academic/subjects`                                                      | `checkPermission(PERMISSIONS.ACADEMIC_SETUP)`               | **Implemented & Accessible**  | View and register academic subjects, course codes, and department affiliations.                                                            |
| **Teacher & Faculty Management** | `GET /api/v1/staff`<br>`POST /api/v1/staff`<br>`PATCH /api/v1/staff/:id`                                                 | `checkPermission(StaffPolicy.canManageStaff())`             | **Implemented & Accessible**  | Create staff profiles, designate faculty departments, assign designations, manage staff employment status.                                 |
| **Faculty Assignments**          | `POST /api/v1/academic/faculty-assignments`<br>`DELETE /api/v1/academic/faculty-assignments/:id`                         | `checkPermission(PERMISSIONS.ACADEMIC_SETUP)`               | **Implemented & Accessible**  | Assign faculty to sections and subjects (`section_subject_faculty_assignments`).                                                           |
| **Timetable Management**         | `POST /api/v1/academic/timetable/slots`<br>`PUT /api/v1/academic/timetable/bulk`                                         | `checkPermission(PERMISSIONS.ACADEMIC_SETUP)`               | **501 Unsupported**           | Endpoints exist in `academic.routes.ts` (lines 142-156) but controllers return HTTP 501 ("Timetable generation engine not yet supported"). |
| **Calendar Management**          | `GET /api/v1/academic/calendar/events`                                                                                   | `checkPermission(PERMISSIONS.ACADEMIC_VIEW)`                | **Implemented & Accessible**  | Read school calendar events, holidays, and examination schedules. Event creation write endpoints are missing.                              |
| **Curriculum Management**        | `GET /api/v1/academic/curriculum`<br>`POST /api/v1/academic/curriculum`                                                  | `checkPermission(PERMISSIONS.ACADEMIC_SETUP)`               | **Implemented & Accessible**  | Define syllabus structures, chapters, and expected learning competencies.                                                                  |
| **Lesson Plan Monitoring**       | `GET /api/v1/academic/lesson-plans`<br>`POST /api/v1/academic/lesson-plans`                                              | `checkPermission(PERMISSIONS.ACADEMIC_SETUP)`               | **Partially Implemented**     | Read and search lesson plans submitted by teachers. Approval workflow state transitions are not implemented.                               |
| **Learning Resources**           | `GET /api/v1/academic/resources`<br>`POST /api/v1/academic/resources`                                                    | `checkPermission(PERMISSIONS.ACADEMIC_SETUP)`               | **Implemented & Accessible**  | Upload and curate digital resources, links, and documents mapped to grade-subject curricula.                                               |
| **Student Records**              | `GET /api/v1/students`<br>`POST /api/v1/students`<br>`PATCH /api/v1/students/:id`                                        | `checkPermission(StudentPolicy.canViewAll())`               | **Implemented & Accessible**  | Search and create students, manage enrollment records, assign class sections, link parents.                                                |
| **Parent Records**               | `GET /api/v1/parents`<br>`POST /api/v1/parents`<br>`PATCH /api/v1/parents/:id`                                           | `checkPermission(ParentPolicy.canManageParents())`          | **Implemented & Accessible**  | Search parent directory, update emergency contacts, manage parent portal access accounts.                                                  |
| **Admissions & Leads**           | `GET /api/v1/leads`<br>`GET /api/v1/applications`<br>`POST /api/v1/applications/:id/decision`                            | `checkPermission(AdmissionPolicy.canManageDecisions())`     | **Implemented & Accessible**  | Full pipeline: Lead conversion, CRM status updates, entrance assessment scoring, enrollment finalization.                                  |
| **Finance & Fees**               | `GET /api/v1/fees/structures`<br>`POST /api/v1/fees/structures`<br>`POST /api/v1/fees/collect`                           | `checkPermission(PERMISSIONS.FEES_VIEW)` & Role Fallback    | **Implemented & Accessible**  | Configure fee components, assign fee structures to student cohorts, process offline payments, generate receipts.                           |
| **Communication & Feeds**        | `POST /api/v1/communication/posts`<br>`GET /api/v1/communication/feeds`                                                  | `authenticate` & `resolveTenantMiddleware`                  | **Implemented & Accessible**  | Broadcast campus-wide notices, create engagement polls, manage helpdesk escalation policies.                                               |

---

## Section F: Teacher Access Matrix

Detailed audit of capabilities accessible to users possessing the **`Teacher`** (canonical `TEACHER`) role:

| Operational Area                 | Endpoints & Routes                                                                          | Guard & Resolution Logic                                                        | Implementation Status         | Scoping Mechanism & Data Exposure Risk                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Teacher Login & Session**      | `POST /api/auth/login`<br>`GET /api/auth/me`                                                | Authenticates against `users` + `user_roles`. Normalizes `Teacher` → `TEACHER`. | **Implemented & Accessible**  | Session injected with `DASHBOARD_VIEW_FACULTY`. Profile resolves `staff_id` by matching `staff.user_id = user.id`.            |
| **Teacher Dashboard**            | `GET /api/v1/academic/teacher/dashboard`                                                    | `checkPermission(PERMISSIONS.FACULTY_DASHBOARD_VIEW)`                           | **Implemented & Accessible**  | Scoped strictly to authenticated teacher's `staff_id`. Returns today's classes, active subject count, assigned student count. |
| **Assigned Sections**            | `GET /api/v1/academic/teacher/classes`                                                      | `checkPermission(PERMISSIONS.FACULTY_DASHBOARD_VIEW)`                           | **Implemented & Accessible**  | Queries `section_subject_faculty_assignments` where `staff_id = teacherStaffId`. Prevents viewing unassigned sections.        |
| **Subject Assignments**          | `GET /api/v1/academic/teacher/subjects`                                                     | `checkPermission(PERMISSIONS.FACULTY_DASHBOARD_VIEW)`                           | **Implemented & Accessible**  | Scoped to assigned subjects via `section_subject_faculty_assignments`.                                                        |
| **Timetable Access**             | `GET /api/v1/academic/teacher/timetable`                                                    | `checkPermission(PERMISSIONS.FACULTY_DASHBOARD_VIEW)`                           | **Implemented & Accessible**  | Scoped to `staff_id`. Returns period schedules where the teacher is designated faculty.                                       |
| **Curriculum Access**            | `GET /api/v1/academic/teacher/curriculum`<br>`GET /api/v1/academic/curriculum`              | `checkPermission(PERMISSIONS.ACADEMIC_VIEW)` (via fallback)                     | **Implemented & Accessible**  | Can browse curriculum syllabus for assigned grades and subjects. Mutation blocked (`ACADEMIC_SETUP` required).                |
| **Lesson Plan Access**           | `GET /api/v1/academic/teacher/lesson-plans`<br>`POST /api/v1/academic/teacher/lesson-plans` | `checkPermission(PERMISSIONS.FACULTY_DASHBOARD_VIEW)`                           | **Implemented & Accessible**  | Teachers can create and manage their own lesson plans. Filtered by `staff_id`.                                                |
| **Activities & Differentiation** | Stored inside lesson plan JSON payload                                                      | Included in Lesson Plan DTO                                                     | **Partially Implemented**     | Handled as embedded fields within the lesson plan model rather than standalone entities.                                      |
| **Exit Tickets**                 | Embedded within Lesson Plan JSON                                                            | No dedicated relational model                                                   | **Partially Implemented**     | Stored within lesson plan structures. Standalone student response collection is not implemented.                              |
| **Resource Access**              | `GET /api/v1/academic/resources`                                                            | `checkPermission(PERMISSIONS.ACADEMIC_VIEW)` (via fallback)                     | **Implemented & Accessible**  | Teachers can view digital learning resources. Creating resources returns 403 Forbidden (`ACADEMIC_SETUP` required).           |
| **Calendar Access**              | `GET /api/v1/academic/calendar/events`                                                      | `checkPermission(PERMISSIONS.ACADEMIC_VIEW)` (via fallback)                     | **Implemented & Accessible**  | Can view academic calendar and holiday schedule across the tenant.                                                            |
| **Student Roster Access**        | `GET /api/v1/academic/teacher/classes/:id/students`                                         | `checkPermission(PERMISSIONS.FACULTY_DASHBOARD_VIEW)`                           | **Implemented & Accessible**  | Resolves class roster for sections assigned to this teacher.                                                                  |
| **Attendance & Grading Entry**   | `POST /api/v1/academic/attendance`<br>`POST /api/v1/academic/grades/records`                | N/A                                                                             | **Not Implemented (Missing)** | Write endpoints for daily student attendance marking and gradebook mark entry do not exist in the backend.                    |

### Teacher Data Scoping Architecture

Teacher scoping is anchored to `staff_id`:

1. `TeacherAcademicService.resolveStaffId(userId, orgId)` queries `prisma.staff.findFirst({ where: { user_id: userId, org_id: orgId } })`.
2. All teacher workspace queries (`/v1/academic/teacher/*`) enforce `where: { staff_id: staffId }` on `section_subject_faculty_assignments`.
3. If an endpoint in general academic management (`/v1/academic/sections`) is accessed, teachers see organization-wide section names, but cannot view student data without passing through the scoped teacher routes.

---

## Section G: Parent Access Matrix

Detailed audit of capabilities accessible to users possessing the **`Parent`** (canonical `PARENT`) role:

| Operational Area                                            | Endpoints & Routes                                                                                                                                                                                            | Guard & Resolution Logic                                                            | Implementation Status                | Ownership Enforcement & Security Assessment                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Parent Login & Session**                                  | `POST /api/auth/login`<br>`GET /api/auth/me`                                                                                                                                                                  | Authenticates against `users`. Auto-injects `PARENT` if record in `parents` exists. | **Implemented & Accessible**         | Injects `admission.view_own`, `parent.dashboard.view`, `fees.payment.view`, `communication.view`.                                                                             |
| **Child Discovery (Lifecycle)**                             | `GET /api/v1/parents/lifecycle`                                                                                                                                                                               | Resolves parent record via `parents.user_id = user.id`.                             | **Implemented & Accessible**         | Returns two cohorts: (1) Pre-admission applicants linked to parent's user/lead ID; (2) Enrolled children from `student_parents`.                                              |
| **Child Discovery (Helpdesk)**                              | `GET /api/parent/students`<br>`GET /api/v1/parent/students`                                                                                                                                                   | Calls `HelpdeskService.getParentChildren(userId)`                                   | **Implemented & Accessible**         | Correctly filters children via `student_parents` where `parents.user_id = userId`.                                                                                            |
| **Individual Child Profile**                                | `GET /api/v1/students/:id`                                                                                                                                                                                    | `assertParentCanAccessStudent(user, studentId)`                                     | **Implemented & Accessible**         | **Properly Enforced:** Verifies `student_parents` relation between authenticated parent and `student_id`. Returns 403 Forbidden on mismatch.                                  |
| **Student Timeline**                                        | `GET /api/v1/students/:id/timeline`                                                                                                                                                                           | `checkPermission(StudentPolicy.canView())`                                          | **CRITICAL IDOR LEAK**               | **VULNERABLE:** Calls `StudentAnalyticsService.getTimeline(id)`. Does NOT execute `assertParentCanAccessStudent`. Any parent can view another student's timeline.             |
| **Student Parents / Contacts**                              | `GET /api/v1/students/:id/parents`                                                                                                                                                                            | `checkPermission(StudentPolicy.canView())`                                          | **CRITICAL IDOR LEAK**               | **VULNERABLE:** Calls `StudentParentService.getParentsByStudent(id)`. Does NOT verify ownership. Returns parents' names, phones, and emails to any authenticated parent.      |
| **Child Academics (Exams, Attendance, Timetable, Results)** | `GET /api/v1/students/:id/exams`<br>`GET /api/v1/students/:id/attendance/summary`<br>`GET /api/v1/students/:id/timetable/today`<br>`GET /api/v1/students/:id/homework`<br>`GET /api/v1/students/:id/results`  | `checkPermission(StudentPolicy.canView())`                                          | **Stub Implementation (Dummy Data)** | Endpoints in `student.academics.controller.ts` return empty arrays (`[]`) or static dummy structures.                                                                         |
| **Child Fee Management**                                    | `GET /api/v1/fees/my`<br>`GET /api/v1/fees/my/students/:studentId`<br>`POST /api/v1/fees/my/payments/create-order`<br>`POST /api/v1/fees/my/payments/verify`<br>`GET /api/v1/fees/my/receipts/:transactionId` | `verifyParentChildAccess(user.id, studentId)`                                       | **Implemented & Securely Enforced**  | **Properly Enforced:** Enforces parent-child linkage via `student_parents`. Rejects unauthorized student fee inspection with 403 Forbidden. Razorpay order creation verified. |
| **Admission Applications**                                  | `GET /api/v1/admission/my`<br>`GET /api/v1/applications/mine`<br>`POST /api/v1/admission/apply`                                                                                                               | `checkPermission(PERMISSIONS.ADMISSION_VIEW_SELF)`                                  | **Implemented & Accessible**         | Scoped to `parent_id = parent.parent_id` or `lead_id = parent.lead_id`.                                                                                                       |
| **Admission Application Timeline**                          | `GET /api/v1/applications/:id/timeline`                                                                                                                                                                       | `checkPermission(AdmissionPolicy.canView())`                                        | **HIGH IDOR LEAK**                   | **VULNERABLE:** Does NOT check `parent_id`. Any parent can supply any `application_id` and view internal admission decisions and payment events.                              |
| **Communication Feeds**                                     | `GET /api/v1/communication/feeds`                                                                                                                                                                             | `authenticate` & `resolveTenantMiddleware`                                          | **Implemented & Accessible**         | Read-only access to published announcements and campus posts. Post reaction supported.                                                                                        |
| **Helpdesk Tickets**                                        | `POST /api/v1/communication/helpdesk/tickets`<br>`GET /api/v1/communication/helpdesk/tickets`                                                                                                                 | Scoped via `created_by = user.id`                                                   | **Implemented & Accessible**         | Parents can create tickets for their linked children and track ticket responses.                                                                                              |

---

## Section H: API Authorization Inventory

The following table catalogs all primary registered backend routes grouped by architectural module:

| Module                 | HTTP Method | API Path                                          | Authentication Required? | Role / Permission Guard                         |   Tenant Filter (`org_id`)    | Actual Access & Classification                                              |
| ---------------------- | ----------- | ------------------------------------------------- | :----------------------: | ----------------------------------------------- | :---------------------------: | --------------------------------------------------------------------------- |
| **System Probes**      | `GET`       | `/health`                                         |            NO            | None (Public)                                   |              NO               | Public system liveness probe.                                               |
| **System Probes**      | `GET`       | `/health/readiness`                               |            NO            | None (Public)                                   |              NO               | Public database connection probe.                                           |
| **System Probes**      | `GET`       | `/public/inspect-rbac`                            |            NO            | None (Public)                                   |              NO               | **VULNERABLE:** Unauthenticated leak of all database roles and sample user. |
| **Auth (Public)**      | `POST`      | `/api/auth/login`                                 |            NO            | None (Public)                                   |     Scoped by user lookup     | Public login endpoint.                                                      |
| **Auth (Public)**      | `POST`      | `/api/auth/refresh`                               |            NO            | None (Public)                                   |       Via refresh token       | Public token refresh.                                                       |
| **Auth (Public)**      | `POST`      | `/api/auth/register`                              |            NO            | None (Public)                                   |    Body `org_id` / default    | Parent self-registration.                                                   |
| **Auth (Protected)**   | `POST`      | `/api/auth/logout`                                |         **YES**          | `authenticate`                                  |              N/A              | Authenticated logout (No-op token revocation).                              |
| **Auth (Protected)**   | `GET`       | `/api/auth/me`                                    |         **YES**          | `authenticate`                                  |      Inherited from user      | Returns current authenticated user, roles, permissions.                     |
| **Dashboard**          | `GET`       | `/api/dashboard/summary`                          |         **YES**          | `authenticate` (No role guard)                  |         `user.org_id`         | **UNPROTECTED:** Any authenticated user views tenant-wide metrics.          |
| **Dashboard**          | `GET`       | `/api/dashboard/timeline`                         |         **YES**          | `authenticate` (No role guard)                  |         `user.org_id`         | **UNPROTECTED:** Any authenticated user views last 10 campus payments.      |
| **Dashboard**          | `GET`       | `/api/dashboard/parent/overview`                  |         **YES**          | `checkPermission(PARENT_DASHBOARD_VIEW)`        |  `user.org_id` + `parent_id`  | Scoped parent overview.                                                     |
| **Dashboard**          | `GET`       | `/api/admin/dashboard`                            |         **YES**          | `checkPermission(ADMIN_DASHBOARD_VIEW)`         |         `user.org_id`         | Admin executive analytics.                                                  |
| **Academic**           | `GET`       | `/api/v1/academic/years`                          |         **YES**          | `checkPermission(ACADEMIC_VIEW)`                |         `user.org_id`         | Admin, Teacher (via fallback).                                              |
| **Academic**           | `POST`      | `/api/v1/academic/years`                          |         **YES**          | `checkPermission(ACADEMIC_SETUP)`               |         `user.org_id`         | Admin only.                                                                 |
| **Academic**           | `POST`      | `/api/academic-years`                             |         **YES**          | `authenticate` (Missing guard)                  |         `user.org_id`         | **UNPROTECTED:** Any authenticated user can create academic years.          |
| **Academic**           | `GET`       | `/api/v1/academic/grades`                         |         **YES**          | `checkPermission(ACADEMIC_VIEW)`                |         `user.org_id`         | Admin, Teacher (via fallback).                                              |
| **Academic**           | `POST`      | `/api/v1/academic/grades`                         |         **YES**          | `checkPermission(ACADEMIC_SETUP)`               |         `user.org_id`         | Admin only.                                                                 |
| **Academic**           | `GET`       | `/api/v1/academic/sections`                       |         **YES**          | `checkPermission(ACADEMIC_VIEW)`                |         `user.org_id`         | Admin, Teacher (via fallback).                                              |
| **Academic**           | `POST`      | `/api/v1/academic/sections`                       |         **YES**          | `checkPermission(ACADEMIC_SETUP)`               |         `user.org_id`         | Admin only.                                                                 |
| **Academic**           | `GET`       | `/api/v1/academic/subjects`                       |         **YES**          | `checkPermission(ACADEMIC_VIEW)`                |         `user.org_id`         | Admin, Teacher (via fallback).                                              |
| **Academic**           | `POST`      | `/api/v1/academic/subjects`                       |         **YES**          | `checkPermission(ACADEMIC_SETUP)`               |         `user.org_id`         | Admin only.                                                                 |
| **Academic (Teacher)** | `GET`       | `/api/v1/academic/teacher/dashboard`              |         **YES**          | `checkPermission(FACULTY_DASHBOARD_VIEW)`       |  `user.org_id` + `staff_id`   | Teacher only (Scoped).                                                      |
| **Academic (Teacher)** | `GET`       | `/api/v1/academic/teacher/classes`                |         **YES**          | `checkPermission(FACULTY_DASHBOARD_VIEW)`       |  `user.org_id` + `staff_id`   | Teacher only (Scoped).                                                      |
| **Academic (Teacher)** | `GET`       | `/api/v1/academic/teacher/timetable`              |         **YES**          | `checkPermission(FACULTY_DASHBOARD_VIEW)`       |  `user.org_id` + `staff_id`   | Teacher only (Scoped).                                                      |
| **Academic (Teacher)** | `POST`      | `/api/v1/academic/teacher/lesson-plans`           |         **YES**          | `checkPermission(FACULTY_DASHBOARD_VIEW)`       |  `user.org_id` + `staff_id`   | Teacher only (Scoped).                                                      |
| **Students**           | `GET`       | `/api/v1/students`                                |         **YES**          | `checkPermission(StudentPolicy.canViewAll())`   |         `user.org_id`         | Admin, Admissions Desk.                                                     |
| **Students**           | `POST`      | `/api/v1/students`                                |         **YES**          | `checkPermission(StudentPolicy.canCreate())`    |         `user.org_id`         | Admin, Admissions Desk.                                                     |
| **Students**           | `GET`       | `/api/v1/students/:id`                            |         **YES**          | `checkPermission(StudentPolicy.canView())`      |      Enforced if Parent       | Admin; Parent (verified via `student_parents`).                             |
| **Students**           | `GET`       | `/api/v1/students/:id/timeline`                   |         **YES**          | `checkPermission(StudentPolicy.canView())`      |        **NONE (IDOR)**        | **VULNERABLE:** Accessible to any Parent; missing ownership & tenant check. |
| **Students**           | `GET`       | `/api/v1/students/:id/parents`                    |         **YES**          | `checkPermission(StudentPolicy.canView())`      |        **NONE (IDOR)**        | **VULNERABLE:** Accessible to any Parent; leaks guardian PII cross-tenant.  |
| **Parents**            | `GET`       | `/api/v1/parents`                                 |         **YES**          | `checkPermission(ParentPolicy.canViewAll())`    |         `user.org_id`         | Admin only.                                                                 |
| **Parents**            | `GET`       | `/api/v1/parents/lifecycle`                       |         **YES**          | `authenticate` (Parent Scoped)                  |           `user.id`           | Parent only (Returns linked applicants and children).                       |
| **Staff**              | `GET`       | `/api/v1/staff`                                   |         **YES**          | `checkPermission(StaffPolicy.canView())`        |         `user.org_id`         | Admin, HR.                                                                  |
| **Staff**              | `POST`      | `/api/v1/staff`                                   |         **YES**          | `checkPermission(StaffPolicy.canManageStaff())` |         `user.org_id`         | Admin, HR.                                                                  |
| **Admissions**         | `GET`       | `/api/v1/applications`                            |         **YES**          | `checkPermission(AdmissionPolicy.canViewAll())` |         `user.org_id`         | Admin, Admissions Desk.                                                     |
| **Admissions**         | `GET`       | `/api/v1/admission/my`                            |         **YES**          | `checkPermission(ADMISSION_VIEW_SELF)`          |    `user.id` / `parent_id`    | Parent self-service applications.                                           |
| **Admissions**         | `GET`       | `/api/v1/applications/:id/timeline`               |         **YES**          | `checkPermission(AdmissionPolicy.canView())`    |        **NONE (IDOR)**        | **VULNERABLE:** Accessible to any Parent; leaks application decisions.      |
| **Finance**            | `GET`       | `/api/v1/fees/structures`                         |         **YES**          | `checkPermission(FEES_VIEW)`                    |         `user.org_id`         | Admin, Finance Officer.                                                     |
| **Finance**            | `POST`      | `/api/v1/fees/structures`                         |         **YES**          | `checkPermission(FEES_STRUCTURE_MANAGE)`        |         `user.org_id`         | Admin, Finance Officer.                                                     |
| **Finance (Parent)**   | `GET`       | `/api/v1/fees/my`                                 |         **YES**          | `authenticate` & Parent Check                   | `user.id` + `student_parents` | Parent only (Scoped).                                                       |
| **Finance (Parent)**   | `POST`      | `/api/v1/fees/my/payments/create-order`           |         **YES**          | `authenticate` & Parent Check                   | `user.id` + `student_parents` | Parent only (Scoped).                                                       |
| **User Mgmt**          | `POST`      | `/api/v1/users/:userId/roles`                     |         **YES**          | `checkPermission(UserPolicy.canManageRoles())`  |      **NONE (CRITICAL)**      | **VULNERABLE:** Front Office / Staff can assign Admin/Super Admin roles.    |
| **Communication**      | `GET`       | `/api/v1/communication/feeds`                     |         **YES**          | `authenticate`                                  |         `user.org_id`         | Admin, Teacher, Parent.                                                     |
| **Helpdesk**           | `POST`      | `/api/v1/communication/helpdesk/categories`       |         **YES**          | `authenticate` (Missing guard)                  |         `user.org_id`         | **UNPROTECTED:** Any user can create ticket categories.                     |
| **Helpdesk**           | `POST`      | `/api/v1/communication/helpdesk/escalation/rules` |         **YES**          | `authenticate` (Missing guard)                  |         `user.org_id`         | **UNPROTECTED:** Any user can configure SLA escalation rules.               |

---

## Section I: Tenant Security Assessment

### 1. Tenant Context Origin & Authority

Tenant context originates from the authenticated user's record (`users.org_id` and `users.school_id`). When `SessionService.validateSession` runs, it extracts `org_id` and places it onto `req.context.user.org_id`. In `apps/backend/src/middlewares/tenant.middleware.ts`, `resolveTenantMiddleware` inspects:

1. `req.context?.user?.org_id`
2. `req.headers['x-tenant-id']` or `req.headers['x-org-id']`
3. Fallback database lookup if unauthenticated

**Authority Vulnerability:** In several routes (e.g. `apps/backend/src/routes.ts` lines 181-185, 248-254, 347-350), query parameters `req.query.school_id` or `req.query.org_id` are checked **before** or **alongside** the authenticated session. In unauthenticated or weakly-guarded routes, an attacker can supply an arbitrary `school_id` to inspect data belonging to another institution.

### 2. Prisma Connection & Row Level Security (RLS) Analysis

```text
Application Code (Prisma Queries)
             │
             │ Direct TCP Connection via pg / Prisma Engine
             ▼
Supabase Connection Pooler (Port 6543)
`aws-0-ap-northeast-1.pooler.supabase.com:6543`
User: postgres / service_role
             │
             │ Connects with DB Owner / Superuser Privileges
             ▼
PostgreSQL Engine
- RLS Policies exist on tables? YES.
- Do RLS Policies apply to this connection? NO (Bypassed by db owner / service_role).
```

**Key Architectural Finding:**
The backend connects directly to PostgreSQL via `DATABASE_URL` using database administrative credentials. Furthermore, `apps/backend/src/config/supabase.ts` instantiates the Supabase client using `env.SUPABASE_SERVICE_ROLE_KEY`. In PostgreSQL, table owners and `service_role` tokens explicitly bypass Row Level Security.
**Conclusion:** RLS provides **zero** isolation enforcement for queries executed by the backend. Tenant isolation depends 100% on manual `where: { org_id }` clauses in application queries. Whenever an engineer writes `prisma.students.findUnique({ where: { student_id } })` without an `org_id` check, institutional tenant boundaries are broken.

---

## Section J: Frontend / Backend Authorization Consistency

Comparison between frontend navigation guards (`apps/web_app/src/config/routes.ts`, `route_registry.tsx`, `ProtectedRoute.tsx`) and backend API route protection:

| Operational Area / Feature                         | Frontend Declared Roles (`route_registry.tsx`) | Backend Enforced Roles / Permissions | Alignment Status             | Identified Risk / Behavioral Discrepancy                                                                                              |
| -------------------------------------------------- | ---------------------------------------------- | ------------------------------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Executive Dashboard**                            | `['ADMIN', 'SUPERADMIN', 'HOI']`               | `PERMISSIONS.ADMIN_DASHBOARD_VIEW`   | **Aligned**                  | Both layers restrict access to leadership roles.                                                                                      |
| **Teacher Workspace**                              | `['TEACHER', 'FACULTY']`                       | `PERMISSIONS.FACULTY_DASHBOARD_VIEW` | **Aligned**                  | Landing resolver routes teachers directly to `/academic/teacher/dashboard`.                                                           |
| **Parent Portal**                                  | `['PARENT', 'ENROLLED_PARENT']`                | `PARENT` checks on child endpoints   | **Partially Aligned**        | UI restricts parent navigation, but backend exposes child timelines and contact info via direct API calls due to missing IDOR checks. |
| **Staff Directory Management**                     | `['ADMIN', 'HR']`                              | `PERMISSIONS.STAFF_MANAGE`           | **Aligned**                  | Non-administrative roles blocked both in UI and backend.                                                                              |
| **Academic Timetable Write**                       | Visible in Admin UI navigation                 | Returns HTTP 501 Unsupported         | **Frontend / Backend Drift** | UI displays timetable generation options, but backend API throws 501 Unsupported.                                                     |
| **Student Academics (Attendance, Exams, Results)** | Rendered in Parent Portal tabs                 | Endpoints return empty arrays (`[]`) | **Frontend / Backend Drift** | Parent UI expects live student attendance and grade metrics; backend returns static stub responses.                                   |
| **Role Assignment Interface**                      | `['ADMIN', 'SUPERADMIN']`                      | `PERMISSIONS.ADMISSION_REVIEW`       | **CRITICAL MISMATCH**        | Frontend hides role assignment screen from Front Office, but backend API allows anyone with `ADMISSION_REVIEW` to assign roles.       |

---

## Section K: Security Findings

### 1. [CRITICAL] Privilege Escalation in User Role Assignment API

- **File Path:** [`apps/backend/src/modules/user-management/routes/user.routes.ts`](file:///d:/EduTech/EduTech/apps/backend/src/modules/user-management/routes/user.routes.ts#L58-L63)<br>[`apps/backend/src/modules/user-management/policies/user.policy.ts`](file:///d:/EduTech/EduTech/apps/backend/src/modules/user-management/policies/user.policy.ts#L16-L18)<br>[`apps/backend/src/modules/user-management/services/user-role.service.ts`](file:///d:/EduTech/EduTech/apps/backend/src/modules/user-management/services/user-role.service.ts#L12-L43)
- **Code Evidence:**
  ```typescript
  // user.routes.ts (Lines 58-63)
  userRouter.post(
    '/:userId/roles',
    checkPermission(UserPolicy.canManageRoles()),
    checkIdempotency,
    UserRoleController.assignRole,
  );

  // user.policy.ts (Lines 16-18)
  static canManageRoles(): string {
    return PERMISSIONS.ADMISSION_REVIEW || PERMISSIONS.ADMISSION_LEADS_MANAGE;
  }
  ```
- **Actual Behavior:** `session.service.ts` (lines 191-215) automatically grants `admission.review` and `admission.leads.manage` to `FRONT_OFFICE`, `RECEPTIONIST`, `COUNSELLOR`, `STAFF`, and `FACULTY`. Consequently, any staff member possessing admissions review privileges can call `POST /api/v1/users/:userId/roles`. Furthermore, `UserRoleService.assignRole()` performs no role tier validation, allowing them to assign `Administrator` or `Super Admin` to themselves or any account.
- **Potential Impact:** Complete institutional takeover by low-privilege administrative staff.
- **Recommended Direction:** Restrict `UserPolicy.canManageRoles()` strictly to `PERMISSIONS.ADMIN_DASHBOARD_VIEW` or a dedicated `ROLE_MANAGE` permission. Enforce role hierarchy checks preventing callers from assigning roles equal to or higher than their own.

---

### 2. [HIGH] Direct Object Reference (IDOR) & Cross-Tenant Student Timeline Leak

- **File Path:** [`apps/backend/src/modules/student-management/controllers/student-analytics.controller.ts`](file:///d:/EduTech/EduTech/apps/backend/src/modules/student-management/controllers/student-analytics.controller.ts#L15-L23)<br>[`apps/backend/src/modules/student-management/routes/student.routes.ts`](file:///d:/EduTech/EduTech/apps/backend/src/modules/student-management/routes/student.routes.ts#L53-L57)<br>[`apps/backend/src/modules/student-management/queries/student.timeline.ts`](file:///d:/EduTech/EduTech/apps/backend/src/modules/student-management/queries/student.timeline.ts#L7-L26)
- **Code Evidence:**
  ```typescript
  // student.routes.ts (Line 55)
  studentRouter.get('/:id/timeline', checkPermission(StudentPolicy.canView()), StudentAnalyticsController.getTimeline);

  // student.policy.ts (Line 5)
  static canView(): string { return PERMISSIONS.ADMISSION_VIEW_SELF; } // Granted to all PARENT users

  // student.timeline.ts (Lines 8-10)
  const student = await db.students.findUnique({
    where: { student_id: studentId }, // NO org_id filter, NO parent ownership check!
  ```
- **Actual Behavior:** Any parent possesses `admission.view_own`. When querying `/api/v1/students/:id/timeline`, the controller omits `assertParentCanAccessStudent(user, id)`. The underlying query executes `findUnique` on `student_id` without checking `org_id`.
- **Potential Impact:** A parent can supply the UUID of any student in any school and retrieve their full academic timeline and section history.
- **Recommended Direction:** Add `assertParentCanAccessStudent` middleware before `StudentAnalyticsController.getTimeline` and include `org_id` in `StudentTimelineQuery`.

---

### 3. [HIGH] Direct Object Reference (IDOR) & Cross-Tenant Student Parents PII Leak

- **File Path:** [`apps/backend/src/modules/student-management/controllers/student-parent.controller.ts`](file:///d:/EduTech/EduTech/apps/backend/src/modules/student-management/controllers/student-parent.controller.ts#L42-L53)<br>[`apps/backend/src/modules/student-management/routes/student.routes.ts`](file:///d:/EduTech/EduTech/apps/backend/src/modules/student-management/routes/student.routes.ts#L136-L140)<br>[`apps/backend/src/modules/student-management/services/student.parent.service.ts`](file:///d:/EduTech/EduTech/apps/backend/src/modules/student-management/services/student.parent.service.ts#L45-L52)
- **Code Evidence:**
  ```typescript
  // student.routes.ts (Lines 136-140)
  studentRouter.get('/:id/parents', checkPermission(StudentPolicy.canView()), StudentParentController.getParents);

  // student.parent.service.ts (Lines 45-52)
  static async getParentsByStudent(studentId: string) {
    const student = await StudentRepository.findById(studentId);
    return StudentParentRepository.findParentsByStudentId(studentId);
  }
  ```
- **Actual Behavior:** Guarded only by `StudentPolicy.canView()` (accessible to any parent). Omits parent-child verification. Queries all guardians linked to the student and serializes guardian names, mobile phone numbers, and email addresses.
- **Potential Impact:** Harassment and mass scraping of family contact information across institutions.
- **Recommended Direction:** Guard `GET /:id/parents` with `StudentPolicy.canManageParents()` (Admin/Staff only) or enforce `assertParentCanAccessStudent`.

---

### 4. [HIGH] Direct Object Reference (IDOR) & Admission Application Timeline Leak

- **File Path:** [`apps/backend/src/modules/admission-management/controllers/admission-analytics.controller.ts`](file:///d:/EduTech/EduTech/apps/backend/src/modules/admission-management/controllers/admission-analytics.controller.ts#L16-L24)<br>[`apps/backend/src/modules/admission-management/routes/admission.routes.ts`](file:///d:/EduTech/EduTech/apps/backend/src/modules/admission-management/routes/admission.routes.ts#L107-L111)<br>[`apps/backend/src/modules/admission-management/queries/admission.timeline.ts`](file:///d:/EduTech/EduTech/apps/backend/src/modules/admission-management/queries/admission.timeline.ts#L8-L22)
- **Code Evidence:**
  ```typescript
  // admission.routes.ts (Lines 107-111)
  admissionRouter.get('/:id/timeline', checkPermission(AdmissionPolicy.canView()), AdmissionAnalyticsController.getTimeline);

  // admission.policy.ts (Line 5)
  static canView(): string { return PERMISSIONS.APPLICATION_VIEW; } // Granted to all PARENT users

  // admission.timeline.ts (Lines 9-18)
  const app = await prisma.admissions_applications.findUnique({
    where: { application_id: applicationId }, // NO parent linkage check, NO org_id check
  ```
- **Actual Behavior:** Any parent can supply any `application_id` to retrieve internal admission notes, entrance assessment evaluation marks, interviewer feedback, and fee transactions.
- **Potential Impact:** Exposure of confidential entrance evaluation comments and applicant details.
- **Recommended Direction:** Enforce applicant ownership check ensuring `app.parent_id === req.context.user.parent_id` before returning application timeline data.

---

### 5. [HIGH] PostgreSQL Row Level Security (RLS) Complete Application Bypass

- **File Path:** [`apps/backend/src/lib/prismaClient.ts`](file:///d:/EduTech/EduTech/apps/backend/src/lib/prismaClient.ts#L1-L25)<br>[`apps/backend/src/config/supabase.ts`](file:///d:/EduTech/EduTech/apps/backend/src/config/supabase.ts#L1-L15)<br>[`apps/backend/src/config/env.ts`](file:///d:/EduTech/EduTech/apps/backend/src/config/env.ts#L18-L25)
- **Code Evidence:**
  ```typescript
  // prismaClient.ts: Direct connection to pooled PostgreSQL database URL
  const prisma = new PrismaClient({ ... });

  // supabase.ts: Service role key usage
  export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { ... });
  ```
- **Actual Behavior:** Prisma connects directly to the Supabase pooler as a database superuser (`postgres`). The Supabase client initializes using `SUPABASE_SERVICE_ROLE_KEY`. Both connections bypass PostgreSQL RLS policies unconditionally.
- **Potential Impact:** Application queries that omit `where: { org_id }` leak cross-tenant data without any database-level safety net.
- **Recommended Direction:** Implement a Prisma Client Extension (`prisma.$extends`) that automatically injects `org_id` into the `where` clause of every find, update, and delete query.

---

### 6. [MEDIUM] Unprotected Organization-Wide Metrics and Payment History

- **File Path:** [`apps/backend/src/modules/dashboard/dashboard.routes.ts`](file:///d:/EduTech/EduTech/apps/backend/src/modules/dashboard/dashboard.routes.ts#L12-L50)<br>[`apps/backend/src/modules/dashboard/dashboard.routes.ts`](file:///d:/EduTech/EduTech/apps/backend/src/modules/dashboard/dashboard.routes.ts#L202-L244)
- **Code Evidence:**
  ```typescript
  // dashboard.routes.ts (Lines 12-15)
  dashboardRouter.get('/summary', async (req: Request, res: Response) => {
    // Only checks req.context?.user?.org_id; NO checkPermission() guard!

  // dashboard.routes.ts (Lines 202-244)
  dashboardRouter.get('/timeline', async (req: Request, res: Response) => {
    // Queries last 10 admission applications and last 10 payment transactions across entire school!
  ```
- **Actual Behavior:** Any authenticated user in the school (including Parents and Students) can query `/api/dashboard/summary` and `/api/dashboard/timeline` to monitor institutional revenue, student enrollment totals, and transaction amounts.
- **Potential Impact:** Institutional financial metrics and student transaction details exposed to unauthorized personas.
- **Recommended Direction:** Guard `/dashboard/summary` and `/dashboard/timeline` under `checkPermission(PERMISSIONS.ADMIN_DASHBOARD_VIEW)`.

---

### 7. [MEDIUM] Unrestricted Helpdesk SLA Escalations and Category Creation

- **File Path:** [`apps/backend/src/modules/communication/communication.routes.ts`](file:///d:/EduTech/EduTech/apps/backend/src/modules/communication/communication.routes.ts#L68)<br>[`apps/backend/src/modules/communication/communication.routes.ts`](file:///d:/EduTech/EduTech/apps/backend/src/modules/communication/communication.routes.ts#L84)<br>[`apps/backend/src/modules/communication/communication.routes.ts`](file:///d:/EduTech/EduTech/apps/backend/src/modules/communication/communication.routes.ts#L92-L98)
- **Code Evidence:**
  ```typescript
  communicationRouter.post('/helpdesk/categories', CommunicationController.createCategory);
  communicationRouter.patch('/helpdesk/tickets/:id/assign', CommunicationController.assignTicket);
  communicationRouter.post(
    '/helpdesk/escalation/rules',
    CommunicationController.createEscalationRule,
  );
  communicationRouter.post(
    '/helpdesk/escalation/evaluate',
    CommunicationController.evaluateEscalations,
  );
  ```
- **Actual Behavior:** These operational mutation routes require only `authenticate`. Any authenticated user, including parents, can create categories, modify ticket assignments, create escalation rules, or trigger background SLA escalation sweeps.
- **Potential Impact:** Service disruption and tampering with institutional support routing.
- **Recommended Direction:** Add `checkPermission(PERMISSIONS.COMMUNICATION_MANAGE)` or role guard `['ADMIN', 'PRINCIPAL']` to helpdesk administrative routes.

---

### 8. [LOW] Client-Side Logout (No Server-Side Token Revocation)

- **File Path:** [`apps/backend/src/auth/auth.controller.ts`](file:///d:/EduTech/EduTech/apps/backend/src/auth/auth.controller.ts#L76-L78)
- **Code Evidence:**
  ```typescript
  static async logout(req: Request, res: Response) {
    return res.json({ success: true, message: 'Logged out successfully' });
  }
  ```
- **Actual Behavior:** Does not invalidate the JWT token, does not clear `sessionCache`, and has no revocation blocklist.
- **Potential Impact:** Stolen or copied tokens remain fully valid until the 24-hour expiration window lapses.
- **Recommended Direction:** Introduce a token revocation store (Redis or database table) or flush `sessionCache` upon logout.

---

### 9. [LOW] Public RBAC Debug Endpoint Enabled in Production Routes

- **File Path:** [`apps/backend/src/routes.ts`](file:///d:/EduTech/EduTech/apps/backend/src/routes.ts#L589-L614)
- **Code Evidence:**
  ```typescript
  router.get('/public/inspect-rbac', async (req: Request, res: Response) => {
    const user = await prisma.users.findFirst({ where: { email: 'examplatform@edu.in' }, ... });
    const allRoles = await prisma.roles.findMany();
    res.json({ user, userRoles, allRoles });
  });
  ```
- **Actual Behavior:** An unauthenticated public route dumps system roles and internal user account mappings.
- **Potential Impact:** Reconnaissance data leak revealing role IDs and user account structures.
- **Recommended Direction:** Delete or restrict `/public/inspect-rbac` to local development environments (`env.NODE_ENV !== 'production'`).

---

### 10. [INFORMATIONAL] Teacher Broad Permission Block Exclusion in Session Service

- **File Path:** [`apps/backend/src/auth/session.service.ts`](file:///d:/EduTech/EduTech/apps/backend/src/auth/session.service.ts#L191-L211)
- **Actual Behavior:** Role `'TEACHER'` was omitted from the broad permission injection block, leaving teachers with only 2 session permissions. The system functions only because `rbac.middleware.ts` contains hardcoded fallback checks for `TEACHER`.
- **Potential Impact:** Fragile architecture; adding new teacher permissions to routes fails unless also added to middleware fallbacks.
- **Recommended Direction:** Add `'TEACHER'` into the appropriate role arrays in `session.service.ts` or unify role definitions.

---

## Section L: Missing Implementation

The following features and workflows are currently referenced in code or UI, but have **no functioning backend implementation**:

1. **Student Daily Attendance Marking Write API:**
   - No route or controller exists for teachers or administrators to submit daily or period-by-period attendance marks (`POST /api/v1/academic/attendance`).
   - The student attendance endpoints (`GET /api/v1/students/:id/attendance/summary`, `/timeline`) return static stub objects.

2. **Teacher Gradebook / Exam Marks Entry Write API:**
   - No route or controller exists for faculty to record assessment scores, exam grades, or report card marks.
   - The student exam and results endpoints (`GET /api/v1/students/:id/exams`, `GET /api/v1/students/:id/results`) return empty arrays (`[]`).

3. **Timetable Generation Engine:**
   - The timetable generation routes in `academic.routes.ts` (`POST /api/v1/academic/timetable/slots`, `PUT /api/v1/academic/timetable/bulk`) return HTTP 501 Unsupported.

4. **Curriculum Event Creation & Approval Workflow:**
   - Teachers can submit lesson plans, but there is no implemented review, rejection, or approval workflow state transition API for Academic Admins or Principals.

5. **Token Revocation / Server-Side Session Invalidation:**
   - No persistent token blocklist or Redis store exists. Logout is purely decorative on the server.

6. **Database Permissions Table (`permissions` / `role_permissions`):**
   - No database schema or tables exist for dynamic permission assignments. Permissions cannot be modified without editing TypeScript source files and redeploying the backend.

---

## Section M: Recommended Next Steps

Based strictly on actual code evidence, the following work is prioritized for subsequent implementation stages:

### Priority 1: Critical Security Remediation

1. **Fix User Role Assignment Guard:** In `apps/backend/src/modules/user-management/policies/user.policy.ts`, change `canManageRoles()` from `ADMISSION_REVIEW` to `PERMISSIONS.ADMIN_DASHBOARD_VIEW` or a dedicated administrative permission.
2. **Close IDOR Vulnerabilities on Student Endpoints:** In `apps/backend/src/modules/student-management/routes/student.routes.ts`, attach `assertParentCanAccessStudent` to `GET /:id/timeline` and restrict `GET /:id/parents` to administrators.
3. **Close IDOR Vulnerability on Admission Application Timeline:** In `apps/backend/src/modules/admission-management/routes/admission.routes.ts`, enforce applicant ownership checks on `GET /:id/timeline`.
4. **Remove Unauthenticated Debug Route:** Remove `/public/inspect-rbac` from `apps/backend/src/routes.ts`.

### Priority 2: Tenant Isolation Hardening

1. **Prisma Client Extension for Automatic Tenant Scoping:** Implement `prisma.$extends` query middleware to enforce `where: { org_id }` across all models possessing an `org_id` column, eliminating accidental cross-tenant data leaks.
2. **Protect Dashboard Endpoints:** Add `checkPermission(PERMISSIONS.ADMIN_DASHBOARD_VIEW)` to `GET /api/dashboard/summary` and `GET /api/dashboard/timeline`.

### Priority 3: Role & Permission Architecture Cleanup

1. **Harmonize Teacher Role in Session Service:** Add `'TEACHER'` to the broad permission array in `apps/backend/src/auth/session.service.ts` (line 191) so session permissions accurately reflect teacher capabilities without relying solely on middleware fallbacks.
2. **Consolidate Duplicate Parent Roles:** Unify database role `'PARENT'` and `'Parent'` in ORG-001 to maintain database consistency.

### Priority 4: Academic Module Feature Completion

1. **Implement Student Attendance Recording API:** Develop the transactional write service and controller for daily section attendance.
2. **Implement Gradebook & Exam Mark Entry API:** Develop the assessment score submission endpoints for assigned faculty.

---

_Report Compiled & Verified against EduTrack ERP Codebase._  
_Investigation completed without modifying source code or database records._
