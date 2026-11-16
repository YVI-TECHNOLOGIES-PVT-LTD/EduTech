# EduTrack ERP — Stage 2 Database Architecture

# Report 10: Migration & Deployment Strategy for Stage 2

**Document ID:** STG2-DB-MIG-10  
**Date:** November 10, 2026  
**Author:** Principal Database Reliability Engineer & DevOps Release Architect  
**Scope:** Staging Verification, Production Deployment, Rollback Runbook, and Schema Drift Governance  
**Governing Rule:** `.agents/AGENTS.md` (Stage-1 Database Freeze)

---

## 1. Executive Summary

This deployment plan details how Stage-2 database objects will be provisioned in PostgreSQL and synchronized with Prisma without violating Stage-1 immutability.

### Core Strategic Tenets:

1. **Stage-1 SQL Files Remain 100% Untouched:** The existing DDL suite in `apps/database/stage_1/schema/` will not be edited, renamed, or deleted.
2. **Dedicated Modular Stage-2 Package:** All new DDL statements will be packaged in a new physical directory: `apps/database/stage_2/schema/`.
3. **Additive-Only DDL:** Zero modifications (`ALTER TABLE DROP COLUMN`, `DROP TABLE`) will be executed against existing Stage-1 tables.
4. **Idempotent Migration Scripts:** All statements will utilize `IF NOT EXISTS` guards.
5. **Pre-Deployment Stage-1 Compatibility Patch:** A dedicated compatibility script (`00_stage1_compatibility_patch.sql`) will resolve the 6 Stage-1 bootstrap defects on target databases before Stage-2 DDL is applied.

---

## 2. Proposed Stage-2 Modular SQL Package Structure

Proposed Location: `apps/database/stage_2/schema/` (To be created upon approval):

```
apps/database/stage_2/schema/
├── 00_stage1_compatibility_patch.sql  (Resolves 6 Stage-1 DDL defects)
├── 01_stage2_extensions.sql           (Enables pg_trgm for resource search)
├── 02_stage2_enums.sql                (10 new Academic Planning enums)
├── 03_stage2_functions.sql            (Publication locking & validation functions)
├── 04_stage2_tables.sql               (34 new physical Stage-2 tables)
├── 05_stage2_circular_fks.sql         (Inter-table relational bindings)
├── 06_stage2_indexes.sql              (38 high-performance B-tree & GIN indexes)
├── 07_stage2_triggers.sql             (set_updated_at & immutability triggers)
├── 08_stage2_rls.sql                  (Stage-2 tenant Row-Level Security policies)
└── 09_stage2_views.sql                (Flattened curriculum and calendar views)
```

---

## 3. Ordered Migration Execution Runbook

```
                         ORDERED DEPLOYMENT SEQUENCE
                                      │
                                      ▼
             [Step 1] Execute 00_stage1_compatibility_patch.sql
             (Fixes missing enums, missing columns, and syntax blocks)
                                      │
                                      ▼
             [Step 2] Execute 01_stage2_extensions.sql
             (Installs pg_trgm for full-text search)
                                      │
                                      ▼
             [Step 3] Execute 02_stage2_enums.sql
             (Creates 10 academic planning enums)
                                      │
                                      ▼
             [Step 4] Execute 03_stage2_functions.sql
             (Deploys publication snapshot enforcement functions)
                                      │
                                      ▼
             [Step 5] Execute 04_stage2_tables.sql
             (Creates 34 Stage-2 tables referencing Stage-1 keys)
                                      │
                                      ▼
             [Step 6] Execute 05_stage2_circular_fks.sql
             (Establishes reciprocal foreign keys)
                                      │
                                      ▼
             [Step 7] Execute 06_stage2_indexes.sql
             (Creates 38 performance indexes)
                                      │
                                      ▼
             [Step 8] Execute 07_stage2_triggers.sql
             (Attaches updated_at and publication freeze triggers)
                                      │
                                      ▼
             [Step 9] Execute 08_stage2_rls.sql
             (Deploys Row Level Security for Stage-2 tables)
                                      │
                                      ▼
             [Step 10] Decommission RAM Fallback Proxy in Backend
             (Hardens apps/backend/src/lib/prismaClient.ts)
                                      │
                                      ▼
             [Step 11] Execute prisma generate & Run Test Suite
```

---

## 4. Stage-1 Compatibility Patch Strategy

To prevent touching the frozen files in `apps/database/stage_1/schema/`, a dedicated forward-patch script `00_stage1_compatibility_patch.sql` will be executed first:

