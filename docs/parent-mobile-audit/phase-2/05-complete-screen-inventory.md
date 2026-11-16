# Phase 2 Blueprint: Master Screen Inventory & Component Taxonomy

**Document Reference:** `docs/parent-mobile-audit/phase-2/05-complete-screen-inventory.md`  
**Phase:** Phase 2 — Complete UI/UX Architecture & Redesign Blueprint  
**Status:** ARCHITECTURAL SPECIFICATION & BLUEPRINT (READ-ONLY DESIGN)

---

## 1. Inventory Summary & Classification

This document provides the exhaustive screen inventory for the redesigned EduTrack Parent Mobile App across all 22 audited domains.

### Screen Classification Breakdown:

- **Total Screens Specified:** 38 screens
- **Existing & Reusable (Minor Polish):** 8 screens (Auth splash, login, admission wizard, doc upload, decision, timeline, notifications, maintenance)
- **Existing but Requiring Redesign:** 7 screens (Home dashboard, fee checkout, receipt, child switcher, profile, OTP, settings)
- **Existing but Functionally Incomplete:** 4 screens (Forgot password, calendar, unexpected error, no-internet)
- **New UI Required (SIS Core):** 13 screens (Attendance, Timetable, Homework list, Homework detail, Exam list, Exam hall ticket, Report card, School feed, Circular reader, Event detail, Teacher messages, Chat thread, Helpdesk)
- **New UI Required (Additional Services):** 4 screens (Student bio/medical, Bus transport, Library loans, Reset password)
- **Orphaned Screens to Delete:** 2 screens (`app/index - Copy.tsx` and `app/(teacher)/index.tsx`)

---

## 2. Master Screen Inventory Table

### Module A: Authentication & Session Management

#### `SCR-AUTH-01`: Splash & Hydration Screen

- **Route:** `/(auth)/splash`
- **Classification:** Existing & Reusable
- **Purpose:** Cold-start branding and auth session hydration.
- **Journey:** Shared
- **UI Components:** App logo, animated spinner, version tag.
- **Actions:** Auto-navigates to `/(main)/home` if token valid; else `/(auth)/login`.
- **API Status:** `EXISTING & VERIFIED` (`GET /v1/auth/me`).

#### `SCR-AUTH-02`: Parent Login Screen

- **Route:** `/(auth)/login`
- **Classification:** Existing & Reusable
- **Purpose:** Authenticate parent via email and password, or biometrics.
- **Journey:** Shared
- **UI Components:** Header illustration, Email input, Password input with eye toggle, "Remember Me" switch, Biometric icon button, Primary Login button, Forgot Password link, Register link.
- **Actions:** Submit credentials; Biometric authenticate; Navigate to register.
- **API Status:** `EXISTING & VERIFIED` (`POST /v1/auth/login`).

#### `SCR-AUTH-03`: Parent Registration Screen

- **Route:** `/(auth)/register`
- **Classification:** Existing & Reusable
- **Purpose:** New parent registration or self-service claim from school lead.
- **Journey:** Journey A (Prospective Parent)
- **UI Components:** Full Name input, Email input, Phone input, Password input, Terms of Service checkbox, Primary Register button.
- **Actions:** Submit registration; Navigates to OTP.
- **API Status:** `EXISTING & VERIFIED` (`POST /v1/auth/register`).

#### `SCR-AUTH-04`: Forgot Password Screen

- **Route:** `/(auth)/forgot-password`
- **Classification:** Existing but Functionally Incomplete (`ISSUE-FUNC-01`)
- **Purpose:** Request password recovery OTP/link.
- **Journey:** Shared
- **UI Components:** Back button, Email input with validation, "Send Reset Code" button, Support hotline link.
- **Actions:** Submits email; Passes email param to OTP.
- **API Status:** `PROPOSED / MISSING` (`POST /v1/auth/forgot-password`).

#### `SCR-AUTH-05`: OTP Verification Screen

- **Route:** `/(auth)/otp`
- **Classification:** Existing but Requiring Redesign
- **Purpose:** 6-digit OTP code entry for registration or password reset.
- **Journey:** Shared
- **UI Components:** 6-box segmented OTP input, Countdown timer (60s), Resend OTP button, Verify button.
- **Actions:** Auto-submits on 6th digit; Resend code.
- **API Status:** `EXISTING & VERIFIED` (`POST /v1/auth/verify-otp` for register; proposed for reset).

