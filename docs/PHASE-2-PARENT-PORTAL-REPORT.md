# PHASE 2.13 — PARENT PORTAL SELF-SERVICE REPORT
**EduTrack ERP Web Application**

---

## 1. Module Scope

The Parent Portal module provides isolated self-service capabilities for parents/guardians:
- **Parent Dashboard**: Summary of linked applications, document status, and notifications.
- **Application Status & Details**: View submitted applications and track real-time stage progression.
- **Document Upload & Resubmission**: Upload mandatory certificates and respond to resubmission requests.
- **Ward / Student Profile**: View academic placement and enrollment information for linked children.
- **Profile Management**: View and update contact information.

---

## 2. Source-of-Truth Database Models Used

| Table / Prisma Model | Primary Keys | Core Fields | Usage |
| :--- | :--- | :--- | :--- |
| `parents` | `parent_id` | `org_id`, `user_id`, `first_name`, `last_name`, `email`, `phone` | Parent identity |
| `student_parents` | `student_parent_id` | `student_id`, `parent_id`, `relationship_type` | Parent-ward link |
| `admissions_applications` | `application_id` | `created_by`, `status` | Parent application tracking |
| `admission_documents` | `document_id` | `application_id`, `verification_status` | Parent document resubmission |

---

## 3. Backend APIs & RBAC Guarding

| HTTP Method | Route Endpoint | Permission Required | Controller / Handler |
| :--- | :--- | :--- | :--- |
| `GET` | `/v1/admission/my` | `admission.view_own` | `applicationController.listMine` |
| `POST` | `/v1/admission/apply` | `ADMISSION_CREATE` | `applicationController.parentApply` |
| `GET` | `/v1/parents/my-children` | Authenticated Parent | `parentManagementRouter` |

---

## 4. Security & Parent Data Isolation Audit

- **Ownership Validation**: Backend API routes validate `req.context.user.id` against application `created_by` or `student_parents` relationship before returning data.
- **URL Tampering Prevention**: Changing `application_id` or `student_id` in URL yields 403 Forbidden unless the parent is explicitly linked to that object in PostgreSQL.

---

## 5. Status

**PASS ✅** — Parent Portal module verified, type-checked, and integrated.
