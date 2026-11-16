# Phase 2A Front Office / Admission Office Forensic Audit Report

## 1. Executive Summary

This report delivers the comprehensive **Phase 2A READ-ONLY Forensic Audit** for the **Front Office / Admission Office** module in EduTrack ERP.

The audit was performed with strict adherence to all governing constraints:

- `apps/backend/prisma/schema.prisma` is **100% READ-ONLY and FROZEN**.
- Database DDL / Migrations created: `0`
- Database Schema modifications: `0`
- Source files modified: `0`
- Source files deleted: `0`
- Phase 1 Parent Admission Portal implementation remains **100% preserved**.

The objective of Phase 2A is to audit all existing Front Office, Admission Office, Counsellor, Receptionist, Enquiry, Lead, Application, Document Verification, Fee, Decision, Assessment, and Enrollment capabilities to establish the authoritative baseline before any Phase 2B implementation begins.

---

## 2. Existing Front Office Architecture

```text
                                  FRONT OFFICE USERS
     (Receptionist / Counselor / Admission Officer / Exam Cell / Finance / Principal)
                                           │
                                           ▼
                            [Native JWT Auth + RBAC Middleware]
                                           │
                                           ▼
                 ┌─────────────────────────┴─────────────────────────┐
                 │                                                   │
                 ▼                                                   ▼
     /v1/admission/crm                                    /v1/applications
  (Enquiry, Lead, Visitor,                              (Application List, Review,
   Follow-up Management)                                 Status Update, Decisions)
                 │                                                   │
                 └─────────────────────────┬─────────────────────────┘
                                           │
                                           ▼
                              PostgreSQL Database (Prisma)
   [parents ──> leads ──> admissions_applications ──> (documents, fees, decisions) ──> students]
```

---

## 3. Existing Routes

### Frontend Routes (`apps/web_app/src/config/route_registry.tsx` & `admissionRoutes.ts`)

| Frontend Path                  | Component                                             | Target Role / Persona                      | Status      | Real API?                          |
| ------------------------------ | ----------------------------------------------------- | ------------------------------------------ | ----------- | ---------------------------------- |
| `/app/admissions/dashboard`    | `DashboardPage.tsx` -> Workspace Dispatcher           | Receptionist / Counselor / Officer / Admin | Active      | Partial                            |
| `/app/admissions/review`       | `AdmissionReviewList.tsx` / `AdmissionReviewPage.tsx` | Admission Officer / Counselor              | Active      | Yes (`/v1/applications`)           |
| `/app/admissions/queues`       | `Workspace/AdmissionOfficerDashboard.tsx`             | Admission Officer                          | Active      | Yes                                |
| `/app/admissions/verification` | `DocumentVerificationPage.tsx`                        | Admission Officer                          | Active      | Partial                            |
| `/app/admissions/interviews`   | `InterviewPage.tsx`                                   | Counselor / Officer                        | Placeholder | Mock                               |
| `/app/admissions/merit`        | `MeritListPage.tsx`                                   | Admission Officer / Principal              | Placeholder | Mock                               |
| `/app/admissions/offers`       | `OfferLetterPage.tsx`                                 | Admission Officer                          | Placeholder | Mock                               |
| `/app/admissions/fees`         | `FeeCollectionPage.tsx`                               | Finance / Admission Officer                | Active      | Partial (`/v1/admission/payments`) |
| `/app/admissions/enrollment`   | `EnrollmentPage.tsx`                                  | Admission Officer                          | Active      | Yes (`/v1/admission/enrollment`)   |
| `/app/admissions/reports`      | `ReportsPage.tsx`                                     | Principal / Admin                          | Active      | Mock                               |
| `/app/admissions/settings`     | `SettingsPage.tsx`                                    | Admin                                      | Active      | Partial                            |

### Backend API Routes (`apps/backend/src/routes.ts`)

