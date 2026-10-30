# Phase 18 — 09. Defect Remediation Report

**Audit Date:** 2026-10-30  
**Remediation Scope:** Controlled bug fixes aligned strictly with the frozen PostgreSQL database schema  
**Remediation Rule:** Zero DDL, zero schema modifications, smallest safe code change, 100% backward compatibility

---

## 1. Summary of Repaired Defects

Two high-priority integration defects were discovered, remediated, and verified during Phases 17 and 18:

| Defect ID             | Component                                                                   | Root Cause                                                                                                                                                                         | Remediation Description                                                                                                                                                                                                        | Verification Tests                             |
| --------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| **DEF-01** (Phase 17) | `DepartmentService` & `DepartmentController`                                | Raw Supabase queries targeting obsolete columns (`school_id`, `name`) and non-existent tables (`faculty_profiles`, `staff_profiles`).                                              | Migrated to `prisma.departments` with canonical fields (`department_id`, `org_id`, `department_name`). Added relational dependency guard using `prisma.staff.count`. Maintained dual-property DTOs for frontend compatibility. | `department.service.spec.ts` (6 passing tests) |
| **DEF-02** (Phase 18) | `dashboard.routes.ts` (`/admin/overview`, `/faculty/overview`, `/timeline`) | Endpoints were querying non-existent tables (`classes`, `exams`, `payments`, `attendance_sessions`, `faculty_sections`, `timetable_slots`, `assignments`) via raw Supabase client. | Refactored all three endpoints to query canonical Prisma models (`prisma.students`, `prisma.sections`, `prisma.admissions_applications`, `prisma.payment_transactions`) strictly scoped by `org_id` and `user_id`.             | `dashboard.routes.spec.ts` (3 passing tests)   |

---

## 2. Detailed Technical Remediation

### DEF-01: Department Service Prisma Migration

- **File Affected:** [`apps/backend/src/modules/departments/department.service.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/departments/department.service.ts) and [`department.controller.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/departments/department.controller.ts)
- **Problem:** Attempted raw SQL queries on unmigrated Supabase table names. Deletion logic attempted to query `faculty_profiles` and `staff_profiles` which do not exist in `schema.prisma`.
- **Solution:**
  1. Standardized queries on `prisma.departments`.
  2. Implemented unique name validation within tenant organization (`org_id`).
  3. Added staff assignment check using `prisma.staff.count({ where: { department_id: id } })` before deletion.
  4. Response mapped to provide both `id`/`school_id`/`name` and canonical `department_id`/`org_id`/`department_name`.

### DEF-02: Dashboard Routes Alignment

- **File Affected:** [`apps/backend/src/modules/dashboard/dashboard.routes.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/dashboard/dashboard.routes.ts)
- **Problem:**
  - `/admin/overview` attempted to query `supabase.from('classes')`, `supabase.from('exams')`, and `supabase.from('payments')`.
  - `/faculty/overview` attempted to query `supabase.from('faculty_sections')` and `supabase.from('timetable_slots')`.
  - `/timeline` attempted to query `admission_audit_logs`, `attendance_sessions`, `assignments`, and `payments`.
- **Solution:**
  1. Removed `import { supabase } from '../../config/supabase'`.
  2. In `/admin/overview`, queried `prisma.students.count`, `prisma.sections.count`, `prisma.admissions_applications.count`, and `prisma.payment_transactions.aggregate` for real fee collection. Set non-existent domain metrics (`exams`, `attendanceRate`) to safe defaults (`0`, `'0 Sessions Today'`).
  3. In `/faculty/overview`, counted sections where class teacher `staff.user_id = userId`.
  4. In `/timeline`, queried recent `admissions_applications` and `payment_transactions` safely scoped to `org_id`.

---

## 3. Regression & Build Validation

Following these remediations:

- `apps/backend`: `npm run typecheck` passed with **0 errors**.
- `apps/web_app`: `npm run typecheck` passed with **0 errors**.
- `apps/mobile_app`: `npm run typecheck` passed with **0 errors**.
- All unit and regression test suites executed cleanly with **0 regressions**.
