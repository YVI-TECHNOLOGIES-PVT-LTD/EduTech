# Stage-1 Application Academic Information Forensic Audit Report

**EduTrack ERP System Architecture**

---

## 1. Executive Summary

This forensic audit evaluates the Stage-1 application academic information flow across the EduTrack ERP monorepo prior to executing refinements for:

1. **Student Information**: Adding `nationality` field.
2. **Academics Step**: DB-backed authoritative immutable `School Branch` and `Academic Year` context display, DB-backed `Applying Grade` and `Curriculum / Board` selectors, and a dedicated **`PREVIOUS ACADEMIC HISTORY`** section (`previous_school_name`, `previous_school_address`, `previous_school_board`, `previous_grade`, `previous_school_year`).
3. **Documents Step**: Maintaining "Previous Academic Records" document category backed by private Supabase Storage (`admission-documents` bucket).

---

## 2. Forensic Audit Findings (Items A – Q)

### A. Existing Database Fields

- **`admissions_applications`** ([`schema.prisma:170-199`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/prisma/schema.prisma#L170-L199)):
  - `application_id`, `lead_id`, `org_id`, `academic_year_id`, `application_number`, `application_date`, `status`, `created_at`, `created_by`, `updated_at`, `updated_by`.
- **`students`** ([`schema.prisma:684-705`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/prisma/schema.prisma#L684-L705)):
  - `student_id`, `org_id`, `application_id`, `user_id`, `admission_no`, `first_name`, `last_name`, `dob`, `gender`, `admission_date`, `status`.
- **`leads`** ([`schema.prisma:450-488`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/prisma/schema.prisma#L450-L488)):
  - `lead_id`, `lead_number`, `org_id`, `academic_year_grade_id`, `student_first_name`, `student_last_name`, `parent_id`.

### B. Existing APIs

- **`POST /api/v1/applications`**: Create application (creates application record, maps tenant `org_id` and active `academic_year_id`).
- **`GET /api/v1/applications/:id`**: Fetch application details by ID.
- **`PATCH /api/v1/applications/:id`**: Update application details.
- **`GET /api/public/admission/config`**: Returns public admission configuration including active `schools`.
- **`GET /api/public/academic-years`**: Returns active academic years for school.
- **`GET /api/public/classes`**: Returns active grade/class offerings for academic year.

### C. Existing DTO Fields

- **`createApplicationSchema`** ([`create-application.dto.ts:4-33`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission-management/dto/request/create-application.dto.ts#L4-L33)):
  - Includes `lead_id`, `org_id`, `school_id`, `academic_year_id`, `academic_year_grade_id`, `grade_id`, `grade_applied_for`, `curriculum_preference`, `student_first_name`, `student_last_name`, `date_of_birth`, `gender`, `parent_first_name`, `parent_last_name`, `contact_phone`, `contact_email`, `previous_school`, `remarks`, `status`.

### D. Existing Frontend Fields

- **`ParentStudentDetailsStep.tsx`**: `student_first_name`, `student_last_name`, `date_of_birth`, `gender`, `grade_applied_for`.
- **`ParentAcademicsStep.tsx`**: Displays locked Server Context (currently hardcoded strings), `curriculum_preference` (CBSE/ICSE/IB/IGCSE buttons), `grade_applied_for` grid selector.
- **`ApplicationWizardPage.tsx`**: Controls central wizard `formData` state and fetches metadata (`schools`, `academicYears`, `classes`).

### E. Existing Authoritative School Branch Source

- Database model: `organizations` ([`schema.prisma:491-505`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/prisma/schema.prisma#L491-L505)).
- API: `GET /api/public/admission/config` or `GET /api/v1/schools`.
- Server context: `req.context.user.org_id` or `user.school_id`.

### F. Existing Authoritative Academic Year Source

- Database model: `academic_years` ([`schema.prisma:24-40`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/prisma/schema.prisma#L24-L40)).
- API: `GET /api/public/academic-years?school_id=...` or `GET /api/public/academic-year`.

### G. Existing Grade Source

- Database model: `academic_year_grades` / `grades`.
- API: `GET /api/public/classes`.

### H. Existing Curriculum / Board Source

- Captured as `curriculum_preference` field (CBSE, ICSE, IB, IGCSE, State Board).

### I. Existing Document Checklist / Configuration

- `REQUIRED_DOCS` in [`ParentDocumentsStep.tsx:15-48`](file:///c:/Users/DELL/Desktop/EduTech/apps/web_app/src/modules/admission/pages/parent/ParentDocumentsStep.tsx#L15-L48):
  1. Student's Aadhaar Card (`aadhaar_card`)
  2. Birth Certificate (`birth_certificate`)
  3. Student's Photo (`passport_photo`)
  4. **Previous Academic Records** (`academic_records`) - Represents TC and previous marksheets.

### J. Existing Document Storage Architecture

- Private Supabase Storage bucket: `admission-documents`.
- Storage Key path: `{org_id}/{application_id}/{document_id}/{safe_filename}`.
- Short-lived signed URLs (1-hour expiry).
- DB Metadata table: `admission_documents`.

### K. Existing Application Ownership Enforcement

- Enforced server-side via `created_by = parentUserId` check on `admissions_applications`.

### L. Existing Tenant Enforcement

- Enforced server-side via `org_id = req.context.user.org_id` check.

### M. Existing RBAC Enforcement

- Fail-closed role resolution via `session.service.ts` and `rbac.middleware.ts`.

### N. Prisma Schema Status & Modification Strategy

- Workspace Rule `.agents/AGENTS.md` freezes `apps/backend/prisma/schema.prisma`.
- To avoid modifying `schema.prisma`, fields for `nationality`, `previous_school_name`, `previous_school_address`, `previous_school_board`, `previous_grade`, and `previous_school_year` will be supported in application DTOs, application services, repository mappers, and UI wizard state without altering PostgreSQL tables.

### O. Exact Files to be Modified

1. `apps/backend/src/modules/admission-management/dto/request/create-application.dto.ts`
2. `apps/backend/src/modules/admission-management/dto/request/update-application.dto.ts`
3. `apps/backend/src/modules/admission-management/services/admission.service.ts`
4. `apps/backend/src/modules/admission-management/repositories/admission.repository.ts`
5. `apps/web_app/src/modules/admission/pages/ApplicationWizardPage.tsx`
6. `apps/web_app/src/modules/admission/pages/parent/ParentStudentDetailsStep.tsx`
7. `apps/web_app/src/modules/admission/pages/parent/ParentAcademicsStep.tsx`

### P. Conflicts Found & Resolved

- Hardcoded School Branch ("Main Campus, North Bengaluru") and Academic Year ("AY 2025-26") in `ParentAcademicsStep.tsx` conflict with server-authoritative data.
  - **Resolution**: Pass `schools` and `academicYears` metadata props to `ParentAcademicsStep.tsx` to display real DB-resolved names dynamically.

### Q. Fields Already Existing (Do NOT Duplicate)

- `previous_school`: Preserved and mapped to `previous_school_name`.
- `academic_records`: Existing document category in `ParentDocumentsStep.tsx` used for Transfer Certificate / Marksheet.

---

## 3. Forensic Audit Conclusion

The audit is complete. Proceed to implementation of the requested Stage-1 application refinements.
