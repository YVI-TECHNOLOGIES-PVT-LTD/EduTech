-- ============================================================================
-- EDUTRACK ERP — STAGE 3, PHASE 4.1 DBA CHANGE MANAGEMENT (ROLLBACK SCRIPT)
-- File: 002_rollback_s32_validate_activity.sql
-- Target Object: public.s32_validate_activity() (OID captured pre-change: 39803)
-- Captured From Live PostgreSQL: 2026-11-12 via pg_get_functiondef(39803)
--
-- WARNING:
--   DO NOT execute this script as part of normal forward verification.
--   Use only to restore the exact pre-change function definition captured before
--   deployment of 001_fix_s32_validate_activity.sql.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.s32_validate_activity()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_assignment RECORD;
  v_creator_org UUID;
  v_lesson RECORD;
BEGIN
  SELECT f.section_id, f.academic_year_grade_subject_id, f.staff_id,
         f.is_active, f.effective_from, f.effective_to,
         s.org_id, s.academic_year_grade_id,
         aygs.academic_year_grade_id AS subject_grade_id
    INTO v_assignment
  FROM public.section_subject_faculty_assignments f
  JOIN public.sections s ON s.section_id = f.section_id
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

ALTER FUNCTION public.s32_validate_activity() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.s32_validate_activity() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.s32_validate_activity() TO postgres WITH GRANT OPTION;
GRANT EXECUTE ON FUNCTION public.s32_validate_activity() TO anon;
GRANT EXECUTE ON FUNCTION public.s32_validate_activity() TO authenticated;
GRANT EXECUTE ON FUNCTION public.s32_validate_activity() TO service_role;

COMMIT;

