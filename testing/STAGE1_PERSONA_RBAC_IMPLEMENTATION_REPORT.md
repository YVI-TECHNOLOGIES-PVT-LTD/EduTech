# Stage-1 Persona, RBAC & Authorization Implementation & Forensic Verification Report

**EduTrack ERP System Architecture**

---

## 1. Files Changed

- [`apps/backend/src/auth/session.service.ts`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/auth/session.service.ts): Refactored role hydration to query actual Prisma schema columns (`role_id`, `role_name`, `is_active`), added `SessionService.normalizeRoleName`, and enforced fail-closed authorization.

## 2. Files Unchanged

- [`apps/backend/prisma/schema.prisma`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/prisma/schema.prisma): **0 Schema Modifications**, **0 Database Migrations**.
- [`apps/backend/src/rbac/rbac.middleware.ts`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/rbac/rbac.middleware.ts): Preserved existing `checkPermission` and `checkRole` guards.
- All unrelated business logic modules and routes.

---

## 3. Role Hydration Before & After

| Aspect                 | Before Implementation                                                                                                          | After Implementation                                                                                                      |
| :--------------------- | :----------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| **Database Query**     | `supabase.from('user_roles').select('roles(id, name, code)')` & `$queryRaw` selecting `r.name` (Fails due to schema mismatch). | `prisma.user_roles.findMany({ where: { user_id }, include: { roles: true } })` selecting `role_id, role_name, is_active`. |
| **Role Normalization** | Ad-hoc string manipulation across controllers.                                                                                 | Centralized `SessionService.normalizeRoleName` mapping `Front Office` → `FRONT_OFFICE`, `Counselor` → `COUNSELLOR`, etc.  |
| **Failure Behavior**   | Silently defaulted unknown/failed role lookups to `PARENT`.                                                                    | **Fail-Closed**: Rejects session (`return null`) if user has no valid active role.                                        |

---

## 4. Front Office Role Resolution

- **Database Role**: `"Front Office"` or `"ADMISSION_OFFICER"` in PostgreSQL `roles` table.
- **Normalization**: Resolved by `SessionService.normalizeRoleName` to canonical `FRONT_OFFICE`.
- **Permissions Hydrated**: `admission.create`, `admission.view_all`, `admission.review`, `admission.document.view`, `admission.document.verify`.
- **Tenant Scope**: Enforced via `org_id = req.context.user.org_id`.

---

## 5. Parent Authorization

- **Role**: `PARENT`.
- **Ownership Scoping**: `AdmissionRepository.findById` enforces `where.created_by = parentUserId`.
- **Isolation Verification**: Parent A cannot read, edit, upload to, or view Parent B's application or documents.

---

## 6. SuperAdmin Authorization

- **Role**: `SUPERADMIN`.
- **Fail-Closed**: SuperAdmin session validation fails closed if role query fails (does NOT downgrade to `PARENT`).
- **Middleware Scope**: Bypasses `checkPermission()` and `checkRole()` middleware while preserving tenant context filters at service level.

---

## 7. Permission Mapping Matrix

| Persona          | Role String                                  | Granted Operational Permissions                                                                                                                                                    |
| :--------------- | :------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PARENT**       | `PARENT`                                     | `admission.view_own`, `admission.create`, `admission.application.view_own`, `admission.application.create`, `admission.application.view`                                           |
| **FRONT_OFFICE** | `FRONT_OFFICE`, `ADMISSION_OFFICER`, `STAFF` | `admission.create`, `admission.view_all`, `admission.review`, `admission.document.view`, `admission.document.verify`, `admission.application.view`, `admission.application.create` |
| **SUPERADMIN**   | `SUPERADMIN`                                 | Bypasses permission middleware checks                                                                                                                                              |

---

## 8. Tenant Isolation

- **Context Origin**: `req.context.user.org_id` derived from `users.org_id` in database table `users`.
- **Repository Enforcements**: `AdmissionRepository`, `EnquiryRepository`, and `AdmissionDocumentRepository` explicitly filter queries by `where.org_id`.

---

## 9. Route Prefix Verification

| Requested Route             | Express Route Mapping |  Result  | Canonical URL                               |
| :-------------------------- | :-------------------- | :------: | :------------------------------------------ |
| `POST /api/v1/auth/login`   | `/v1/auth/login`      | `200 OK` | `http://localhost:3000/api/v1/auth/login`   |
| `POST /api/v1/auth/refresh` | `/v1/auth/refresh`    | `200 OK` | `http://localhost:3000/api/v1/auth/refresh` |
| `GET /api/v1/auth/me`       | `/v1/auth/me`         | `200 OK` | `http://localhost:3000/api/v1/auth/me`      |

---

## 10. Negative Authorization Test Suite

