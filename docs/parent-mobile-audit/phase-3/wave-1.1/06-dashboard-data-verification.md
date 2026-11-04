# EduTrack ERP — Parent Mobile App

# Phase 3 — Wave 1.1: Dashboard Data Verification & Zero Fake Data Audit

## 1. Zero Fake Production Data Policy

In strict accordance with Section 6 of the stabilization directive:

- No fake production records.
- No fabricated attendance percentages, fee balances, examination results, or schedules.
- Preview screens must be explicitly designated as previews, not completed functional modules.

During the Wave 1.1 audit, every dashboard widget was inspected, and all default mock values were completely eliminated.

---

## 2. Widget-by-Widget Audit & Data Source Matrix

| Widget Component             | Data Source                                                         | Empty / Fallback State                                                                    |                                            Verified Behavior                                             |
| :--------------------------- | :------------------------------------------------------------------ | :---------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------: |
| **`DailyAttendancePill`**    | `activeChild.attendanceToday` (from backend student record)         | _"Attendance not yet marked for today"_                                                   | **CLEAN** — Removed hardcoded _"Present at 08:15 AM"_ default. Shows real status or honest pending pill. |
| **`TodayScheduleGlance`**    | `currentClass` prop (to be supplied by Wave 2 Timetable API)        | _"Timetable synchronization is in progress. Tap Full Timetable for the weekly schedule."_ |    **CLEAN** — Removed hardcoded _"Period 3 General Science Dr. Rao"_. Real weekend check preserved.     |
| **`QuickActionGrid`**        | Static navigation routes (`ROUTES.MAIN.*`)                          | N/A — Direct button matrix                                                                |                     **CLEAN** — Navigates to active canonical tabs and deep routes.                      |
| **`AcademicPriorityCard`**   | `pendingAssignmentsCount`, `upcomingExamNotice`                     | _"No pending assignments or urgent academic alerts for today."_                           |            **CLEAN** — Removed hardcoded _"Math Chapter 4"_ and _"Mid-Term Exams on Nov 10"_.            |
| **`FinanceSummaryWidget`**   | `activeChild.hasPendingFees`, `activeChild.pendingFeeAmount`        | _"Fee Status • All Dues Settled — No outstanding term fees recorded"_                     |    **CLEAN** — Removed hardcoded _"₹25,000 Due Nov 15"_. Displays settled banner or pending invoice.     |
| **`AnnouncementCarousel`**   | `announcements` prop (bound to notification feed)                   | _"No active school circulars or announcements at this time."_                             |                **CLEAN** — Removed hardcoded sports day and winter uniform announcements.                |
| **`ApplicantDashboardView`** | `ApplicantChild` properties (from `GET /v1/applications?mine=true`) | Honest status stepper based on backend `status` enum                                      |                 **CLEAN** — 100% real data from parent's actual submitted applications.                  |
| **`UnlinkedOnboardingView`** | Rendered when `useChildStore.selectedChild === null`                | Zero-child onboarding guidance                                                            |                    **CLEAN** — Directs parent to application wizard or admin linkage.                    |

---

## 3. Detailed Sanitization Evidence

### 3.1. `DailyAttendancePill.tsx`

- **Before**: Defaulted to `status = 'present'` and `timestamp = '08:15 AM'`. If no attendance record existed in the database, the UI falsely claimed the student was present at 8:15 AM.
- **After**: Defaults to `status = 'unmarked'`. Displays a slate status badge reading: _"Attendance not yet marked for today"_.

### 3.2. `TodayScheduleGlance.tsx`

- **Before**: When weekday was true, unconditionally rendered a hardcoded physics class with Dr. Rao in Room 204.
- **After**: Checks `currentClass` prop. If no live period is active, renders an informational banner: _"Timetable synchronization is in progress. Tap Full Timetable for the weekly schedule."_.

### 3.3. `AcademicPriorityCard.tsx`

- **Before**: Hardcoded "2 Assignments Due This Week" and "Upcoming Term Assessment on Nov 10".
- **After**: Checks `pendingAssignmentsCount` and `upcomingExamNotice`. When 0, displays: _"No pending assignments or urgent academic alerts for today."_.

### 3.4. `FinanceSummaryWidget.tsx`

- **Before**: Hardcoded `amount = 25000` and `dueDate = 'Nov 15, 2026'`.
- **After**: If `hasPendingFees` is false or amount is 0, displays an emerald _"All Dues Settled"_ badge. If fees are pending but amount is uncalculated, displays _"Pending Invoice"_, never inventing an arbitrary fee sum.

### 3.5. `AnnouncementCarousel.tsx`

- **Before**: Hardcoded three fake announcements (Annual Sports Day, Science Exhibition, Winter Uniform).
- **After**: Defaults to empty array `[]`. When empty, renders: _"No active school circulars or announcements at this time."_.

---

## 4. Wave 2–5 Preview Screen Designation

All secondary tab screens created in Wave 1 are clearly marked as **Module Previews**:

- `app/(main)/academics/index.tsx`: Features a prominent _"Wave 2 Preview — Academics Hub under active development"_ banner.
- `app/(main)/communication/index.tsx`: Features a prominent _"Wave 4 Preview — Communication Hub under active development"_ banner.
- `app/(main)/finance/index.tsx`: Features a prominent _"Wave 3 Preview — Finance Hub under active development"_ banner.

None of these preview screens claim to be completed functional implementations.
