# Phase 2 Blueprint: Home Dashboard Specification & Dynamic Hierarchy

**Document Reference:** `docs/parent-mobile-audit/phase-2/06-home-dashboard-specification.md`  
**Phase:** Phase 2 — Complete UI/UX Architecture & Redesign Blueprint  
**Status:** ARCHITECTURAL SPECIFICATION & BLUEPRINT (READ-ONLY DESIGN)

---

## 1. Executive Summary & Design Mission

The Home Dashboard (`/(main)/home`) is the central launchpad for parents. Its primary ergonomic objective is **5-Second Glanceability**: allowing parents to answer 8 critical daily questions within 5 seconds of opening the application without manual scrolling:

1. **Which child is selected?** $\rightarrow$ Visible in the top persistent selector bar.
2. **Is my child present today?** $\rightarrow$ High-visibility Attendance Status Pill.
3. **What is happening today?** $\rightarrow$ "Today's Schedule" card with the active period highlighted.
4. **Is any homework pending?** $\rightarrow$ Pending Homework counter chip.
5. **Are examinations approaching?** $\rightarrow$ Countdown badge for next scheduled exam.
6. **Are there outstanding fees?** $\rightarrow$ Outstanding fee balance and due date alert.
7. **Are there school circulars?** $\rightarrow$ Broadcast announcement banner.
8. **Does the parent need to take immediate action?** $\rightarrow$ Priority action callout.

---

## 2. Dynamic Dashboard Mode Switching

The dashboard adapts seamlessly between **Enrolled SIS Mode** and **Admission Applicant Mode**:

```
                       GLOBAL ACTIVE CHILD CONTEXT
                                    │
            ┌───────────────────────┴───────────────────────┐
            ▼                                               ▼
     ENROLLED SIS MODE                            ADMISSION FUNNEL MODE
     (Active Student Selected)                    (Prospective Applicant Selected)
            │                                               │
  1. Header & Parent Greeting                    1. Header & Parent Greeting
  2. Selected Student Bar (Grade 4B)             2. Selected Applicant Bar (Pre-K App #)
  3. Today's Attendance Pill (Present)           3. Application Progress Stepper (Stage 3/9)
  4. Today's Class Schedule (Current Period)     4. Action Required Banner (Upload Docs)
  5. 6-Button Quick Action Grid                  5. Admission Shortcuts (Docs, Fees, Interview)
  6. Academic Summary (Homework & Exams)         6. Application Processing Fee Card
  7. Fee Summary (Balance & Pay Now)             7. Assessment Countdown & Venue
  8. School Circulars & Feed                     8. Admissions Office Announcements
  9. Recent Activity Timeline                    9. Application Milestone Audit Log
```

---

## 3. The 9-Section Dashboard Layout Specification

### Section 1: Top Navigation Header

- **Layout:** Horizontal row, `px-5 py-3`, transparent background.
- **Left:** School institutional crest / logo (`w-8 h-8`) and contextual greeting:
  - Morning (05:00–11:59): _"Good morning, [Parent First Name]"_
  - Afternoon (12:00–16:59): _"Good afternoon, [Parent First Name]"_
  - Evening (17:00–04:59): _"Good evening, [Parent First Name]"_
- **Right:**
  - Notification Bell Icon (`Ionicons name="notifications-outline"`) with unread red badge dot when unread count $>0$. Tapping opens `/(common)/notifications`.
  - Parent Profile Avatar (`w-9 h-9 rounded-full border border-indigo-200`). Tapping switches to the Profile tab.

---

### Section 2: Universal Child Selector Bar

- **Component:** `SelectedChildCard`
- **Visual Design:** Elevated surface card with subtle indigo tint (`bg-indigo-50/60 dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 rounded-2xl p-3.5`).
- **Elements:**
  - **Left Avatar:** Circular photo with status border ring.
  - **Child Details:**
    - If Enrolled: `[Student Full Name]` in bold, subtitle: `Grade 4 - Section B • Roll #14`.
    - If Applicant: `[Applicant Full Name]` in bold, subtitle: `Applying for Grade 1 • App #APP-2026-102`.
  - **Right Action:** "Switch" pill button with chevron down icon (`bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-full font-bold`).
- **Interaction:** Tapping opens `/(main)/home/child-switcher` bottom sheet.

---

### Section 3: Student Daily Overview (Enrolled Mode Only)

- **Component:** `DailyAttendancePill`
- **Visual Presentation:** Prominent horizontal banner displaying real-time attendance status:
  - **Present:** Emerald background (`bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800`), icon: `checkmark-circle`, text: _"Present Today • Marked at 08:15 AM"_.
  - **Absent:** Rose background (`bg-rose-50 text-rose-800`), icon: `alert-circle`, text: _"Marked Absent Today • Please contact school"_.
  - **Late:** Amber background (`bg-amber-50 text-amber-800`), icon: `time`, text: _"Arrived Late at 08:42 AM"_.
  - **Holiday / Weekend:** Sky background (`bg-sky-50 text-sky-800`), icon: `calendar`, text: _"School Holiday • [Holiday Name]"_.
  - **Unmarked (Morning before school starts):** Slate background, text: _"Classes commence at 08:30 AM"_.

