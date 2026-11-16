# STAGE 3 PHASE 4.1 — DATABASE FUNCTION REMEDIATION DESIGN

**Remediation Artifact:** [001_fix_s32_validate_activity.sql](file:///Users/sathish/Documents/GitHub/EduTech/docs/stage-3/phase-4-1/sql/001_fix_s32_validate_activity.sql)
**Deployment State:** **PREPARED / NOT EXECUTED (`BLOCKED — DBA APPROVAL REQUIRED`)**

---

## 1. Exact Targeted SQL Diff

Only the `v_assignment` tenant resolution query inside `public.s32_validate_activity()` is modified:

**Before (Defective Live PG Definition):**

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

**After (Minimal Targeted Correction):**

```sql
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
```

---

## 2. Preserved Attributes & Validations

1. **Function Signature & Attributes:** `public.s32_validate_activity() RETURNS trigger LANGUAGE plpgsql VOLATILE SECURITY INVOKER` (`prosecdef = false`).
2. **Owner & Privileges:** `OWNER TO postgres`; `EXECUTE` preserved for `PUBLIC`, `postgres` (`WITH GRANT OPTION`), `anon`, `authenticated`, and `service_role`.
3. **Trigger Attachment:** `CREATE OR REPLACE FUNCTION` preserves `trg_s32_validate_activity` (`BEFORE INSERT OR UPDATE ON learning_activities FOR EACH ROW`, enabled `'O'`).
4. **All Original Business Rules Retained Verbatim:**
   - Faculty assignment existence, organization match (`v_assignment.org_id <> NEW.org_id`), section/subject match, academic-year-grade match, staff ownership, effective date bounds, `is_active` enforcement on insert and publish.
   - Creator `public.staff` active & organization verification.
   - Optional `lesson_plan_id` teacher/subject/org match.
   - Draft-only `INSERT`, immutable `created_by_staff_id`, reopen deadline/late check, published-to-draft prevention, and automatic `published_at` / `closed_at` timestamp maintenance.
