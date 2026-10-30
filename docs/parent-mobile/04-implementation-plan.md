# EduTrack ERP — Parent Mobile App

## 04. Implementation Plan & Prioritized Gap Closure

**Date:** October 15, 2026  
**Auditor & Lead Architect:** Mobile Architect & Full-Stack Engineer  
**Status:** ACTIVE IMPLEMENTATION PLAN

---

### Gap Classification & Prioritization Framework

All identified findings and incomplete workflows are categorized using the standard severity rubric:

- **P0 — Critical:** Security, data integrity, payment integrity, cross-tenant isolation, or application-blocking defects.
- **P1 — Essential:** Core parent workflows that are missing, partially integrated, or broken between mobile and backend.
- **P2 — Important:** Usability, multi-child switching consistency, performance, and reliability improvements.
- **P3 — Enhancement:** Nice-to-have features, architectural recommendations for subsequent releases.

---

### Prioritized Gap Register

#### GAP-01 (Priority: P1) — Mobile Integration with Backend Enrolled Student Fee Ledgers

- **Finding:** The backend contains a complete, database-backed `ParentFinanceService` with endpoints `GET /v1/fees/my` and `GET /v1/fees/my/children/:studentId`. However, the mobile client currently only calls `applicationsApi.listMine()`. Parents with enrolled children have no mobile screen to view their child's tuition fees, installment schedules, overdue amounts, or payment history.
- **Evidence:**
  - `apps/mobile_app/src/api/endpoints.ts` only defines `FEES.SUMMARY`, `FEES.PAYMENT`, and `FEES.RECEIPT` for application fees.
  - `apps/mobile_app/src/api/fees.api.ts` lacks `getMyChildrenFees` and `getChildFeeDetails`.
- **Root Cause:** Mobile app Phase 1–9 focused on the admission onboarding lifecycle. Post-admission student finance was implemented on the backend (`fees.routes.ts`) but not yet wired to the mobile API client.
- **Business Impact:** High. Parents cannot check ongoing school fee balances or view installment dues on mobile after their child is enrolled.
- **Required Changes:**
  1. Add `FEES.MY_CHILDREN` and `FEES.CHILD_DETAILS` to `apps/mobile_app/src/api/endpoints.ts`.
  2. Implement `getMyChildrenFees()` and `getChildFeeDetails(studentId)` in `apps/mobile_app/src/api/fees.api.ts`.
  3. Add query keys in `apps/mobile_app/src/api/query-keys.ts`.
  4. Create `useMyChildrenFees` and `useChildFeeDetails` custom React Query hooks.
  5. Add `EnrolledChildFeeCard` component displaying student identity, grade/section, total assessed, total paid, and balance.
  6. Integrate enrolled children fee overview into `ParentDashboardScreen` (`app/(parent)/index.tsx`).
- **Affected Frontend Files:**
  - `apps/mobile_app/src/api/endpoints.ts`
  - `apps/mobile_app/src/api/fees.api.ts`
  - `apps/mobile_app/src/api/query-keys.ts`
  - `apps/mobile_app/src/types/admission.types.ts`
  - `apps/mobile_app/src/features/parent/hooks/useMyChildrenFees.ts`
  - `apps/mobile_app/app/(parent)/index.tsx`
- **Affected Backend Files:** None (backend already implements `GET /v1/fees/my` and `GET /v1/fees/my/children/:studentId`).
- **Database Requirements:** None (`schema.prisma` already possesses all necessary models).
- **Dependencies:** Authenticated parent session with role `PARENT`.
- **Acceptance Criteria:**
  - Calling `feesApi.getMyChildrenFees()` successfully returns the parent's linked children and fee balances.
  - Dashboard renders enrolled student fee summary cards when enrolled children exist.
  - Unit tests verify the new API client methods and hook behavior.
- **Tests Required:** Unit test in `tests/unit/api-services.test.ts` and `dashboard-phase3.test.ts`.
- **Implementation Status:** **Ready for Implementation (Pass 5)**

---

#### GAP-02 (Priority: P2) — Multi-Child Switcher Support for Enrolled Students

- **Finding:** The `ChildSwitcher` component (`apps/mobile_app/src/components/admission/ChildSwitcher.tsx`) is currently typed exclusively for `AdmissionApplication[]`.
- **Evidence:** Interface `ChildSwitcherProps` requires `applications: AdmissionApplication[]`.
- **Root Cause:** Designed for admission applicant cards prior to post-enrollment integration.
- **Business Impact:** Medium. A parent with both an applicant child and an enrolled child needs clear tab/filter visibility across both contexts.
- **Required Changes:**
  - Generalize or supplement `ChildSwitcher` to support selecting between enrolled children or displaying distinct sections on the dashboard for Enrolled Students vs Admission Applications.
- **Affected Frontend Files:**
  - `apps/mobile_app/src/components/admission/ChildSwitcher.tsx`
  - `apps/mobile_app/app/(parent)/index.tsx`
- **Affected Backend Files:** None.
- **Database Requirements:** None.
- **Acceptance Criteria:** Parents can switch between multiple enrolled children seamlessly without data bleeding.
- **Implementation Status:** **Ready for Implementation (Pass 5)**

