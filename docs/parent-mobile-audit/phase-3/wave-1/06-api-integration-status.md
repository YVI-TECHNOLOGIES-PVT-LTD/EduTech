# EduTrack ERP — Parent Mobile App

# Phase 3 — Wave 1: API Integration Status

## 1. Existing Backend Endpoints Utilized in Wave 1

Wave 1 leverages existing, verified backend APIs without introducing any schema modifications, DDL changes, or custom endpoint inventions.

| Endpoint                      | HTTP Method | Service / Client                | Purpose in Wave 1                                                  |
| :---------------------------- | :---------- | :------------------------------ | :----------------------------------------------------------------- |
| `/v1/parents/:id/students`    | `GET`       | `studentsApi` / `child.store`   | Fetches active enrolled children for the authenticated parent      |
| `/v1/admissions/applications` | `GET`       | `admissionsApi` / `child.store` | Fetches prospective admission applications submitted by the parent |
| `/v1/auth/login`              | `POST`      | `AuthService`                   | Authenticates parent and retrieves JWT tokens                      |
| `/v1/auth/refresh`            | `POST`      | `AuthService`                   | Refreshes expired access tokens                                    |
| `/v1/auth/logout`             | `POST`      | `AuthService`                   | Revokes session and triggers `useChildStore.reset()`               |
| `/v1/notifications`           | `GET`       | `notificationsApi`              | Fetches system announcements and notifications                     |
| `/v1/notifications/:id/read`  | `PATCH`     | `notificationsApi`              | Marks notifications as read                                        |

---

## 2. Data Mapping Contracts

### 2.1. Backend Student -> `EnrolledChild`

When calling `GET /v1/parents/:id/students`, each student record is mapped to the `EnrolledChild` discriminated union variant:

```typescript
{
  id: student.id,
  kind: 'enrolled',
  studentId: student.id,
  firstName: student.first_name,
  lastName: student.last_name,
  fullName: `${student.first_name} ${student.last_name}`.trim(),
  photoUrl: student.profile_photo_url || null,
  admissionNumber: student.admission_number,
  rollNumber: student.roll_number || null,
  grade: student.grade?.name || student.class_name || 'N/A',
  section: student.section?.name || student.section_name || 'A',
  academicYearId: student.academic_year_id,
  campusId: student.campus_id,
  status: student.status || 'ACTIVE'
}
```

### 2.2. Backend Application -> `ApplicantChild`

When calling `GET /v1/admissions/applications`, each application record is mapped to the `ApplicantChild` variant:

```typescript
{
  id: app.id,
  kind: 'applicant',
  applicationId: app.id,
  applicationNumber: app.application_number,
  firstName: app.student_first_name || app.applicant_name,
  lastName: app.student_last_name || '',
  fullName: `${app.student_first_name} ${app.student_last_name || ''}`.trim(),
  photoUrl: app.student_photo_url || null,
  targetGrade: app.grade_applying_for || app.grade_name || 'N/A',
  academicYear: app.academic_year || '2026-2027',
  applicationStatus: app.status || 'SUBMITTED',
  submittedAt: app.submitted_at || app.created_at
}
```

---

## 3. Unimplemented Backend Contracts & Stage-1 Freeze Boundary

In adherence to the **Stage-1 Freeze** (`.agents/AGENTS.md` and Phase 2 blueprint):

1. **No Backend Code or Database Schemas Were Touched**:
   - `schema.prisma` was neither modified nor migrated.
   - No backend routes or controllers were altered.
2. **Identified Missing SIS APIs (Deferred to Waves 2 & 3 Backend Sprints)**:
   - `GET /v1/students/:id/attendance/summary`: Daily and term-level attendance aggregations.
   - `GET /v1/students/:id/timetable/today`: Day-specific timetable schedule with periods.
   - `GET /v1/students/:id/homework/pending`: Priority homework and assignment dues.
   - `GET /v1/students/:id/finance/dues-summary`: Outstanding fee balances and next payment dates.
3. **Resilience Strategy**:
   - Until these dedicated SIS endpoints are implemented on the backend in subsequent waves, the Wave 1 UI displays honest empty/placeholder states or gracefully degrades without crashing or throwing unhandled rejections.
