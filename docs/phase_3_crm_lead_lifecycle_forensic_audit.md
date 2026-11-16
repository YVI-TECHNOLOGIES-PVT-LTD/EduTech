# Phase 3A CRM / Lead Lifecycle Forensic Audit Report

## 1. Executive Summary

This report delivers the comprehensive **Phase 3A READ-ONLY Forensic Audit** for **CRM & Lead Lifecycle Management** in EduTrack ERP.

The audit was performed with strict adherence to all governing constraints:

- `apps/backend/prisma/schema.prisma` is **100% READ-ONLY and FROZEN**.
- Database DDL / Migrations created: `0`
- Database Schema modifications: `0`
- Phase 1 Parent Admission Portal (`/app/admissions/wizard`) and Phase 2 Front Office command center remain **100% preserved and untouched**.

---

## 2. Database Model Forensic Audit (`apps/backend/prisma/schema.prisma`)

### A. Model `leads` (`schema.prisma` L445-L494)

- **Primary Key**: `lead_id` (`Uuid`, `default(dbgenerated("gen_random_uuid()"))`)
- **Unique Columns**: `lead_number` (`VarChar(30)`)
- **Foreign Keys**:
  - `org_id` -> `organizations.org_id` (Cascade onDelete)
  - `academic_year_grade_id` -> `academic_year_grades.academic_year_grade_id`
  - `assigned_counsellor_id` -> `staff.staff_id`
  - `parent_id` -> `parents.parent_id`
  - `created_by` -> `users.user_id`
  - `updated_by` -> `users.user_id`
- **1:1 Relation**: `admissions_applications` (Optional 1:1 relation to application)
- **1:N Relations**: `lead_activities`, `lead_visits`, `chatbot_sessions`, `lead_query_type_mappings`

### Canonical `leads` Columns & Types:

- `student_first_name`: `VarChar(100)`
- `student_last_name`: `VarChar(100)` (Optional)
- `dob`: `Date` (Optional)
- `gender`: `gender_type` Enum (`male`, `female`, `other`, `undisclosed`)
- `curriculum_preference`: `VarChar(50)` (Optional)
- `scholarship_interest`: `Boolean` (Default: `false`)
- `contact_name`: `VarChar(150)`
- `contact_relationship`: `relationship_type` Enum (`father`, `mother`, `guardian`, `grandparent`, `other`)
- `contact_phone`: `VarChar(20)`
- `contact_email`: `VarChar(200)` (Optional)
- `source`: `lead_source` Enum
- `stage`: `lead_stage` Enum (Default: `enquiry_received`)
- `priority`: `lead_priority` Enum (Default: `warm`)
- `ai_lead_score`: `Decimal(5, 2)` (Optional)
- `assigned_counsellor_id`: `Uuid` (Optional)
- `remarks`: `String` (Optional)
- `enquiry_date`: `Date` (Default: `CURRENT_DATE`)
- `contact_consent`: `Boolean` (Default: `false`)
- `contact_consent_at`: `Timestamptz` (Optional)
- `parent_id`: `Uuid` (Optional)

### B. Model `lead_activities` (`schema.prisma` L396-L416)

- **Primary Key**: `activity_id` (`Uuid`)
- **Foreign Key**: `lead_id` -> `leads.lead_id` (Cascade onDelete)
- **Fields**: `activity_type` (`lead_activity_type`), `activity_date`, `status` (`activity_status`), `next_followup_date`, `notes`

### C. Model `lead_visits` (`schema.prisma` L419-L442)

- **Primary Key**: `visit_id` (`Uuid`)
- **Foreign Keys**: `lead_id` -> `leads.lead_id`, `staff_id` -> `staff.staff_id`
- **Fields**: `visit_type` (`visit_type`: `campus`, `virtual`), `scheduled_at`, `status` (`visit_status`: `scheduled`, `completed`, `cancelled`, `no_show`), `meeting_link`, `remarks`

---

## 3. Enum Audit (`schema.prisma`)

- **`lead_source`** (L1077-L1090):
  `website`, `walk_in`, `referral`, `social_media`, `chatbot`, `qr_code`, `education_fair`, `phone_call`, `email`, `other`
- **`lead_stage`** (L1092-L1107):
  `enquiry_received`, `qualified`, `counselling_scheduled`, `campus_visit`, `application_submitted`, `document_verification`, `assessment`, `admission_approved`, `waitlisted`, `rejected`, `fee_payment_pending`, `enrolled`
