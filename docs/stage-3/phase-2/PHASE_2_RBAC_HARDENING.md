# EduTrack ERP — Stage 3 Phase 2: RBAC Hardening Report (WS7)

> **Workstream:** WS7 — Startup RBAC Verification & Role Alias / Normalization Parity  
> **Primary Artifacts:** [`apps/backend/src/server.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/server.ts), [`apps/backend/src/rbac/rbac.middleware.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/rbac/rbac.middleware.ts), [`apps/backend/src/rbac/role-normalization.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/rbac/role-normalization.ts), [`apps/backend/src/modules/academic-management/services/teacher-context.service.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/academic-management/services/teacher-context.service.ts)  
> **Verification Status:** **PASSED** (`stage3-phase2-hardening.spec.ts` WS5/WS7 checks, `academic-phase9.spec.ts`, `admin-dashboard-rbac-realtime.spec.ts`)

---

## 1. Defects Resolved

1. **Invalid Startup RBAC Table Upserts ([`server.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/server.ts#L13-L34)):**
   - Replaced `runRBACSelfHealing()` (which attempted Supabase REST upserts against nonexistent `permissions` / `role_permissions` tables) with `verifyStartupRBACState()`: a strictly read-only Prisma query (`prisma.roles.findMany({ select: { role_id: true, role_name: true } })`) that logs canonical `normalizeRoleName()` coverage cleanly at startup without DDL/DML side effects.
2. **`COUNSELLOR` / `COUNSELOR` Alias Asymmetry ([`rbac.middleware.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/rbac/rbac.middleware.ts#L26-L27)):**
   - Added symmetric expansion for both spellings in `ROLE_ALIASES`:
     - `COUNSELLOR: ['COUNSELLOR', 'COUNSELOR']`
     - `COUNSELOR: ['COUNSELLOR', 'COUNSELOR']`
   - Verified `normalizeRoles(['super-admin'])` -> `['SUPERADMIN']` and `requireRole(['COUNSELLOR'])` accepts callers holding `['COUNSELOR']`.
3. **Unnormalized Teacher Context Role Checks ([`teacher-context.service.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/academic-management/services/teacher-context.service.ts)):**
   - Replaced raw uppercase comparisons with shared `normalizeRoles(roles)` from [`role-normalization.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/rbac/role-normalization.ts), ensuring consistent recognition of DB role labels (`Administrator`, `Principal`, `Head of Institute`, `Teacher`, `Faculty`, `Super Admin`) across backend services.

---

## 2. Documented External PostgreSQL Change Requests (Frozen Schema Constraint)

Per the Stage 3 Phase 2 Database Freeze, the following PG-side role-matching defects were **not** altered in SQL and remain documented for external DBA execution prior to Stage 3 stored-procedure execution by academic admins:

1. `public.auth_is_academic_admin`, `public.s35_apply_result_correction_approval`, and `public.s36_evaluate_assessment_mcq` use case-sensitive `ro.role_name IN ('admin', 'principal', 'coordinator', 'academic_coordinator')` whereas live `public.roles` stores `'Administrator'`, `'Principal'`, `'Super Admin'`.
2. Application-layer normalization (`normalizeRoleName` / `normalizeRoles` / `getEffectiveRoles`) enforces canonical case-insensitive matching safely across Express middleware and services.