#### `SCR-AUTH-06`: Reset Password Screen

- **Route:** `/(auth)/reset-password`
- **Classification:** New UI Required
- **Purpose:** Set new secure password following successful OTP verification.
- **Journey:** Shared
- **UI Components:** New Password input, Confirm Password input, Password strength meter, "Update Password & Login" button.
- **Actions:** Submit new password; Redirect to Login.
- **API Status:** `PROPOSED / MISSING` (`POST /v1/auth/reset-password`).

---

### Module B: Home Dashboard & Child Selection

#### `SCR-HOME-01`: Adaptive Family Home Dashboard

- **Route:** `/(main)/home`
- **Classification:** Existing but Requiring Redesign
- **Purpose:** Primary family launchpad. Dynamically morphs between Enrolled SIS and Admission Funnel based on active child.
- **Journey:** Adaptive (Journeys A & B)
- **UI Components:** Header (Avatar, School Logo, Notification Bell), Child Selector Bar, Today's Attendance Pill, Timetable Card, Quick Action Grid (6 icons), Homework Due Widget, Tuition Fee Alert, Announcement Carousel.
- **Actions:** Tap child selector sheet; Tap quick actions; Tap homework; Tap fee pay.
- **API Status:** `PARTIALLY AVAILABLE` (Admission APIs exist; Enrolled student dashboard API exists in backend `GET /v1/parents/dashboard`).

#### `SCR-HOME-02`: Global Child Switcher Modal

