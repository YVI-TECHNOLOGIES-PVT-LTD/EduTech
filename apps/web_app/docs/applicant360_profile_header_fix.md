# EduTrack ERP — Applicant 360 Profile Header Crash Resolution Report

## 1. Executive Summary

This report documents the forensic investigation and resolution of the ProfileHeader runtime crash (`Uncaught TypeError: can't access property "charAt", applicant.name is undefined`) occurring when a parent clicks "View Status" on `/app/admissions/my` to open `/app/admissions/:applicationId`.

The root cause was identified as a **View-Model Data Mapping Omission**:
1. When calling `GET /v1/applications/:id`, the backend returns an `ApplicationResponseDto` containing student information nested inside `app.lead.student_name` (or `app.lead.student_first_name` + `app.lead.student_last_name`), while root `app.student_name` may be omitted.
2. `mapApplicant360View` in `applicant360.mapper.ts` directly assigned `name: app.student_name`, resulting in `applicant.name = undefined`.
3. `ProfileHeader.tsx` line 23 directly executed `{applicant.name.charAt(0)}` without defensive guards, triggering a fatal JS runtime crash.

---

## 2. Root Cause & Forensic Trace

### Call Pipeline
```text
Backend API Response (ApplicationResponseDto)
       │ (contains app.lead.student_name / app.lead.student_first_name)
       ▼
admission.api.ts
       │
       ▼
useApplication / useApplicant360
       │
       ▼
applicant360.mapper.ts
       │ (mapped name: app.student_name -> resulted in undefined)
       ▼
Applicant360Profile
       │
       ▼
ProfileHeader.tsx (executed applicant.name.charAt(0) -> CRASH)
```

---

## 3. Data Contract Resolution

A robust name resolver `deriveStudentName` was introduced in `applicant360.mapper.ts` to inspect all possible data sources in hierarchical order:
1. `app.student_name` (if non-empty and not `'N/A'`)
2. `app.lead.student_name` / `app.leads.student_name`
3. `[app.lead.student_first_name, app.lead.student_last_name].join(' ')`
4. `app.applicant.full_name`
5. `app.applicantName`
6. Fallback default: `'Applicant'`

---

## 4. Defensive UI Safeguards Implemented

In [`ProfileHeader.tsx`](file:///C:/Users/DELL/Desktop/EduTech/apps/web_app/src/modules/admission/components/profile360/ProfileHeader.tsx):
- Derived `displayName = applicant?.name?.trim() || 'Applicant'`.
- Derived `initials` safely:
  ```ts
  const initials = displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'A';
  ```
- Guarded `getStatusStyle` and `statusText` to prevent `undefined` string property access crashes.

---

## 5. Previous 409 & Performance Safeguards Preserved

- Downstream 409 Conflict business states remain non-fatal.
- Primary application lookup errors remain fatal.
- Stable memoization in `useApplicant360` preserved; zero request storms.
- Parent security isolation and JWT auth guards intact.

---

## 6. Verification Summary

- **Backend Typecheck**: Exit Code 0 (PASS)
- **Backend Build (`tsc`)**: Exit Code 0 (PASS)
- **Frontend Typecheck**: Exit Code 0 (PASS)
- **Frontend Build (`vite build`)**: Exit Code 0 (PASS)
- **Database / Schema / DDL / Migration Changes**: 0
