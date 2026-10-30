# Phase 18 — 08. Cross-Module Workflow Validation

**Audit Date:** 2026-10-30  
**Scope:** End-to-end multi-module operational workflows across `apps/backend`, `apps/web_app`, and `apps/mobile_app`  
**Compliance Standard:** Full relational foreign-key consistency and tenant isolation

---

## 1. Primary Operational Workflows

### 1. Admission Workflow

```text
leads ──> lead_activities ──> lead_visits ──> admissions_applications
  ──> admission_documents ──> application_assessments ──> admission_decisions
  ──> admission_fee_payments ──> students ──> student_enrollments
```

- **Business Sequence:** Prospects begin as CRM `leads`. Successful inquiry converts to an `admissions_applications` record with unique `application_number`.
- **Relational Integrity:** `admissions_applications.lead_id` references `leads.lead_id`. Documents link via `admission_documents.application_id`.
- **Status Transitions:** `submitted` -> `under_review` -> `assessment_pending` -> `approved`.
- **Enrollment Conversion:** Once `admission_decisions.status = 'approved'` and registration fee is cleared in `admission_fee_payments`, student profile is provisioned in `students` and linked to `student_enrollments`.

### 2. Academic Management Workflow

```text
academic_years ──> grades ──> academic_year_grades ──> sections ──> staff (Class Teacher)
```

- **Business Sequence:** Institutional planning establishes `academic_years` (dates, status). Grades are bound to years via `academic_year_grades` defining intake capacity.
- **Relational Integrity:** `academic_year_grades` references both `academic_years` and `grades`. `sections` references `academic_year_grades` and assigns `class_teacher_id` pointing to `staff(staff_id)`.
- **Uniqueness Constraints:** Unique constraint on `(academic_year_grade_id, section_name)` prevents duplicate sections in the same grade.

### 3. Student & Parent Lifecycle Workflow

```text
users ──> parents ──> student_parents ──> students ──> student_enrollments ──> sections
```

- **Business Sequence:** Parents register via mobile app creating a `users` record and `parents` profile. The junction table `student_parents` binds the parent to the `students` record with defined relationship (`mother`, `father`, `guardian`) and primary contact flag.
- **Placement Authorization:** Mobile app queries `student_parents` to resolve authorized children. Current placement is determined from `student_enrollments` linked to active `academic_years`.

### 4. Finance Fee Assessment & Payment Journey

```text
fee_structures ──> fee_components ──> installment_plans ──> installment_plan_terms
  ──> student_fee_assignments ──> student_charges ──> student_charge_dues
  ──> payment_orders ──> payment_transactions ──> payment_allocations
```

- **Business Sequence:**
  1. Administrative fee setup creates `fee_structures` and `installment_plans`.
  2. Student fee assignment binds structure to student, generating `student_charges` (invoiced obligation) and `student_charge_dues` (discrete payable installments).
  3. Parent selects due item in mobile app, generating `payment_orders` with server-calculated payable balance.
  4. Parent completes gateway checkout; webhook or verification returns authoritative `payment_transactions` record.
  5. Payment collection engine calculates and writes `payment_allocations` against the target `student_charge_dues` in a single atomic database transaction.

### 5. In-App Notification Delivery Workflow

```text
Business Event ──> NotificationService.createNotification() ──> notifications table
  ──> RealtimeNotificationServer.sendToUser() ──> SSE / WebSocket ──> Mobile / Web UI
```

- **Business Sequence:** Domain events (e.g. fee due published, payment received, admission status updated) invoke `NotificationService`.
- **Authoritative Persistence:** Written to `notifications` table (`notification_id`, `org_id`, `user_id`, `title`, `message`, `category`, `is_read`).
- **Realtime Dispatch:** Non-blocking dispatch to active WebSocket/SSE connections scoped to the recipient's `user_id`.
- **Client Acknowledgement:** Mobile and web clients fetch unread alerts via `GET /v1/notifications` and mark read via `PATCH /v1/notifications/:id/read`.

---

## 2. Inactive / Staging Workflow Classification

- **Helpdesk Support Workflow (`helpdesk_*`):** Models exist in database schema (`helpdesk_tickets`, `helpdesk_messages`, etc.), but backend router is not yet mounted. Classified as `DATABASE MODEL EXISTS BUT BACKEND INTEGRATION IS MISSING`.
- **Campus Social Feeds Workflow (`feed_*`):** Models exist in database schema (`feed_posts`, `feed_comments`, etc.), but backend router is not yet mounted. Classified as `DATABASE MODEL EXISTS BUT BACKEND INTEGRATION IS MISSING`.
- Both workflows remain safely dormant in the schema without unstable or partial code paths.
