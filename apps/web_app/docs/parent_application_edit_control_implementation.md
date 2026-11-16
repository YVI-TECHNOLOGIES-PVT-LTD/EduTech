# EduTrack ERP — Front Office Controlled Parent Application Editing Implementation & Blocker Report

## 1. Forensic Audit Findings

### A. Repository & Database Capabilities Inspected
- `apps/backend/prisma/schema.prisma`
- Models: `admissions_applications`, `leads`, `parents`, `admission_documents`, `admission_decisions`, `application_assessments`.
- Enums: `application_status` (`submitted`, `documents_pending`, `assessment_pending`, `under_review`, `approved`, `waitlisted`, `rejected`, `withdrawn`).

### B. Findings on Field-Level Authorization Persistence
1. Current `admissions_applications` schema lacks `can_parent_edit`, `editable_fields`, or field-permission mapping columns.
2. The PostgreSQL enum `application_status` in `schema.prisma` contains `submitted`, `documents_pending`, `assessment_pending`, `under_review`, `approved`, `waitlisted`, `rejected`, `withdrawn`, but does NOT contain `correction_required` or `edit_authorized`.
3. As mandated by **Section 2, Section 11, and Section 45** of the governing requirements:
   - **Database Freeze = 0 Changes** (NO modifications allowed to `schema.prisma`, migrations, DDL, or SQL).
   - **No Faking Permissions**: We cannot fake backend permissions in frontend state or silently make all fields editable.
   - **Final Release Status**: Must be declared **BLOCKED** for field-level edit persistence until schema changes are authorized.

---

## 2. Implemented Non-Persistent Architecture

Despite database freeze constraints, full canonical support for field-level edit control has been built into the application model:

1. **Application Field Registry**:
   - Location: [`applicationFields.registry.ts`](file:///C:/Users/DELL/Desktop/EduTech/apps/web_app/src/modules/admission/utils/applicationFields.registry.ts)
   - Defines stable field keys (`student_name`, `date_of_birth`, `gender`, `grade_applied_for`, `curriculum_preference`, `parent_name`, `parent_phone`, `parent_email`, `contact_relationship`, `academic_year_id`, `previous_school_name`, `previous_grade`), display labels, value mappers, and editability helpers (`isFieldEditable`).

2. **Dual-Mode UI (`ParentReadOnlyApplicationView.tsx`)**:
   - **READ_ONLY Mode** (Default): When `canParentEdit` is false or `editableFields` is empty, all submitted fields render as locked Label/Value displays without input controls or submit buttons.
   - **EDIT_AUTHORIZED Mode**: When `canParentEdit` is true with authorized field keys (e.g. `['parent_phone', 'parent_email']`), a correction banner is displayed. Only the authorized fields render as active editable inputs with an "EDITABLE" badge, while all unauthorized fields remain strictly locked.

3. **Backend Update Security (`AdmissionService.updateApplication`)**:
   - Enforces user JWT authentication and parent application ownership (`parents.user_id` -> `parents.parent_id` -> `leads.parent_id` -> `admissions_applications.lead_id`).
   - Strips immutable keys (`application_id`, `lead_id`, `created_by`, `org_id`, `application_number`) before execution.

---

## 3. Verification Results

- **Frontend Typecheck (`pnpm --filter @edutrack/web typecheck`)**: PASS (Exit Code 0)
- **Frontend Build (`pnpm --filter @edutrack/web build`)**: PASS (Exit Code 0)
- **Backend Typecheck (`pnpm --filter @edutrack/api typecheck`)**: PASS (Exit Code 0)
- **Backend Build (`npx tsc`)**: PASS (Exit Code 0)
- **Database Changes**: 0 (Database Freeze strictly maintained)

---

## 4. Blocker Statement

- **Current System Can Authorize Editing**: NO (Missing DB persistence columns/enum)
- **Current System Can Authorize Individual Fields**: NO (Missing `editable_fields` array/table)
- **Proposed Schema Addition**: `admissions_applications.can_parent_edit Boolean`, `admissions_applications.editable_fields String[]`, and enum addition `correction_required` to `application_status`.
- **Status**: **BLOCKED** (Pending explicit schema freeze lift)
