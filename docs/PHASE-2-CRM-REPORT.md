# PHASE 2.3 & 2.4 — CRM, LEADS, FOLLOW-UPS & CAMPUS VISITS REPORT
**EduTrack ERP Web Application**

---

## 1. Module Scope

The CRM and Lead Management module handles Stage-1 lead acquisition, follow-up scheduling, and campus visit logistics:
- **Lead Capture & Inquiries**: Walk-in and web inquiry creation with unique `lead_number`.
- **Lead Pipeline Management**: Status tracking (New, Contacted, In Progress, Scheduled, Converted, Lost).
- **Follow-up Scheduling**: Activity timeline logging, counsellor notes, and next follow-up dates.
- **Campus Visit Logistics**: Scheduled dates/times, counsellor assignment, visit outcomes (Completed, Cancelled, No-Show).

---

## 2. Source-of-Truth Database Models Used

| Table / Prisma Model | Primary Keys | Core Fields | Usage |
| :--- | :--- | :--- | :--- |
| `leads` | `lead_id` | `org_id`, `lead_number`, `student_first_name`, `student_last_name`, `guardian_name`, `guardian_email`, `guardian_phone`, `stage`, `status` | Lead directory |
| `lead_activities` | `activity_id` | `lead_id`, `activity_type`, `description`, `performed_by`, `performed_at` | Activity timeline |
| `lead_visits` | `visit_id` | `lead_id`, `scheduled_at`, `status`, `counsellor_id`, `notes` | Campus visit tracking |

---

## 3. Backend APIs & RBAC Guarding

| HTTP Method | Route Endpoint | Permission Required | Controller / Handler |
| :--- | :--- | :--- | :--- |
| `GET` | `/v1/admission/crm/leads` | `admission.inquiry.view` | `crmRouter` (`getLeads`) |
| `POST` | `/v1/admission/crm/leads` | `admission.inquiry.create` | `crmRouter` (`createLead`) |
| `GET` | `/v1/admission/crm/campus-visits` | `admission.inquiry.view` | `crmRouter` (`getCampusVisits`) |
| `POST` | `/v1/leads` | `ADMISSION_INQUIRY_CREATE` | `leadRouter` |
| `GET` | `/v1/leads/:id/timeline` | `ADMISSION_INQUIRY_VIEW` | `leadRouter` |

---

## 4. RTK Query API Integration

- **API Slice**: `crmApi` (`src/shared/api/crm.api.ts`).
- **Endpoints**:
  - `getLeads`: `builder.query<LeadRecord[], void>` (Provides Tag: `Lead`).
  - `createLead`: `builder.mutation<LeadRecord, CreateLeadPayload>` (Invalidates Tag: `Lead`).
  - `getCampusVisits`: `builder.query<CampusVisitRecord[], void>` (Provides Tag: `CampusVisit`).

---

## 5. Security & Multi-Tenant Audit

- **Tenant Isolation**: `org_id` / `school_id` enforced on all lead queries and mutations.
- **Lead Number Generation**: Human-facing business identifiers generated via backend sequence service (independent from application numbers).

---

## 6. Status

**PASS ✅** — CRM, Lead Management, Follow-ups, and Campus Visit module verified, type-checked, and integrated.