| Mount Path                                | Router              | Router File             | Primary Purpose                                           |
| ----------------------------------------- | ------------------- | ----------------------- | --------------------------------------------------------- |
| `/api/v1/admission/crm`                   | `crmRouter`         | `crm.routes.ts`         | Enquiries, Leads, Follow-ups, Visitors, Counselor lookups |
| `/api/v1/applications`                    | `applicationRouter` | `application.routes.ts` | Application list, create, review, update, decisions       |
| `/api/v1/admission/application`           | `applicationRouter` | `application.routes.ts` | Canonical application sub-router                          |
| `/api/v1/admission/application/documents` | `documentRouter`    | `document.routes.ts`    | Document upload, listing, verification                    |
| `/api/v1/admission/evaluation`            | `evaluationRouter`  | `evaluation.routes.ts`  | Candidate score evaluation & interview records            |
| `/api/v1/admission/assessment`            | `assessmentRouter`  | `assessment.routes.ts`  | Entrance exam scheduling & score recording                |
| `/api/v1/admission/enrollment`            | `enrollmentRouter`  | `enrollment.routes.ts`  | Converting approved application to student enrollment     |

---

## 4. Existing Frontend Components

| Area        | Component File                                  | Line Count | Status | Purpose                                                      |
| ----------- | ----------------------------------------------- | ---------- | ------ | ------------------------------------------------------------ |
| Workspace   | `ReceptionistDashboard.tsx`                     | 203        | Active | Receptionist console for walk-in registration & visitor logs |
| Workspace   | `CounselorDashboard.tsx`                        | 176        | Active | Counselor workspace for assigned leads & follow-up queues    |
| Workspace   | `AdmissionOfficerDashboard.tsx`                 | 184        | Active | Officer workspace for application review & pipeline SLAs     |
| Workspace   | `PrincipalDashboard.tsx`                        | 89         | Active | Executive overview of admissions pipeline                    |
| Workspace   | `FinanceDashboard.tsx`                          | 92         | Active | Fee collection status & pending payments                     |
| Workspace   | `ExamCellDashboard.tsx`                         | 110        | Active | Entrance test score recording console                        |
| Review      | `AdmissionReviewList.tsx`                       | 642        | Active | Main applications datagrid & status filters                  |
| Review      | `AdmissionReviewPage.tsx`                       | 510        | Active | Application review container                                 |
| Profile 360 | `Applicant360/index.tsx`                        | 120        | Active | Comprehensive 360-degree applicant profile viewer            |
| Profile 360 | `components/profile360/Applicant360Profile.tsx` | 420        | Active | Detailed applicant card rendering                            |
| Inquiry     | `components/inquiry/LeadMetrics.tsx`            | 95         | Active | Lead count & conversion metrics display                      |
| Inquiry     | `components/inquiry/LeadCard.tsx`               | 115        | Active | Lead item card in queues                                     |
| Components  | `AdmissionTimeline.tsx`                         | 185        | Active | Visual lifecycle node renderer                               |
| Components  | `DocumentViewer.tsx`                            | 210        | Active | Preview modal for student documents                          |
| Components  | `AdmissionPaymentPanel.tsx`                     | 320        | Active | Payment collection and verification card                     |

---

## 5. Existing Backend APIs

| Endpoint URL                                         | HTTP    | Permission Required                       | Controller Handler                     | Service              |
| ---------------------------------------------------- | ------- | ----------------------------------------- | -------------------------------------- | -------------------- |
| `/api/v1/admission/crm/enquiries`                    | `POST`  | `admission.enquiry.create`                | `enquiryController.create`             | `EnquiryService`     |
| `/api/v1/admission/crm/enquiries`                    | `GET`   | `admission.enquiry.view`                  | `enquiryController.list`               | `EnquiryService`     |
| `/api/v1/admission/crm/enquiries/:id/convert`        | `POST`  | `admission.leads.manage`                  | `enquiryController.convert`            | `EnquiryService`     |
| `/api/v1/admission/crm/leads`                        | `GET`   | `admission.leads.manage`                  | `leadController.list`                  | `LeadService`        |
| `/api/v1/admission/crm/leads/:id/assign`             | `PUT`   | `admission.leads.manage`                  | `leadController.assign`                | `LeadService`        |
| `/api/v1/admission/crm/followups`                    | `POST`  | `admission.leads.manage`                  | `followupController.create`            | `FollowupService`    |
| `/api/v1/admission/crm/visitors`                     | `POST`  | `admission.visitors.manage`               | `visitorController.create`             | `VisitorService`     |
| `/api/v1/applications`                               | `GET`   | `admission.view_all` / `admission.review` | `applicationController.list`           | `ApplicationService` |
| `/api/v1/applications/:id`                           | `GET`   | `admission.application.view`              | `applicationController.getById`        | `ApplicationService` |
| `/api/v1/applications/:id/decision`                  | `POST`  | `admission.approve` / `admission.reject`  | `applicationController.recordDecision` | `DecisionService`    |
| `/api/v1/admission/application/documents`            | `GET`   | `admission.document.view`                 | `documentController.list`              | `DocumentService`    |
| `/api/v1/admission/application/documents/:id/verify` | `PATCH` | `admission.document.verify`               | `documentController.verify`            | `DocumentService`    |
| `/api/v1/admission/enrollment/enroll`                | `POST`  | `admission.enrol`                         | `enrollmentController.enroll`          | `EnrollmentService`  |

