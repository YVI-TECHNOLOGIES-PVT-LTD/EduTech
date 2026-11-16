-- ============================================================================
-- EDUTRACK ERP — STAGE 3, PHASE 4.1 DBA CHANGE MANAGEMENT (READ-ONLY VERIFY)
-- File: 003_verify_s32_validate_activity.sql
-- Purpose: Non-destructive verification of public.s32_validate_activity() and
--          triggers attached to public.learning_activities.
-- ============================================================================

-- 1. Verify function existence, owner, security attributes, and SQL logic checks
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS identity_args,
  r.rolname AS owner_role,
  p.prosecdef AS is_security_definer,
  p.provolatile::text AS volatility,
  l.lanname AS language_name,
  p.proacl::text AS acl,
  (pg_get_functiondef(p.oid) LIKE '%s.org_id%') AS contains_invalid_s_org_id,
  (
    pg_get_functiondef(p.oid) LIKE '%academic_year_grades%'
    AND pg_get_functiondef(p.oid) LIKE '%academic_years%'
    AND pg_get_functiondef(p.oid) LIKE '%ay.org_id%'
  ) AS contains_valid_org_join
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_roles r ON r.oid = p.proowner
JOIN pg_language l ON l.oid = p.prolang
WHERE n.nspname = 'public'
  AND p.proname = 's32_validate_activity';

-- 2. Verify attached triggers on public.learning_activities remain present & enabled
SELECT
  c.relname AS table_name,
  t.tgname AS trigger_name,
  t.tgenabled::text AS trigger_enabled_code,
  CASE t.tgenabled
    WHEN 'O' THEN 'enabled_origin_local'
    WHEN 'A' THEN 'enabled_always'
    WHEN 'R' THEN 'enabled_replica'
    WHEN 'D' THEN 'disabled'
    ELSE 'unknown'
  END AS trigger_state_label,
  pg_get_triggerdef(t.oid, true) AS trigger_definition
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'learning_activities'
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- 3. Verify routine execute privileges remain intact
SELECT
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.routine_privileges
WHERE specific_schema = 'public'
  AND routine_name = 's32_validate_activity'
ORDER BY grantee, privilege_type;

