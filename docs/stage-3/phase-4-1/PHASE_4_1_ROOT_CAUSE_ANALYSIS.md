# STAGE 3 PHASE 4.1 — ROOT CAUSE ANALYSIS (`public.s32_validate_activity`)

**Target Function:** `public.s32_validate_activity()` (`OID 39803`)
**Target Trigger:** `trg_s32_validate_activity` (`BEFORE INSERT OR UPDATE ON public.learning_activities FOR EACH ROW`)
**PostgreSQL Error Code:** `42703` (`column s.org_id does not exist`)
**Frozen Schema Compliance:** [schema.prisma](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/prisma/schema.prisma) unchanged (SHA-256 `73d98492b3a7f2cbfd9348de94a0373ef530be966d6d00c3a4008bc0974d6c39`, `445174` bytes)

---

## 1. Live PostgreSQL Inspection Evidence

Live read-only introspection against PostgreSQL `17.6` (`pg_proc`, `pg_trigger`, `pg_get_functiondef`, `information_schema.columns`) confirmed:

1. **Defect Location in `public.s32_validate_activity()`**:
   Inside the `v_assignment` lookup query at the top of `public.s32_validate_activity()`:

   ```sql
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
   ```

   The column `s.org_id` does **not** exist on `public.sections`.

2. **Verified Live Columns of `public.sections`**:
   `section_id`, `academic_year_grade_id`, `section_name`, `class_teacher_id`, `room_no`, `capacity`, `is_active`, `created_at`, `created_by`, `updated_at`, `updated_by`.
   (`org_id` is absent from `public.sections` in both PostgreSQL and [schema.prisma](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/prisma/schema.prisma).)

3. **Authoritative Tenant-Resolution Relationship**:
   - `public.sections.academic_year_grade_id` -> `public.academic_year_grades.academic_year_grade_id`
   - `public.academic_year_grades.academic_year_id` -> `public.academic_years.academic_year_id`
   - `public.academic_years.org_id` (UUID, non-null)

4. **Check for Other Invalid Columns in `public.s32_validate_activity()` and `s32_*` Functions**:
   Every remaining table/column referenced in `public.s32_validate_activity()` (`section_subject_faculty_assignments`, `sections.academic_year_grade_id`, `academic_year_grade_subjects.academic_year_grade_id`, `staff.{staff_id, org_id, is_active}`, `lesson_plans.{lesson_plan_id, teacher_staff_id, curriculum_unit_id}`, `curriculum_plan_units.{curriculum_unit_id, curriculum_plan_id}`, `curriculum_plans.{curriculum_plan_id, academic_year_grade_subject_id, org_id}`, `learning_activities` fields) and across all 11 `public.s32_*` functions was verified against `information_schema.columns`. No other invalid column reference exists.

---

## 2. Blast Radius & Application Behavior

- Because `trg_s32_validate_activity` executes `BEFORE INSERT OR UPDATE ON public.learning_activities`, every activity creation (`INSERT`), edit, publish, close, and late-extension (`UPDATE`) raises PostgreSQL `42703`, leaving all five `learning_activit*` tables with `0` rows.
- All downstream student submission and teacher review workflows depend on a persisted `learning_activities` row and are therefore blocked on live PostgreSQL writes until `public.s32_validate_activity()` is repaired.
- Application layer ([learning-activities.service.ts](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/learning-activities/learning-activities.service.ts)) intentionally preserves the trigger and translates `42703` (`column s.org_id does not exist`) into HTTP `503 DATABASE_TRIGGER_DEFECT`.