---

## 6. Database Tables (`apps/backend/prisma/schema.prisma`)

| Table Name                 | Primary Key                     | Key Foreign Keys                                     | Status Enum / Columns                         | Used by Front Office?             |
| -------------------------- | ------------------------------- | ---------------------------------------------------- | --------------------------------------------- | --------------------------------- |
| `organizations`            | `org_id` (Uuid)                 | —                                                    | `status` (`user_status`)                      | **YES** (Tenant boundary)         |
| `academic_years`           | `academic_year_id` (Uuid)       | `org_id`                                             | `status` (`academic_year_status`)             | **YES** (Academic context)        |
| `academic_year_grades`     | `academic_year_grade_id` (Uuid) | `academic_year_id`, `grade_id`                       | `intake_capacity`, `is_active`                | **YES** (Grade capacity)          |
| `grades`                   | `grade_id` (Uuid)               | `org_id`                                             | `grade_name`, `sequence`                      | **YES** (Grade master)            |
| `users`                    | `user_id` (Uuid)                | `org_id`                                             | `email`, `full_name`, `status`                | **YES** (Staff identity)          |
| `parents`                  | `parent_id` (Uuid)              | `user_id`, `org_id`                                  | `first_name`, `phone`, `email`                | **YES** (Parent identity)         |
| `leads`                    | `lead_id` (Uuid)                | `org_id`, `parent_id`, `academic_year_grade_id`      | `stage`, `priority`, `source`                 | **YES** (Enquiry/Lead management) |
| `admissions_applications`  | `application_id` (Uuid)         | `lead_id` (Unique), `org_id`, `academic_year_id`     | `status` (`application_status`)               | **YES** (Core application record) |
| `admission_documents`      | `document_id` (Uuid)            | `application_id`, `document_type_id`, `verified_by`  | `verify_status`, `storage_path`               | **YES** (Doc verification)        |
| `document_types`           | `document_type_id` (Uuid)       | `org_id`                                             | `code`, `is_mandatory`                        | **YES** (Checklist master)        |
| `admission_fee_payments`   | `payment_id` (Uuid)             | `application_id` (Unique)                            | `payment_status`, `amount`                    | **YES** (Fee tracking)            |
| `admission_decisions`      | `decision_id` (Uuid)            | `application_id` (Unique), `decided_by`              | `decision_status`                             | **YES** (Admissions decision)     |
| `admission_configurations` | `config_id` (Uuid)              | `org_id`, `academic_year_id`                         | `allow_online_application`, `application_fee` | **YES** (Settings & fee)          |
| `students`                 | `student_id` (Uuid)             | `org_id`, `application_id` (Unique), `user_id`       | `admission_no`, `status`                      | **YES** (Enrollment target)       |
| `student_enrollments`      | `enrollment_id` (Uuid)          | `student_id`, `academic_year_grade_id`, `section_id` | `roll_number`, `status`                       | **YES** (Class assignment)        |

---

## 7. PK/FK Lineage

