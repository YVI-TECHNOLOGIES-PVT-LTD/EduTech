# EduTrack ERP — Parent Experience Integration

# Document 01: Parent Web Dashboard Audit & Screen Inventory

**Document Version:** 1.0.0  
**Phase:** Phase 0 — Complete Repository Audit, System Discovery & Integration Blueprint  
**Date:** October 16, 2026  
**Governing Standard:** Schema Freeze & Prisma-First Domain Architecture ([AGENTS.md](file:///Users/sathish/Documents/GitHub/EduTech/.agents/AGENTS.md))  
**Auditor:** Antigravity AI Pair Programmer

---

## 1. Executive Summary

This audit inspects the **Parent Web Experience** within `@edutrack/web` ([apps/web_app](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app)). It examines route configurations, page components, state management, API consumption, multi-child support, and UI/UX state handling.

### Crucial Architectural Takeaways:

1. **Pre-Enrollment vs. Post-Enrollment Division:**
   - **Pre-Enrollment Admission Portal:** Well-structured under `/admissions/*` and `/parent/applications`, consuming RTK Query (`admission.api.ts`) against `/v1/applications/*` and `/v1/admission/*`.
   - **Post-Enrollment Enrolled Student Portal:** Centered on [MyFees.tsx](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/fees/pages/MyFees.tsx) (`/fees/my` and `/parent/my-fees`), querying `GET /fees/my`.
2. **Missing Enrolled Fee Checkout:**
   - While parents can pay pre-admission application fees in [ParentFeePaymentPage.tsx](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/admission/pages/parent/ParentFeePaymentPage.tsx), [MyFees.tsx](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/fees/pages/MyFees.tsx) is currently a **read-only statement viewer** without an online payment checkout button for academic installment dues.
3. **Backend Dashboard Query Failure:**
   - [ParentDashboard.tsx](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/dashboard/pages/ParentDashboard.tsx) calls `/dashboard/parent/overview`. This backend route queries Supabase with `.eq('parent_user_id', userId)`, but `parent_user_id` does not exist on `student_parents` in [schema.prisma](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/prisma/schema.prisma#L713), causing the overview call to fail or return empty arrays.

---

## 2. Parent Route Registry & Navigation Map

Configured in [apps/web_app/src/config/route_registry.tsx](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/config/route_registry.tsx):

```
Parent Portal Navigation Architecture:
├── /parent/dashboard         -> ParentDashboardRouter (dynamic role redirector)
│
├── Pre-Admission Applications (Layout: 'parent_admission', Guard: 'parent'):
│   ├── /admissions/dashboard -> ParentDashboardPage
│   ├── /admissions/my        -> MyApplications
│   ├── /admissions/wizard    -> ApplicationWizardPage
│   ├── /admissions/view/:id  -> ParentSubmittedApplicationPage
│   ├── /admissions/documents -> ParentDocumentCenterPage
│   ├── /admissions/fees      -> ParentFeePaymentPage (Pre-Admission App Fee)
│   └── /admissions/status    -> ParentAdmissionStatusPage
│
└── Enrolled Student Fees & Academics (Layout: 'dashboard', Guard: 'parent'):
    ├── /parent/my-child      -> ParentDashboard (Academics & Combined Overview)
    ├── /fees/my              -> MyFees (Official Student Fee Center & Ledger)
    └── /parent/my-fees       -> MyFees (Alias route for direct navigation)
```

---

## 3. Screen Inventory & Classification

| Screen / Page                    | Route Path(s)                                  | Underlying Component                                                                                                                                                    | Backend APIs Consumed                                                         | Classification            | Description & Audit Notes                                                                                                                                                                                                                        |
| :------------------------------- | :--------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------- | :------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Admission Applications**       | `/admissions/my`<br>`/parent/applications`     | [MyApplications.tsx](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/admission/pages/parent/MyApplications.tsx)                                 | `GET /v1/applications/my`                                                     | **EXISTS AND WORKING**    | Lists all applications for logged-in parent; status badges, view buttons, submission timestamps.                                                                                                                                                 |
| **Submitted Application View**   | `/admissions/view/:id`                         | [ParentSubmittedApplicationPage.tsx](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/admission/pages/parent/ParentSubmittedApplicationPage.tsx) | `GET /v1/applications/:id`                                                    | **EXISTS AND WORKING**    | Read-only accordion view of student biodata, parent contacts, previous schooling, and submitted documents.                                                                                                                                       |
| **Document Center**              | `/admissions/documents`<br>`/parent/documents` | [ParentDocumentCenterPage.tsx](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/admission/pages/parent/ParentDocumentCenterPage.tsx)             | `GET /v1/applications/:id/documents`<br>`POST /v1/applications/:id/documents` | **EXISTS AND WORKING**    | Uploads required certificates/birth records with document status badges (`verified`, `rejected`, `pending`).                                                                                                                                     |
| **Admission Status Tracker**     | `/admissions/status`<br>`/admissions/:id`      | [ParentAdmissionStatusPage.tsx](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/admission/pages/parent/ParentAdmissionStatusPage.tsx)           | `GET /v1/applications/:id`                                                    | **EXISTS AND WORKING**    | 6-stage linear milestone tracker (Draft ➔ Submitted ➔ Under Review ➔ Docs Verified ➔ Payment ➔ Enrolled).                                                                                                                                        |
| **Pre-Admission Fee Checkout**   | `/admissions/fees`<br>`/parent/fees`           | [ParentFeePaymentPage.tsx](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/admission/pages/parent/ParentFeePaymentPage.tsx)                     | `GET /v1/applications/:id/fee`<br>`POST /v1/applications/:id/payment`         | **EXISTS AND WORKING**    | Pays pre-enrollment admission/processing fee with simulation or Razorpay checkout modal and receipt modal.                                                                                                                                       |
| **Official Fee Center & Ledger** | `/fees/my`<br>`/parent/my-fees`                | [MyFees.tsx](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/fees/pages/MyFees.tsx)                                                             | `GET /fees/my`<br>`GET /academic-years/current`                               | **EXISTS BUT INCOMPLETE** | Renders multi-child tabs, assessed fees, settled amount, outstanding balance, installment dues table, component breakdown, transaction history, and printable fee statement. **Incomplete:** No "Pay Online" action exists for installment dues. |
| **Parent Child Overview**        | `/parent/my-child`                             | [ParentDashboard.tsx](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/dashboard/pages/ParentDashboard.tsx)                                      | `GET /dashboard/parent/overview`<br>`GET /fees/my`                            | **EXISTS BUT INCOMPLETE** | Intended to show enrolled child summary + active admission applications. Blocked because backend `/dashboard/parent/overview` references non-existent schema column `parent_user_id`.                                                            |
| **Parent Enrolled Profile**      | N/A                                            | None                                                                                                                                                                    | N/A                                                                           | **MISSING**               | No dedicated screen displaying student confirmed admission number, grade, section, roll number, class teacher, and attendance.                                                                                                                   |
| **Enrolled Dues Checkout Modal** | N/A                                            | None                                                                                                                                                                    | `POST /create-order`<br>`POST /verify-payment`                                | **MISSING**               | Online checkout modal for paying enrolled academic installment dues is absent from [MyFees.tsx](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/fees/pages/MyFees.tsx).                                                  |
| **Official ERP Receipt Viewer**  | N/A                                            | None                                                                                                                                                                    | `GET /fees/payments/receipts/:transactionId`                                  | **BLOCKED BY DEPENDENCY** | Backend route is guarded by `checkPermission(PERMISSIONS.FEES_VIEW)` which rejects the `PARENT` role with HTTP 403.                                                                                                                              |

---

## 4. Multi-Child Support & Child Switcher Audit

### 4.1 Pre-Enrollment Multi-Child Handling

- Handled by hook [useActiveAdmissionApplication.ts](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/admission/hooks/useActiveAdmissionApplication.ts).
- Queries `useGetMyApplicationsQuery()` (`GET /v1/applications/my`).
- Stores `activeApplicationId` in session state.
- Component [ActiveApplicationBanner.tsx](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/admission/components/ActiveApplicationBanner.tsx) renders a dropdown selector if the parent has multiple applications.

### 4.2 Enrolled Multi-Child Handling

- Implemented in [MyFees.tsx](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/fees/pages/MyFees.tsx#L121-L153).
- Uses `selectedChildIndex` state:
  ```tsx
  {
    childrenRecords.length > 1 && (
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {childrenRecords.map((c, idx) => (
          <button key={c.student_id || idx} onClick={() => setSelectedChildIndex(idx)}>
            <span>{c.full_name}</span> ({c.grade_name || 'Enrolled'})
          </button>
        ))}
      </div>
    );
  }
  ```
- Automatically switches metrics cards, installment dues schedule, fee components, and payment history to the active child.

---

## 5. UI/UX State Handling & Resilience

1. **Loading State:**
   - [MyFees.tsx](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/fees/pages/MyFees.tsx#L75-L81) displays a branded spinning loader with `"Loading student financial ledger..."`.
2. **Empty State:**
   - If `childrenRecords.length === 0`, renders a clean card with GraduationCap icon: `"No Student Records Linked. No active student enrollments are currently associated with this authenticated parent account."`
3. **Error Handling:**
   - Network or authorization failures trigger Sonner toasts (`toast.error('Failed to load fee statement.')`) and fall back to empty data arrays without crashing the UI.
4. **Statement Printing:**
   - Integrated via `useReactToPrint({ contentRef: printRef })`, rendering a print-optimized, un-paginated official institutional statement complete with school branding, student details, and dues ledger.

---

## 6. Recommendations for Phase 2 / Phase 3 Web Implementation

1. **Extend `MyFees.tsx` with Online Payment Action:**
   - Add a `"Pay Now"` button on pending/overdue installment rows.
   - Open a modal consuming `/create-order` and Razorpay Checkout SDK.
2. **Fix Backend `/dashboard/parent/overview`:**
   - Correct the Supabase/Prisma query to join `parents` via `user_id` / `email` instead of non-existent column `student_parents.parent_user_id`.
3. **Dedicated Enrolled Student Academic Profile Screen:**
   - Create a clean child card or tab displaying Confirmed Admission Number, Academic Year, Grade, Section, Roll Number, and Class Teacher.
