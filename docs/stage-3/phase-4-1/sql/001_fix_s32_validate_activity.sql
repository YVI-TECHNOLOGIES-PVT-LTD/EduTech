-- ============================================================================
-- EDUTRACK ERP — STAGE 3, PHASE 4.1 DBA CHANGE MANAGEMENT (FORWARD SCRIPT)
-- File: 001_fix_s32_validate_activity.sql
-- Target Object: public.s32_validate_activity() (OID captured pre-change: 39803)
-- Attached Trigger: trg_s32_validate_activity ON public.learning_activities
-- Governance: Stage 3 Frozen Schema Freeze — DBA-Authorized Targeted Remediation Only
--
-- Description:
--   Replaces invalid column reference s.org_id on public.sections with the
--   authoritative tenant-resolution join:
--     public.sections s
--       -> public.academic_year_grades ayg ON ayg.academic_year_grade_id = s.academic_year_grade_id
--       -> public.academic_years ay ON ay.academic_year_id = ayg.academic_year_id
--   selecting ay.org_id into v_assignment.org_id.
--   All remaining trigger validation rules, owner, security mode, and grants
--   are preserved verbatim. Trigger trg_s32_validate_activity remains attached.
-- ============================================================================

BEGIN;

-- 1. Pre-flight check: verify target function and trigger exist before replacing
DO $$
BEGIN
  IF to_regprocedure('public.s32_validate_activity()') IS NULL THEN
    RAISE EXCEPTION 'Target function public.s32_validate_activity() does not exist; aborting deployment.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'learning_activities'
      AND t.tgname = 'trg_s32_validate_activity'
      AND NOT t.tgisinternal
  ) THEN
    RAISE EXCEPTION 'Expected trigger trg_s32_validate_activity on public.learning_activities does not exist; aborting deployment.';
  END IF;
END
$$;

-- 2. Targeted function replacement preserving exact signature, attributes, and business logic
CREATE OR REPLACE FUNCTION public.s32_validate_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 VOLATILE
 SECURITY INVOKER
AS $function$
DECLARE
  v_assignment RECORD;
  v_creator_org UUID;
  v_lesson RECORD;
