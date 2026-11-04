# EduTrack ERP — Parent Mobile App

# Phase 3 Verification Report: 04 — Academics Integration Verification

## 1. Executive Summary

This report evaluates the Academics module (`apps/mobile_app/app/(main)/academics/index.tsx`, `useAcademicsStore`, and `academicsApi`) against actual backend API routes, services, RBAC authorization, and Prisma models.

---

## 2. Feature-by-Feature Integration Audit

| Academics Feature          | Mobile API Method                         | Endpoint Declared in `endpoints.ts`    | Backend Route Mounted?  | Backend Controller / Service                                                                         | RBAC Permission Status                                                              | Prisma Model in `schema.prisma`?    | Verification Verdict |
| -------------------------- | ----------------------------------------- | -------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------- | -------------------- |
| **Attendance Summary**     | `academicsApi.getAttendance`              | `/v1/students/:id/attendance/summary`  | **NO** (Unmounted)      | `AttendanceController.getSummary` in `attendance.routes.ts` exists but is NOT mounted in `routes.ts` | Requires `attendance.verify` (NOT granted to `PARENT` role in `rbac.middleware.ts`) | `student_attendance` does NOT exist | **BLOCKED**          |
| **Attendance Timeline**    | `academicsApi.getAttendance`              | `/v1/students/:id/attendance/timeline` | **NO** (Unmounted)      | `AttendanceController.getTimeline` in `attendance.routes.ts` unmounted                               | Requires `attendance.verify` (NOT granted to `PARENT`)                              | Does not exist                      | **BLOCKED**          |
| **Weekly Timetable**       | `academicsApi.getTimetable`               | `/v1/students/:id/timetable/week`      | **NO** (Does not exist) | None                                                                                                 | None                                                                                | `class_timetables` does NOT exist   | **UI ONLY**          |
| **Homework List**          | `academicsApi.getHomework`                | `/v1/students/:id/homework`            | **NO** (Does not exist) | None                                                                                                 | None                                                                                | `student_homework` does NOT exist   | **UI ONLY**          |
| **Homework Submission**    | `useAcademicsStore.markHomeworkSubmitted` | None (Local store mutation only)       | **NO**                  | None                                                                                                 | None                                                                                | Does not exist                      | **UI ONLY**          |
| **Exam Schedule**          | `academicsApi.getExams`                   | `/v1/students/:id/exams`               | **NO** (Does not exist) | None (Only applicant entrance tests exist)                                                           | None                                                                                | Enrolled exam model does NOT exist  | **UI ONLY**          |
| **Report Cards / Results** | `academicsApi.getReportCard`              | `/v1/students/:id/results`             | **NO** (Does not exist) | None                                                                                                 | None                                                                                | Term results model does NOT exist   | **UI ONLY**          |

---

## 3. Deep-Dive Technical Findings

### Finding A: Unmounted Attendance Router in Backend

In `apps/backend/src/modules/student/attendance.routes.ts`, an `attendanceRouter` is defined with endpoints:

- `GET /summary/:studentId` (Line 85)
- `GET /timeline/:studentId` (Line 90)

However, an inspection of `apps/backend/src/routes.ts` and `apps/backend/src/app.ts` confirms that **`attendanceRouter` is never imported or mounted** in Express router! Any HTTP request to `/v1/attendance/...` or `/v1/students/.../attendance` returns a `404 Not Found`.

### Finding B: Parent Role Missing Attendance RBAC Permissions

In `apps/backend/src/rbac/rbac.middleware.ts` (lines 87–98):

```typescript
if (
  roles.includes('PARENT') &&
  [
    'admission.view_own',
    'admission.create',
    'admission.application.create',
    'admission.application.update',
    'admission.application.view_own',
    'admission.application.view',
  ].includes(requiredPermission)
) {
  return next();
}
```

The endpoints in `attendance.routes.ts` are guarded by `checkPermission('attendance.verify')`.
Even if `attendanceRouter` were mounted, any request with a Parent JWT token would be rejected with `403 Forbidden` because `attendance.verify` is not assigned to the `PARENT` role.

### Finding C: Complete Absence of Backend Timetable, Homework, and Examination Modules

A search across all backend files in `apps/backend/src/` confirms that:

- There is no Timetable controller, service, or route.
- There is no Homework or Assignment controller, service, or route.
- There is no Enrolled Student Examination or Report Card controller, service, or route.
- `schema.prisma` does not have tables for timetables, homework, or term results.

### Finding D: Frontend Resiliency vs Backend Integration

In `apps/mobile_app/src/api/academics.api.ts`, all API calls wrap network requests in `try / catch` blocks:

```typescript
try {
  const res = await apiClient.get<any>(ENDPOINTS.ACADEMICS.ATTENDANCE_SUMMARY(studentId));
  if (res?.data) return res.data;
} catch {
  // Graceful fallback to default empty attendance representation
}
return { totalDays: 0, presentDays: 0, absentDays: 0, lateDays: 0, percentage: 0, records: [] };
```

Because the backend endpoints return 404, the catch blocks trigger, returning empty arrays and zero metrics. The mobile UI then renders clean empty states ("No daily records recorded for this term yet", "No classroom periods scheduled", "No pending homework assignments").

While this is excellent defensive engineering that prevents app crashes, **it cannot be classified as a verified backend integration**.

---

## 4. Summary Verdict

| Capability            | Verdict                           | Notes                                                                   |
| --------------------- | --------------------------------- | ----------------------------------------------------------------------- |
| Academics Hub Screen  | VERIFIED — FRONTEND FUNCTIONALITY | Full 4-tab UI with filters, day selector, and interactive states        |
| Attendance Tracking   | **BLOCKED**                       | Router unmounted in backend; RBAC blocks parent role                    |
| Timetable Engine      | **UI ONLY**                       | No backend routes, controllers, or database models                      |
| Homework & Submission | **UI ONLY**                       | No backend routes or models; submission only alters local Zustand state |
| Exams & Report Cards  | **UI ONLY**                       | No backend routes or models for enrolled student terms                  |
