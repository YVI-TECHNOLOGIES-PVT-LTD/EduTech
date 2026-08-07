# EduTrack ERP — Stage-1 Business Rules & Domain Policies

## 1. Multi-Tenant Scoping Rules

- **Rule BR-ORG-001**: Every database mutation and query MUST filter by `organization_id`.
- **Rule BR-ORG-002**: SuperAdmin users (role `SUPERADMIN`) bypass tenant filtering for system maintenance.

## 2. Lead Management Rules

- **Rule BR-CRM-001**: Auto-generate unique lead numbers using prefix `LEAD-YYYY-XXX`.
- **Rule BR-CRM-002**: Calculate AI Lead Score ($0-100$) based on engagement source, prompt response time, and campus visit completion.

## 3. Admission Application & Decision Rules

- **Rule BR-ADM-001**: Application transitions follow strict state progression:
  `SUBMITTED` ➔ `DOCUMENT_VERIFIED` ➔ `ASSESSMENT_COMPLETED` ➔ `APPROVED` ➔ `FEE_PAID` ➔ `ENROLLED`.
- **Rule BR-ADM-002**: An application CANNOT be set to `FEE_PAID` until `decision === 'APPROVED'`.

## 4. Final Enrollment Execution Rules

- **Rule BR-STU-001**: Stage-1 Enrollment Execution (`POST /api/v1/admission/enrollment/execute`) MUST execute atomically inside a database transaction (`$transaction`).
- **Rule BR-STU-002**: Student record creation generates permanent `admission_number` (`ADM-YYYY-XXX`) and `student_id` (`STU-YYYY-XXX`).
