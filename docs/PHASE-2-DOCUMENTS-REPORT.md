# PHASE 2.6 — DOCUMENT VERIFICATION REPORT
**EduTrack ERP Web Application**

---

## 1. Module Scope

The Document Verification module manages candidate compliance documents:
- **Document Checklist**: Normalized `document_types` (Birth Certificate, Transfer Certificate, Marksheet, Parent ID, Photo).
- **Verification Workflow**: Verification state transitions (`pending`, `verified`, `rejected`, `resubmission_requested`).
- **Audit & Remarks**: Verification timestamps, verifier identity, and refusal/resubmission reasons.
- **Parent Resubmission**: Secure parent upload and resubmission.

---

## 2. Source-of-Truth Database Models Used

| Table / Prisma Model | Primary Keys | Core Fields | Usage |
| :--- | :--- | :--- | :--- |
| `document_types` | `document_type_id` | `org_id`, `type_code`, `type_name`, `is_mandatory` | Document configuration |
| `admission_documents` | `document_id` | `application_id`, `document_type_id`, `file_path`, `verification_status`, `verified_by`, `verified_at`, `rejection_reason` | Document record |

---

## 3. Backend APIs & RBAC Guarding

| HTTP Method | Route Endpoint | Permission Required | Controller / Handler |
| :--- | :--- | :--- | :--- |
| `GET` | `/v1/admission/application/documents/:applicationId` | `admission.document.view` | `documentRouter` (`getDocuments`) |
| `POST` | `/v1/admission/application/documents/verify` | `admission.document.verify` | `documentRouter` (`verifyDocument`) |
| `POST` | `/v1/admission/application/documents/request-resubmission` | `admission.document.verify` | `documentRouter` (`requestResubmission`) |

---

## 4. RTK Query API Integration

- **API Slice**: `admissionApi` (`src/shared/api/admission.api.ts`).
- **Endpoints**:
  - `verifyDocument`: `builder.mutation<DocumentRecord, VerifyDocumentPayload>` (Invalidates Tag: `Application`).

---

## 5. Security & Multi-Tenant Audit

- **Ownership & Tenant Validation**: Direct document ID queries validate application ownership and tenant scope before returning file descriptors.
- **Parent Isolation**: Parents can only access documents belonging to their linked application context.

---

## 6. Status

**PASS ✅** — Document Verification module verified, type-checked, and integrated.
