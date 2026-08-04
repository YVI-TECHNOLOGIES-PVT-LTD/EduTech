# AMAT — Admission Module Acceptance Test

**Golden Student End-to-End Acceptance**

**Status:** ⏳ **PENDING EXECUTION** — Module is **NOT certified** until one complete UI journey passes.

**Prerequisite docs:** Phases 5.1–5.12 (implementation complete)  
**Environment:** Frontend `http://127.0.0.1:5173` · Backend `http://127.0.0.1:3000/api`

---

## Acceptance Rule

> The Admission Module v1.0 is **functionally complete and production-ready** only when **one test student** travels **Inquiry → ERP Student** using **only the application UI**, with **all validations passing**, and **zero critical defects open**.

Phase completion ≠ certification. **AMAT pass = certification.**

---

## Golden Test Student Profile

Use a unique student each run to avoid collisions:

| Field | Value |
|-------|-------|
| Student Name | **Aarav Mehta (AMAT-2026)** |
| DOB | 2015-03-15 |
| Gender | Male |
| Grade | Grade 5 |
| Program | General |
| Parent Name | Priya Mehta |
| Parent Email | `priya.amat2026+{timestamp}@test.edu.in` |
| Parent Phone | +91-9876543210 |
| Category | General |

Replace `{timestamp}` with run time (e.g. `202607051200`) so email is unique.

---

## Environment Prerequisites

### 1. Services running

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

### 2. Seed AMAT role users (one-time)

```bash
cd backend && node database/seeds/seed_admission_users.js
```

**Password for all demo users:** `Welcome#321`

| Role | Email |
|------|-------|
| Receptionist | receptionist@edu.in |
| Counselor | counselor@edu.in |
| Exam Cell | examcell@edu.in |
| Finance Officer | financeofficer@edu.in |
| Principal | principal@edu.in / hoi@edu.in |
| Admission Officer | admissionofficer@edu.in |
| Admin | admin@edu.in |

### 3. Feature flags (must be enabled)

Verify in Supabase `feature_flags` (development environment):

- `admission.fee_collection`
- `admission.student_enrollment`
- `admission.erp_handover`

Migration `085_admission_sprint6_enrollment.sql` seeds these as `true` for development.

### 4. Reference UUIDs (collect before Finance/Offer steps)

From Admin / Fees module or Supabase (read-only lookup):

| Item | Table | Notes |
|------|-------|-------|
| Offer template ID | `admission_offer_templates` | Required in Offer Workspace toolbar |
| Fee structure ID | `fee_structures` | Required in Finance Workspace → Fee Structure Assignment |

---

## Golden Student Journey — Step-by-Step Playbook

### Stage 0 — Record baseline

- [ ] Note run start time
- [ ] Confirm `npm run build` passes
- [ ] Open bug register (below)

---

### Stage 1 — Inquiry (Receptionist)

**Login:** `receptionist@edu.in`  
**Route:** `/app/admissions/inquiries`

| Step | Action | Pass Criteria |
|------|--------|---------------|
| 1.1 | Create new inquiry for Aarav Mehta | Inquiry saved, number assigned |
| 1.2 | Verify inquiry appears in list | Live data, no mock names |
| 1.3 | Check dashboard KPI | Inquiry count +1 (auto refresh) |

**Events:** `INQUIRY_CREATED`  
**DB:** `admission_inquiries` row exists

---

### Stage 2 — Lead & Follow-up (Counselor)

**Login:** `counselor@edu.in`  
**Route:** `/app/admissions/dashboard` (Counselor) · `/app/admissions/inquiries`

| Step | Action | Pass Criteria |
|------|--------|---------------|
| 2.1 | Assign lead to self | Assignment saved |
| 2.2 | Log follow-up | Follow-up in bucket |
| 2.3 | Mark follow-up complete | Status updated |
| 2.4 | Convert inquiry → application | `INQUIRY_CONVERTED` event |

**Route after convert:** Application form or Applicant 360

---

### Stage 3 — Application Form

**Login:** Counselor or Parent  
**Routes:** `/app/admissions/new` or `/app/admissions/wizard`

| Step | Action | Pass Criteria |
|------|--------|---------------|
| 3.1 | Enter personal details | Validation works |
| 3.2 | Enter guardian, address, academic history | Required fields enforced |
| 3.3 | Upload documents (if required) | Upload succeeds |
| 3.4 | Save draft | Draft retrievable |
| 3.5 | Submit application | Status → submitted |

**DB:** `admissions` row; status `submitted`  
**Applicant 360:** `/app/admissions/{applicationId}` loads live data

---

### Stage 4 — Applicant 360 Verification

**Login:** `admissionofficer@edu.in`  
**Route:** `/app/admissions/{id}`

