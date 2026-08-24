# EduTrack ERP Mobile V1 — Phase 4 Web Parity Audit

## Parent Admission Application Workflow

**Document**: `MOBILE_PHASE4_WEB_PARITY.md`  
**Date**: August 22, 2026  
**Audited Location**: `apps/web_app/src/modules/admission/pages/ApplicationWizardPage.tsx` & `parent/`

---

## 1. Web Parity Audit Table

| Step #                 | Web Route / Component          | Backend API & Method                                                                    | Request Payload / Params                                                                            | Response Contract                          | Validation & Rules                                                                           | Mobile Equivalent                                         |
| :--------------------- | :----------------------------- | :-------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------- | :----------------------------------------- | :------------------------------------------------------------------------------------------- | :-------------------------------------------------------- |
| **0. Init**            | `ApplicationWizardPage.tsx`    | `GET /public/admission/config`<br>`GET /public/academic-years`<br>`GET /public/classes` | Public config params                                                                                | `{ organization, academic_years, grades }` | Loads active school, year, and available grades                                              | Metadata Query Hook (`useAdmissionConfig`, `metadataApi`) |
| **1. Guidelines**      | `ParentInstructionsStep.tsx`   | Local state / Draft                                                                     | None                                                                                                | None                                       | Parent must check "I accept the guidelines" before proceeding                                | `WizardStep1Guidelines.tsx`                               |
| **2. Student Details** | `ParentStudentDetailsStep.tsx` | Local state / Draft                                                                     | `student_first_name`, `student_last_name`, `date_of_birth`, `gender`, `nationality`                 | None                                       | Mandatory first name, last name, valid DOB, gender                                           | `WizardStep2Student.tsx` (Zod validation)                 |
| **3. Parent Details**  | `ParentDetailsStep.tsx`        | Local state / Draft                                                                     | `parent_name`, `parent_email`, `parent_phone`, `contact_relationship`, `parent_occupation`          | None                                       | Mandatory name, valid phone (7-15 digits), valid email, relationship                         | `WizardStep3Parent.tsx` (Zod validation)                  |
| **4. Academic Info**   | `ParentAcademicsStep.tsx`      | Local state / Draft                                                                     | `school_id`, `academic_year_id`, `academic_year_grade_id`, `grade_applied_for`, `previous_school_*` | None                                       | Grade selection mandatory, previous school info optional                                     | `WizardStep4Academics.tsx`                                |
| **5. Documents**       | `ParentDocumentsStep.tsx`      | `GET /v1/applications/document-types`<br>`POST /v1/applications/:id/documents`          | Multipart `FormData`: `file`, `document_type_id`                                                    | `AdmissionDocument`                        | File size $\le$ 10MB; MIME type image/pdf; mandatory documents verified                      | `WizardStep5Documents.tsx` (`expo-document-picker`)       |
| **6. Fee Statement**   | `ParentFeePaymentStep.tsx`     | `GET /v1/applications/:id/fee`<br>`POST /v1/applications/:id/payment`                   | `{ payment_mode, payment_status }`                                                                  | `FeeSummary` / `payment`                   | Processing fee display, payment mode selection (`upi`, `card`, `netbanking`)                 | `WizardStep6Fee.tsx`                                      |
| **7. Review & Submit** | `ParentReviewSubmitStep.tsx`   | `POST /v1/applications`<br>`PATCH /v1/applications/:id/status`                          | Payload: `CreateApplicationRequest`<br>Status: `{ status: 'submitted' }`                            | `AdmissionApplication`                     | Declaration acceptance mandatory; full validation before mutation; mutation retries disabled | `WizardStep7Review.tsx`                                   |
| **8. Confirmation**    | `ParentConfirmationStep.tsx`   | Read-only state                                                                         | None                                                                                                | Server Application Number                  | Displays submission badge, application number, and next steps                                | `WizardStep8Confirmation.tsx`                             |

---

## 2. Security & Invariant Rules

1. **Server-Side Ownership**: The client never specifies `parent_id` or `user_id` as an authorization token. Ownership is bound to the JWT context on the backend.
2. **Atomic Document Upload Invariant**: If any mandatory document upload fails, status remains `documents_pending` and the user is guided to retry without losing form progress.
3. **Post-Submission Lock**: Once `status === 'submitted'`, form fields become immutable and editing controls are disabled.
4. **Draft Isolation**: Unsubmitted drafts are keyed by `edutrack_app_draft_<userId>_<appId>` and never store secrets or tokens.
