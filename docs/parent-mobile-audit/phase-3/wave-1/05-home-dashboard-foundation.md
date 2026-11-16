# EduTrack ERP — Parent Mobile App

# Phase 3 — Wave 1: Home Dashboard Foundation

## 1. Adaptive Dashboard Architecture

The Home Dashboard located at [`apps/mobile_app/app/(main)/home/index.tsx`](<file:///c:/Users/user/Documents/GitHub/EduTech/apps/mobile_app/app/(main)/home/index.tsx>) serves as the primary operational surface for parents. Rather than presenting a static or generic screen, the dashboard adapts dynamically based on the active child selected in `useChildStore`:

```text
                           ┌─────────────────────────┐
                           │   useChildStore.state   │
                           │      selectedChild      │
                           └────────────┬────────────┘
                                        │
             ┌──────────────────────────┼──────────────────────────┐
             ▼                          ▼                          ▼
      [selectedChild is          [selectedChild is          [selectedChild is
       EnrolledChild]             ApplicantChild]                 null]
             │                          │                          │
             ▼                          ▼                          ▼
   Enrolled SIS Dashboard     Applicant Tracking View     Unlinked Onboarding View
   - Attendance Pill          - Application Stepper       - Welcome Greeting
   - Today's Schedule         - Document Checklist        - "Submit New Application"
   - Quick Action Grid        - Fee Payment CTA           - "Link Enrolled Student"
   - Academic Priority        - Track Status CTA
   - Finance Summary Widget
   - Circulars Carousel
```

---

## 2. Enrolled Student Experience (Mode 1)

When an active enrolled student is selected, the dashboard provides a high-efficiency SIS cockpit:

### Implemented Dashboard Widgets

1. **Header & Context (`SelectedChildCard.tsx`)**:
   - Displays greeting ("Welcome, {ParentName}"), notification bell with badge, and the active student banner with child switcher.
2. **Attendance Glance (`DailyAttendancePill.tsx`)**:
   - Shows today's live status (e.g., "Present", "Late", "Absent") and overall term attendance percentage (e.g., "94.5%").
3. **Today's Schedule Glance (`TodayScheduleGlance.tsx`)**:
   - Displays current period and next upcoming classes for the day.
   - Includes truthful empty state: _"No classes scheduled for today"_ when no timetable data is available.
4. **Quick Action Grid (`QuickActionGrid.tsx`)**:
   - 6 high-frequency actions linking directly to active routes:
     - **Pay Fees**: Routes to `ROUTES.MAIN.FINANCE` (`/(main)/finance`).
     - **Attendance**: Routes to `ROUTES.MAIN.ACADEMICS` (`/(main)/academics`).
     - **Timetable**: Routes to `ROUTES.MAIN.ACADEMICS` (`/(main)/academics`).
     - **Homework**: Routes to `ROUTES.MAIN.ACADEMICS` (`/(main)/academics`).
     - **Exams & Report**: Routes to `ROUTES.MAIN.ACADEMICS` (`/(main)/academics`).
     - **Announcements**: Routes to `ROUTES.MAIN.COMMUNICATION` (`/(main)/communication`).
5. **Academic Priority Card (`AcademicPriorityCard.tsx`)**:
   - Highlights pending homework items due today/tomorrow and upcoming examination dates.
   - Fallback empty state: _"All assignments up to date!"_.
6. **Finance Summary Widget (`FinanceSummaryWidget.tsx`)**:
   - Summarizes outstanding fees due this cycle with a prominent "Pay Now" button routing to `ROUTES.MAIN.FINANCE`.
   - Fallback state: _"No pending dues. All payments are up to date."_.
7. **School Announcements Carousel (`AnnouncementCarousel.tsx`)**:
   - Horizontal scrolling carousel highlighting recent school circulars and events.

---

## 3. Admission Applicant Experience (Mode 2)

When an applicant child is selected, the dashboard delegates to [`ApplicantDashboardView.tsx`](file:///c:/Users/user/Documents/GitHub/EduTech/apps/mobile_app/src/components/dashboard/ApplicantDashboardView.tsx):

- **Application Header**: Shows Application Number, Target Grade, and Academic Year.
- **Application Progress Stepper**: Visual stepper tracking milestones:
  1. _Submitted_
  2. _Document Verification_
  3. _Assessment / Interview_
  4. _Decision & Offer_
  5. _Admission Fee Payment_
- **Action Checklist**:
  - **Upload Pending Documents**: Quick access to existing route `/(parent)/applications/[id]/documents`.
  - **Pay Application / Admission Fee**: Quick access to existing route `/(parent)/applications/[id]/fees`.
  - **View Official Receipt**: Quick access to existing route `/(parent)/applications/[id]/receipt`.
  - **Complete Timeline**: Quick access to existing route `/(parent)/applications/[id]/timeline`.

---

## 4. Unlinked Onboarding Experience (Mode 3)

When a parent logs in with zero children and zero applications linked, the dashboard presents [`UnlinkedOnboardingView.tsx`](file:///c:/Users/user/Documents/GitHub/EduTech/apps/mobile_app/src/components/dashboard/UnlinkedOnboardingView.tsx):

- Displays friendly onboarding hero illustrations.
- **Primary Action**: "Submit Admission Application" -> Routes directly to `/(parent)/applications/wizard`.
- **Secondary Action**: "Link Enrolled Student" -> Directs parent to contact the school administration desk.

---

## 5. Zero Fake Data Policy

In strict accordance with workspace rules and Phase 2 directives:

- **No mock SIS data is fabricated**: We do not generate fake grades, fake attendance percentages, or dummy homework items.
- All widgets gracefully handle empty or undefined backend data by presenting honest, dignified empty states with clear informational copy.
