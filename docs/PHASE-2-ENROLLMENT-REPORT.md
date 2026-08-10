# PHASE 2.7–2.10 — ASSESSMENT, DECISION, FEE STATUS & TRANSACTIONAL ENROLLMENT REPORT
**EduTrack ERP Web Application**

---

## 1. Module Scope

This module covers the core decision and enrollment pipeline:
- **Assessment Management**: `assessment_configurations` and candidate `application_assessments` (marks, pass/fail status, remarks).
- **Admission Decision**: Formal `admission_decisions` (`APPROVED`, `REJECTED`, `WAITLISTED`) with decision audit details.
- **Admission Fee Payment Status**: Stage-1 fee status tracking (`PAID`, `PENDING`, `WAIVED`) on `admission_fee_payments`.
- **Transactional Enrollment**: Multi-record transactional execution (`EnrollmentService` / `StudentProvisionService`) creating student, enrollment placement, and parent linkage atomically.

---

## 2. Source-of-Truth Database Models Used

| Table / Prisma Model | Primary Keys | Core Fields | Usage |
| :--- | :--- | :--- | :--- |
| `assessment_configurations` | `configuration_id` | `academic_year_grade_id`, `max_marks`, `pass_marks` | Assessment rules |
| `application_assessments` | `assessment_id` | `application_id`, `configuration_id`, `marks_obtained`, `status` | Candidate test results |
| `admission_decisions` | `decision_id` | `application_id`, `decision_status`, `decision_date`, `remarks` | Admission decision |
| `admission_fee_payments` | `payment_id` | `application_id`, `amount`, `payment_status`, `receipt_number` | Temporary Stage-1 fee status |
| `students` | `student_id` | `org_id`, `admission_number`, `first_name`, `last_name` | Master student identity |
| `student_enrollments` | `enrollment_id` | `student_id`, `academic_year_grade_id`, `section_id`, `roll_number`, `status` | Current academic placement |
| `parents` | `parent_id` | `org_id`, `user_id`, `first_name`, `last_name`, `email` | Master parent identity |
| `student_parents` | `student_parent_id` | `student_id`, `parent_id`, `relationship_type`, `is_primary` | Parent-student link |

---

## 3. Backend Transactional Enrollment Service (`EnrollmentService`)

```text
Application (Approved & Fee Paid)
    ↓
Validation (Pre-enrollment checks)
    ↓
Student Provisioning (Atomic creation of student_id & admission_number)
    ↓
State Machine Validation (Transition ADMISSION_CONFIRMED -> ENROLLED)
    ↓
Enrollment Finalization (Save student_enrollments record with academic_year_grade_id & section_id)
    ↓
Parent Linkage (Provision user account & student_parents relation)
    ↓
Workflow & Audit Trail Logging
```

---

## 4. Backend APIs & RBAC Guarding

| HTTP Method | Route Endpoint | Permission Required | Controller / Handler |
| :--- | :--- | :--- | :--- |
| `POST` | `/v1/admission/assessment/record` | `admission.assessment.write` | `assessmentRouter` |
| `POST` | `/v1/admission/evaluation/decision` | `admission.review` | `evaluationRouter` |
| `POST` | `/v1/admission/enrollment/finalize` | `admission.review` | `enrollmentRouter` (`EnrollmentService.enrollStudent`) |
| `POST` | `/v1/students/:id/enrollments` | `STUDENT_ENROLL` | `studentManagementRouter` |

---

## 5. Security & Multi-Tenant Audit

- **Transactional Rollback**: If parent linkage or section assignment fails, the entire transaction rolls back cleanly to prevent orphaned half-enrolled students.
- **Tenant Scope**: `org_id` / `school_id` validated across all candidate and enrollment models.

---

## 6. Status

**PASS ✅** — Assessment, Admission Decision, Fee Status, and Transactional Enrollment module verified, type-checked, and integrated.
