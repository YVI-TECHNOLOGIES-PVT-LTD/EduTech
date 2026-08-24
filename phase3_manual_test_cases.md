# EduTrack ERP — Phase 3 Manual Verification Test Matrix

## Module: Admission Decision → Enrollment Lifecycle

This document contains the complete manual test matrix for verifying the **Phase 3 (Admission Decision → Enrollment)** implementation in EduTrack ERP.

---

### Test Suite 1: Decision Workflow & Principal Desk

| ID        | Test Scenario                   | Preconditions                                 | Action / Steps                                                                                                                                     | Expected Result                                                                                                         | Pass/Fail |
| --------- | ------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------- |
| **TC-01** | Record Approved Decision        | Application submitted & assessment evaluated. | Open Applicant 360 → Approval Tab → Click "Record Decision" → Select `approved`, specify scholarship `15%`, offer validity date, remarks → Submit. | Decision saved to `admission_decisions` table. Status updates to `approved`. Toast confirms success.                    | `PASS`    |
| **TC-02** | Record Waitlisted Decision      | Application under review.                     | Open Applicant 360 → Approval Tab → Click "Record Decision" → Select `waitlisted`, specify position `3`, reason → Submit.                          | `admission_decisions.decision_status = 'waitlisted'`. Applicant 360 and Parent Portal display Waitlisted position `#3`. | `PASS`    |
| **TC-03** | Record Rejected Decision        | Application evaluated below cutoff.           | Open Applicant 360 → Approval Tab → Click "Record Decision" → Select `rejected`, provide rejection reason → Submit.                                | Status updates to `rejected`. Parent Portal reflects clear committee reason.                                            | `PASS`    |
| **TC-04** | Decision Update / Revision      | Decision already recorded.                    | Re-open Record Decision modal, update scholarship or remarks, click Update.                                                                        | Existing decision record is updated (1:1 relation), no duplicate rows created.                                          | `PASS`    |
| **TC-05** | Form Validation & Empty Strings | Decision modal open.                          | Leave optional numbers empty (scholarship, waitlist) and submit.                                                                                   | Backend DTO transforms `""` to `undefined/null`, PostgreSQL decimal/integer parsing succeeds without 500 error.         | `PASS`    |

---

### Test Suite 2: Enrollment Gating & Prerequisite Enforcement

| ID        | Test Scenario                               | Preconditions                                                    | Action / Steps                                                              | Expected Result                                                                                                                      | Pass/Fail |
| --------- | ------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| **TC-06** | Block Enrollment without Decision           | Application submitted, no decision recorded.                     | Attempt to call `POST /api/v1/students/convert/:id` directly or inspect UI. | Returns 422: `"Cannot enroll student: Admission decision is not approved (current status: None)"`. UI shows decision pending.        | `PASS`    |
| **TC-07** | Block Enrollment when Waitlisted / Rejected | Decision is `waitlisted` or `rejected`.                          | Attempt conversion.                                                         | Returns 422: `"Cannot enroll student: Admission decision is not approved"`. Enrollment button disabled.                              | `PASS`    |
| **TC-08** | Block Enrollment when Fee is Unpaid         | Decision is `approved`, but fee payment is `pending` or missing. | Attempt conversion via Enrollment Desk.                                     | Returns 422: `"Admission fee payment is required before enrollment. Please complete fee payment first."` UI shows red fee indicator. | `PASS`    |
| **TC-09** | Permit Enrollment when Fee is Paid          | Decision is `approved` and fee payment is `paid`.                | Open Enrollment Desk in Applicant 360.                                      | Prerequisite indicators show all green (✓ Decision Approved, ✓ Fee Paid, ✓ Docs Verified). "Enroll Student Now" button enabled.      | `PASS`    |
| **TC-10** | Permit Enrollment when Fee is Waived        | Decision is `approved` and fee payment is `waived`.              | Open Enrollment Desk and submit enrollment.                                 | System validates `waived` as equivalent to paid, allows enrollment to proceed.                                                       | `PASS`    |

---

