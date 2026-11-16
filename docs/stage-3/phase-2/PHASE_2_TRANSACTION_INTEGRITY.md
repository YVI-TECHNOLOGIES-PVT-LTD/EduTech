# EduTrack ERP — Stage 3 Phase 2: Transaction Integrity & Identity Boundaries Report (WS8 & WS10)

> **Workstreams:** WS8 (Transactional Integrity & Row-Level Serialization) & WS10 (Eliminate Silent Staff/Teacher Identity Impersonation)  
> **Primary Artifacts:**
>
> - [`apps/backend/src/modules/academic-management/services/learning-resource.service.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/academic-management/services/learning-resource.service.ts)
> - [`apps/backend/src/modules/academic-management/repositories/learning-resource.repository.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/academic-management/repositories/learning-resource.repository.ts)
> - [`apps/backend/src/modules/academic-management/repositories/academic-year.repository.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/academic-management/repositories/academic-year.repository.ts)
> - [`apps/backend/src/modules/academic-management/repositories/curriculum.repository.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/academic-management/repositories/curriculum.repository.ts)
> - [`apps/backend/src/modules/student-management/services/student.service.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/student-management/services/student.service.ts)  
>   **Verification Status:** **PASSED** (`stage3-phase2-hardening.spec.ts` WS8/WS10 atomic rollback & missing-identity tests, `verify_concurrency.ts`, `academic-phase4.spec.ts` `35/35`, `academic-phase5.spec.ts` `42/42`)

---

## 1. Atomic Transactions Implemented

### 1.1 Learning Resource + Grade Visibility Sync (`LearningResourceService` & `LearningResourceRepository`)

- Updated `LearningResourceRepository.create()`, `update()`, and `syncGrades()` to accept an optional transactional `dbClient: any = prisma`.
- Wrapped resource creation + grade mapping (`createResource` for both `resource_type: 'file'` and `'external_link'`) and resource updates + grade synchronization inside `prisma.$transaction(async (tx) => ...)`.
- **Verified in [`stage3-phase2-hardening.spec.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/tests/stage3-phase2-hardening.spec.ts):** when `syncGrades` fails mid-transaction, the parent `learning_resources` row is completely rolled back from PostgreSQL (`0` orphan rows left behind).

### 1.2 Student Conversion & Enrollment Boundary ([`student.service.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/student-management/services/student.service.ts))

- Moved `parents.findFirst` / `parents.create` inside the same `prisma.$transaction` wrapping `students.create`, `student_parents.upsert`, `student_enrollments.create`, `admissions_applications.update`, and `leads.update` inside `enrollFromApplication`.
- Eliminates orphaned `parents` rows if downstream student or enrollment creation fails.

### 1.3 Concurrency Serialization & Row Locks

- **`AcademicYearRepository.setCurrent` ([`academic-year.repository.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/academic-management/repositories/academic-year.repository.ts#L177-L190)):** Serializes concurrent current-year transitions per tenant via `SELECT pg_advisory_xact_lock(hashtext($1))` keyed by `academic_year_current:${orgId}` inside `prisma.$transaction`. Verified by [`verify_concurrency.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/academic-management/tests/verify_concurrency.ts) (`[SINGLE ACTIVE YEAR MAINTAINED]: Exactly 1 year has status = "teaching"`).
- **`CurriculumRepository.updateStatus` & `updatePlan` ([`curriculum.repository.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/academic-management/repositories/curriculum.repository.ts#L299-L424)):** Lock target `curriculum_plans` rows via `SELECT ... FOR UPDATE` inside `prisma.$transaction` before applying lifecycle transitions (`draft` -> `review` -> `approved` -> `published` -> `archived`) or metadata updates.

---

## 2. Staff / Teacher Identity Integrity (WS10)

- Eliminated `findFirstActiveStaff` impersonation fallback in [`LearningResourceService.createResource`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/academic-management/services/learning-resource.service.ts#L92-L115):
  - `uploaded_by_staff_id` is accepted only if validated as an active staff member belonging to `orgId` (`400 INVALID_STAFF` otherwise).
  - Otherwise resolves strictly from the authenticated caller's own `userId` (`findStaffByUserId(orgId, userId)`).
  - Missing staff linkage fails closed with HTTP `403` (`code: 'STAFF_PROFILE_REQUIRED'`) instead of attributing content to an unrelated colleague.
- Updated `academic-phase4.spec.ts` to cover `403 STAFF_PROFILE_REQUIRED` rejection cleanly (`35/35` passing).
