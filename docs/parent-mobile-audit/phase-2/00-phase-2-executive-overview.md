# Phase 2 Blueprint: Executive Overview & Product Transformation Vision

**Document Reference:** `docs/parent-mobile-audit/phase-2/00-phase-2-executive-overview.md`  
**Phase:** Phase 2 — Complete UI/UX Architecture & Redesign Blueprint  
**Status:** ARCHITECTURAL SPECIFICATION & BLUEPRINT (READ-ONLY DESIGN)  
**Parent Audits:** `docs/parent-mobile-audit/phase-1/` & `docs/parent-mobile-audit/phase-1.1/`  
**Baseline Git Commit:** `a9c3486`  
**Branch:** `hari-finance`

---

## 1. Executive Summary

Phase 1 and Phase 1.1 audits revealed that the existing EduTrack Parent Mobile App (`apps/mobile_app`) is technically modern and structurally stable (Expo 51, React Native 0.74, TypeScript 5.3, NativeWind, 179 passing tests, 0 compiler errors), but possesses a profound product divergence:

> **The application currently operates exclusively as an Admission Application Tracker.**  
> Out of 22 audited parent modules, 15 have zero mobile implementation, 1 is mock-driven, 2 are partially integrated, and only 4 are production-integrated (all centered around admission applications and notifications). Daily Student Information System (SIS) domains—attendance, timetables, homework, report cards, teacher communication, and tuition payments—are entirely absent from the parent experience.

The objective of **Phase 2** is to create a complete, production-grade UI/UX architecture and redesign blueprint that bridges this gap. Phase 2 unifies prospective applicant tracking and active enrolled student management into a cohesive, premium, and trustworthy parent application.

---

## 2. The Core Problem: The Dual Parent Experience Deficit

Modern education ERP platforms serve parents across two fundamentally distinct operational contexts:

```
                                    PARENT USER
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
       JOURNEY A: PROSPECTIVE PARENT                   JOURNEY B: ENROLLED PARENT
       (Admission Applicant)                           (Active Matriculated Student)
                 │                                               │
       • Lead conversion                               • Daily attendance tracking
       • Multi-step application submission             • Daily class timetable & schedule
       • Verification document uploads                 • Homework & assignment deadlines
       • Application fee settlement                    • Examination schedules & report cards
       • Interview/Assessment scheduling               • Term tuition fee installments & receipts
       • Offer letter review & acceptance              • Teacher-parent circulars & messaging
       • Admission status timeline                     • Bus route tracking & school calendar
```

### The Current Reality

In the current application:

1. An enrolled parent with children in Grade 3 and Grade 7 sees: _"No Admission Applications Yet — Start your child's enrollment process"_ (`app/(parent)/index.tsx#L169`). The app is non-functional for them.
2. The child switcher (`ChildSwitcher.tsx`) operates exclusively on `AdmissionApplication[]` records.
3. Fee payment (`fees.tsx`) relies on a simulated test ledger (`MOB-${Date.now()}`), while the backend's extensive 939-line Razorpay school fee gateway (`razorpay.routes.ts`) is completely disconnected.
4. Two competing tab bars (`app/(parent)/_layout.tsx` and `app/(tabs)/_layout.tsx`) exist in the filesystem, creating routing confusion and dead loops.

---

## 3. Product Vision & Architecture Goals

The Phase 2 blueprint redefines the Parent Mobile App into **EduTrack Parent: The Unified Family Education Hub**.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        EDUTRACK PARENT APP SHELL                       │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │   GLOBAL CONTEXT: AUTH + TENANT + UNIFIED CHILD SELECTOR       │   │
│   │   [ Child A: Enrolled (Gr 4) ] ◄── Active Context ──► [ Child B: Applicant ]│
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │             CANONICAL ROOT BOTTOM TAB NAVIGATION               │   │
│   │    [ Home ]   [ Academics ]   [ Messages ]   [ Fees ]   [ Profile ]│
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                  CONTEXTUAL VIEW CONTROLLER                    │   │
│   │                                                                │   │
│   │   IF ACTIVE CHILD == ENROLLED:     IF ACTIVE CHILD == APPLICANT:│  │
│   │   • Attendance Overview            • Application Progress Stepper│ │
│   │   • Current Period Timetable       • Document Verification State │ │
│   │   • Homework & Exam Due Dates      • Assessment Scheduling       │ │
│   │   • Term Fee Installments          • Admission Processing Fee    │ │
│   │   • Class Circulars & Feed         • Offer Letter Acceptance     │ │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### Core Architecture Pillars:

1. **Unified Child Model:** Abstract prospective applicants (`status: 'applicant'`) and enrolled students (`status: 'enrolled'`) into a cohesive `UnifiedChild` domain model stored in a global Zustand context.
2. **Canonical Navigation Shell:** Eliminate the dual-tab conflict identified in Phase 1.1 (`ISSUE-NAV-01` and duplicate layouts) by establishing a single root bottom tab navigator with 5 core tabs: **Home, Academics, Communication, Finance, Profile**.
3. **Contextual Screen Adaptability:** The dashboard and domain tabs dynamically adapt their widgets, cards, and data queries based on whether the currently selected child is an enrolled student or an applicant.
4. **Production-Ready Payment Pipeline:** Bridge the mobile finance module to the existing backend Razorpay gateway (`POST /create-order`, `POST /verify-payment`), replacing the simulated MVP ledger with a resilient, double-submit-safe checkout flow.
5. **Multi-Child Coexistence:** Seamlessly support families having children across multiple grades, campuses, or simultaneous stages (e.g., Child 1 enrolled in Grade 5, Child 2 applying for Grade 1).

---

## 4. Phase 2 Blueprint Document Map

This blueprint is articulated across 20 specialized architectural documents in `docs/parent-mobile-audit/phase-2/`:

| Doc #  | Filename                                        | Scope & Content                                                                     |
| ------ | ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| **00** | `00-phase-2-executive-overview.md`              | Executive summary, core problem, product vision, document map (this document).      |
| **01** | `01-product-experience-strategy.md`             | UX principles, parent personas, design inspirations, and anti-patterns.             |
| **02** | `02-parent-app-information-architecture.md`     | Master taxonomy, site hierarchy, domain boundaries, and content flow.               |
| **03** | `03-navigation-architecture.md`                 | Canonical Expo Router layout tree, route constants, deep links, tab consolidation.  |
| **04** | `04-admission-vs-enrolled-student-journeys.md`  | State machines and end-to-end user journeys for Applicants vs Enrolled students.    |
| **05** | `05-complete-screen-inventory.md`               | Master catalog of all existing, redesigned, and newly proposed mobile screens.      |
| **06** | `06-home-dashboard-specification.md`            | Conditional 9-section dashboard specification with dynamic data rules.              |
| **07** | `07-child-switcher-specification.md`            | Global child switcher UI, bottom sheet, state persistence, and empty states.        |
| **08** | `08-academic-module-ui-specification.md`        | Attendance, Timetable, Homework, Exams, and Report Card UI specifications.          |
| **09** | `09-finance-payment-ui-specification.md`        | Tuition fee structures, invoices, Razorpay checkout, receipts, and refund states.   |
| **10** | `10-communication-feed-specification.md`        | School announcement feed, circulars, event calendar, and teacher messages.          |
| **11** | `11-notifications-and-support-specification.md` | Real-time notification center, WebSocket security, push strategy, and helpdesk.     |
| **12** | `12-design-system-specification.md`             | Color tokens (light/dark), typography scales, spacing, radii, and shadows.          |
| **13** | `13-component-library-specification.md`         | Atomic UI library specifications (Atoms, Molecules, Organisms, Templates).          |
| **14** | `14-api-and-data-integration-matrix.md`         | Exhaustive mapping of all screens to existing, verified, and proposed backend APIs. |
| **15** | `15-loading-empty-error-success-states.md`      | State design rules: skeletons, recovery banners, empty illustrations, alerts.       |
| **16** | `16-accessibility-and-responsive-design.md`     | WCAG AA compliance, dynamic type, touch targets, screen readers, and tablets.       |
| **17** | `17-implementation-wave-plan.md`                | Phased 5-wave implementation roadmap with technical dependencies and gates.         |
| **18** | `18-phase-3-implementation-readiness.md`        | Phase 3 prerequisites, architecture constraints, and governance checklist.          |
| **19** | `19-phase-2-final-summary.md`                   | Final synthesis, 10 executive questions answered, readiness decision.               |

---

## 5. Scope Boundaries and Governance

In accordance with workspace rules and Phase 2 mandates:

- **Design & Blueprint Only:** Zero application source code (`apps/mobile_app`), backend controllers (`apps/backend`), or database models (`schema.prisma`) are modified during Phase 2.
- **Truth Hierarchy:** Backend capabilities and Prisma database schemas documented in Phase 1.1 are treated as the sole authoritative baseline.
- **No Hallucinated Endpoints:** Any proposed API endpoint or schema extension needed for future capabilities is explicitly designated as `PROPOSED / MISSING` with a recommended payload contract.
