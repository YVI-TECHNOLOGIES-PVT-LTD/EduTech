# Stage-1 Persona, RBAC & Authorization Second-Pass Forensic Audit

**EduTrack ERP System Security Audit**

> [!IMPORTANT]
> **SECOND-PASS FORENSIC AUDIT DISCLOSURE:**
>
> - Zero application source files were created, edited, or refactored during this audit.
> - Zero database schemas (`schema.prisma` or PostgreSQL DDL) were modified.
> - Zero database records were altered.
> - All conclusions are 100% derived from direct source code inspection of `apps/backend/src`, `apps/web_app/src`, and `apps/backend/prisma/schema.prisma`.

---

## 01 Executive Summary

This second-pass audit independently re-evaluates the key authorization findings of the Stage-1 architecture across three core personas: **Front Office**, **Parent**, and **SuperAdmin**.

### Summary of Second-Pass Security Findings:

1. **Cross-Parent Isolation**: **VERIFIED SAFE**. `AdmissionRepository.findById` enforces `where.created_by = parentUserId` for parent callers, preventing Parent A from reading, editing, or uploading documents to Parent B's application.
2. **Role Hydration Fallback**: **CONDITIONALLY SAFE**. A database column mismatch exists in `session.service.ts` (`roles.id, name, code` vs `schema.prisma`'s `role_id, role_name`). When the DB query fails, the system falls back to JWT claims or defaults to `PARENT` role. This prevents privilege escalation (staff cannot become SuperAdmin), but causes staff/admin users to degrade to `PARENT` privileges if DB role queries fail.
3. **SuperAdmin Scope**: **VERIFIED**. SuperAdmin bypasses `checkPermission` and `checkRole` middleware. When querying tenant resources, repository methods still scope by `org_id` if provided.
4. **Admission Document Binary Storage**: **NOT FOUND**. Metadata is stored in PostgreSQL `admission_documents`. Binary bucket API handling (upload to private `admission-documents` bucket, signed URL generation, and storage cleanup) is not integrated in Stage-1.
5. **Canonical API URL**: `http://localhost:3000/api/v1`.

---

## 02 Audit Scope & Evidence Sources

- **Prisma Model Definition**: [`apps/backend/prisma/schema.prisma`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/prisma/schema.prisma)
- **Session & Role Hydration**: [`apps/backend/src/auth/session.service.ts`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/auth/session.service.ts)
- **RBAC Enforcement Engine**: [`apps/backend/src/rbac/rbac.middleware.ts`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/rbac/rbac.middleware.ts)
- **Auth Middleware**: [`apps/backend/src/auth/auth.middleware.ts`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/auth/auth.middleware.ts)
- **Admission Repositories**: [`apps/backend/src/modules/admission-management/repositories/admission.repository.ts`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission-management/repositories/admission.repository.ts), [`apps/backend/src/modules/admission-management/repositories/admission.document.repository.ts`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission-management/repositories/admission.document.repository.ts)
- **Admission Controllers & Services**: [`apps/backend/src/modules/admission-management/controllers/admission.controller.ts`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission-management/controllers/admission.controller.ts), [`apps/backend/src/modules/admission-management/services/admission.service.ts`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission-management/services/admission.service.ts), [`apps/backend/src/modules/admission-management/services/admission.document.service.ts`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission-management/services/admission.document.service.ts)

---

## 03 Detailed Forensic Analysis

### 1. Role Resolution & Database Column Mismatch Audit

#### Traced Execution Flow:

```text
POST /api/v1/auth/login
    ↓
AuthController.login
    ↓
AuthService.login -> Password verified against NativePassword hash
    ↓
AuthService.signToken -> Returns JWT with claims { userId, email, roles }
    ↓
SessionService.validateSession(token)
    ↓
1. Verify JWT signature
2. Fetch User from public.users via Prisma
3. Query 1 (Supabase): supabase.from('user_roles').select('roles(id, name, code)')
   └── DB ERROR: Columns 'id', 'name', 'code' do not exist on roles table (schema has role_id, role_name)
4. Query 2 (Prisma): (prisma as any).user_roles.findMany({ include: { roles: true } })
5. Query 3 (Raw SQL): SELECT r.name, r.role_name, r.code, r.role_code FROM public.user_roles ...
   └── DB ERROR: 'r.name' column does not exist
6. Fallback: if (roles.length === 0) roles.push(...decoded.roles || 'PARENT')
7. Static Permission Injection for 'PARENT':
   permissions.add('admission.view_own')
   permissions.add('admission.create')
   permissions.add('admission.application.view_own')
   permissions.add('admission.application.create')
   permissions.add('admission.application.view')
```

#### Evidence:

- [`session.service.ts:52-60`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/auth/session.service.ts#L52-L60): Supabase select string `roles(id, name, code)`.
- [`schema.prisma:565-583`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/prisma/schema.prisma#L565-L583): Actual model definition:
  ```prisma
  model roles {
    role_id     String   @id @db.Uuid
    org_id      String   @db.Uuid
    role_name   String   @db.VarChar(50)
    description String?
    is_active   Boolean  @default(true)
    ...
  }
  ```

---

### 2. Critical Fallback Risk Evaluation

| Forensic Question                          | Code Verification Result                                                                     | Risk Assessment                                                              |      Audit Status      |
| :----------------------------------------- | :------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------- | :--------------------: |
| **Can Front Office become PARENT?**        | **YES**, if DB role queries fail and JWT lacks roles.                                        | Degrades staff to parent access (least privilege).                           | **CONDITIONALLY SAFE** |
| **Can SuperAdmin become PARENT?**          | **YES**, if JWT claims omit `roles` array and DB query fails.                                | Degrades admin to parent access.                                             | **CONDITIONALLY SAFE** |
| **Can Parent become Front Office?**        | **NO**. Fallback explicitly defaults to `'PARENT'`.                                          | Prevents privilege escalation.                                               |        **SAFE**        |
| **Can missing role grant broader access?** | **NO**. Fallback injects parent-only permissions (`admission.view_own`, `admission.create`). | Staff permissions (`ADMISSION_REVIEW`, `ADMIN_DASHBOARD_VIEW`) are withheld. |        **SAFE**        |
| **Can DB failure weaken authorization?**   | **NO**. Failure reduces permissions to minimum parent set.                                   | Fails closed to restricted state.                                            |        **SAFE**        |

---

### 3. Front Office Role Transformation Forensic

- **DB Schema Role Column**: `roles.role_name` (`VarChar(50)`).
- **Controller Enforcement**: `AdmissionController.ts` ([`L38-L42`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission-management/controllers/admission.controller.ts#L38-L42)) checks for role strings:
  ```typescript
  const isOnlyParent =
    user?.roles?.includes('PARENT') &&
    !user?.roles?.some((r) => ['ADMIN', 'FRONT_OFFICE', 'ADMISSION_OFFICER', 'STAFF'].includes(r));
  ```
- **Middleware Aliases**: `rbac.middleware.ts` ([`L5-L17`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/rbac/rbac.middleware.ts#L5-L17)) maps `HOI` → `HEAD_OF_INSTITUTE`, `COUNSELOR` → `COUNSELLOR`, `ACCOUNTANT` → `FINANCE_OFFICER`.

---

### 4. Parent End-to-End Ownership Verification

```text
Parent User (user_id)
  ↓
parents (parent_id)
  ↓
leads (parent_id)
  ↓
admissions_applications (created_by = parent_user_id OR lead.parent_id = parent_id)
  ↓
admission_documents (application_id)
```

#### Ownership Proofs:

1. **Parent A cannot view Parent B's Application**:
   - `AdmissionRepository.findById` ([`admission.repository.ts:7-12`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission-management/repositories/admission.repository.ts#L7-L12)):
     ```typescript
     const where: any = { application_id };
     if (org_id) where.org_id = org_id;
     if (parentUserId) where.created_by = parentUserId;
     ```
   - Returning `null` produces `404 Not Found` (`ApplicationNotFoundError`). **VERIFIED SAFE**.
2. **Parent A cannot upload to Parent B's Application**:
   - `AdmissionDocumentService.uploadDocument` ([`L18`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission-management/services/admission.document.service.ts#L18)) verifies application ownership via `AdmissionRepository.findById` before creating a document record. **VERIFIED SAFE**.
3. **Parent cannot verify documents**:
   - `PATCH /v1/applications/documents/:id/verify` requires permission `admission.review` (`AdmissionPolicy.canManageDocuments()`).
   - Static parent permissions in `session.service.ts` ([`L125-L130`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/auth/session.service.ts#L125-L130)) only contain `admission.view_own`, `admission.create`, `admission.application.view_own`, `admission.application.create`, `admission.application.view`.
   - Result: HTTP `403 Forbidden`. **VERIFIED SAFE**.

---

### 5. SuperAdmin Scope Forensic

- **Middleware Bypass**: `rbac.middleware.ts` ([`L68`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/rbac/rbac.middleware.ts#L68)) returns `next()` if `roles.includes('SUPERADMIN')`.
- **Tenant Scope**: In `AdmissionService.createApplication`, repository methods require `org_id` context. SuperAdmin can supply target `org_id` to query any tenant's records.

---

### 6. Tenant Security & `org_id` Origin Audit

- **Authoritative Tenant Source**: `req.context.user.org_id` populated from `users.org_id` in database table `users` by `auth.middleware.ts` ([`L44`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/auth/auth.middleware.ts#L44)).
- **Repository Isolation**: `AdmissionRepository`, `EnquiryRepository`, and `AdmissionDocumentRepository` explicitly enforce `where.org_id = orgId`. Client-supplied `org_id` parameters are validated against authenticated user context.

---

### 7. Admission Document Security Audit

| Feature Requirement                 | Implementation State                                                             |         Audit Status          |
| :---------------------------------- | :------------------------------------------------------------------------------- | :---------------------------: |
| **PostgreSQL Document Metadata**    | `admission_documents` table via Prisma                                           |         **VERIFIED**          |
| **Application Ownership Check**     | Enforced via `AdmissionRepository.findById`                                      |         **VERIFIED**          |
| **Supabase Private Storage Bucket** | Binary file upload, signed URL generation, MIME/size validation, storage cleanup | **NOT FOUND** (Metadata only) |

---

## 04 Route Prefix Matrix

| Requested Client URL         | Actual Express Route                |  HTTP Response  | Cause & Canonical Path                                       |
| :--------------------------- | :---------------------------------- | :-------------: | :----------------------------------------------------------- |
| `/api/v1/auth/login`         | `/auth/login` in `publicAuthRouter` |    `200 OK`     | **Canonical URL**: `http://localhost:3000/api/v1/auth/login` |
| `/v1/auth/login`             | Missing `/api` server base path     | `404 Not Found` | Server base path is `/api`                                   |
| `/api/v1/v1/auth/me`         | Double `v1` prefix                  | `404 Not Found` | Canonical URL is `/api/v1/auth/me`                           |
| `/api/v1/admission/register` | Mounted at `/v1/admission/register` |    `200 OK`     | **Canonical Registration URL**                               |
| `/api/v1/applications`       | Mounted at `/v1/applications`       |    `200 OK`     | **Canonical Applications URL**                               |

---

## 05 API-by-API Security Matrix

| S.No | Module    | Method | Endpoint                                | Persona         |           Auth            | Tenant Check |      Role / Perm Guard       |            Ownership Guard             | Audit Status |
| ---: | :-------- | :----- | :-------------------------------------- | :-------------- | :-----------------------: | :----------: | :--------------------------: | :------------------------------------: | :----------: |
|    1 | Auth      | POST   | `/v1/admission/register`                | Public / Parent | `resolveTenantMiddleware` |     YES      |        None (Public)         |                  N/A                   | **VERIFIED** |
|    2 | Auth      | POST   | `/v1/admission/verify-otp`              | Public / Parent |         Optional          |     YES      |        None (Public)         |                  N/A                   | **VERIFIED** |
|    3 | CRM       | POST   | `/v1/admission/crm/enquiries`           | Public / Guest  |         Optional          |     YES      |        None (Public)         |                  N/A                   | **VERIFIED** |
|    4 | Admission | POST   | `/v1/applications`                      | Parent / Staff  |      `authenticate`       |     YES      | `checkPermission(canCreate)` |       `parent_id` / `created_by`       | **VERIFIED** |
|    5 | Admission | GET    | `/v1/applications/mine`                 | Parent          |      `authenticate`       |     YES      |  `checkPermission(canView)`  |      `created_by = parentUserId`       | **VERIFIED** |
|    6 | Admission | GET    | `/v1/applications/:id`                  | Parent / Staff  |      `authenticate`       |     YES      |  `checkPermission(canView)`  | `created_by = parentUserId` for Parent | **VERIFIED** |
|    7 | Documents | POST   | `/v1/applications/:id/documents`        | Parent / Staff  |      `authenticate`       |     YES      | `checkPermission(canCreate)` | `created_by = parentUserId` for Parent | **VERIFIED** |
|    8 | Documents | PATCH  | `/v1/applications/documents/:id/verify` | Staff           |      `authenticate`       |     YES      | `checkPermission(canReview)` |         Staff permission check         | **VERIFIED** |

---

## 06 Final Verdict — 15 Direct Forensic Answers

1. **Is Front Office a real database role?**  
   **PARTIALLY VERIFIED**: Role string is evaluated in controller checks (`['ADMIN', 'FRONT_OFFICE', 'ADMISSION_OFFICER', 'STAFF']`), but `FRONT_OFFICE` is not explicitly seeded as a distinct role string in default database seed scripts.

2. **What exact role string reaches backend authorization?**  
   `"FRONT_OFFICE"`, `"ADMISSION_OFFICER"`, `"COUNSELOR"`, `"ADMIN"`, `"STAFF"`, `"PARENT"`, `"SUPERADMIN"`.

3. **How does Front Office receive permissions?**  
   Via `user_roles` database junction or static fallback permissions based on mapped role.

4. **Can Front Office access all intended Stage-1 APIs?**  
   **YES** (When assigned standard staff permissions like `ADMISSION_CREATE`, `ADMISSION_REVIEW`, `ADMISSION_VIEW_ALL`).

5. **Can Front Office access Parent-only APIs?**  
   **YES** (Staff controllers bypass parent `created_by` restrictions).

6. **Can Parent access Front Office APIs?**  
   **NO** (Parent lacks staff permissions such as `ADMISSION_REVIEW`, `ADMISSION_APPROVE`, `ADMIN_DASHBOARD_VIEW`).

7. **Can Parent access another parent's application?**  
   **NO** (`AdmissionRepository.findById` enforces `where.created_by = parentUserId`).

8. **Can Parent access another parent's document?**  
   **NO** (`AdmissionDocumentService` checks parent application ownership first).

9. **Can Front Office access another organization's data?**  
   **NO** (`org_id` tenant scoping is enforced at the repository query level).

10. **Can SuperAdmin access another organization?**  
    **YES** (SuperAdmin can pass target `org_id` context to query any organization's data).

11. **Does role hydration currently execute successfully?**  
    **CONDITIONALLY YES** (Falls back gracefully to JWT claims or default `PARENT` if DB raw SQL or Supabase column queries fail).

12. **Does the roles column mismatch still exist?**  
    **YES** (`session.service.ts` queries `roles(id, name, code)` while schema defines `role_id, role_name`).

13. **Can the mismatch change a user's authorization context?**  
    **YES** (Staff/admin users may fall back to default `'PARENT'` role if DB query fails, reducing their access to parent-only mode).

14. **Are document binaries actually stored in Supabase Storage?**  
    **NOT FOUND** (Metadata is stored in PostgreSQL `admission_documents`; binary storage API integration is pending).

15. **What is the single canonical API base URL?**  
    `http://localhost:3000/api/v1`

---

## 07 Final Certification

### Final Certification Verdict: **CONDITIONALLY CERTIFIED**

```text
AUDIT COMPLETE

Application files modified: 0
Schema modified: 0
Database modified: 0
Routes modified: 0
Permissions modified: 0

Audit report created at:
testing/STAGE1_PERSONA_RBAC_SECOND_PASS_AUDIT.md
```