- **Route:** `/(main)/home/child-switcher`
- **Classification:** Existing but Requiring Redesign (Currently only switches applicants)
- **Purpose:** Bottom sheet allowing parents to switch active child context across enrolled students and applicants.
- **Journey:** Shared / Multi-child
- **UI Components:** Drag handle, Search bar (if $>3$ children), List of Enrolled Children cards (Photo, Name, Grade/Section, Status), List of Admission Applicants cards (Photo, Name, Application #, Funnel Step), "Add Another Child / Apply" button.
- **Actions:** Tap child to select; Dismiss sheet; Start new application.
- **API Status:** `PARTIALLY AVAILABLE` (Backend `GET /v1/parents/:id/students` exists; mobile client integration required).

---

### Module C: Admission Funnel (Journey A)

#### `SCR-ADM-01`: Applications Hub & List

- **Route:** `/(admission)`
- **Classification:** Existing & Reusable
- **Purpose:** Overview of all admission applications submitted by parent.
- **Journey:** Journey A
- **UI Components:** Active application cards, archived applications list, "Start New Application" floating button.
- **API Status:** `EXISTING & VERIFIED` (`GET /v1/admissions/applications`).

#### `SCR-ADM-02`: Admission Application Wizard

- **Route:** `/(admission)/wizard`
- **Classification:** Existing & Reusable
- **Purpose:** 4-step interactive application form.
- **Journey:** Journey A
- **UI Components:** Step indicator (1–4), Student details form, Parent details form, Academic history form, Medical declaration, Save Draft button, Submit Application button.
- **API Status:** `EXISTING & VERIFIED` (`POST /v1/admissions/applications`).

#### `SCR-ADM-03`: Application Detail & Stepper Hub

- **Route:** `/(admission)/[id]`
- **Classification:** Existing & Reusable
- **Purpose:** Central tracking hub for an active application.
- **Journey:** Journey A
- **UI Components:** Applicant header, 9-stage visual milestone stepper, "Action Required" prominent card, Shortcut tiles (Documents, Fees, Assessment, Decision, Timeline).
- **API Status:** `EXISTING & VERIFIED` (`GET /v1/admissions/applications/:id`).

#### `SCR-ADM-04`: Document Submission Screen

- **Route:** `/(admission)/[id]/documents`
- **Classification:** Existing & Reusable
- **Purpose:** Upload required verification documents (Birth certificate, photos, immunizations).
- **Journey:** Journey A
- **UI Components:** Document requirement cards, Upload button (Camera / Document Picker), Verification status badge (Pending, Verified, Rejected with reason).
- **API Status:** `EXISTING & VERIFIED` (`GET/POST /v1/admissions/applications/:id/documents`).

#### `SCR-ADM-05`: Admission Processing Fee Screen

- **Route:** `/(admission)/[id]/fees`
- **Classification:** Existing but Requiring Redesign (`ISSUE-FIN-01`)
- **Purpose:** Review and settle admission application processing fee.
- **Journey:** Journey A
- **UI Components:** Fee line breakdown, Payment mode selection, Razorpay Checkout CTA button, Security compliance badge.
- **API Status:** `BACKEND GATEWAY AVAILABLE` (Must wire to backend Razorpay instead of mock ledger).

#### `SCR-ADM-06`: Admission Fee Receipt Screen

- **Route:** `/(admission)/[id]/receipt`
- **Classification:** Existing & Reusable
- **Purpose:** View and download official admission fee payment receipt.
- **Journey:** Journey A
- **UI Components:** Receipt header, Transaction ID, Payment Mode, Amount, Timestamp, "Download PDF" button, "Share" button.
- **API Status:** `EXISTING & VERIFIED` (`GET /v1/admissions/applications/:id/payment`).

#### `SCR-ADM-07`: Assessment & Interview Scheduling

- **Route:** `/(admission)/[id]/assessment`
- **Classification:** Existing & Reusable
- **Purpose:** Book and manage student entrance assessment or parent interview.
- **Journey:** Journey A
- **UI Components:** Available date picker, Time slot chips, Assigned interviewer details, Confirmation modal, Add to Device Calendar button.
- **API Status:** `EXISTING & VERIFIED` (`GET/PATCH /v1/admissions/applications/:id/assessment`).

#### `SCR-ADM-08`: Decision & Offer Acceptance Screen

- **Route:** `/(admission)/[id]/decision`
- **Classification:** Existing & Reusable
- **Purpose:** Review formal admission offer letter and accept enrollment.
- **Journey:** Journey A
- **UI Components:** Digital Offer Letter reader, Terms & conditions scrollview, Acceptance checkbox, "Accept Offer & Enroll" button.
- **API Status:** `EXISTING & VERIFIED` (`GET/PATCH /v1/admissions/applications/:id/decision`).

#### `SCR-ADM-09`: Application Audit Timeline

- **Route:** `/(admission)/[id]/timeline`
- **Classification:** Existing & Reusable
- **Purpose:** Immutable audit log of all application events and status transitions.
- **Journey:** Journey A
- **UI Components:** Chronological timeline cards with actor avatars, timestamps, and stage descriptions.
- **API Status:** `EXISTING & VERIFIED` (`GET /v1/admissions/applications/:id/timeline`).

---

### Module D: Academic Domain (Journey B)

#### `SCR-ACAD-01`: Academics Hub Screen

- **Route:** `/(main)/academics`
- **Classification:** New UI Required
- **Purpose:** High-level academic overview for the active enrolled child.
- **Journey:** Journey B
- **UI Components:** Current GPA / Grade card, Today's Timetable glance, Pending Homework card, Upcoming Exams alert, Module Navigation Tiles.
- **API Status:** `PROPOSED / BACKEND AGGREGATE REQUIRED`.

#### `SCR-ACAD-02`: Attendance Calendar & Details

- **Route:** `/(main)/academics/attendance`
- **Classification:** New UI Required
- **Purpose:** Month-by-month attendance records and statistics.
- **Journey:** Journey B
- **UI Components:** Month selector, Color-coded interactive calendar grid, Statistics bar (% present, days absent, late days), Daily detail bottom sheet, "Apply for Leave" action.
- **API Status:** `BACKEND CONTROLLER AVAILABLE` (`GET /v1/attendance/student/:id`).

#### `SCR-ACAD-03`: Weekly Class Timetable

- **Route:** `/(main)/academics/timetable`
- **Classification:** New UI Required
- **Purpose:** Day-by-day class schedule with periods, subjects, and room numbers.
- **Journey:** Journey B
- **UI Components:** Horizontal day-of-week bar (Mon–Sat), Period cards (Time, Subject, Teacher Name, Room), Live pulsing "Now Active" period indicator.
- **API Status:** `BACKEND CONTROLLER AVAILABLE` (`GET /v1/academics/timetable/student/:id`).

#### `SCR-ACAD-04`: Homework & Assignments List

- **Route:** `/(main)/academics/homework`
- **Classification:** New UI Required
- **Purpose:** Track pending and submitted homework assignments.
- **Journey:** Journey B
- **UI Components:** Filter tabs (`Due Soon`, `Completed`, `Past Due`), Subject filter chips, Homework cards (Title, Subject, Due Date chip, Submission status badge).
- **API Status:** `BACKEND CONTROLLER AVAILABLE` (`GET /v1/homework/student/:id`).

#### `SCR-ACAD-05`: Homework Detail & Attachments Screen

- **Route:** `/(main)/academics/homework/[id]`
- **Classification:** New UI Required
- **Purpose:** View teacher assignment instructions and reference documents.
- **Journey:** Journey B
- **UI Components:** Subject tag, Due date, Teacher name, Rich text assignment body, Attachment list with download buttons, Parent acknowledgement checkbox.
- **API Status:** `BACKEND CONTROLLER AVAILABLE` (`GET /v1/homework/:id`).

#### `SCR-ACAD-06`: Examination Schedules & Hall Ticket

- **Route:** `/(main)/academics/examinations`
- **Classification:** New UI Required
- **Purpose:** Upcoming term examination date sheets and seating plans.
- **Journey:** Journey B
- **UI Components:** Exam term selector (e.g. "Mid-Term 2026"), Date-by-date subject schedule, Timing, Syllabus links, "Download Hall Ticket" button.
- **API Status:** `BACKEND CONTROLLER AVAILABLE` (`GET /v1/examinations/student/:id`).

#### `SCR-ACAD-07`: Report Cards & Term Results

- **Route:** `/(main)/academics/results`
- **Classification:** New UI Required
- **Purpose:** View grades, percentages, class averages, and official report cards.
- **Journey:** Journey B
- **UI Components:** Term selector, Overall GPA pill, Subject-wise grade table, Teacher remarks box, Attendance summary, "Download Official Report Card PDF" button.
- **API Status:** `BACKEND CONTROLLER AVAILABLE` (`GET /v1/examinations/results/student/:id`).

---

### Module E: Finance & Fee Payments (Journey B)

#### `SCR-FIN-01`: Student Fee Dashboard

- **Route:** `/(main)/finance`
- **Classification:** New UI Required (`ISSUE-FIN-02`)
- **Purpose:** Comprehensive overview of enrolled student fees, dues, and payment options.
- **Journey:** Journey B
- **UI Components:** Total Outstanding Card, Due Date countdown, Next Installment banner, Quick "Pay Now" button, Breakdown by Installment (Term 1, Term 2, Bus Fee), Recent Receipts carousel.
- **API Status:** `BACKEND ROUTE AVAILABLE` (`apps/backend/src/modules/fees`).

#### `SCR-FIN-02`: Annual Fee Structure Screen

- **Route:** `/(main)/finance/structure`
- **Classification:** New UI Required
- **Purpose:** Transparent breakdown of the child's academic fee schedule.
- **Journey:** Journey B
- **UI Components:** Academic year selector, Itemized table (Tuition, Lab, Sports, Library, Development), Concessions/Scholarships applied, Total Net Payable.
- **API Status:** `BACKEND ROUTE AVAILABLE` (`GET /v1/fees/structure/student/:id`).

#### `SCR-FIN-03`: Payment Checkout & Review Screen

- **Route:** `/(main)/finance/checkout/review`
- **Classification:** New UI Required
- **Purpose:** Review selected fee installment lines prior to gateway handoff.
- **Journey:** Journey B
- **UI Components:** Selected fee items checklist, Subtotal, Convenience fee line, Total payable amount, Gateway selector (Razorpay, UPI, Net Banking), "Proceed to Secure Payment" button.
- **API Status:** `BACKEND ROUTE AVAILABLE` (`POST /api/create-order` in `razorpay.routes.ts`).

#### `SCR-FIN-04`: Payment Status Outcome Screen

- **Route:** `/(main)/finance/checkout/status`
- **Classification:** New UI Required
- **Purpose:** Post-payment feedback screen handling Success, Pending, or Failure states.
- **Journey:** Journey B
- **UI Components:** Status animation (Success checkmark, Pending spinner, Failed cross), Transaction ID, Amount paid, Bank reference, "Download Receipt" CTA, "Back to Finance" CTA.
- **API Status:** `BACKEND ROUTE AVAILABLE` (`POST /api/verify-payment`).

#### `SCR-FIN-05`: Transaction History Ledger

- **Route:** `/(main)/finance/history`
- **Classification:** New UI Required
- **Purpose:** Filterable history of all past payments and receipts.
- **Journey:** Journey B
- **UI Components:** Filter by year, Transaction rows (Date, Amount, Mode, Receipt #, Status badge), Tap row to open receipt.
- **API Status:** `BACKEND ROUTE AVAILABLE` (`GET /v1/fees/payments/student/:id`).

#### `SCR-FIN-06`: Official Fee Receipt Screen

- **Route:** `/(main)/finance/receipts/[id]`
- **Classification:** Existing but Requiring Redesign
- **Purpose:** Legal school fee receipt viewer with print and share actions.
- **Journey:** Journey B
- **UI Components:** School header, Receipt #, Student admission #, Itemized payment allocation, Authorized signature seal, "Download PDF" button, "Share Receipt" button.
- **API Status:** `BACKEND ROUTE AVAILABLE` (`GET /v1/fees/receipts/:id`).

---

### Module F: School Communication & Feed

#### `SCR-COMM-01`: Unified School Feed Screen

- **Route:** `/(main)/communication`
- **Classification:** New UI Required
- **Purpose:** Chronological social-style feed of institutional notices, circulars, and events.
- **Journey:** Shared
- **UI Components:** Category filter tabs (`All`, `Circulars`, `Announcements`, `Events`), Search input, Feed Card (School badge, Title, Summary, Timestamp, Image preview, Attachment chip), Unread badge.
- **API Status:** `PROPOSED / BACKEND CONTROLLER AVAILABLE IN MODULES`.

#### `SCR-COMM-02`: Circular Detail & Attachment Reader

- **Route:** `/(main)/communication/circulars/[id]`
- **Classification:** New UI Required
- **Purpose:** Official circular reader with PDF preview and acknowledgement.
- **Journey:** Shared
- **UI Components:** Circular title, Department stamp, Publication date, Formatted content body, Attached PDF list with download button, "Acknowledge Receipt" button.
- **API Status:** `PROPOSED / MISSING CLIENT MAPPING`.

#### `SCR-COMM-03`: School Event Details Screen

- **Route:** `/(main)/communication/events/[id]`
- **Classification:** New UI Required
- **Purpose:** Event announcement (Sports day, Annual function, Parent-Teacher meeting).
- **Journey:** Shared
- **UI Components:** Event banner image, Title, Date & Time range, Location/Auditorium, Description, "RSVP Attending" toggle, "Add to Phone Calendar" button.
- **API Status:** `PROPOSED / MISSING CLIENT MAPPING`.

#### `SCR-COMM-04`: Teacher Message Threads List

- **Route:** `/(main)/communication/messages`
- **Classification:** New UI Required
- **Purpose:** List of official communications between class teachers and parents.
- **Journey:** Journey B
- **UI Components:** Search bar, Conversation rows (Teacher avatar, Name, Subject/Grade, Last message snippet, Unread badge, Timestamp).
- **API Status:** `PROPOSED / MISSING CONTRACT`.

#### `SCR-COMM-05`: Teacher Message Thread View

- **Route:** `/(main)/communication/messages/[id]`
- **Classification:** New UI Required
- **Purpose:** Moderated 1-to-1 message history between teacher and parent.
- **Journey:** Journey B
- **UI Components:** Chat message bubbles, Timestamp, Read receipts, Restricted text input with attachment button (only during active communication hours).
- **API Status:** `PROPOSED / MISSING CONTRACT`.

#### `SCR-COMM-06`: Parent Helpdesk Tickets List

- **Route:** `/(main)/communication/helpdesk`
- **Classification:** New UI Required
- **Purpose:** Track support inquiries regarding transport, fees, academics, or IT.
- **Journey:** Shared
- **UI Components:** Filter tabs (`Open`, `Resolved`), Ticket cards (Ticket #, Category, Subject, Status badge, Last updated), "New Inquiry" FAB button.
- **API Status:** `PROPOSED / MISSING CONTRACT`.

#### `SCR-COMM-07`: Submit Helpdesk Ticket Screen

- **Route:** `/(main)/communication/helpdesk/new`
- **Classification:** New UI Required
- **Purpose:** Submit formal inquiry or grievance to school administration.
- **Journey:** Shared
- **UI Components:** Category dropdown (Fees, Transport, Academics, General), Subject input, Detailed description textarea, Attachment picker, "Submit Ticket" button.
- **API Status:** `PROPOSED / MISSING CONTRACT`.

---

### Module G: Family Profile & Auxiliary Services

#### `SCR-PROF-01`: Family Profile & Hub Screen

- **Route:** `/(main)/profile`
- **Classification:** Existing but Requiring Redesign
- **Purpose:** Parent account overview, linked student profiles, and service shortcuts.
- **Journey:** Shared
- **UI Components:** Parent Avatar, Name, Email, Phone, Linked Children cards, Service List (Transport, Library, Documents, Settings, Support, Logout).
- **API Status:** `EXISTING & VERIFIED` (`GET /v1/auth/me`).

#### `SCR-PROF-02`: Enrolled Student Profile Screen

- **Route:** `/(main)/profile/student`
- **Classification:** New UI Required
- **Purpose:** Detailed biographical, academic, and emergency details of the student.
- **Journey:** Journey B
- **UI Components:** Student photo, Admission number, Roll number, Class & Section, Blood group, Emergency contact, Medical allergies, Assigned Class Teacher details.
- **API Status:** `BACKEND ROUTE AVAILABLE` (`GET /v1/students/:id`).

#### `SCR-PROF-03`: Bus Transport & Route Screen

- **Route:** `/(main)/profile/transport`
- **Classification:** New UI Required
- **Purpose:** Bus tracking, route number, stop timing, and driver contact.
- **Journey:** Journey B
- **UI Components:** Bus route badge, Morning pickup time, Evening drop time, Stop name, Driver name & call button, Bus attendant contact, Live bus location map placeholder.
- **API Status:** `PROPOSED / MISSING CONTRACT`.

#### `SCR-PROF-04`: Library Loans & History Screen

- **Route:** `/(main)/profile/library`
- **Classification:** New UI Required
- **Purpose:** Track books currently checked out by student and due dates.
- **Journey:** Journey B
- **UI Components:** Currently Issued cards (Book title, Author, Issued date, Return due date, Overdue warning badge), Reading history list.
- **API Status:** `PROPOSED / MISSING CONTRACT`.

#### `SCR-PROF-05`: App Settings Screen

- **Route:** `/(main)/profile/settings`
- **Classification:** Existing but Requiring Redesign
- **Purpose:** Preferences, notifications toggle, security, and theme settings.
- **Journey:** Shared
- **UI Components:** Dark/Light theme switch, Biometric login switch, Push notification category toggles, Cache clear button, App version.
- **API Status:** Local storage / Zustand.

---

### Module H: System Overlays & Error Boundaries

#### `SCR-SYS-01`: Notification Center Screen

- **Route:** `/(common)/notifications`
- **Classification:** Existing & Reusable
- **Purpose:** Centralized list of all alerts across admissions, fees, and academics.
- **Journey:** Shared
- **UI Components:** Filter chips (`All`, `Unread`, `Admissions`, `Fees`), "Mark all as read" button, Notification cards with deep-link navigation on tap.
- **API Status:** `EXISTING & VERIFIED` (`GET /v1/notifications`).

#### `SCR-SYS-02`: Unexpected Error Recovery Screen

- **Route:** `/(common)/unexpected-error`
- **Classification:** Existing but Functionally Incomplete (`ISSUE-NAV-01`)
- **Purpose:** Safe crash boundary with context-aware session reset.
- **Journey:** Shared
- **UI Components:** Warning illustration, Error description, "Reset Session & Return" button.
- **API Status:** Local boundary.

#### `SCR-SYS-03`: No Internet Connection Screen

- **Route:** `/(common)/no-internet`
- **Classification:** Existing but Functionally Incomplete (`ISSUE-NAV-03`)
- **Purpose:** Offline screen with active network re-probing.
- **Journey:** Shared
- **UI Components:** Satellite offline icon, Connectivity troubleshooting tips, "Retry Connection" button with NetInfo probe.
- **API Status:** Local NetInfo.