- **`lead_priority`** (L1069-L1075):
  `hot`, `warm`, `cold`
- **`lead_activity_type`** (L1056-L1067):
  `phone_call`, `email`, `whatsapp`, `chatbot`, `follow_up`, `counselling`, `application_submitted`, `note`
- **`visit_type`** (L1210-L1215):
  `campus`, `virtual`
- **`visit_status`** (L1201-L1208):
  `scheduled`, `completed`, `cancelled`, `no_show`

---

## 4. Existing API Routes & Controllers Audit

### Backend CRM Routes (`apps/backend/src/modules/admission/crm.routes.ts`)

| Endpoint                                      | HTTP   | Controller Handler          | Permission Required         | Purpose                                      |
| --------------------------------------------- | ------ | --------------------------- | --------------------------- | -------------------------------------------- |
| `/api/v1/admission/crm/enquiries`             | `POST` | `enquiryController.create`  | `admission.enquiry.create`  | Create Walk-in / Online Enquiry              |
| `/api/v1/admission/crm/enquiries`             | `GET`  | `enquiryController.list`    | `admission.enquiry.view`    | List Enquiries                               |
| `/api/v1/admission/crm/enquiries/:id/convert` | `POST` | `enquiryController.convert` | `admission.leads.manage`    | Convert Enquiry to Lead                      |
| `/api/v1/admission/crm/leads`                 | `GET`  | `leadController.list`       | `admission.leads.manage`    | List & Filter Leads Queue                    |
| `/api/v1/admission/crm/leads/:id`             | `GET`  | `leadController.getById`    | `admission.leads.manage`    | Lead 360 Details                             |
| `/api/v1/admission/crm/leads/:id`             | `PUT`  | `leadController.update`     | `admission.leads.manage`    | Update Lead Profile / Stage                  |
| `/api/v1/admission/crm/leads/:id/assign`      | `PUT`  | `leadController.assign`     | `admission.leads.manage`    | Assign Counsellor (`assigned_counsellor_id`) |
| `/api/v1/admission/crm/followups`             | `POST` | `followupController.create` | `admission.leads.manage`    | Log Activity / Follow-up                     |
| `/api/v1/admission/crm/visitors`              | `POST` | `visitorController.create`  | `admission.visitors.manage` | Register Visitor / Campus Visit              |
| `/api/v1/admission/crm/counselors`            | `GET`  | Inline Lookup Handler       | Custom Staff Guard          | List Available Counsellors                   |

---

## 5. Pre-Application to Application Lineage

```text
[Parent / Public Enquiry / Chatbot / Walk-in]
                      │
                      ▼
               [leads Model]
 (student_first_name, contact_phone, contact_email, source, stage, priority, assigned_counsellor_id)
                      │
                      ▼
          [Qualified Lead Handoff]
                      │
                      ▼
         [/app/admissions/wizard]
  (Phase 1 Certified Parent Application Wizard)
                      │
                      ▼
        [admissions_applications Model]
  (application_id, application_number, status, lead_id)
```

---

## 6. Duplicate Lead Detection Rules

Server-side duplicate detection matches against existing leads in PostgreSQL using tenant-scoped parameters:

- `org_id` = `req.context.user.org_id`
- Match dimensions: `contact_phone`, `contact_email`, `student_first_name` + `contact_name`
- Conflict HTTP Status: `409 Conflict` returning existing lead details for counselor review.

---

## 7. AI Lead Scoring

- Sourced from `leads.ai_lead_score` (`Decimal(5, 2)`).
- If uncalculated, UI explicitly renders **"Not scored"** (zero hardcoded fake scores or `Math.random()`).

---

## 8. Tenant Isolation & RBAC Security

- Server-authoritative `req.context.user.org_id` is enforced across all CRM service queries.
- RBAC permissions (`admission.enquiry.create`, `admission.enquiry.view`, `admission.leads.manage`, `admission.visitors.manage`) enforced via `checkPermission` in `rbac.middleware.ts`.

---

## 9. Gap Analysis

- **All Data Models Exist**: `leads`, `lead_activities`, `lead_visits`, `parents`, `admissions_applications` are fully defined in `schema.prisma`.
- **All Backend Services Exist**: `EnquiryService`, `LeadService`, `FollowupService`, `VisitorService`, `PublicApplicationService`.
- **Target Implementation**: Unify frontend CRM workspace consoles to consume these endpoints cleanly.
