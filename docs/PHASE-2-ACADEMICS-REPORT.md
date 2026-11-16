# PHASE 2.2 — ACADEMIC STRUCTURE SETUP REPORT
**EduTrack ERP Web Application**

---

## 1. Module Scope

The Academic Structure Setup module provides the Stage-1 foundation for school configuration:
- **Academic Years**: Creation, activation, planning status transitions.
- **Grades / Classes**: Grade levels, display ordering, intake capacity.
- **Sections**: Section allocation per grade, section capacity.
- **Academic Year Grade Mappings**: Junction mapping between academic year and grade level (`academic_year_grades`).

---

## 2. Source-of-Truth Database Models Used

| Table / Prisma Model | Primary Keys | Core Fields | Usage |
| :--- | :--- | :--- | :--- |
| `academic_years` | `academic_year_id` | `org_id`, `academic_year_name`, `start_date`, `end_date`, `status` | Academic session tracking |
| `grades` | `grade_id` | `org_id`, `grade_name`, `grade_code`, `display_order` | Grade hierarchy |
| `sections` | `section_id` | `academic_year_grade_id`, `section_name`, `capacity` | Classroom sectioning |
| `academic_year_grades` | `academic_year_grade_id` | `academic_year_id`, `grade_id`, `intake_capacity` | Session-grade configuration |

---

## 3. Backend APIs & RBAC Guarding

| HTTP Method | Route Endpoint | Permission Required | Controller / Handler |
| :--- | :--- | :--- | :--- |
| `GET` | `/academic-years` | Authenticated | `routes.ts` (`/academic-years`) |
| `GET` | `/academic-years/current` | Authenticated | `routes.ts` (`/academic-years/current`) |
| `POST` | `/academic-years` | `ACADEMIC_SETUP` | `routes.ts` (`/academic-years`) |
| `GET` | `/public/classes` | Public (Tenant Scoped) | `routes.ts` (`/public/classes`) |
| `GET` | `/public/admission/config` | Public (Tenant Scoped) | `routes.ts` (`/public/admission/config`) |
| `GET` / `POST` | `/v1/academic/*` | `ACADEMIC_SETUP` | `academicManagementRouter` |

---

## 4. RTK Query API Integration

- **API Slice**: `academicApi` (`src/shared/api/academic.api.ts`).
- **Endpoints**:
  - `getAcademicYears`: `builder.query<AcademicYearRecord[], void>` (Provides Tag: `AcademicYear`).
  - `getGrades`: `builder.query<GradeRecord[], void>` (Provides Tag: `Grade`).
  - `getSections`: `builder.query<SectionRecord[], void>` (Provides Tag: `Section`).

---

## 5. Security & Multi-Tenant Audit

- **Tenant Isolation**: All queries enforce `org_id` / `school_id` filtering from authenticated user session context (`req.context!.user.school_id`).
- **Role Access**: Restricted to users with `ACADEMIC_SETUP` permission or `SUPER_ADMIN` role.

---

## 6. Status

**PASS ✅** — Academic Structure Setup module verified, type-checked, and integrated.