| Check | Pass Criteria |
|-------|---------------|
| Profile header | Correct name, grade, status |
| Timeline | Submission event visible |
| Documents tab | Uploaded docs listed |
| Audit | Actions logged |
| Communication | Panel loads (if enabled) |

---

### Stage 5 — Pipeline

**Route:** `/app/admissions/review`

| Check | Pass Criteria |
|-------|---------------|
| Card appears in correct column | Status mapped via AdmissionStatusMapper |
| Drag / workflow actions | Status transitions via useWorkflow |
| No manual page refresh | Queue updates via events |

---

### Stage 6 — Document Verification

**Route:** `/app/admissions/verification`

| Step | Action | Pass Criteria |
|------|--------|---------------|
| 6.1 | Open candidate in queue | Live queue data |
| 6.2 | Approve each document | `DOCUMENT_VERIFIED` event |
| 6.3 | Complete verification | Application advances |

---

### Stage 7 — Entrance Exam

**Login:** `examcell@edu.in`  
**Route:** `/app/admissions/exams`

| Step | Action | Pass Criteria |
|------|--------|---------------|
| 7.1 | Record attendance | Workflow action succeeds |
| 7.2 | Enter marks | Saved to backend |
| 7.3 | Submit result | Exam status updated |

---

### Stage 8 — Interview

**Route:** `/app/admissions/interviews`

| Step | Action | Pass Criteria |
|------|--------|---------------|
| 8.1 | Panel evaluation | Score recorded |
| 8.2 | Recommendation | Workflow transitions |

---

### Stage 9 — Merit List

**Login:** `hoi@edu.in` or `admissionofficer@edu.in`  
**Route:** `/app/admissions/merit`

| Step | Action | Pass Criteria |
|------|--------|---------------|
| 9.1 | View ranking | Live merit data |
| 9.2 | Seat allocation / publish | Merit action via runMeritAction |

---

### Stage 10 — Offer Management

**Route:** `/app/admissions/offers`

| Step | Action | Pass Criteria |
|------|--------|---------------|
| 10.1 | Generate offer | Template UUID required; offer created |
| 10.2 | Send offer | `OFFER_SENT` event |
| 10.3 | Accept offer | Backend offer status = `ACCEPTED` |

**Critical:** Enrollment validators require offer status **ACCEPTED** in DB (not just workflow approve).

---

### Stage 11 — Finance

**Login:** `financeofficer@edu.in`  
**Route:** `/app/admissions/fees`

| Step | Action | Pass Criteria |
|------|--------|---------------|
| 11.1 | **Assign fee structure** | Fee Structure panel → UUID → success toast |
| 11.2 | Verify fees summary | Outstanding amount from backend |
| 11.3 | Collect payment (Cash) | Payment ID returned; auto-completes for Cash |
| 11.4 | Verify payment (if PENDING) | Status COMPLETED |
| 11.5 | Generate receipt | Receipt viewer populated |
| 11.6 | Confirm outstanding = 0 | PaymentValidator requirement |

**Order matters:** Assign fee → Collect full outstanding → Receipt exists

---

### Stage 12 — Enrollment

**Login:** `admissionofficer@edu.in`  
**Route:** `/app/admissions/enrollment`

| Step | Action | Pass Criteria |
|------|--------|---------------|
| 12.1 | Validation checklist all green | Offer, payment, docs, confirmation |
| 12.2 | Confirm admission | Admission number generated |
| 12.3 | Enroll & provision | `ENROLLMENT_COMPLETED` event |
| 12.4 | Provisioning steps | Phase → enrolled; student ID shown |

---

### Stage 13 — ERP Student Verification (Admin)

**Login:** `admin@edu.in`

| Check | Where | Pass Criteria |
|-------|-------|---------------|
| Student Master | `/app/students` or Students module | Aarav Mehta record exists |
| Student profile | Student detail | Linked to admission |
| Guardian | Student / parent link | Parent mapped |
| Academic allocation | Academic module | Grade/section assigned |
| Fee account | Fees module | Ledger active |
| Library / Transport / Hostel | Respective modules | Provisioned if applicable |
| Global search | Search bar | Finds student by name |
| Reports | `/app/admissions/reports` | Application appears |
| Timeline | Applicant 360 | Full event chain |

**DB verification (read-only, post-UI):**

```sql
-- Replace {application_id} with golden student application UUID
SELECT status FROM admissions WHERE student_name LIKE '%Aarav Mehta%';
SELECT * FROM admission_confirmation WHERE application_id = '{application_id}';
SELECT * FROM students WHERE full_name LIKE '%Aarav Mehta%';
SELECT * FROM student_provisioning_jobs WHERE application_id = '{application_id}';
```

---

## Per-Stage Validation Matrix

For **every stage**, confirm:

| Layer | Check |
|-------|-------|
| Frontend | Page loads, forms validate, buttons work, loading/empty/error states |
| API | Correct endpoint, payload, 2xx response |
| Database | Records created/updated, relationships intact, audit logs |
| Admission Engine | Events dispatched, cache invalidated |
| Dashboards | KPIs and queues refresh without reload |
| Timeline | Action appears in Applicant 360 timeline |

---

## Expected Timeline Events

After successful run, Applicant 360 timeline / audit should include:

1. Inquiry Created  
2. Application Submitted  
3. Documents Verified  
4. Exam Completed  
5. Interview Completed  
6. Merit Published  
7. Offer Sent  
8. Offer Accepted  
9. Payment Verified  
10. Enrollment Completed  

---

## Bug Register

| ID | Stage | Severity | Description | Status |
|----|-------|----------|-------------|--------|
| ADM-001 | Prerequisites | High | AMAT role users may be missing if `seed_admission_users.js` not run | Open — run seed script |
| ADM-002 | Offer | High | Generate offer requires manual offer template UUID | Open — document UUID per environment |
| ADM-003 | Finance | **Critical** | Fee structure assignment was missing from Finance UI — blocked enrollment | **Fixed** — `FeeStructurePanel` + `assign_fee_structure` |
| ADM-004 | Enrollment | High | Backend requires offer status `ACCEPTED` in DB before confirm/enroll | Open — must use Accept Offer action |
| ADM-005 | Enrollment | High | Two-step flow: Confirm Admission → Enroll & Provision | Open — documented in playbook |
| ADM-006 | Forms | Medium | `AdmissionForm` / `Wizard` use direct API (not workspace hooks) | Open — v1.1 refactor |
| ADM-007 | Exam | Medium | Exam schedule/allocate APIs not exposed in UI | Open — workflow path only |
| ADM-008 | Provisioning | Medium | No GET provisioning jobs API — UI shows phase-derived steps | Open — documented limitation |
| ADM-009 | Testing | High | No automated Playwright E2E — AMAT is manual UI execution | Open — add E2E in v1.1 |

**Rule:** Any **Critical** or **High** defect that blocks the golden path must be **Fixed** or **Waived with sign-off** before certification.

---

## Final Certification Checklist

Mark each only after **live AMAT execution**:

- [ ] Inquiry created successfully  
- [ ] Lead converted to Application  
- [ ] Application submitted  
- [ ] Applicant 360 displays live data  
- [ ] Pipeline updates correctly  
- [ ] Documents verified  
- [ ] Entrance exam completed  
- [ ] Interview completed  
- [ ] Merit generated  
- [ ] Offer generated and **accepted** (DB status ACCEPTED)  
- [ ] Fee structure assigned  
- [ ] Fee collected and verified (outstanding = 0)  
- [ ] Receipt generated  
- [ ] Enrollment confirmed + enrolled  
- [ ] ERP Student created automatically  
- [ ] Student Master exists  
- [ ] Guardian linked  
- [ ] Academic allocation completed  
- [ ] Dashboards updated throughout  
- [ ] Reports include the student  
- [ ] Global Search finds the student  
- [ ] Timeline complete  
- [ ] No manual database changes  
- [ ] No manual API calls (Postman/curl)  
- [ ] No broken workflow  
- [ ] `npm run build` passes  
- [ ] Zero critical defects remain  

---

## Certification Sign-Off

| Field | Value |
|-------|-------|
| Test Run ID | AMAT-2026-___ |
| Executed By | |
| Date | |
| Application ID | |
| Student ID | |
| Admission Number | |
| Result | ☐ PASS ☐ FAIL |
| Certified By | |
| Module Freeze Approved | ☐ Yes ☐ No |

---

## When Certification Passes

Update this document status to:

> **Status: ✅ CERTIFIED** — Golden student **Aarav Mehta (AMAT-2026)** completed Inquiry → ERP Student on {date}.

Then update `phase-5.12-admission-production-readiness.md`:

> Module freeze effective after AMAT pass on {date}.

Only then move to the next ERP module.

---

## Quick Reference — Routes

| Stage | Route |
|-------|-------|
| Inquiries | `/app/admissions/inquiries` |
| Dashboard | `/app/admissions/dashboard` |
| New Application | `/app/admissions/new` |
| Applicant 360 | `/app/admissions/{id}` |
| Pipeline | `/app/admissions/review` |
| Documents | `/app/admissions/verification` |
| Exams | `/app/admissions/exams` |
| Interviews | `/app/admissions/interviews` |
| Merit | `/app/admissions/merit` |
| Offers | `/app/admissions/offers` |
| Finance | `/app/admissions/fees` |
| Enrollment | `/app/admissions/enrollment` |
| Reports | `/app/admissions/reports` |