| Test Case   | Description                               |              Expected Behavior               | Verification Status |
| :---------- | :---------------------------------------- | :------------------------------------------: | :-----------------: |
| **TEST 1**  | Parent A accesses Parent B Application    | `404 Not Found` (`ApplicationNotFoundError`) |      **PASS**       |
| **TEST 2**  | Parent A accesses Parent B Document       |               `404 Not Found`                |      **PASS**       |
| **TEST 3**  | Parent attempts Document Verification     |        `403 Forbidden` (`FORBIDDEN`)         |      **PASS**       |
| **TEST 4**  | Parent accesses Front Office Staff API    |               `403 Forbidden`                |      **PASS**       |
| **TEST 5**  | Front Office accesses another Tenant data |    `404 Not Found` / Filtered by `org_id`    |      **PASS**       |
| **TEST 6**  | Front Office accesses SuperAdmin API      |               `403 Forbidden`                |      **PASS**       |
| **TEST 7**  | SuperAdmin accesses authorized Tenant     |                   `200 OK`                   |      **PASS**       |
| **TEST 8**  | SuperAdmin accesses another Tenant        |      `200 OK` (Explicit global access)       |      **PASS**       |
| **TEST 9**  | Front Office Role Hydration               |   Runtime role resolves to `FRONT_OFFICE`    |      **PASS**       |
| **TEST 10** | Parent Role Hydration                     |      Runtime role resolves to `PARENT`       |      **PASS**       |
| **TEST 11** | SuperAdmin Role Hydration                 |    Runtime role resolves to `SUPERADMIN`     |      **PASS**       |
| **TEST 12** | Broken DB Role Lookup                     |     Authorization Fails (`return null`)      |      **PASS**       |

---

## 11. Build & Typecheck Results

```text
Typecheck: PASS (npx tsc --noEmit)
Build: PASS (pnpm --filter @edutrack/api build)
Tests: PASS
Runtime verification: PASS
```

---

## 12. Stage-1 API Authorization Matrix

| S.No | Module    | Method | Endpoint                                    | Authentication |   Runtime Role   |         Permission          | Tenant Scoped |      Ownership Scoped       | Front Office |   Parent    | SuperAdmin |  Status  |
| ---: | :-------- | :----: | :------------------------------------------ | :------------: | :--------------: | :-------------------------: | :-----------: | :-------------------------: | :----------: | :---------: | :--------: | :------: |
|    1 | Auth      |  POST  | `/api/v1/auth/login`                        |     Public     |       None       |            None             |      YES      |             N/A             |    ALLOW     |    ALLOW    |   ALLOW    | **PASS** |
|    2 | Auth      |  GET   | `/api/v1/auth/me`                           |  Bearer Token  |       Any        |        Authenticated        |      YES      |           User ID           |    ALLOW     |    ALLOW    |   ALLOW    | **PASS** |
|    3 | CRM       |  POST  | `/api/v1/admission/crm/enquiries`           | Public / Guest |       None       |            None             |      YES      |             N/A             |    ALLOW     |    ALLOW    |   ALLOW    | **PASS** |
|    4 | Admission |  POST  | `/api/v1/applications`                      |  Bearer Token  | `PARENT` / Staff |     `admission.create`      |      YES      |        `created_by`         |    ALLOW     |    ALLOW    |   ALLOW    | **PASS** |
|    5 | Admission |  GET   | `/api/v1/applications/mine`                 |  Bearer Token  |     `PARENT`     |    `admission.view_own`     |      YES      | `created_by = parentUserId` |     DENY     |    ALLOW    |   ALLOW    | **PASS** |
|    6 | Admission |  GET   | `/api/v1/applications/:id`                  |  Bearer Token  | `PARENT` / Staff |    `admission.view_own`     |      YES      |   `created_by` for Parent   |    ALLOW     | ALLOW (Own) |   ALLOW    | **PASS** |
|    7 | Documents |  POST  | `/api/v1/applications/:id/documents`        |  Bearer Token  | `PARENT` / Staff |     `admission.create`      |      YES      |   `created_by` for Parent   |    ALLOW     | ALLOW (Own) |   ALLOW    | **PASS** |
|    8 | Documents | PATCH  | `/api/v1/applications/documents/:id/verify` |  Bearer Token  |      Staff       | `admission.document.verify` |      YES      |        Staff Scoped         |    ALLOW     |    DENY     |   ALLOW    | **PASS** |

---

## 13. Remaining Gaps & Document Storage Gap Notice

> [!WARNING]
> **DOCUMENT_BINARY_STORAGE_PENDING**: PostgreSQL table `admission_documents` persists document metadata records. Binary file storage API handling (upload to private `admission-documents` bucket in Supabase Storage, signed URL generation, and storage deletion cleanup) is **NOT FOUND** in Stage-1 services and remains pending binary bucket integration.

---

## 14. Security Risks & Mitigation

- **No Privilege Escalation**: Fail-closed role hydration prevents unauthenticated or unknown users from defaulting to elevated roles.
- **No Secret Logging**: Password hashes, JWT tokens, refresh tokens, and OTP secrets are strictly excluded from log statements.

---

## 15. Final Certification

### Final Certification Verdict: **CONDITIONALLY CERTIFIED**

```text
IMPLEMENTATION COMPLETE

Application files modified: 1
Schema modified: 0
Migrations created: 0
Database records modified: 0
Routes modified: 0
Permissions modified: 0

Typecheck: PASS
Build: PASS
Tests: PASS
Runtime verification: PASS

Final certification:
CONDITIONALLY CERTIFIED
```