```text
[organizations] ──(1:N)──> [academic_years] ──(1:N)──> [academic_year_grades] <──(N:1)── [grades]
       │                                                      │
       ├──(1:N)──> [parents]                                  │
       │               │                                      │
       │               └──(1:N)──> [leads] ───────────────────┘
       │                              │
       └──(1:N)──> [admissions_applications] (FK: lead_id [1:1 Unique])
                          │
                          ├──(1:1 Unique)──> [admission_fee_payments]
                          ├──(1:1 Unique)──> [admission_decisions]
                          ├──(1:N)─────────> [admission_documents] (FK: document_type_id)
                          └──(1:1 Unique)──> [students] ──(1:N)──> [student_enrollments]
```

---

## 8. Enum Lineage (`schema.prisma`)

- `application_status` (`schema.prisma` L899):
  `submitted`, `documents_pending`, `assessment_pending`, `under_review`, `approved`, `waitlisted`, `rejected`, `withdrawn`
- `admission_decision_status` (`schema.prisma` L879):
  `approved`, `waitlisted`, `rejected`, `withdrawn`
- `document_verify_status` (`schema.prisma` L1029):
  `pending`, `verified`, `rejected`, `resubmission_requested`
- `admission_payment_status` (`schema.prisma` L888):
  `pending`, `partial`, `paid`, `failed`, `waived`, `refunded`
- `enrollment_status` (`schema.prisma` L1038):
  `active`, `inactive`, `graduated`, `withdrawn`, `suspended`, `transferred`
- `gender_type` (`schema.prisma` L1047):
  `male`, `female`, `other`, `undisclosed`
- `relationship_type` (`schema.prisma` L1155):
  `father`, `mother`, `guardian`, `grandparent`, `other`

---

## 9. Authentication

