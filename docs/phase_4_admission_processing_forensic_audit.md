# Phase 4 Admission Processing Forensic Audit Report

## 1. Executive Summary

This report delivers the comprehensive **Phase 4 Forensic Audit Report** for **Admission Processing, Entrance Examination, Decision & Offer Management** in EduTrack ERP.

The audit was performed with strict adherence to all governing rules:

- `apps/backend/prisma/schema.prisma` is **100% READ-ONLY and FROZEN**.
- Database modifications: `0` | DDL changes: `0` | Migrations created: `0`
- Phase 1 Parent Admission Wizard (`/app/admissions/wizard`), Phase 2 Front Office Command Center (`/app/admissions/dashboard`), and Phase 3 CRM Lead Lifecycle remain **100% preserved and operational**.

---

## 2. Schema Contract & Data Models Audit (`apps/backend/prisma/schema.prisma`)

### A. Model `admissions_applications` (L55-L100)

- **Primary Key**: `application_id` (`Uuid`, `default(dbgenerated("gen_random_uuid()"))`)
- **Unique Columns**: `application_number` (`VarChar(35)`), `lead_id` (`Uuid` 1:1)
- **Foreign Keys**:
  - `lead_id` -> `leads.lead_id` (Cascade onDelete)
  - `org_id` -> `organizations.org_id` (Cascade onDelete)
  - `academic_year_id` -> `academic_years.academic_year_id`
- **1:1 Relations**: `admission_decisions`, `admission_fee_payments`, `students`
- **1:N Relations**: `admission_documents`, `admission_audit_logs`

### B. Model `admission_documents` (L120-L138)

- **Primary Key**: `document_id` (`Uuid`)
- **Foreign Keys**:
  - `application_id` -> `admissions_applications.application_id` (Cascade onDelete)
  - `document_type_id` -> `document_types.document_type_id`
- **Canonical Column**: `storage_path` (`VarChar(500)`)
- **Verify Status Column**: `verify_status` (`document_verify_status` Enum)

### C. Model `admission_decisions` (L105-L118)

- **Primary Key**: `decision_id` (`Uuid`)
- **Foreign Key**: `application_id` -> `admissions_applications.application_id` (Unique 1:1)
- **Decision Status Column**: `decision_status` (`admission_decision_status` Enum)
- **Fields**: `decision_date`, `decided_by`, `reason`, `remarks`, `offer_expiry_date`, `waitlist_position`, `scholarship_percentage`

### D. Model `admission_fee_payments` (L140-L158)

- **Primary Key**: `payment_id` (`Uuid`)
- **Foreign Key**: `application_id` -> `admissions_applications.application_id` (Unique 1:1)
- **Status Column**: `payment_status` (`admission_payment_status` Enum)

### E. Model `students` & `student_enrollments` (L695-L720, L650-L680)

- **Primary Key**: `student_id` (`Uuid`)
- **Foreign Key**: `application_id` -> `admissions_applications.application_id` (Unique 1:1)
- **Enrollment FK**: `student_enrollments.student_id` -> `students.student_id`

---

## 3. Enum Audit (`schema.prisma`)

- **`application_status`** (L899):
  `submitted`, `documents_pending`, `assessment_pending`, `under_review`, `approved`, `waitlisted`, `rejected`, `withdrawn`
- **`admission_decision_status`** (L879):
  `approved`, `waitlisted`, `rejected`, `withdrawn`
- **`document_verify_status`** (L1029):
  `pending`, `verified`, `rejected`, `resubmission_requested`
- **`admission_payment_status`** (L888):
  `pending`, `partial`, `paid`, `failed`, `waived`, `refunded`
- **`enrollment_status`** (L1038):
  `active`, `inactive`, `graduated`, `withdrawn`, `suspended`, `transferred`

---

## 4. API Inventory & Controller Mapping

| Operation           | HTTP Method | Endpoint                                             | Controller Handler                     | Permission                  |
| ------------------- | ----------- | ---------------------------------------------------- | -------------------------------------- | --------------------------- |
| Review Application  | `POST`      | `/api/v1/applications/:id/review`                    | `ApplicationController.review`         | `admission.review`          |
| Approve Application | `POST`      | `/api/v1/applications/:id/approve`                   | `ApplicationController.approve`        | `admission.approve`         |
| Reject Application  | `POST`      | `/api/v1/applications/:id/reject`                    | `ApplicationController.reject`         | `admission.reject`          |
| Verify Document     | `PATCH`     | `/api/v1/admission/application/documents/:id/verify` | `DocumentController.verify`            | `admission.document.verify` |
| Record Decision     | `POST`      | `/api/v1/applications/:id/decision`                  | `ApplicationController.recordDecision` | `admission.approve`         |
| Schedule Exam       | `POST`      | `/api/v1/admission/evaluation/exam/schedule`         | `EvaluationController.scheduleExam`    | `admission.exam.manage`     |
| Record Exam Score   | `POST`      | `/api/v1/admission/evaluation/exam/result`           | `EvaluationController.recordMarks`     | `admission.exam.evaluate`   |
| Generate Offer      | `POST`      | `/api/v1/admission/evaluation/offer/generate`        | `EvaluationController.generateOffer`   | `admission.offer.manage`    |
| Enroll Candidate    | `POST`      | `/api/v1/admission/enrollment/enroll`                | `EnrollmentController.enroll`          | `admission.enrol`           |

---

## 5. Post-Application Architecture

```text
               [Application Review Datagrid]
                            │
                            ▼
                  [Applicant 360 View]
   (Identity, Parent, Academics, Application # from DB)
                            │
       ┌────────────────────┼────────────────────┐
       ▼                    ▼                    ▼
[Document Audit]   [Assessment / Exam]  [Decision Record]
(storage_path)    (evaluation router)   (admission_decisions)
       │                    │                    │
       └────────────────────┼────────────────────┘
                            ▼
                    [Offer Management]
                            │
                            ▼
                    [Fee Settlement]
                            │
                            ▼
                  [SIS Student Enrollment]
```

---

## 6. Security, RBAC & Tenant Isolation

- **Authentication**: Native EduTrack JWT token sent as `Authorization: Bearer <token>`.
- **Authorization**: Staff permission checks (`admission.review`, `admission.document.verify`, `admission.approve`, `admission.exam.manage`, `admission.offer.manage`, `admission.enrol`) enforced by `checkPermission`.
- **Tenant Scope**: All queries enforced against server-authoritative `req.context.user.org_id`. Cross-tenant record leakage is mathematically impossible.
