-- ============================================================================
-- EduTrack ERP — Stage-2 Phase 1: Read-Only Database Verification Queries
-- Document ID: docs/stage-2/phase-1/13_read_only_database_verification_queries.sql
-- Phase: Stage-2 Phase 1: Foundation & Database Contract Verification
-- Author: Senior PostgreSQL Database Architect & Lead Data Governance Auditor
-- Date: November 2026
--
-- GOVERNANCE NOTICE:
-- THIS SCRIPT CONTAINS ONLY READ-ONLY SELECT QUERIES AGAINST SYSTEM CATALOGS.
-- ABSOLUTELY ZERO DDL, ZERO DML, AND ZERO MUTATIONS ARE CONTAINED HEREIN.
-- RUN THIS SCRIPT AGAINST A POSTGRESQL INSTANCE TO AUDIT CATALOG STATE SAFELY.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PHYSICAL TABLE INVENTORY
-- Lists all user-defined base tables in the public schema with row estimates.
-- ----------------------------------------------------------------------------
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity
FROM pg_catalog.pg_tables
WHERE schemaname = 'public'
ORDER BY tablename ASC;

-- ----------------------------------------------------------------------------
-- 2. STAGE 1 VS STAGE 2 TABLE EXISTENCE AUDIT
-- Checks existence of all 33 Stage-1 tables and 34 Stage-2 models.
-- ----------------------------------------------------------------------------
WITH expected_tables(tablename, stage) AS (
    VALUES
        -- Stage 1 Core Tables (33)
        ('organizations', 'Stage 1'),
        ('users', 'Stage 1'),
        ('roles', 'Stage 1'),
        ('user_roles', 'Stage 1'),
        ('designations', 'Stage 1'),
        ('departments', 'Stage 1'),
        ('staff', 'Stage 1'),
        ('parents', 'Stage 1'),
        ('academic_years', 'Stage 1'),
        ('admission_configurations', 'Stage 1'),
        ('grades', 'Stage 1'),
        ('academic_year_grades', 'Stage 1'),
        ('sections', 'Stage 1'),
        ('leads', 'Stage 1'),
        ('lead_activities', 'Stage 1'),
        ('chatbot_sessions', 'Stage 1'),
        ('chatbot_messages', 'Stage 1'),
        ('lead_visits', 'Stage 1'),
        ('admissions_applications', 'Stage 1'),
        ('document_types', 'Stage 1'),
        ('admission_documents', 'Stage 1'),
        ('assessment_configurations', 'Stage 1'),
        ('application_assessments', 'Stage 1'),
        ('admission_decisions', 'Stage 1'),
        ('admission_fee_payments', 'Stage 1'),
        ('students', 'Stage 1'),
        ('student_parents', 'Stage 1'),
        ('student_enrollments', 'Stage 1'),
        ('notifications', 'Stage 1'),
        ('countries', 'Stage 1'),
        ('lead_query_types', 'Stage 1'),
        ('lead_query_type_mappings', 'Stage 1'),
        ('document_chunks', 'Stage 1'),

        -- Stage 2 Academic Planning Models (34)
        ('academic_calendars', 'Stage 2'),
        ('academic_calendar_entries', 'Stage 2'),
        ('academic_calendar_entry_grades', 'Stage 2'),
        ('academic_calendar_working_days', 'Stage 2'),
        ('academic_calendar_publication_history', 'Stage 2'),
        ('academic_terms', 'Stage 2'),
        ('academic_year_curriculum_mappings', 'Stage 2'),
        ('academic_year_grade_subjects', 'Stage 2'),
        ('curriculum_frameworks', 'Stage 2'),
        ('curriculum_framework_versions', 'Stage 2'),
        ('curriculum_plans', 'Stage 2'),
        ('curriculum_plan_units', 'Stage 2'),
        ('curriculum_learning_outcomes', 'Stage 2'),
        ('subjects', 'Stage 2'),
        ('subject_categories', 'Stage 2'),
        ('subject_selection_groups', 'Stage 2'),
        ('subject_selection_group_options', 'Stage 2'),
        ('learning_resources', 'Stage 2'),
        ('learning_resource_grades', 'Stage 2'),
        ('learning_resource_recipients', 'Stage 2'),
        ('learning_resource_shares', 'Stage 2'),
        ('learning_resource_share_sections', 'Stage 2'),
        ('learning_resource_subjects', 'Stage 2'),
        ('learning_resource_tags', 'Stage 2'),
        ('resource_categories', 'Stage 2'),
        ('resource_tags', 'Stage 2'),
        ('lesson_plans', 'Stage 2'),
        ('lesson_activities', 'Stage 2'),
        ('lesson_differentiation_strategies', 'Stage 2'),
        ('lesson_exit_tickets', 'Stage 2'),
        ('lesson_plan_outcomes', 'Stage 2'),
        ('lesson_plan_resources', 'Stage 2'),
        ('section_subject_faculty_assignments', 'Stage 2'),
        ('staff_subject_qualifications', 'Stage 2'),
        ('staff_unavailable_slots', 'Stage 2')
)
SELECT 
    e.stage,
    e.tablename,
    CASE WHEN t.table_name IS NOT NULL THEN 'PRESENT IN LIVE DB' ELSE 'ABSENT FROM LIVE DB' END AS live_db_status