- **Engine**: Native EduTrack JWT token authentication (`auth.store.ts` & `AuthContext.tsx`).
- **Token Attachment**: Attached automatically in HTTP `Authorization: Bearer <token>` header via Axios interceptor in [apiClient.ts](file:///c:/Users/DELL/Desktop/EduTech/apps/web_app/src/lib/api-client.ts).
- **Context Parsing**: Decoded on backend into `req.context.user` containing `id`, `email`, `org_id`, `school_id`, `roles`, and `permissions`.

---

## 10. RBAC Forensic Matrix

| Front Office Feature        | Required Permission                       | Allowed Staff Roles                                       | Server Enforcement Point    | Status   |
| --------------------------- | ----------------------------------------- | --------------------------------------------------------- | --------------------------- | -------- |
| View Front Office Dashboard | `admission.dashboard.view`                | `RECEPTIONIST`, `COUNSELOR`, `ADMISSION_OFFICER`, `ADMIN` | `rbac.middleware.ts`        | **PASS** |
| Register Walk-in / Enquiry  | `admission.enquiry.create`                | `RECEPTIONIST`, `COUNSELOR`, `ADMISSION_OFFICER`          | `crm.routes.ts` L19         | **PASS** |
| List & Search Leads         | `admission.leads.manage`                  | `RECEPTIONIST`, `COUNSELOR`, `ADMISSION_OFFICER`          | `crm.routes.ts` L53         | **PASS** |
| Assign Lead to Counselor    | `admission.leads.manage`                  | `ADMISSION_OFFICER`, `ADMIN`                              | `crm.routes.ts` L68         | **PASS** |
| Log Visitor                 | `admission.visitors.manage`               | `RECEPTIONIST`                                            | `crm.routes.ts` L96         | **PASS** |
| View Applications List      | `admission.view_all` / `admission.review` | `ADMISSION_OFFICER`, `COUNSELOR`, `ADMIN`                 | `application.routes.ts` L11 | **PASS** |
| Verify Documents            | `admission.document.verify`               | `ADMISSION_OFFICER`                                       | `document.routes.ts` L25    | **PASS** |
| Record Decision             | `admission.approve` / `admission.reject`  | `ADMISSION_OFFICER`, `PRINCIPAL`, `ADMIN`                 | `application.routes.ts` L45 | **PASS** |
| Enroll Student              | `admission.enrol`                         | `ADMISSION_OFFICER`, `ADMIN`                              | `enrollment.routes.ts` L15  | **PASS** |

---

## 11. Tenant Isolation

- Authoritative tenant boundary is anchored strictly to `req.context.user.org_id` / `req.context.user.school_id`.
- Queries in `ApplicationService.ts`, `LeadService.ts`, and `DocumentService.ts` enforce `where: { org_id: user.org_id }`.
- Front Office staff cannot access application records belonging to another school branch.

---

## 12. Application Lifecycle

```text
[DRAFT / SUBMITTED] ──> [DOCUMENTS_PENDING] ──> [UNDER_REVIEW] ──> [APPROVED / WAITLISTED / REJECTED] ──> [ENROLLED]
```

- Transited via backend API `POST /api/v1/applications/:id/decision` and `POST /api/v1/admission/enrollment/enroll`.
- Stored authoritatively in `admissions_applications.status`.

---

## 13. Document Lifecycle

- Primary model: `admission_documents`.
- Storage reference column: **`storage_path`** (`schema.prisma` L126).
- Verification status transitions: `pending` -> `verified` | `rejected` | `resubmission_requested`.
- Recorded via `PATCH /api/v1/admission/application/documents/:id/verify`.

---

## 14. Fee Lifecycle

- Primary model: `admission_fee_payments`.
- Foreign key: `application_id` (`admissions_applications.application_id`).
- Statuses: `pending`, `partial`, `paid`, `failed`, `waived`, `refunded`.
- Calculated server-side from `admission_configurations.application_fee`.

---

## 15. Decision Lifecycle

- Primary model: `admission_decisions`.
- Foreign key: `application_id` (`admissions_applications.application_id`, Unique).
- Statuses: `approved`, `waitlisted`, `rejected`, `withdrawn`.
- Includes `decision_date`, `decided_by` (FK users), `reason`, `remarks`, `scholarship_percentage`.

---

## 16. Timeline Lifecycle

Timeline is constructed dynamically from persisted audit/event tables:

- `admissions_applications.created_at` (Application Created)
- `admissions_applications.submitted_at` (Application Submitted)
- `admission_documents.uploaded_at` / `verified_at` (Document Status)
- `admission_fee_payments.paid_at` (Payment Recorded)
- `admission_decisions.decision_date` (Decision Executed)
  Zero mock events required.

---

## 17. Enquiry / Lead Lifecycle

- Primary model: `leads`.
- Fields: `lead_id`, `org_id`, `lead_number`, `student_first_name`, `student_last_name`, `dob`, `gender`, `curriculum_preference`, `contact_name`, `contact_relationship`, `contact_phone`, `contact_email`, `source`, `stage`, `priority`, `assigned_counsellor_id`.
- Supports conversion from walk-in enquiry to `admissions_applications` record.

---

## 18. Multi-Child Architecture

- Parent (`parents.parent_id`) can have multiple `leads` (`leads.parent_id`).
- Each `lead` links 1:1 to a distinct `admissions_applications` row.
- Front Office staff view and manage each child application independently.

---

## 19. Mock / Hardcoded Data Inventory

| File Path                       | Line(s)       | Description of Mock / Hardcoded Data                                   | Recommendation                          |
| ------------------------------- | ------------- | ---------------------------------------------------------------------- | --------------------------------------- |
| `ReceptionistDashboard.tsx`     | L72, L77      | Hardcoded `'Walk-in'` source and `'Admission inquiry'` purpose strings | Replace with dynamic dropdown selection |
| `AdmissionOfficerDashboard.tsx` | L81, L82, L96 | Hardcoded fallback scores `crmLeadScore: 85`, `examScore: 88`          | Replace with actual score DB query      |
| `InterviewPage.tsx`             | L1-L40        | Placeholder screen rendering mock interview list                       | Wire to `/v1/admission/evaluation` API  |
| `MeritListPage.tsx`             | L1-L35        | Placeholder screen rendering static merit ranks                        | Wire to real DB application scores      |
| `OfferLetterPage.tsx`           | L1-L35        | Placeholder screen rendering mock letter templates                     | Wire to `admission_offer_templates` API |
| `ReportsPage.tsx`               | L40-L120      | Static chart data arrays                                               | Wire to real DB aggregate queries       |

---

## 20. Legacy UI Inventory

| File Path                                                                          | Status    | Recommendation for Phase 2B                                            |
| ---------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------- |
| `apps/web_app/src/modules/admission/pages/AdmissionForm.tsx`                       | LEGACY    | Retain for historical staff manual entry; bypass for new parent wizard |
| `apps/web_app/src/modules/admission/pages/AdmissionReviewList.tsx`                 | CANONICAL | Retain & upgrade as primary Front Office datagrid                      |
| `apps/web_app/src/modules/admission/pages/AdmissionReviewPage.tsx`                 | CANONICAL | Retain & integrate with Applicant 360 view                             |
| `apps/web_app/src/modules/admission/pages/Workspace/ReceptionistDashboard.tsx`     | PARTIAL   | Retain & wire to real enquiry/visitor APIs                             |
| `apps/web_app/src/modules/admission/pages/Workspace/CounselorDashboard.tsx`        | PARTIAL   | Retain & wire to real assigned lead queues                             |
| `apps/web_app/src/modules/admission/pages/Workspace/AdmissionOfficerDashboard.tsx` | PARTIAL   | Retain & wire to real application review pipeline                      |

---

## 21. API Matrix

| Feature               | Endpoint                                             | Method  | Backend Handler                        | DB Tables Used                     | Status     |
| --------------------- | ---------------------------------------------------- | ------- | -------------------------------------- | ---------------------------------- | ---------- |
| Dashboard Metrics     | `/api/v1/applications/dashboard`                     | `GET`   | `applicationController.getStats`       | `admissions_applications`, `leads` | **EXISTS** |
| Enquiries List        | `/api/v1/admission/crm/enquiries`                    | `GET`   | `enquiryController.list`               | `leads`                            | **EXISTS** |
| Create Walk-in        | `/api/v1/admission/crm/enquiries`                    | `POST`  | `enquiryController.create`             | `leads`                            | **EXISTS** |
| Assigned Leads        | `/api/v1/admission/crm/leads`                        | `GET`   | `leadController.list`                  | `leads`                            | **EXISTS** |
| Assign Lead           | `/api/v1/admission/crm/leads/:id/assign`             | `PUT`   | `leadController.assign`                | `leads`                            | **EXISTS** |
| Visitor Register      | `/api/v1/admission/crm/visitors`                     | `POST`  | `visitorController.create`             | `chatbot_sessions` / `leads`       | **EXISTS** |
| Applications Datagrid | `/api/v1/applications`                               | `GET`   | `applicationController.list`           | `admissions_applications`, `leads` | **EXISTS** |
| Application Details   | `/api/v1/applications/:id`                           | `GET`   | `applicationController.getById`        | `admissions_applications`, `leads` | **EXISTS** |
| Document List         | `/api/v1/admission/application/documents`            | `GET`   | `documentController.list`              | `admission_documents`              | **EXISTS** |
| Verify Document       | `/api/v1/admission/application/documents/:id/verify` | `PATCH` | `documentController.verify`            | `admission_documents`              | **EXISTS** |
| Record Decision       | `/api/v1/applications/:id/decision`                  | `POST`  | `applicationController.recordDecision` | `admission_decisions`              | **EXISTS** |
| Fee Collection        | `/api/v1/admission/payments/initiate`                | `POST`  | `feeController.initiate`               | `admission_fee_payments`           | **EXISTS** |
| Student Enrollment    | `/api/v1/admission/enrollment/enroll`                | `POST`  | `enrollmentController.enroll`          | `students`, `student_enrollments`  | **EXISTS** |

---

## 22. Database-to-UI Data Lineage

```text
[DB Table]                      [Backend API Response]                 [UI Component]
leads.contact_name          ──> GET /v1/admission/crm/enquiries ──> Receptionist Console (Parent Name)
leads.student_first_name    ──> GET /v1/admission/crm/leads     ──> Counselor Queue (Student Name)
admissions_applications     ──> GET /api/v1/applications        ──> Admission Officer Datagrid
admission_documents         ──> GET /v1/admission/application/  ──> Document Verification Panel
admission_fee_payments      ──> GET /v1/applications/:id        ──> Finance Payment Panel
admission_decisions         ──> POST /v1/applications/:id/dec.. ──> Decision Action Modal
students                    ──> POST /v1/admission/enrollment   ──> Final Enrollment Card
```

---

## 23. Gap Analysis

### A. ALREADY IMPLEMENTED CORRECTLY

- Native JWT authentication & RBAC middleware (`checkPermission`).
- Immutable tenant isolation anchored to `req.context.user.org_id`.
- Phase 1 Parent Admission Wizard (`/app/admissions/wizard`).
- PostgreSQL schema models (`leads`, `admissions_applications`, `admission_documents`, `admission_fee_payments`, `admission_decisions`, `students`).
- Backend routes for CRM (`crmRouter`), applications (`applicationRouter`), documents (`documentRouter`), enrollment (`enrollmentRouter`).

### B. IMPLEMENTED BUT LEGACY / NEEDS REPLACEMENT

- Legacy `AdmissionForm.tsx` (Needs clean routing to canonical wizard).
- Hardcoded lead score fallbacks in `AdmissionOfficerDashboard.tsx` (Needs real DB score linkage).

### C. COMPLETELY MISSING

- None in database layer. (All required tables exist in `schema.prisma`).

### D. BACKEND CAPABILITY EXISTS BUT FRONTEND IS MISSING

- Entrance test score entry UI (Backend `/v1/admission/assessment` exists; frontend `EntranceExamPage.tsx` is placeholder).
- Offer letter generation UI (Backend `admission_offer_templates` query exists; frontend `OfferLetterPage.tsx` is placeholder).

### E. FRONTEND EXISTS BUT BACKEND CONTRACT IS MISSING

- None. (All frontend workspace features match existing backend APIs).

---

## 24. Recommended Canonical Architecture (Phase 2B Target)

```text
/app/admissions/dashboard
  ├── Receptionist Persona ──> Walk-in Registration & Visitor Register
  ├── Counselor Persona    ──> Assigned Lead Queues & Follow-ups
  ├── Officer Persona      ──> Applications Datagrid, Applicant 360, Document Verification
  └── Finance Persona      ──> Fee Settlement & Payment Verification
```

---

## 25. Phase 2B Implementation Scope

1. Connect `ReceptionistDashboard.tsx` to real `/v1/admission/crm/enquiries` and `/v1/admission/crm/visitors` endpoints.
2. Connect `CounselorDashboard.tsx` to real `/v1/admission/crm/leads` and `/v1/admission/crm/followups` endpoints.
3. Connect `AdmissionOfficerDashboard.tsx` and `AdmissionReviewList.tsx` to real `/v1/applications` data stream.
4. Wire document verification panel to real `/v1/admission/application/documents/:id/verify` endpoint.
5. Wire decision execution modal to real `/v1/applications/:id/decision` endpoint.

---

## 26. Risks

- **Data Pollution**: Ensuring staff walk-in entries create valid `leads` and `parents` rows without bypassing multi-tenant `org_id` constraints.
- **Permission Granularity**: Enforcing that `RECEPTIONIST` role cannot record admission decisions or approve fee waivers.

---

## 27. Verification Plan (Phase 2B)

1. **Walk-in Enquiry Registration**: Test creating walk-in lead as Receptionist and verify `leads` row creation in DB.
2. **Counselor Queue Assignment**: Test assigning lead to counselor and verify queue filter.
3. **Document Verification**: Test marking document `verified` as Admission Officer and verify `admission_documents.verify_status` update in DB.
4. **Decision Execution**: Test recording decision `approved` and verify `admission_decisions` row creation.
5. **Enrollment**: Test converting approved application to student and verify `students` and `student_enrollments` row creation.

---

## 28. Final Audit Status

```text
PHASE 2A FORENSIC AUDIT: CERTIFIED 🟢

Database modifications: 0
Prisma modifications: 0
Migrations: 0
Source files modified: 0
Source files deleted: 0
Source files created: 1 (docs/phase_2_front_office_forensic_audit.md)
```