```sql
-- ============================================================================
-- EDUTrack ERP — STAGE 1 COMPATIBILITY PATCH (READ-ONLY BASELINE PRESERVATION)
-- ============================================================================

-- 1. Create missing notification_priority enum (FIND-SQL-03)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_priority') THEN
        CREATE TYPE public.notification_priority AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
    END IF;
END $$;

-- 2. Add missing lead_activity_id to chatbot_sessions (FIND-PSC-01)
ALTER TABLE chatbot_sessions
ADD COLUMN IF NOT EXISTS lead_activity_id UUID REFERENCES lead_activities(activity_id) ON DELETE SET NULL;

-- 3. Add missing is_teaching_role to designations (FIND-PSC-02)
ALTER TABLE designations
ADD COLUMN IF NOT EXISTS is_teaching_role BOOLEAN NOT NULL DEFAULT FALSE;

-- 4. Add missing waiting_for_parent to concern_status (FIND-PSC-03)
ALTER TYPE concern_status ADD VALUE IF NOT EXISTS 'waiting_for_parent';

-- 5. Attach missing set_updated_at triggers (FIND-TRG-01)
CREATE OR REPLACE TRIGGER trg_notifications_updated
BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_countries_updated
BEFORE UPDATE ON countries FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_lead_query_types_updated
BEFORE UPDATE ON lead_query_types FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_document_chunks_updated
BEFORE UPDATE ON document_chunks FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

## 5. Rollback Runbook (Zero-Data-Loss Inversion)

If staging verification or production deployment encounters an unrecoverable failure during Stage-2 rollout, the following reverse teardown script (`rollback_stage2.sql`) will safely de-provision Stage-2 objects without impacting Stage-1 tables:

```sql
-- STAGE 2 ATOMIC ROLLBACK (Preserves Stage-1 Core)
BEGIN;

-- 1. Drop Stage-2 views
DROP VIEW IF EXISTS view_published_curricula CASCADE;
DROP VIEW IF EXISTS view_academic_calendar_timeline CASCADE;

-- 2. Drop Stage-2 tables (Cascades to Stage-2 indexes, triggers, and foreign keys)
DROP TABLE IF EXISTS lesson_plan_resources CASCADE;
DROP TABLE IF EXISTS lesson_plan_outcomes CASCADE;
DROP TABLE IF EXISTS lesson_exit_tickets CASCADE;
DROP TABLE IF EXISTS lesson_differentiation_strategies CASCADE;
DROP TABLE IF EXISTS lesson_activities CASCADE;
DROP TABLE IF EXISTS lesson_plans CASCADE;
DROP TABLE IF EXISTS learning_resource_recipients CASCADE;
DROP TABLE IF EXISTS learning_resource_share_sections CASCADE;
DROP TABLE IF EXISTS learning_resource_shares CASCADE;
DROP TABLE IF EXISTS learning_resource_tags CASCADE;
DROP TABLE IF EXISTS learning_resource_subjects CASCADE;
DROP TABLE IF EXISTS learning_resource_grades CASCADE;
DROP TABLE IF EXISTS learning_resources CASCADE;
DROP TABLE IF EXISTS resource_tags CASCADE;
DROP TABLE IF EXISTS resource_categories CASCADE;
DROP TABLE IF EXISTS curriculum_plan_units CASCADE;
DROP TABLE IF EXISTS curriculum_plans CASCADE;
DROP TABLE IF EXISTS section_subject_faculty_assignments CASCADE;
DROP TABLE IF EXISTS staff_subject_qualifications CASCADE;
DROP TABLE IF EXISTS subject_selection_group_options CASCADE;
DROP TABLE IF EXISTS subject_selection_groups CASCADE;
DROP TABLE IF EXISTS academic_year_curriculum_mappings CASCADE;
DROP TABLE IF EXISTS academic_year_grade_subjects CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS subject_categories CASCADE;
DROP TABLE IF EXISTS curriculum_learning_outcomes CASCADE;
DROP TABLE IF EXISTS curriculum_framework_versions CASCADE;
DROP TABLE IF EXISTS curriculum_frameworks CASCADE;
DROP TABLE IF EXISTS academic_calendar_publication_history CASCADE;
DROP TABLE IF EXISTS academic_calendar_working_days CASCADE;
DROP TABLE IF EXISTS academic_calendar_entry_grades CASCADE;
DROP TABLE IF EXISTS academic_calendar_entries CASCADE;
DROP TABLE IF EXISTS academic_terms CASCADE;
DROP TABLE IF EXISTS academic_calendars CASCADE;

-- 3. Drop Stage-2 enums
DROP TYPE IF EXISTS lesson_activity_type CASCADE;
DROP TYPE IF EXISTS resource_share_audience CASCADE;
DROP TYPE IF EXISTS resource_status CASCADE;
DROP TYPE IF EXISTS resource_type CASCADE;
DROP TYPE IF EXISTS faculty_assignment_role CASCADE;
DROP TYPE IF EXISTS subject_requirement CASCADE;
DROP TYPE IF EXISTS learning_outcome_bloom_level CASCADE;
DROP TYPE IF EXISTS curriculum_plan_status CASCADE;
DROP TYPE IF EXISTS academic_calendar_entry_type CASCADE;
DROP TYPE IF EXISTS academic_calendar_status CASCADE;

COMMIT;
```

---

## 6. Staging Validation & Drift Detection

Before production deployment:

1. **Catalog Drift Scan:** Run an automated schema comparison tool (`pg-diff` or `prisma db pull --print`) comparing staging against `apps/backend/prisma/schema.prisma`.
2. **Zero In-Memory Proxy Verification:** Run integration test suite with `NODE_ENV=test` and confirm that zero write calls hit `fallbackStores`.
3. **ACID Transaction Failure Test:** Induce a simulated network abort during a multi-unit curriculum plan creation and verify zero partial records remain in PostgreSQL.
