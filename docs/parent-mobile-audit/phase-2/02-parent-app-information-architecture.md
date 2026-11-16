# Phase 2 Blueprint: Parent App Information Architecture & Domain Taxonomy

**Document Reference:** `docs/parent-mobile-audit/phase-2/02-parent-app-information-architecture.md`  
**Phase:** Phase 2 — Complete UI/UX Architecture & Redesign Blueprint  
**Status:** ARCHITECTURAL SPECIFICATION & BLUEPRINT (READ-ONLY DESIGN)

---

## 1. Information Architecture Evaluation & Conflict Resolution

### 1.1 The Legacy Tab Conflict

Phase 1.1 identified an architectural defect in the current navigation structure:

- **`app/(parent)/_layout.tsx`**: Defines 4 tabs (`Home`, `Applications`, `Notifications`, `Settings`).
- **`app/(tabs)/_layout.tsx`**: Defines 3 tabs (`Dashboard`, `Profile`, `Calendar`).
- **Impact:** Users navigating between screens experience inconsistent tab bars, route hijacking, and redirect loops (`ISSUE-NAV-01` and `ISSUE-NAV-02`).

### 1.2 The Canonical Information Architecture Recommendation

We recommend **decommissioning the competing dual-tab structure** in favor of a **single, unified 5-tab Root Navigation Controller**:

```
                       CANONICAL ROOT NAVIGATION SHELL
                                      │
  ┌──────────────┬──────────────┬─────┴────────┬──────────────┬──────────────┐
  ▼              ▼              ▼              ▼              ▼              ▼
[ HOME ]   [ ACADEMICS ]   [ FEED / MSGS ] [ FINANCE ]   [ PROFILE ]   [ MODAL STACK ]
```

---

## 2. Master Information Architecture Tree

```
ROOT /
├── (auth)/
│   ├── splash               # Initial brand splash & auth check
│   ├── login                # Parent email/password authentication
│   ├── register             # Parent registration & lead claim
│   ├── forgot-password      # Password reset request (sends reset OTP/link)
│   ├── otp                  # 6-digit OTP verification
│   └── reset-password       # [NEW] Set new password after recovery OTP
│
├── (main)/ [CANONICAL BOTTOM TAB BAR]
│   ├── home/
│   │   ├── index            # Adaptive Home Dashboard (Enrolled SIS vs Admission)
│   │   ├── child-switcher   # [MODAL] Global Child Switcher Sheet
│   │   └── quick-actions/   # Fast action routing
│   │
│   ├── academics/
│   │   ├── index            # Academic Hub Overview (Current grades, timetable card)
│   │   ├── attendance       # Monthly calendar, daily records, leave requests
│   │   ├── timetable        # Weekly class schedule, period times, teacher tags
│   │   ├── homework/        # Pending/submitted homework checklist
│   │   │   └── [id]         # Homework details, attachments, submission status
│   │   ├── examinations/    # Exam schedules, hall tickets, syllabus
│   │   │   └── [id]         # Exam subject timetable
│   │   └── results/         # Term grade cards, GPA trends, subject breakdowns
│   │       └── [id]         # Downloadable Term Report Card
│   │
│   ├── communication/
│   │   ├── index            # Unified School Feed (Announcements, Circulars, Events)
│   │   ├── circulars/       # Official school notices with PDF attachments
│   │   │   └── [id]         # Circular reader & attachment downloader
│   │   ├── events/          # School event calendar, sports day, parent-teacher meets
│   │   ├── messages/        # Teacher-to-parent 1-way / moderated communication
│   │   │   └── [threadId]   # Chat / message thread view
│   │   └── helpdesk/        # Parent support ticket management
│   │       ├── new          # Create inquiry/ticket
│   │       └── [ticketId]   # Ticket resolution tracking
│   │
│   ├── finance/
│   │   ├── index            # Fee Dashboard: Outstanding balance, upcoming installments
│   │   ├── structure        # Annual fee structure & itemized breakdown
│   │   ├── checkout/        # Razorpay Payment Gateway integration flow
│   │   │   ├── review       # Fee allocation & convenience fee confirmation
│   │   │   ├── process      # Active gateway handoff & SDK verification
│   │   │   └── status       # Payment success, pending, or failed screen
│   │   ├── history          # Past transaction ledger & payment references
│   │   └── receipts/        # Official school fee receipts
│   │       └── [receiptId]  # Printable / shareable PDF receipt view
│   │
│   └── profile/
│       ├── index            # Parent & Student Profile Overview
│       ├── student-details  # Enrolled student biographical, medical & blood group
│       ├── documents        # School-stored documents & transfer certificates
│       ├── transport        # Bus route, driver contact, morning/evening stop times
│       ├── library          # Books currently borrowed, due dates, library fines
│       ├── settings         # Biometrics, notification channels, theme (dark/light)
│       └── support          # FAQ, school contact, app feedback, logout
│
├── (admission)/ [DEDICATED APPLICANT STACK]
│   ├── index                # My Admission Applications list
│   ├── wizard               # 4-step new admission application form
│   └── [id]/
│       ├── index            # Application Hub & Progress Stepper
│       ├── documents        # Required document upload & verification status
│       ├── fees             # Admission application processing fee payment
│       ├── receipt          # Admission fee payment receipt
│       ├── assessment       # Entrance test & parent interview scheduling
│       ├── decision         # Offer letter review, acceptance & enrollment agreement
│       └── timeline         # Audit log of admission status milestones
│
└── (common)/ [SYSTEM OVERLAYS]
    ├── notifications        # Centralized notification inbox (all categories)
    ├── unexpected-error     # Error recovery boundary (safe reset action)
    ├── no-internet          # Offline detection with active NetInfo retry
    └── maintenance          # Scheduled system downtime notification
```

