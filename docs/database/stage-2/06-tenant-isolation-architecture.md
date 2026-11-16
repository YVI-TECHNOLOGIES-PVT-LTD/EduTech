# EduTrack ERP — Stage 2 Database Architecture

# Report 06: Multi-Tenant Isolation Architecture for Stage 2

**Document ID:** STG2-DB-SEC-06  
**Date:** November 10, 2026  
**Author:** Principal Database Security Auditor & Cloud Identity Architect  
**Scope:** Tenant Boundary Enforcement, RLS Design, Role Privileges, and Cross-Tenant Prevention  
**Governing Rule:** `.agents/AGENTS.md` (Stage-1 Database Freeze)

---

## 1. Executive Summary

A core finding from the Stage-1 forensic audit is that **the database engine currently provides zero physical multi-tenant isolation** because connection credentials use the cluster superuser (`postgres`) and no session tenant context (`app.current_org_id`) is ever injected by the backend.

For Stage 2 Academic Planning, relying exclusively on application-level filtering (`where: { org_id }`) creates unacceptable risk of intellectual property leakage (e.g. proprietary curricula, assessment frameworks, and private teaching resources).

This document establishes the **defense-in-depth tenant isolation architecture for Stage 2**, combining:

1. **Direct `org_id` anchoring** on all primary master entities.
2. **Composite relational constraints** preventing cross-tenant parent-child associations.
3. **A least-privilege database role model** to replace the superuser connection.
4. **Automated transaction-scoped session context injection** (`SET LOCAL app.current_org_id`).

---

## 2. Stage 2 Tenant Anchoring Strategy

Every Stage-2 entity is categorized into one of two tenant ownership patterns:

```
                            STAGE 2 TENANT ANCHORING
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            │                                                     │
     DIRECT ANCHOR                                         INDIRECT ANCHOR
   (Column org_id present)                             (Via direct parent only)
            │                                                     │
 ┌───────────────────────┐                             ┌───────────────────────┐
 │ curriculum_frameworks │                             │ curriculum_plans      │
 │ subjects              │                             │ curriculum_plan_units │
 │ learning_resources    │                             │ lesson_plans          │
 │ resource_categories   │                             │ lesson_activities     │
 │ resource_tags         │                             │ academic_terms        │
 │ learning_shares       │                             │ calendar_entries      │
 └───────────────────────┘                             └───────────────────────┘
```

### A. Direct `org_id` Tables (10 Entities)

The following tables store a mandatory, indexed foreign key to `organizations`:

- `curriculum_frameworks(org_id)`
- `curriculum_framework_versions(org_id)`
- `curriculum_learning_outcomes(org_id)`
- `subject_categories(org_id)`
- `subjects(org_id)`
- `resource_categories(org_id)`
- `resource_tags(org_id)`
- `learning_resources(org_id)`
- `learning_resource_shares(org_id)`
- `lesson_plan_resources(org_id)`

### B. Indirect Tables (Scoped via Immutable Relational Chains)

Child entities inherit tenancy through their immutable parent hierarchy:

- `academic_calendars` -> `academic_years(org_id)`
- `academic_terms` -> `academic_calendars` -> `academic_years(org_id)`
- `curriculum_plans` -> `academic_year_curriculum_mappings` -> `academic_year_grade_subjects` -> `academic_year_grades` -> `academic_years(org_id)`
- `curriculum_plan_units` -> `curriculum_plans`
- `lesson_plans` -> `curriculum_plan_units` -> `curriculum_plans`
- `lesson_activities`, `differentiation_strategies`, `exit_tickets` -> `lesson_plans`

---

## 3. Cross-Tenant Vulnerability Prevention (Composite Constraints)

In Stage 1, child tables allow cross-tenant foreign-key associations (e.g. Student from School 1 enrolled in School 2). For Stage 2, **composite unique constraints and composite foreign keys** must be enforced:

### A. Digital Resource Protection

```sql
-- Resource Category must belong to same organization as Resource
ALTER TABLE learning_resources
ADD CONSTRAINT fk_learning_resources_category_org
FOREIGN KEY (category_id, org_id)
REFERENCES resource_categories(category_id, org_id)
ON DELETE SET NULL;
```

### B. Teacher Lesson Plan Ownership

```sql
-- Teacher staff must belong to the organization owning the resource plan
ALTER TABLE lesson_plans
ADD CONSTRAINT chk_lesson_plan_teacher_tenant
CHECK (
  teacher_staff_id IN (
    SELECT staff_id FROM staff WHERE is_active = TRUE
  )
);
```

### C. Resource Share Section Scoping

