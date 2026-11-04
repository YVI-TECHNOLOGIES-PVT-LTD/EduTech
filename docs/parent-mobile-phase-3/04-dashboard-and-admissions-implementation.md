# EduTrack ERP — Parent Mobile App

# Phase 3 — Dashboard & Admissions Implementation Report

## 1. Adaptive Dashboard View Engine (`apps/mobile_app/app/(main)/home/index.tsx`)

The Home Dashboard dynamically branches into three specialized user experiences based on the selected child state:

```
                         Active Child Context
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
         ▼                        ▼                        ▼
  [activeChild == null]   [kind == 'applicant']   [kind == 'enrolled']
         │                        │                        │
         ▼                        ▼                        ▼
UnlinkedOnboardingView   ApplicantDashboardView   Enrolled SIS Cockpit
  • Welcome Banner        • Funnel Progress Bar     • Daily Attendance Pill
  • Add Child Action      • Milestone Stepper       • Today's Schedule Glance
  • Link Enrolled Ward    • Action Notice Banner    • Quick Action Grid
  • Support Shortcut      • Documents Checklist     • Academic Priority Card
                          • Admission Fee Shortcut  • Finance Summary Widget
                                                    • School Circulars
```

---

## 2. Enrolled Student SIS Cockpit

For parents viewing an enrolled student:

1. **Daily Attendance Pill**:
   - Shows today's roll-call status (`present` emerald, `absent` red, `late` amber, `holiday` slate).
   - Tapping redirects to `/(main)/academics` with Attendance tab pre-selected.
2. **Today's Schedule Glance**:
   - Displays current period with active pulsing indicator, time range, subject, room, and instructor.
   - Weekend detection: gracefully shows "No academic classes scheduled for today (Weekend)."
3. **Quick Action Grid**:
   - 6 quick tiles: Attendance, Timetable, Homework, Pay Fees, Report Card, Helpdesk.
4. **Academic Priority Card**:
   - Shows upcoming examination dates and pending homework tasks due within 48 hours.
5. **Finance Summary Widget**:
   - Displays real outstanding tuition dues or "All Dues Settled" badge.
6. **School Circulars Carousel**:
   - Displays recent campus announcements with category badges.

---

## 3. Applicant Child Dashboard Experience

For parents tracking a prospective admission:

1. **Application Funnel Progress**:
   - Visual progress bar calculated dynamically:
     - `DRAFT`: 10%
     - `SUBMITTED`: 25%
     - `DOCUMENTS_PENDING`: 40%
     - `UNDER_REVIEW`: 55%
     - `ASSESSMENT_SCHEDULED`: 70%
     - `FEE_PENDING`: 85%
     - `OFFER_ACCEPTED`: 100%
2. **Milestone Stepper**:
   - 5-step milestone audit: Submission → Verification → Assessment → Fee Payment → Enrollment.
3. **Action Required Notice**:
   - Highlights pending documents or outstanding admission fees.
4. **Direct Admission Routing**:
   - "View Application Cockpit" → `/(parent)/applications/[id]`.

---

## 4. Preservation of Admission Sub-Routes (100% Intact)

All 9 admission tracker routes in `apps/mobile_app/app/(parent)/` remain fully operational and preserved:

1. `applications.tsx`: Full list of submitted and draft applications.
2. `applications/wizard.tsx`: 6-step multi-step admission application form.
3. `applications/[id]/index.tsx`: Application status overview and details.
4. `applications/[id]/assessment.tsx`: Interview schedule, date, time, and instructions.
5. `applications/[id]/decision.tsx`: Offer letter acceptance or rejection workflow.
6. `applications/[id]/documents.tsx`: Document upload, file preview, and signed URLs.
7. `applications/[id]/fees.tsx`: Admission registration fee breakdown and payment.
8. `applications/[id]/receipt.tsx`: Downloadable PDF receipt for admission payments.
9. `applications/[id]/timeline.tsx`: Funnel milestone chronological audit log.
