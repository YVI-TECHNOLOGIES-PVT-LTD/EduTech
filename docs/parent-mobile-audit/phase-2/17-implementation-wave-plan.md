# Phase 2 Blueprint: Phased Implementation Wave Plan

**Document Reference:** `docs/parent-mobile-audit/phase-2/17-implementation-wave-plan.md`  
**Phase:** Phase 2 — Complete UI/UX Architecture & Redesign Blueprint  
**Status:** ARCHITECTURAL SPECIFICATION & BLUEPRINT (READ-ONLY DESIGN)

---

## 1. Executive Summary & Wave Strategy

To de-risk the transformation of `apps/mobile_app` from an Admission-only tool into a full Parent ERP, implementation must not occur as a single massive rewrite.

This document defines a structured **5-Wave Implementation Roadmap**. Each wave produces an independently testable, functionally complete slice of the application with clear architectural dependencies, security preconditions, and quality gates.

```
┌────────────────────────────────────────────────────────────────────────┐
│                      5-WAVE IMPLEMENTATION ROADMAP                     │
├────────────────────────────────────────────────────────────────────────┤
│ WAVE 1: FOUNDATION & NAVIGATION CONSOLIDATION                          │
│         Auth, Single Tab Layout, Universal Child Switcher, Core Shell  │
│                                    │                                   │
│ WAVE 2: CORE ACADEMIC EXPERIENCE (SIS)                                 │
│         Daily Attendance, Class Timetable, Homework, Exams, Results    │
│                                    │                                   │
│ WAVE 3: PRODUCTION FINANCE & PAYMENT PIPELINE                          │
│         Razorpay Checkout, Tuition Fees, Invoices, Signed Receipts     │
│                                    │                                   │
│ WAVE 4: SCHOOL COMMUNICATION & INTERACTION                             │
│         Institutional Feed, Circulars with PDFs, Events, Helpdesk      │
│                                    │                                   │
│ WAVE 5: AUXILIARY SERVICES & PRODUCTION HARDENING                      │
│         Bus Transport, Library, Push Tokens, Maestro E2E, Release Prep │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Wave Specifications

### Wave 1: Foundation, Navigation & Universal Child Architecture

- **Objective:** Establish the bedrock application shell, resolve all Phase 1.1 navigation defects, and introduce the Universal Child Model.
- **Deliverables:**
  1. Consolidate duplicate tabs: Decommission `(parent)` and `(tabs)`; establish canonical 5-tab `(main)` layout (`03-navigation-architecture.md`).
  2. Implement `useChildStore` (Zustand) and `ChildSwitcherSheet` connecting to backend `GET /v1/parents/:id/students` and `GET /v1/admissions/applications`.
  3. Remediate `ISSUE-NAV-01` (`unexpected-error.tsx`), `ISSUE-NAV-02` (dashboard loops), and `ISSUE-NAV-03` (`no-internet.tsx`).
  4. Delete orphaned routes: `app/index - Copy.tsx` and `app/(teacher)/index.tsx`.
  5. Implement silent token refresh Axios interceptor (`ISSUE-SEC-02`).
  6. Secure WebSocket connection via `Sec-WebSocket-Protocol` (`ISSUE-SEC-01`).
- **Dependencies & Blockers:**
  - UI Dependencies: `DesignSystemTokens`, `ScreenWrapper`, `ChildCard`.
  - API Dependencies: `GET /v1/auth/me`, `GET /v1/parents/:id/students`, `POST /v1/auth/refresh`.
  - Backend Blockers: None (All required endpoints exist in backend).
- **Quality Gate:** 100% route navigation pass; 0 compiler errors; session hydration verified.

---

### Wave 2: Core Academic Experience (Enrolled SIS)

- **Objective:** Surface daily student academic life, eliminating the biggest product gap identified in Phase 1.
- **Deliverables:**
  1. Attendance Module: `attendance.tsx` with interactive month calendar and aggregate statistics.
  2. Timetable Module: `timetable.tsx` with weekly day tabs and live active period indicator.
  3. Homework Module: `homework/index.tsx` and `homework/[id].tsx` with due date filters and PDF attachments.
  4. Examination Module: `examinations/index.tsx` with date sheets and hall ticket download.
  5. Results Module: `results/index.tsx` with term GPA card and downloadable official report card PDF.
- **Dependencies & Blockers:**
  - UI Dependencies: `CalendarView`, `PeriodRow`, `Badge`.
  - API Dependencies: Backend endpoints in `apps/backend/src/modules/attendance`, `academics`, and `homework`.
  - Backend Blockers: Client API services and RTK Query / React Query mappers must be written to consume existing backend routes.
- **Quality Gate:** Attendance calendar renders accurately; timetable displays correct periods; Jest unit tests pass for all academic schemas.

---

### Wave 3: Production Finance & Payment Pipeline

- **Objective:** Eliminate the simulated payment defect (`ISSUE-FIN-01`) and wire the mobile app to the production Razorpay gateway (`ISSUE-FIN-02`).
- **Deliverables:**
  1. Tuition Fee Dashboard: `finance/index.tsx` displaying outstanding balance and term installments.
  2. Annual Fee Structure: `finance/structure.tsx` breaking down tuition, lab, and activity heads.
  3. Payment Checkout Flow: `finance/checkout/review.tsx` and `checkout/status.tsx`.
  4. Native Razorpay Gateway Integration: Install and wire `react-native-razorpay` consuming backend `POST /api/create-order` and `POST /api/verify-payment`.
  5. Official Fee Receipts: `finance/receipts/[id].tsx` with PDF rendering, download, and share sheet.
- **Dependencies & Blockers:**
  - UI Dependencies: `FeeItem`, `PaymentReviewSheet`, Razorpay native bridge.
  - API Dependencies: `apps/backend/src/routes/razorpay.routes.ts`.
  - Security Blockers: Server-side HMAC-SHA256 signature verification must be enforced; client mock references completely eradicated.
- **Quality Gate:** End-to-end payment test in Razorpay Sandbox; receipt verification test; idempotency check.

---

### Wave 4: School Communication & Helpdesk

- **Objective:** Modernize parent-school engagement with a curated social-style feed and official support channels.
- **Deliverables:**
  1. School Feed: `communication/index.tsx` with infinite scroll, category filters, and media lightbox.
  2. Circular Reader: `communication/circulars/[id].tsx` with embedded PDF viewer.
  3. Events Calendar: `communication/events/[id].tsx` with RSVP and add-to-calendar action.
  4. Teacher Messaging: `communication/messages/index.tsx` (1-to-1 moderated communication).
  5. Parent Helpdesk: `communication/helpdesk/index.tsx` and `helpdesk/new.tsx` (Ticketing system).
- **Dependencies & Blockers:**
  - UI Dependencies: `FeedCard`, `SearchBar`, Image Lightbox.
  - API Dependencies: `announcements`, `circulars`, `helpdesk` controllers in backend.
- **Quality Gate:** 60fps FlashList scrolling performance on mid-tier Android devices; attachments download cleanly.

---

### Wave 5: Auxiliary Services, A11y & Release Hardening

- **Objective:** Finalize peripheral student services, implement accessibility compliance, and prepare production binaries.
- **Deliverables:**
  1. Student Profile & Medical Details: `profile/student.tsx`.
  2. Transport Route & Driver Contact: `profile/transport.tsx`.
  3. Library Loans & Overdue Books: `profile/library.tsx`.
  4. Accessibility Hardening: Dynamic font scaling verification, VoiceOver/TalkBack testing, contrast auditing.
  5. Forgot Password End-to-End: Connect to newly provisioned backend reset endpoints (`ISSUE-FUNC-01`).
  6. Automated Test Suites: Replace 5-line integration stub with MSW integration tests; add Maestro E2E UI tests.
  7. EAS Build Profiles: Production APK / IPA signing configuration.
- **Dependencies & Blockers:**
  - Backend Blockers: Forgot password backend endpoint; device push token table (post-freeze).
- **Quality Gate:** 0 TypeScript errors; 0 ESLint warnings; 100% Jest pass rate; Maestro E2E smoke tests passing.

---

## 3. Wave Execution & Quality Gate Summary

| Wave       | Primary Objective       | Risk Level | Target Completion Gate                                                              |
| ---------- | ----------------------- | ---------- | ----------------------------------------------------------------------------------- |
| **Wave 1** | Foundation & Navigation | **MEDIUM** | Navigation loops resolved, single tab bar active, universal child store functional. |
| **Wave 2** | Academic Core (SIS)     | **LOW**    | Attendance, timetable, homework, and exams visible for enrolled children.           |
| **Wave 3** | Finance & Razorpay      | **HIGH**   | Real Razorpay checkout in sandbox; zero simulated payments; PDF receipts working.   |
| **Wave 4** | Communication & Feed    | **LOW**    | 60fps feed scrolling; circular attachments opening; helpdesk functional.            |
| **Wave 5** | Services & Hardening    | **MEDIUM** | WCAG AA compliance verified; Maestro E2E green; production EAS builds passing.      |