### Test Suite 3: SIS Provisioning & Atomic Transaction

| ID        | Test Scenario                              | Preconditions                             | Action / Steps                                                                               | Expected Result                                                                                                                                                                                                                   | Pass/Fail |
| --------- | ------------------------------------------ | ----------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| **TC-11** | Full Student Provisioning                  | Prerequisites met (`approved` + `paid`).  | In Enrollment Desk, select Section (e.g. `Section A`), input optional Roll No `101`, submit. | Atomic transaction completes: <br>1. `students` created with auto-generated `ADM-2026-00001`<br>2. `student_parents` linked<br>3. `student_enrollments` created with section & roll no<br>4. `leads.stage` updated to `enrolled`. | `PASS`    |
| **TC-12** | Duplicate Enrollment Idempotency           | Student already enrolled for application. | Repeat `POST /api/v1/students/convert/:id` or click Enroll again.                            | System detects existing `students` record for application and returns 200/201 with existing student and warning, preventing duplicate row errors.                                                                                 | `PASS`    |
| **TC-13** | Collision-Safe Admission Number Generation | Existing students in organization.        | Enroll a new applicant.                                                                      | System queries count, verifies uniqueness of `ADM-2026-XXXXX` across tenant, and assigns unique number.                                                                                                                           | `PASS`    |
| **TC-14** | Section & Academic Year Grade Validation   | Section belongs to different grade.       | Send invalid `section_id` in conversion request payload.                                     | Returns 422: `"Selected section is invalid or does not belong to the applicant's academic year grade."`                                                                                                                           | `PASS`    |

---

### Test Suite 4: Multi-Tenant Isolation & Role-Based Access Control (RBAC)

| ID        | Test Scenario                     | Preconditions                                                                   | Action / Steps                                                             | Expected Result                                                                                         | Pass/Fail |
| --------- | --------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------- |
| **TC-15** | Tenant Isolation on Conversion    | Staff in Org A attempts to enroll Org B application.                            | Staff in Org A calls convert API with `application_id` belonging to Org B. | Returns 404: `"Application not found or does not belong to organization"`. No cross-tenant leak.        | `PASS`    |
| **TC-16** | RBAC Authorization on Enrollment  | User logged in with `TEACHER` or unauthorized role.                             | Attempt to call enrollment endpoint.                                       | Returns 403: `"Forbidden: Missing permission admission.enrol"`.                                         | `PASS`    |
| **TC-17** | RBAC Success for Authorized Staff | User logged in as `FRONT_OFFICE`, `ADMISSION_OFFICER`, `ADMIN`, or `PRINCIPAL`. | Perform decision and enrollment actions.                                   | Session service grants `admission.enrol`, `STUDENT_CREATE`, `STUDENT_VIEW`; action succeeds seamlessly. | `PASS`    |

---

### Test Suite 5: Parent Portal & Internationalization (i18n)

| ID        | Test Scenario                           | Preconditions                                                                      | Action / Steps                        | Expected Result                                                                                                                                                             | Pass/Fail |
| --------- | --------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| **TC-18** | Parent Portal Milestone & Enrolled Card | Parent views status after approval & enrollment.                                   | Navigate to `/app/admissions/status`. | Milestones 1 through 5 reflect checkmarks. Enrolled Student SIS Card displays Student Name, Admission No (`ADM-2026-XXXXX`), Class, and Section.                            | `PASS`    |
| **TC-19** | Multilingual Glossary & RTL Rendering   | Parent or staff selects Hindi, Telugu, Tamil, Kannada, Malayalam, Urdu, or Arabic. | Switch language in UI.                | Phase 3 terms ("Admission Decision", "Enrollment", "Academic Section", "Admission Number", "Roll Number") translate accurately; Arabic and Urdu render right-to-left (RTL). | `PASS`    |

---

### Summary of Manual Test Execution

- **Total Test Cases**: 19
- **Passed**: 19
- **Failed**: 0
- **Blocked**: 0
- **Regression Impact on Phase 1 & 2**: None. All TypeScript checks clean, zero schema changes.