BEGIN
  SELECT f.section_id, f.academic_year_grade_subject_id, f.staff_id,
         f.is_active, f.effective_from, f.effective_to,
         ay.org_id, s.academic_year_grade_id,
         aygs.academic_year_grade_id AS subject_grade_id
    INTO v_assignment
  FROM public.section_subject_faculty_assignments f
  JOIN public.sections s ON s.section_id = f.section_id
  JOIN public.academic_year_grades ayg
    ON ayg.academic_year_grade_id = s.academic_year_grade_id
  JOIN public.academic_years ay
    ON ay.academic_year_id = ayg.academic_year_id
  JOIN public.academic_year_grade_subjects aygs
    ON aygs.academic_year_grade_subject_id = f.academic_year_grade_subject_id
  WHERE f.faculty_assignment_id = NEW.faculty_assignment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Faculty assignment not found';
  END IF;
  IF v_assignment.org_id <> NEW.org_id THEN
    RAISE EXCEPTION 'Activity organization does not match section organization';
  END IF;
  IF v_assignment.section_id <> NEW.section_id OR
     v_assignment.academic_year_grade_subject_id <> NEW.academic_year_grade_subject_id THEN
    RAISE EXCEPTION 'Activity section/subject does not match faculty assignment';
  END IF;
  IF v_assignment.academic_year_grade_id <> v_assignment.subject_grade_id THEN
    RAISE EXCEPTION 'Section and subject offering belong to different academic-year grades';
  END IF;
  IF v_assignment.staff_id <> NEW.created_by_staff_id THEN
    RAISE EXCEPTION 'Only the assigned subject teacher can create/manage this activity';
  END IF;
  IF NEW.assigned_at::date < v_assignment.effective_from OR
     (v_assignment.effective_to IS NOT NULL AND NEW.assigned_at::date > v_assignment.effective_to) THEN
    RAISE EXCEPTION 'Faculty assignment was not effective on the activity assignment date';
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NOT v_assignment.is_active THEN
      RAISE EXCEPTION 'Faculty assignment must be active when the activity is created';
    END IF;
  ELSIF NEW.activity_status = 'published' AND OLD.activity_status <> 'published' THEN
    IF NOT v_assignment.is_active THEN
      RAISE EXCEPTION 'Faculty assignment must be active when the activity is published';
    END IF;
  END IF;

  SELECT org_id INTO v_creator_org FROM public.staff
   WHERE staff_id = NEW.created_by_staff_id AND is_active = TRUE;
  IF v_creator_org IS DISTINCT FROM NEW.org_id THEN
    RAISE EXCEPTION 'Activity creator is inactive or belongs to another organization';
  END IF;

  IF NEW.lesson_plan_id IS NOT NULL THEN
    SELECT lp.teacher_staff_id, cp.academic_year_grade_subject_id, cp.org_id
      INTO v_lesson
    FROM public.lesson_plans lp
    JOIN public.curriculum_plan_units cpu ON cpu.curriculum_unit_id = lp.curriculum_unit_id
    JOIN public.curriculum_plans cp ON cp.curriculum_plan_id = cpu.curriculum_plan_id
    WHERE lp.lesson_plan_id = NEW.lesson_plan_id;
    IF NOT FOUND OR v_lesson.teacher_staff_id <> NEW.created_by_staff_id OR
       v_lesson.academic_year_grade_subject_id <> NEW.academic_year_grade_subject_id OR
       v_lesson.org_id <> NEW.org_id THEN
      RAISE EXCEPTION 'Linked lesson plan must match the assigned teacher, subject offering and organization';
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.activity_status <> 'draft' THEN
      RAISE EXCEPTION 'Activities must be created as draft';
    END IF;
  ELSE
    -- The creator staff id is immutable; updates must still be made by that teacher.
    IF NEW.created_by_staff_id <> OLD.created_by_staff_id THEN
      RAISE EXCEPTION 'Activity creator cannot be changed';
    END IF;
    IF OLD.activity_status = 'closed' AND NEW.activity_status = 'published'
       AND NEW.due_at <= now() AND
       (NEW.late_submission_authorized_until IS NULL OR NEW.late_submission_authorized_until <= now()) THEN
      RAISE EXCEPTION 'Reopening a closed activity requires a future deadline or late-submission authorization';
    END IF;
    IF OLD.activity_status = 'published' AND NEW.activity_status = 'draft' THEN
      RAISE EXCEPTION 'Published activities cannot return to draft';
    END IF;
  END IF;

  IF NEW.activity_status = 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at := now();
  END IF;
  IF NEW.activity_status = 'closed' AND NEW.closed_at IS NULL THEN
    NEW.closed_at := now();
  END IF;
  IF NEW.activity_status = 'published' THEN
    NEW.closed_at := NULL;
  END IF;
  RETURN NEW;
END;
$function$;

-- 3. Preserve original owner and execute privileges captured pre-change
ALTER FUNCTION public.s32_validate_activity() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.s32_validate_activity() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.s32_validate_activity() TO postgres WITH GRANT OPTION;
GRANT EXECUTE ON FUNCTION public.s32_validate_activity() TO anon;
GRANT EXECUTE ON FUNCTION public.s32_validate_activity() TO authenticated;
GRANT EXECUTE ON FUNCTION public.s32_validate_activity() TO service_role;

-- 4. Post-replacement inline sanity assertion inside transaction
DO $$
DECLARE
  v_def TEXT;
BEGIN
  SELECT pg_get_functiondef('public.s32_validate_activity()'::regprocedure) INTO v_def;
  IF v_def LIKE '%s.org_id%' THEN
    RAISE EXCEPTION 'Post-check failed: invalid reference s.org_id still present in public.s32_validate_activity()';
  END IF;
  IF v_def NOT LIKE '%academic_year_grades%' OR v_def NOT LIKE '%academic_years%' OR v_def NOT LIKE '%ay.org_id%' THEN
    RAISE EXCEPTION 'Post-check failed: expected academic_year_grades -> academic_years.org_id join missing';
  END IF;
END
$$;

COMMIT;

