# EduTrack ERP — Parent Mobile App

# Phase 3 — Wave 1: Known Limitations & Blockers

## 1. Intentional Wave Boundaries (Waves 2–5 Scope)

In compliance with the Phase 3 implementation roadmap, Wave 1 strictly encompasses **Foundation, Navigation & Universal Child Switcher**. The following modules remain stubbed or preview screens pending their designated waves:

1. **Wave 2 — Academics Hub (`/(main)/academics`)**:
   - Detailed attendance calendar, term-wise percentage breakdowns, subject-wise attendance.
   - Weekly timetable grid with interactive period details and room numbers.
   - Homework submission interface, attachment viewer, teacher feedback.
   - Examination schedules, marks sheets, and PDF report card downloads.
2. **Wave 3 — Finance & Fee Management (`/(main)/finance`)**:
   - Itemized fee structure breakdowns and historical invoice ledgers.
   - Direct payment gateway SDK checkout integration (Razorpay / Stripe).
   - Instant receipt download and PDF sharing.
3. **Wave 4 — Communication & Updates Feed (`/(main)/communication`)**:
   - Category-filtered circulars and notice boards.
   - Direct messaging channels between parents and homeroom teachers.
   - School event calendar and permission slip confirmations.
4. **Wave 5 — Profile, Settings & Multi-Campus Hardening (`/(main)/profile`)**:
   - Biometric authentication toggles (Face ID / Fingerprint).
   - Multi-campus switching for parents with children in different branches.
   - Comprehensive offline caching and background synchronization.

---

## 2. Backend Contract & Infrastructure Limitations

Due to the **Stage-1 Database & Backend Freeze**, several mobile capabilities remain constrained by the current backend contract:

### 2.1. Missing Student SIS Endpoints

- **Constraint**: The backend currently possesses full CRUD for `AdmissionApplication` and parent auth, but lacks dedicated aggregation endpoints for daily student attendance, today's schedule, and pending homework.
- **Impact on Wave 1**: The adaptive dashboard displays truthful empty states ("No upcoming classes scheduled", "No outstanding dues recorded") rather than fabricated mock data.
- **Mitigation for Wave 2**: Backend engineers should implement read queries `GET /v1/students/:id/attendance/summary` and `GET /v1/students/:id/timetable/today`.

### 2.2. Forgot Password Endpoint Missing

- **Constraint**: The mobile app contains a complete UI for `/(auth)/forgot-password`, but the backend route `POST /v1/auth/forgot-password` is not yet available.
- **Impact**: Parents who forget passwords must contact school administrators directly for account resets.

### 2.3. Native Push Notification Credentials

- **Constraint**: Push notifications are simulated/polled via REST API in development because APNs and FCM production server keys are not registered during the freeze.
- **Impact**: Push delivery relies on active in-app foreground polling until native production credentials are configured during deployment.

---

## 3. Platform & Development Tooling Notes

### Windows Expo Router Type Generation

- **Observation**: Running Expo CLI or Jest on Windows generates `.expo/types/router.d.ts` with unescaped backslashes (`\`) for file paths.
- **Impact**: Causes TypeScript compilation (`tsc --noEmit`) to throw TS1127/TS1109 syntax errors on the generated typing file.
- **Resolution**: A sanitized `.expo/types/router.d.ts` using clean forward slashes (`/`) was established. A pre-commit or post-generation sanitization script is recommended for Windows development environments.