---

#### GAP-03 (Priority: P2) — Data Isolation Verification on Child Switching

- **Finding:** When a parent switches from Child A to Child B in the mobile UI, stale child-specific query data must never leak or be displayed under Child B's profile.
- **Evidence:** Section 5.3 of the Master Objective mandates strict data isolation during child switching.
- **Root Cause:** Asynchronous React Query caching can retain prior child data if keys do not strictly incorporate the child/application ID.
- **Business Impact:** High privacy concern. Parents must never see inconsistent data.
- **Required Changes:**
  - Ensure all child-specific queries (`fees.summary(id)`, `documents.list(id)`, `assessment(id)`, `decision(id)`, `timeline(id)`) strictly use the selected ID in the query key.
  - Verify that query state resets and loading indicators render when switching children.
- **Affected Frontend Files:**
  - `apps/mobile_app/app/(parent)/index.tsx`
  - `apps/mobile_app/app/(parent)/applications/[id].tsx`
- **Affected Backend Files:** None.
- **Database Requirements:** None.
- **Acceptance Criteria:** Switching child immediately replaces active data; zero cross-contamination.
- **Implementation Status:** **Ready for Verification (Pass 5–6)**

---

#### GAP-04 (Priority: P3 — Recommendation) — Attendance & Leave Module Database Models

- **Finding:** Student attendance and parent leave management are absent from `apps/backend/prisma/schema.prisma`.
- **Evidence:** `grep -E "^model " apps/backend/prisma/schema.prisma` shows zero attendance or leave tables.
- **Root Cause:** Platform is in Stage-1 freeze; core SIS attendance tracking is slated for Stage-2.
- **Business Impact:** Parents cannot track daily clock-in/clock-out or submit leave requests until Stage-2.
- **Required Changes (Stage-2 Architectural Recommendation):**
  - Design `student_attendance` model in Prisma with `attendance_id`, `org_id`, `student_id`, `academic_year_id`, `date`, `status` (`present`, `absent`, `late`, `excused`), and `remarks`.
  - Design `student_leave_requests` model with `leave_id`, `parent_id`, `student_id`, `start_date`, `end_date`, `reason`, `status` (`pending`, `approved`, `rejected`), `approved_by`.
  - Build backend `AttendanceService` and parent-scoped endpoints `GET /v1/attendance/my-children` and `POST /v1/attendance/leaves`.
- **Database Requirements:** Blocked by Stage-1 freeze. Under non-negotiable rules, do not run DDL or invent models now.
- **Implementation Status:** **Documented as Stage-2 Recommendation**

---

#### GAP-05 (Priority: P3 — Recommendation) — Ongoing Academics (Homework, Timetables, Report Cards)

- **Finding:** Ongoing academics, class timetables, homework assignments, and term report cards are absent from `schema.prisma`. Only entrance assessment records exist.
- **Evidence:** `schema.prisma` contains `application_assessments` and `assessment_configurations` (for admissions), but no `student_homework`, `timetables`, `exams`, or `report_cards`.
- **Root Cause:** Module planned for Stage-2 Academic ERP release.
- **Business Impact:** Mobile app cannot display ongoing semester grades or daily homework without inventing mock data (which is strictly forbidden by Rule 14).
- **Required Changes (Stage-2 Architectural Recommendation):**
  - Add `exam_timetables`, `student_marks`, `report_cards`, and `homework_assignments` to `schema.prisma`.
  - Expose published-only marksheets via `GET /v1/academics/report-cards` to guarantee parents cannot see draft results.
- **Implementation Status:** **Documented as Stage-2 Recommendation**

---

#### GAP-06 (Priority: P3 — Recommendation) — Live Transport Tracking, Hostel, Library

- **Finding:** Live GPS bus tracking, hostel room allocations, and library loans are not in `schema.prisma`.
- **Evidence:** Feature flag `hostel: false` is returned by `/v1/auth/me`. No GPS or transport route models exist.
- **Root Cause:** Out of scope for Stage-1 core ERP.
- **Implementation Status:** **Documented as Stage-2 Recommendation**

---

### Step-by-Step Implementation Sequence

```
Step 1: Extend Mobile API Client
   ├── Add endpoints in src/api/endpoints.ts
   ├── Add functions in src/api/fees.api.ts
   └── Add query keys in src/api/query-keys.ts
          │
          ▼
Step 2: Define Strongly-Typed Enrolled Finance Types
   └── Add ChildFeeOverview and EnrolledChildrenFeesResponse in src/types/
          │
          ▼
Step 3: Build Custom React Query Hooks
   └── Create src/features/parent/hooks/useMyChildrenFees.ts
          │
          ▼
Step 4: Update Parent Dashboard UI
   ├── Add Enrolled Students & Fee Ledger section to app/(parent)/index.tsx
   └── Enable quick navigation to fee statement & payment details
          │
          ▼
Step 5: Automated Testing & Verification
   ├── Add unit tests in tests/unit/api-services.test.ts
   ├── Run full test suite (ensure 100% pass)
   └── Run TypeScript check across all monorepo apps
```
