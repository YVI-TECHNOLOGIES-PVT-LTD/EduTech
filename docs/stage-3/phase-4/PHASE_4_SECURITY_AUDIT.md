# Stage 3, Phase 4 — Security Audit

## 1. Authentication, Tenant Isolation & Fail-Closed RBAC

- All endpoints in `learning-activities.routes.ts` derive `{ orgId, userId, roles }` exclusively from the verified session (`LearningActivitiesPolicy` + `extractLearningActivityAuthContext` + `ParentPortalPolicy.requireParentRole()`). Client-supplied tenant or user IDs are never trusted.
- Missing tokens return `401 UNAUTHORIZED`; missing organization context returns `401 TENANT_CONTEXT_REQUIRED`; mismatched roles return `403 FORBIDDEN`.
- All queries enforce `org_id = ${orgId}::uuid` (joining `academic_years.org_id` for `sections`). Cross-tenant probes fail with `404` / `403`.

## 2. Parent & Teacher Ownership (IDOR Prevention)

- **Parent Routes (`/parent/children/:childId/...`)**: Enforce `student_parents` + `parents.user_id` + `org_id` linkage (`403` when an unlinked parent queries another child's overview, activities, details, or files). Parent role has zero write endpoints.
- **Teacher Ownership**: Activity edits, publish/close/late-extension actions, audit reads, submission reviews, and submission file downloads verify `activity.created_by_staff_id === teacherStaff.staff_id`.
- **Student Ownership**: Student activity detail and submissions verify active enrollment in `activity.section_id`, block `draft` visibility (`403`), and restrict file downloads to the owning `student_id`.

## 3. SQL Injection & Upload Safety

- **Zero Dynamic Unsafe SQL**: `learning-activities.repository.ts` uses 100% parameterized `Prisma.sql`, `Prisma.empty`, `Prisma.join`, and `$queryRaw` / `$executeRaw` tagged templates — zero `$queryRawUnsafe` or `$executeRawUnsafe`.
- **File Upload & Download Security**: Magic-byte verification (`validateFileBufferSignature`), 5-file & 10MB caps, private bucket storage with compensating deletion on transaction failure, and short-lived (`600s`) role-verified signed download URLs. Raw `storage_path` is omitted from DTOs, DB notifications, and WebSocket payloads.
