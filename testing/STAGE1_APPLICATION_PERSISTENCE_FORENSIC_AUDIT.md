# Stage-1 Application Persistence Forensic Audit Report

**EduTrack ERP System Architecture**

---

## 1. Executive Summary

This forensic audit investigates why newly submitted Parent applications fail to persist:

1. `nationality`
2. `previous_school_name`
3. `previous_school_address`
4. `previous_school_board`
5. `previous_grade`
6. `previous_school_year`
7. Uploaded application documents

### Key Forensic Findings:

- **Database & Prisma Schema**: The database schema ([`schema.prisma`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/prisma/schema.prisma)) **ALREADY HAS PHYSICAL COLUMNS** for `nationality`, `previous_school_name`, `previous_school_address`, `previous_school_board`, `previous_grade`, and `previous_school_year` on `admissions_applications` (and `nationality` on `students`).
- **Backend DTOs & Repositories**: The backend DTOs (`createApplicationSchema`, `updateApplicationSchema`), `AdmissionMapper`, and `AdmissionRepository` have been updated to accept and write these fields.
- **Frontend Submission Payload Defect (Root Cause #1)**: `ApplicationWizardPage.tsx` (`handleSubmit` method, lines 278–299) constructs an explicit HTTP JSON body payload that **COMPLETELY OMITS** `nationality`, `previous_school_name`, `previous_school_address`, `previous_school_board`, `previous_grade`, and `previous_school_year`. Thus, the browser never sends these input values to the server during application submission.
- **Frontend Document Upload Defect (Root Cause #2)**: `ApplicationWizardPage.tsx` (`handleFileUpload` method, lines 249–261) only updates local React component memory state (`uploadedDocs`) with string file names. It **NEVER CALLS THE BACKEND UPLOAD API** (`POST /api/v1/applications/:id/documents`), and `handleSubmit` does not execute binary multipart file uploads upon application submission.
- **Document Type ID Mismatch (Root Cause #3)**: Frontend `ParentDocumentsStep.tsx` uses frontend string keys (`'aadhaar_card'`, `'birth_certificate'`, `'passport_photo'`, `'academic_records'`), whereas backend `admission_documents` requires a UUID `document_type_id` referencing `document_types`.

---

## 2. Phase 1 — Prisma Schema Forensic Audit

Inspection of [`apps/backend/prisma/schema.prisma`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/prisma/schema.prisma#L170-L205):

| Requested Data              | Prisma Model              | Prisma Field              | PostgreSQL Column         | Exists? | Type    | Nullable? | Relation? |
| :-------------------------- | :------------------------ | :------------------------ | :------------------------ | :-----: | :------ | :-------: | :-------: |
| **nationality**             | `admissions_applications` | `nationality`             | `nationality`             |   YES   | String? |    YES    |    NO     |
| **previous_school_name**    | `admissions_applications` | `previous_school_name`    | `previous_school_name`    |   YES   | String? |    YES    |    NO     |
| **previous_school_address** | `admissions_applications` | `previous_school_address` | `previous_school_address` |   YES   | String? |    YES    |    NO     |
| **previous_school_board**   | `admissions_applications` | `previous_school_board`   | `previous_school_board`   |   YES   | String? |    YES    |    NO     |
| **previous_grade**          | `admissions_applications` | `previous_grade`          | `previous_grade`          |   YES   | String? |    YES    |    NO     |
| **previous_school_year**    | `admissions_applications` | `previous_school_year`    | `previous_school_year`    |   YES   | String? |    YES    |    NO     |

- `students` model ([`schema.prisma:684-705`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/prisma/schema.prisma#L684-L705)) also contains `nationality` (`String? @db.VarChar(100)`).

---

## 3. Phase 2 — Database Relationship Audit

- **Lead → Application**: 1-to-1 via `admissions_applications.lead_id` (`@unique @db.Uuid`).
- **Application → Student**: 1-to-1 via `students.application_id` (`@unique @db.Uuid`).
- **Application → Documents**: 1-to-many via `admission_documents.application_id` (`@db.Uuid`).
- **Document → Document Type**: Many-to-1 via `admission_documents.document_type_id` -> `document_types.document_type_id`.

---

## 4. Phase 3 — Document Storage Schema Audit

Inspection of `admission_documents` model ([`schema.prisma:121-149`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/prisma/schema.prisma#L121-L149)):

| Column Name            | Prisma Type | PostgreSQL Type        | Nullable? | Description                                                              |
| :--------------------- | :---------- | :--------------------- | :-------: | :----------------------------------------------------------------------- |
| `document_id`          | String      | UUID                   |    NO     | Primary Key (`gen_random_uuid()`)                                        |
| `application_id`       | String      | UUID                   |    NO     | Foreign Key -> `admissions_applications.application_id` (Cascade Delete) |
| `document_type_id`     | String      | UUID                   |    NO     | Foreign Key -> `document_types.document_type_id`                         |
| `storage_path`         | String      | Text                   |    NO     | Supabase Storage Object Path Key                                         |
| `original_file_name`   | String?     | VarChar(255)           |    YES    | Original file name                                                       |
| `mime_type`            | String?     | VarChar(100)           |    YES    | File MIME type                                                           |
| `file_size`            | BigInt?     | BigInt                 |    YES    | File size in bytes                                                       |
| `verify_status`        | Enum        | document_verify_status |    NO     | Default: `pending`                                                       |
| `verification_remarks` | String?     | Text                   |    YES    | Remarks                                                                  |
| `uploaded_at`          | DateTime    | Timestamptz            |    NO     | Default: `now()`                                                         |
| `verified_by`          | String?     | UUID                   |    YES    | FK -> `users.user_id`                                                    |
| `verified_at`          | DateTime?   | Timestamptz            |    YES    | Verification timestamp                                                   |

### Constraints & Relations:

1. `application_id` is a valid FK with `onDelete: Cascade`.
2. Uniqueness: `@@unique([application_id, document_type_id])` enforces **1 document per type per application**.
3. `storage_path` stores private Supabase Storage key (`{org_id}/{application_id}/{document_id}/{safe_filename}`).

---

## 5. Phase 4 & 5 — Current Application Save Path & Frontend Payload Audit

### Field-by-Field Persistence Trace

| Field                     |         Frontend Component State         | Sent in HTTP Request Payload? | DTO Accepts? | Service Uses? | Repository Writes? | Prisma Field Exists? |         Actually Persisted?          |
| :------------------------ | :--------------------------------------: | :---------------------------: | :----------: | :-----------: | :----------------: | :------------------: | :----------------------------------: |
| `nationality`             |       YES (`formData.nationality`)       |            **NO**             |     YES      |      YES      |        YES         |         YES          | **NO (Dropped by Frontend Payload)** |
| `previous_school_name`    |  YES (`formData.previous_school_name`)   |            **NO**             |     YES      |      YES      |        YES         |         YES          | **NO (Dropped by Frontend Payload)** |
| `previous_school_address` | YES (`formData.previous_school_address`) |            **NO**             |     YES      |      YES      |        YES         |         YES          | **NO (Dropped by Frontend Payload)** |
| `previous_school_board`   |  YES (`formData.previous_school_board`)  |            **NO**             |     YES      |      YES      |        YES         |         YES          | **NO (Dropped by Frontend Payload)** |
| `previous_grade`          |     YES (`formData.previous_grade`)      |            **NO**             |     YES      |      YES      |        YES         |         YES          | **NO (Dropped by Frontend Payload)** |
| `previous_school_year`    |  YES (`formData.previous_school_year`)   |            **NO**             |     YES      |      YES      |        YES         |         YES          | **NO (Dropped by Frontend Payload)** |

### Frontend HTTP POST Payload Evidence:

In [`ApplicationWizardPage.tsx:278-299`](file:///c:/Users/DELL/Desktop/EduTech/apps/web_app/src/modules/admission/pages/ApplicationWizardPage.tsx#L278-L299):

```typescript
const payload = {
  school_id: isUuid(formData.school_id) ? formData.school_id : undefined,
  org_id: isUuid(formData.school_id) ? formData.school_id : undefined,
  academic_year_id: isUuid(formData.academic_year_id) ? formData.academic_year_id : undefined,
  academic_year_grade_id: isUuid(formData.academic_year_grade_id)
    ? formData.academic_year_grade_id
    : undefined,
  grade_id: isUuid(formData.grade_id) ? formData.grade_id : undefined,
  grade_applied_for: formData.grade_applied_for,
  grade: formData.grade_applied_for || formData.grade_id || 'Grade 1',
  curriculum_preference: formData.curriculum_preference,
  student_first_name: formData.student_first_name.trim(),
  student_last_name: formData.student_last_name.trim(),
  student_name: `${formData.student_first_name} ${formData.student_last_name}`.trim(),
  date_of_birth: formData.date_of_birth,
  gender: formData.gender,
  parent_name: formData.parent_name.trim(),
  parent_email: formData.parent_email.trim(),
  parent_phone: formData.parent_phone.trim(),
  contact_relationship: formData.contact_relationship,
  status: 'submitted',
  // 🚨 MISSING: nationality, previous_school_name, previous_school_address,
  // 🚨 previous_school_board, previous_grade, previous_school_year ARE NOT INCLUDED!
};
```

---

## 6. Phase 6 — Document Upload Forensic Audit

### Document Upload Persistence Matrix

| Document Category                                  | Frontend Selects File? | Multer Executed? | Backend Received? | Supabase Uploaded? | DB Row Inserted? |      Actually Persisted?       |
| :------------------------------------------------- | :--------------------: | :--------------: | :---------------: | :----------------: | :--------------: | :----------------------------: |
| **Aadhaar Card** (`aadhaar_card`)                  |    Local State Only    |      **NO**      |      **NO**       |       **NO**       |      **NO**      | **NO (Upload API Not Called)** |
| **Birth Certificate** (`birth_certificate`)        |    Local State Only    |      **NO**      |      **NO**       |       **NO**       |      **NO**      | **NO (Upload API Not Called)** |
| **Student Photo** (`passport_photo`)               |    Local State Only    |      **NO**      |      **NO**       |       **NO**       |      **NO**      | **NO (Upload API Not Called)** |
| **Previous Academic Records** (`academic_records`) |    Local State Only    |      **NO**      |      **NO**       |       **NO**       |      **NO**      | **NO (Upload API Not Called)** |

### Forensic Proof:

1. In [`ApplicationWizardPage.tsx:249-261`](file:///c:/Users/DELL/Desktop/EduTech/apps/web_app/src/modules/admission/pages/ApplicationWizardPage.tsx#L249-L261):
   `handleFileUpload` only updates React state `uploadedDocs` with `{ file_name, file_size }`. It does **NOT** dispatch an HTTP `FormData` request to `/api/v1/applications/:id/documents`.
2. In `handleSubmit` ([`ApplicationWizardPage.tsx:270-338`](file:///c:/Users/DELL/Desktop/EduTech/apps/web_app/src/modules/admission/pages/ApplicationWizardPage.tsx#L270-L338)):
   Upon application submission, no document upload requests are executed for the files selected in `uploadedDocs`.

---

## 7. Phase 9 — Root Cause Classification

| Component                     | Failure Category                 | Exact File & Line Reference                                                                                                                               | Root Cause Description                                                                                                                                                                        |
| :---------------------------- | :------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Application Text Metadata** | E. Frontend does not send fields | [`ApplicationWizardPage.tsx:278-299`](file:///c:/Users/DELL/Desktop/EduTech/apps/web_app/src/modules/admission/pages/ApplicationWizardPage.tsx#L278-L299) | `payload` object constructed in `handleSubmit` omits `nationality`, `previous_school_name`, `previous_school_address`, `previous_school_board`, `previous_grade`, and `previous_school_year`. |
| **Document Upload Flow**      | J. Upload API not invoked        | [`ApplicationWizardPage.tsx:249-261`](file:///c:/Users/DELL/Desktop/EduTech/apps/web_app/src/modules/admission/pages/ApplicationWizardPage.tsx#L249-L261) | `handleFileUpload` stores metadata in client memory state instead of calling `POST /api/v1/applications/:id/documents`.                                                                       |
| **Document Type Identifier**  | I. Document type ID mismatch     | [`ParentDocumentsStep.tsx:15-48`](file:///c:/Users/DELL/Desktop/EduTech/apps/web_app/src/modules/admission/pages/parent/ParentDocumentsStep.tsx#L15-L48)  | Frontend passes string keys (`'aadhaar_card'`), but backend requires a valid UUID `document_type_id` matching a row in `document_types`.                                                      |

---

## 8. Phase 10 — Schema Decision & Architecture Recommendation

1. **Schema Sufficiency**: `apps/backend/prisma/schema.prisma` is **100% SUFFICIENT**. All required columns exist in PostgreSQL and Prisma schema (`admissions_applications` and `admission_documents`).
2. **Required Fix**:
   - Update `ApplicationWizardPage.tsx` `handleSubmit` payload construction to include `nationality`, `previous_school_name`, `previous_school_address`, `previous_school_board`, `previous_grade`, and `previous_school_year`.
   - Update `ApplicationWizardPage.tsx` file handling to execute `POST /api/v1/applications/:id/documents` via `FormData` upon document selection or application submission.
   - Resolve `document_type_id` UUID mapping for `document_types`.

---

## 9. Final Audit Verdict

```text
AUDIT COMPLETE

Files modified: 0
Schema modified: 0
Migrations created: 0
Database records modified: 0
Routes modified: 0
Permissions modified: 0

Final verdict:
BLOCKED BY APPLICATION CODE
```

_(Reason: The database schema fully supports all fields and documents, but application code in `ApplicationWizardPage.tsx` omits the text fields from the submission payload and does not execute the document upload HTTP request)._