---

### Section 4: Today's Schedule & Active Period

- **Component:** `TodayScheduleGlance`
- **Visual Presentation:** Clean horizontal card with period time blocks.
- **Data Display:**
  - Current Period Highlight: Glowing border or indigo accent badge (`Period 3: Mathematics • Room 204 • Mr. Sharma`).
  - Next Upcoming Period: Dimmed subtitle (`Next: Science at 11:15 AM`).
  - If school day is over: _"All 7 classes completed for today."_
- **Action:** Tapping card opens the complete weekly schedule at `/(main)/academics/timetable`.

---

### Section 5: Quick Action Grid

- **Component:** `QuickActionGrid`
- **Visual Design:** 2-row, 3-column balanced icon grid (`grid-cols-3 gap-3`).
- **Action Items & Target Routes:**
  1. **Attendance:** Icon `calendar-outline` (Emerald) $\rightarrow$ `/(main)/academics/attendance`
  2. **Timetable:** Icon `time-outline` (Sky) $\rightarrow$ `/(main)/academics/timetable`
  3. **Homework:** Icon `book-outline` (Purple) $\rightarrow$ `/(main)/academics/homework`
  4. **Pay Fees:** Icon `card-outline` (Amber) $\rightarrow$ `/(main)/finance`
  5. **Report Card:** Icon `ribbon-outline` (Indigo) $\rightarrow$ `/(main)/academics/results`
  6. **Helpdesk:** Icon `chatbubbles-outline` (Rose) $\rightarrow$ `/(main)/communication/helpdesk`
- **Remediation Note:** This directly resolves Phase 1.1 defect `ISSUE-NAV-02` where buttons looped back to the dashboard.

---

### Section 6: Academic Priorities (Homework & Upcoming Exams)

- **Component:** `AcademicPriorityCard`
- **Layout:** Two split cards or segmented pill view:
  - **Homework Card:** Shows count of assignments due tonight/tomorrow (`"2 Assignments Due Tomorrow: Science Worksheet & English Essay"`). Tapping opens homework detail.
  - **Exam Alert Card:** Displayed only when an exam is within 14 days (`"Mid-Term Exams begin in 6 days • English on Monday, Nov 8"`). Tapping opens exam syllabus.

---

### Section 7: Finance Summary Card

- **Component:** `FinanceSummaryWidget`
- **Visual Presentation:** High-contrast card with navy background (`bg-indigo-950 text-white rounded-2xl p-4`).
- **Data Display:**
  - **Outstanding Balance:** Authoritative balance in local currency (e.g., `₹ 24,500`).
  - **Due Date:** Due date countdown chip (`Due in 8 days • Nov 10, 2026`).
  - **Payment CTA:** "Pay Fees" prominent button (`bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl`).
- **Zero Balance State:** When fees are fully settled, the widget renders a tranquil green badge: _"All term dues settled • No pending fees"_.
- **Action:** Tapping opens checkout review at `/(main)/finance/checkout/review`.

---

### Section 8: School Broadcast Announcements

- **Component:** `AnnouncementCarousel`
- **Visual Design:** Horizontally swipeable cards displaying latest 3 official school circulars.
- **Card Content:** Date chip, Department tag (e.g. `Sports`, `Principal's Office`), Title, 1-line snippet, "Read Circular" link.
- **Action:** Tapping opens `/(main)/communication/circulars/[id]`.

---

### Section 9: Recent Activity & Audit Log

- **Component:** `RecentActivityList`
- **Visual Design:** Clean vertical timeline of recent updates for the family:
  - _"Bus 14 departed school at 03:15 PM"_ (15 mins ago)
  - _"Science homework assigned by Ms. Roy"_ (2 hours ago)
  - _"Term 2 fee receipt generated"_ (Yesterday)

---

## 4. Strict Data Honesty Rules (Zero Fabricated Data)

To uphold the core design principles:

1. **Never Show Placeholder Numbers:** If the backend does not return an attendance percentage or exam rank, the widget displays: _"Data will be updated following term evaluations"_, rather than mock numbers like `88%` or `Rank #4`.
2. **Handle Empty Class Schedule:** On weekends or declared vacations, the schedule widget gracefully displays: _"No classes scheduled for today (Weekend)"_.
3. **Handle Unlinked Parent Account:** If a logged-in parent has zero linked students and zero applicants, the dashboard suppresses Sections 3–7 and renders an onboarding invitation:
   ```
   [ Icon: Family Shield ]
   "Welcome to EduTrack ERP"
   "Link your enrolled child using your Admission Number, or begin a new admission application."
   [ Button: Link Enrolled Student ]  [ Button: Apply for Admission ]
   ```