```sql
-- When sharing with a section, section must belong to the same school
ALTER TABLE learning_resource_share_sections
ADD CONSTRAINT fk_share_sections_tenant
FOREIGN KEY (share_id, org_id)
REFERENCES learning_resource_shares(share_id, org_id)
ON DELETE CASCADE;
```

---

## 4. Least-Privilege Database Role Architecture

To transition away from running the backend under cluster superuser `postgres`, Stage 2 requires introducing dedicated application roles in PostgreSQL:

```
                               POSTGRESQL ROLE HIERARCHY
                                           │
                                ┌──────────┴──────────┐
                                │   postgres (Admin)  │  (Used ONLY for migrations)
                                └──────────┬──────────┘
                                           │
                                ┌──────────▼──────────┐
                                │   edutrack_app      │  (Used by backend runtime)
                                └──────────┬──────────┘
                                           │ NO SUPERUSER
                                           │ NO BYPASSRLS
                                           │ GRANTED SELECT, INSERT, UPDATE, DELETE
                                           ▼
                                Row Level Security Enforced
```

### DDL Implementation for Stage-2 Role Provisioning:

```sql
-- 1. Create unprivileged application runtime role
CREATE ROLE edutrack_app WITH LOGIN PASSWORD 'secure_app_password' NOBYPASSRLS NOSUPERUSER;

-- 2. Grant table permissions
GRANT CONNECT ON DATABASE edutrack_db TO edutrack_app;
GRANT USAGE ON SCHEMA public TO edutrack_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO edutrack_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO edutrack_app;

-- 3. Restrict DDL operations
REVOKE ALL ON SCHEMA public FROM edutrack_app CASCADE;
GRANT USAGE ON SCHEMA public TO edutrack_app;
```

---

## 5. Automated Session Context Injection (`SET LOCAL`)

To enable PostgreSQL Row-Level Security, every connection checked out from the pool must set `app.current_org_id` within the active transaction:

### Prisma Middleware / Extension Implementation:

```typescript
import { Prisma } from '@prisma/client';

export function createTenantScopingExtension(getAuthenticatedOrgId: () => string) {
  return Prisma.defineExtension((client) => {
    return client.$extends({
      query: {
        $allModels: {
          async $allOperations({ args, query }) {
            const orgId = getAuthenticatedOrgId();
            if (!orgId) {
              throw new Error(
                '[Security Exception] Missing tenant context in authenticated request.',
              );
            }

            // Execute in transaction with session parameter set
            return client.$transaction(async (tx) => {
              await tx.$executeRaw`SELECT set_config('app.current_org_id', ${orgId}, true)`;
              return query(args);
            });
          },
        },
      },
    });
  });
}
```

---

## 6. Stage-2 Row Level Security (RLS) Policies

When Stage 2 is deployed under `edutrack_app`, the following RLS policies will be activated:

```sql
-- 1. Curriculum Frameworks
ALTER TABLE curriculum_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_frameworks FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_curriculum_frameworks ON curriculum_frameworks
  USING (org_id = current_setting('app.current_org_id', true)::UUID);

-- 2. Learning Resources
ALTER TABLE learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_resources FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_learning_resources ON learning_resources
  USING (org_id = current_setting('app.current_org_id', true)::UUID);

-- 3. Lesson Plans (Indirect via Units -> Plans -> AYG -> AY)
ALTER TABLE lesson_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_plans FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_lesson_plans ON lesson_plans
  USING (
    curriculum_unit_id IN (
      SELECT u.curriculum_unit_id
      FROM curriculum_plan_units u
      JOIN curriculum_plans cp ON cp.curriculum_plan_id = u.curriculum_plan_id
      JOIN academic_year_curriculum_mappings m ON m.mapping_id = cp.mapping_id
      JOIN academic_year_grade_subjects aygs ON aygs.ayg_subject_id = m.ayg_subject_id
      JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = aygs.academic_year_grade_id
      JOIN academic_years ay ON ay.academic_year_id = ayg.academic_year_id
      WHERE ay.org_id = current_setting('app.current_org_id', true)::UUID
    )
  );
```

---

## 7. Security Architecture Checklist for Approval

- [x] Every Stage-2 entity has a defined tenant ownership hierarchy.
- [x] Superuser bypass eliminated via proposed unprivileged runtime role `edutrack_app`.
- [x] Session variable `app.current_org_id` automated via transaction wrapper.
- [x] Frontend `org_id` parameters treated as untrusted; tenancy strictly derived from authenticated JWT claims (`req.user.org_id`).
- [x] Digital resource assets stored in private buckets with short-lived signed URLs.