---

## 3. Domain Taxonomy & Responsibility Matrix

| Domain Tab           | Primary Parent Question Answered                                      | Data Entities Involved                                                         | Action Capabilities                                                         |
| -------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| **1. Home**          | _"What does my child need today, and is everything in order?"_        | `UnifiedChild`, Daily Attendance, Today's Timetable, Alerts, Fee Summary       | Switch child, mark leave, pay dues, open timetable                          |
| **2. Academics**     | _"How is my child performing and what are their obligations?"_        | `attendance_records`, `class_schedules`, `assignments`, `exams`, `grade_books` | View day-by-day attendance, check homework, download report card            |
| **3. Communication** | _"What is happening in the school community that affects my family?"_ | `circulars`, `announcements`, `school_events`, `messages`, `support_tickets`   | Read notices, download attachments, RSVP events, message teachers           |
| **4. Finance**       | _"What fees are owed, and have my past payments been receipted?"_     | `fee_invoices`, `fee_installments`, `payments`, `receipts`, `razorpay_orders`  | Select dues, execute Razorpay checkout, download official PDF receipt       |
| **5. Profile**       | _"What family records, bus routes, and account settings are stored?"_ | `parents`, `students`, `student_parents`, `bus_routes`, `library_loans`        | Update contact info, check bus stop timing, switch theme, toggle biometrics |
| **6. Admission Hub** | _"What is the status of my child's enrollment application?"_          | `admission_applications`, `leads`, `document_submissions`, `assessments`       | Submit application, upload birth cert, pay application fee, accept offer    |

---

## 4. Integration of the Admission Hub in the Master IA

A critical insight from Phase 1.1 is that prospective applicants must not be isolated into a silo that ignores the rest of the application.

### The Unified IA Model

- **When an Enrolled Student is selected:** The bottom navigation provides deep SIS workflows (Academics, Daily Attendance, School Fees, Bus Route).
- **When an Admission Applicant is selected:**
  - **Home Tab:** Displays the Admission Progress Stepper, required document checklist, upcoming interview countdown, and application fee prompt.
  - **Academics Tab:** Displays a helpful state: _"Academic records become available once admission is confirmed and the student is matriculated into a classroom."_ (Includes link to entrance test syllabus if applicable).
  - **Finance Tab:** Directly surfaces the Admission Application Fee and processing invoice.
  - **Communication Tab:** Shows institutional admissions news, open-house invites, and admissions office contact.
- **Dedicated Quick Access:** The Parent can also tap _"Manage Admission Applications"_ from the Global Child Switcher or Profile at any time to enter the full `app/(admission)/` stack.