FROM expected_tables e
LEFT JOIN information_schema.tables t 
    ON t.table_schema = 'public' 
    AND t.table_name = e.tablename
ORDER BY e.stage ASC, live_db_status DESC, e.tablename ASC;

-- ----------------------------------------------------------------------------
-- 3. COLUMN CATALOG & DATA TYPES
-- Inspects column declarations, types, nullability, and defaults for public tables.
-- ----------------------------------------------------------------------------
SELECT 
    table_name,
    ordinal_position,
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name ASC, ordinal_position ASC;

-- ----------------------------------------------------------------------------
-- 4. PRIMARY KEY CONSTRAINTS
-- Verifies primary key column mappings across public tables.
-- ----------------------------------------------------------------------------
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name ASC, kcu.ordinal_position ASC;

-- ----------------------------------------------------------------------------
-- 5. FOREIGN KEY CONSTRAINTS & REFERENTIAL INTEGRITY
-- Audits foreign key references, source columns, target tables, and ON DELETE actions.
-- ----------------------------------------------------------------------------
SELECT 
    tc.table_name AS source_table,
    kcu.column_name AS source_column,
    tc.constraint_name,
    ccu.table_name AS target_table,
    ccu.column_name AS target_column,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON rc.unique_constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name ASC, kcu.column_name ASC;

-- ----------------------------------------------------------------------------
-- 6. UNIQUE CONSTRAINTS AUDIT
-- Lists unique constraints across public tables.
-- ----------------------------------------------------------------------------
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name ASC, tc.constraint_name ASC, kcu.ordinal_position ASC;

-- ----------------------------------------------------------------------------
-- 7. CHECK CONSTRAINTS AUDIT
-- Lists check constraints and their validation clauses.
-- ----------------------------------------------------------------------------
SELECT 
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name ASC;

-- ----------------------------------------------------------------------------
-- 8. INDEX COVERAGE AUDIT
-- Audits all indexes, uniqueness, and column definitions.
-- ----------------------------------------------------------------------------
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_catalog.pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename ASC, indexname ASC;

-- ----------------------------------------------------------------------------
-- 9. CUSTOM ENUM TYPES AUDIT
-- Lists all user-defined enum types and their declared label values.
-- ----------------------------------------------------------------------------
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value,
    e.enumsortorder AS sort_order
FROM pg_catalog.pg_type t
JOIN pg_catalog.pg_enum e ON t.oid = e.enumtypid
JOIN pg_catalog.pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY t.typname ASC, e.enumsortorder ASC;

-- ----------------------------------------------------------------------------
-- 10. ACTIVE DATABASE TRIGGERS AUDIT
-- Lists all active triggers, event timing (BEFORE/AFTER), and target tables.
-- ----------------------------------------------------------------------------
SELECT 
    event_object_table AS table_name,
    trigger_name,
    event_manipulation AS event,
    action_timing AS timing,
    action_statement AS statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table ASC, trigger_name ASC;

-- ----------------------------------------------------------------------------
-- 11. ROW-LEVEL SECURITY (RLS) STATUS AUDIT
-- Audits RLS enablement on all tables and lists all active RLS policies.
-- ----------------------------------------------------------------------------
SELECT 
    c.relname AS table_name,
    c.relrowsecurity AS rls_enabled,
    c.relforcerowsecurity AS rls_forced,
    p.polname AS policy_name,
    p.polcmd AS command,
    pg_get_expr(p.polqual, p.polrelid) AS using_expression,
    pg_get_expr(p.polwithcheck, p.polrelid) AS with_check_expression
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
LEFT JOIN pg_catalog.pg_policy p ON c.oid = p.polrelid
WHERE n.nspname = 'public'
    AND c.relkind = 'r'
ORDER BY c.relname ASC, p.polname ASC;

-- ----------------------------------------------------------------------------
-- 12. DATABASE ROLES & CURRENT USER PRIVILEGES AUDIT
-- Audits the active session role, superuser status, and catalog permissions.
-- ----------------------------------------------------------------------------
SELECT 
    current_user AS session_user,
    session_user AS logged_in_user,
    current_database() AS database_name,
    current_schema() AS active_schema,
    usesuper AS is_superuser
FROM pg_catalog.pg_user
WHERE usename = current_user;

