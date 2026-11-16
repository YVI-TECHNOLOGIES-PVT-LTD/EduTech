# EduTrack ERP — Parent Mobile App

# Phase 3 Verification Report: 03 — Dashboard & Widget API Verification

## 1. Executive Summary

This report verifies the Home Dashboard view engine (`apps/mobile_app/app/(main)/home/index.tsx`) and traces every dashboard widget to its backend API endpoint, store, or fallback state across all three supported modes.

---

## 2. Verification of Dashboard Modes

### A. Mode 1: Enrolled Student Cockpit (`kind === 'enrolled'`)

Triggered when the selected child is an enrolled student (`activeChild.kind === 'enrolled'`).

| Widget                 | Data Source / Store Binding                                  | Backend Endpoint                         | Actual Data vs Fallback Status | Finding / Metric Audit                                                                                              |
| ---------------------- | ------------------------------------------------------------ | ---------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `DailyAttendancePill`  | `activeChild.attendanceToday` in `child.store.ts`            | `/v1/parents/:id/students`               | **FABRICATED METRIC FOUND**    | `child.store.ts` (L124, L177) defaults to `{ status: 'present', timestamp: '08:15 AM' }` when backend returns null! |
| `TodayScheduleGlance`  | No props passed in `home/index.tsx`                          | None (Unmounted)                         | Honest Empty State             | Shows: "Timetable synchronization is in progress. Tap Full Timetable for the weekly schedule."                      |
| `QuickActionGrid`      | Static navigation mapping                                    | Client routing                           | Client Navigation              | Routes to Academics, Finance, and Helpdesk correctly.                                                               |
| `AcademicPriorityCard` | No props passed in `home/index.tsx`                          | None (Unmounted)                         | Honest Empty State             | Shows: "No pending assignments or urgent academic alerts for today."                                                |
| `FinanceSummaryWidget` | `activeChild.hasPendingFees`, `activeChild.pendingFeeAmount` | `/v1/fees/my` via `ParentFinanceService` | **REAL BACKEND INTEGRATION**   | Displays real balance from billing ledger or "All Dues Settled".                                                    |
| `AnnouncementCarousel` | No props passed in `home/index.tsx`                          | `notificationsApi` (not wired to props)  | Honest Empty State             | Shows: "No active school circulars or announcements at this time."                                                  |

### B. Mode 2: Admission Applicant Tracking (`kind === 'applicant'`)

Triggered when the selected child is an applicant (`activeChild.kind === 'applicant'`).

| Element                | Data Source / Store Binding               | Backend Endpoint                     | Actual Data vs Fallback Status | Finding / Metric Audit                            |
| ---------------------- | ----------------------------------------- | ------------------------------------ | ------------------------------ | ------------------------------------------------- |
| Application Number     | `activeChild.applicationNumber`           | `GET /v1/applications?mine=true`     | **REAL BACKEND DATA**          | Maps from `app.application_number`                |
| Progress Bar           | `activeChild.progressPercentage`          | Client calculation from `app.status` | Calculated                     | Mapped cleanly (Draft: 10%, Submitted: 25%, etc.) |
| Milestone Stepper      | Derived from `app.status`                 | `GET /v1/applications?mine=true`     | Calculated                     | Real status mapped to 5 milestones                |
| Action Required Banner | `activeChild.actionRequiredNotice`        | `GET /v1/applications?mine=true`     | Dynamic                        | Set when documents or fees are pending            |
| Checklist Links        | Routes to `/(parent)/applications/[id]/*` | Preserved routes                     | Preserved routes               | All 9 sub-routes operational                      |

### C. Mode 3: Unlinked Parent Onboarding (`activeChild == null`)

Triggered when no children or applications exist for the account.

| Element                        | Description                      | Action Trigger                                 | Finding                           |
| ------------------------------ | -------------------------------- | ---------------------------------------------- | --------------------------------- |
| Welcome Card                   | "Welcome to EduTrack Family Hub" | Informational                                  | Clear, dignified onboarding state |
| "Link Enrolled Student"        | Action button                    | Opens support prompt                           | Placeholder prompt                |
| "Submit Admission Application" | Action button                    | `router.push('/(parent)/applications/wizard')` | Functional navigation             |

---

## 3. Fabricated Data & Metric Audit

### Critical Finding: Fabricated Attendance State in `child.store.ts`

In `apps/mobile_app/src/stores/child.store.ts`:

- **Line 124–127**:
  ```typescript
  attendanceToday: s.attendance_today || {
    status: 'present',
    timestamp: '08:15 AM',
  },
  ```
- **Line 177–180**:
  ```typescript
  attendanceToday: {
    status: 'present',
    timestamp: '08:15 AM',
  },
  ```
- **Audit Conclusion**: Because `s.attendance_today` is not returned by the backend `GET /v1/parents/:id/students` or `GET /v1/fees/my` endpoints, the store automatically injects a fabricated status of `'present'` at `'08:15 AM'`. This gives parents the false impression that daily attendance has been recorded even when no classroom roll call exists in the database.
- **Required Remediation**: When `attendance_today` is absent from the backend response, `attendanceToday` must either be `null` or `{ status: 'unmarked' }`, allowing `DailyAttendancePill` to display an honest "Not yet marked" status.

---

## 4. Summary Verdict

| Dashboard Feature             | Verdict                             | Notes                                                 |
| ----------------------------- | ----------------------------------- | ----------------------------------------------------- |
| Enrolled Cockpit Layout       | VERIFIED — FRONTEND FUNCTIONALITY   | Full UI layout responsive with dark mode              |
| Enrolled Finance Widget       | VERIFIED — REAL BACKEND INTEGRATION | Backed by `ParentFinanceService.getMyChildrenFees`    |
| Daily Attendance Pill         | **FAILED**                          | Injects fabricated `'present'` status at `'08:15 AM'` |
| Today's Schedule & Priorities | VERIFIED — FRONTEND FUNCTIONALITY   | Displays honest empty states (no fake classes)        |
| Applicant Tracking Mode       | VERIFIED — REAL BACKEND INTEGRATION | Backed by `GET /v1/applications?mine=true`            |
| Unlinked Onboarding Mode      | VERIFIED — FRONTEND FUNCTIONALITY   | Clean, honest onboarding state                        |
