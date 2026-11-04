# Phase 2 Blueprint: API & Data Integration Matrix

**Document Reference:** `docs/parent-mobile-audit/phase-2/14-api-and-data-integration-matrix.md`  
**Phase:** Phase 2 — Complete UI/UX Architecture & Redesign Blueprint  
**Status:** ARCHITECTURAL SPECIFICATION & BLUEPRINT (READ-ONLY DESIGN)

---

## 1. Executive Summary

This integration matrix audits every proposed screen in the Parent Mobile App against the Express backend (`apps/backend/src`) and Prisma database schema (`apps/backend/prisma/schema.prisma`).

In accordance with strict workspace rules:

- **No Hallucinated Endpoints:** Only endpoints verified in Phase 1.1 are marked as existing.
- **Truth Hierarchy:** Unimplemented functionality is designated as `BACKEND IMPLEMENTATION ONLY`, `PROPOSED`, or `MISSING` with a recommended payload contract.

---

## 2. Comprehensive API & Data Mapping Table

| Screen ID & Name                 | Required Data Entities           | Existing Mobile API                | Backend Route Verified                           | Missing Contract / Integration Task           | Status                          |
| -------------------------------- | -------------------------------- | ---------------------------------- | ------------------------------------------------ | --------------------------------------------- | ------------------------------- |
| **`SCR-AUTH-01` Splash**         | Current user session & tokens    | `authApi.getMe()`                  | `GET /v1/auth/me`                                | None                                          | **EXISTING AND VERIFIED**       |
| **`SCR-AUTH-02` Login**          | Email, password, device info     | `authApi.login()`                  | `POST /v1/auth/login`                            | Add biometrics payload                        | **EXISTING AND VERIFIED**       |
| **`SCR-AUTH-03` Register**       | Parent name, email, phone, pwd   | `authApi.registerParent()`         | `POST /v1/auth/register`                         | None                                          | **EXISTING AND VERIFIED**       |
| **`SCR-AUTH-04` Forgot Pwd**     | Email address                    | None (`ISSUE-FUNC-01`)             | None (`0 auth reset routes`)                     | Need `POST /v1/auth/forgot-password`          | **MISSING**                     |
| **`SCR-AUTH-05` OTP**            | 6-digit code, email              | `authApi.verifyOtp()`              | `POST /v1/auth/verify-otp`                       | Support password reset flag                   | **PARTIALLY AVAILABLE**         |
| **`SCR-AUTH-06` Reset Pwd**      | Token, new password              | None                               | None                                             | Need `POST /v1/auth/reset-password`           | **MISSING**                     |
| **`SCR-HOME-01` Dashboard**      | Child snapshot, attendance, fees | Multi-query composition            | `GET /v1/parents/dashboard`                      | Wire mobile client to backend dashboard       | **BACKEND IMPLEMENTATION ONLY** |
| **`SCR-HOME-02` Child Switcher** | Linked students & applicants     | Multi-query composition            | `GET /v1/parents/:id/students` & `/admissions`   | Client composite mapper                       | **BACKEND IMPLEMENTATION ONLY** |
| **`SCR-ADM-01` App Hub**         | Admission applications list      | `admissionApi.getApplications()`   | `GET /v1/admissions/applications`                | None                                          | **EXISTING AND VERIFIED**       |
| **`SCR-ADM-02` Wizard**          | 4-step applicant metadata        | `admissionApi.createApplication()` | `POST /v1/admissions/applications`               | None                                          | **EXISTING AND VERIFIED**       |
| **`SCR-ADM-03` App Stepper**     | Single application details       | `admissionApi.getApplication(id)`  | `GET /v1/admissions/applications/:id`            | None                                          | **EXISTING AND VERIFIED**       |
| **`SCR-ADM-04` Documents**       | Document checklist & files       | `documentsApi.upload(id)`          | `POST /v1/admissions/applications/:id/documents` | None                                          | **EXISTING AND VERIFIED**       |
| **`SCR-ADM-05` App Fee**         | Processing fee & transaction     | `feesApi.payFee(id)`               | Simulated in `admission.payment.service.ts`      | Wire to real Razorpay gateway                 | **PARTIALLY AVAILABLE**         |
| **`SCR-ADM-06` App Receipt**     | Payment receipt details          | `feesApi.getReceipt(id)`           | `GET /v1/admissions/applications/:id/payment`    | None                                          | **EXISTING AND VERIFIED**       |
| **`SCR-ADM-07` Assessment**      | Schedule slots & booking         | `admissionApi.getAssessment(id)`   | `GET /v1/admissions/applications/:id/assessment` | None                                          | **EXISTING AND VERIFIED**       |
| **`SCR-ADM-08` Decision**        | Offer letter & decision          | `admissionApi.getDecision(id)`     | `GET /v1/admissions/applications/:id/decision`   | None                                          | **EXISTING AND VERIFIED**       |
| **`SCR-ADM-09` Timeline**        | Audit trail milestones           | `admissionApi.getTimeline(id)`     | `GET /v1/admissions/applications/:id/timeline`   | None                                          | **EXISTING AND VERIFIED**       |
| **`SCR-ACAD-01` Academics**      | Aggregate GPA, schedule glance   | None                               | None (Scattered across modules)                  | Need `GET /v1/academics/student/:id/summary`  | **PROPOSED**                    |
| **`SCR-ACAD-02` Attendance**     | Monthly calendar & statistics    | None                               | `GET /v1/attendance/student/:id`                 | Mobile client API service & hooks             | **BACKEND IMPLEMENTATION ONLY** |
| **`SCR-ACAD-03` Timetable**      | Day-by-day class schedule        | None                               | `GET /v1/academics/timetable/student/:id`        | Mobile client API service & hooks             | **BACKEND IMPLEMENTATION ONLY** |
| **`SCR-ACAD-04` Homework**       | Pending/completed homework       | None                               | `GET /v1/homework/student/:id`                   | Mobile client API service & hooks             | **BACKEND IMPLEMENTATION ONLY** |
| **`SCR-ACAD-05` HW Detail**      | Instructions & reference PDFs    | None                               | `GET /v1/homework/:id`                           | Mobile client API service & hooks             | **BACKEND IMPLEMENTATION ONLY** |
| **`SCR-ACAD-06` Exams**          | Exam schedules & hall tickets    | None                               | `GET /v1/examinations/student/:id`               | Mobile client API service & hooks             | **BACKEND IMPLEMENTATION ONLY** |
| **`SCR-ACAD-07` Results**        | Term report card & grades        | None                               | `GET /v1/examinations/results/student/:id`       | Mobile client API service & hooks             | **BACKEND IMPLEMENTATION ONLY** |
| **`SCR-FIN-01` Fee Dash**        | Invoices, dues & installments    | None (`ISSUE-FIN-02`)              | `GET /v1/fees/student/:id`                       | Mobile client API service & hooks             | **BACKEND IMPLEMENTATION ONLY** |
| **`SCR-FIN-02` Fee Struct**      | Annual fee heads breakdown       | None                               | `GET /v1/fees/structure/student/:id`             | Mobile client API service & hooks             | **BACKEND IMPLEMENTATION ONLY** |
| **`SCR-FIN-03` Checkout**        | Razorpay Order ID                | None                               | `POST /api/create-order` (`razorpay.routes.ts`)  | Mobile integration with Razorpay SDK          | **BACKEND IMPLEMENTATION ONLY** |
| **`SCR-FIN-04` Status**          | Signature verification           | None                               | `POST /api/verify-payment`                       | Verify HMAC-SHA256 signature                  | **BACKEND IMPLEMENTATION ONLY** |
| **`SCR-FIN-05` History**         | Past transaction records         | None                               | `GET /v1/fees/payments/student/:id`              | Mobile client API service & hooks             | **BACKEND IMPLEMENTATION ONLY** |
| **`SCR-FIN-06` Receipt**         | Official tuition PDF receipt     | None                               | `GET /v1/fees/receipts/:id`                      | Mobile PDF preview & share                    | **BACKEND IMPLEMENTATION ONLY** |
| **`SCR-COMM-01` Feed**           | Announcements, circulars         | None                               | `GET /v1/announcements` & `/circulars`           | Mobile feed client & pagination               | **BACKEND IMPLEMENTATION ONLY** |
| **`SCR-COMM-02` Circular**       | PDF circular content & file      | None                               | `GET /v1/circulars/:id`                          | Mobile client API service & hooks             | **BACKEND IMPLEMENTATION ONLY** |
| **`SCR-COMM-03` Event**          | School event metadata & RSVP     | None                               | `GET /v1/events/:id`                             | Mobile client API service & hooks             | **BACKEND IMPLEMENTATION ONLY** |
| **`SCR-COMM-04` Messages**       | Teacher conversation threads     | None                               | None                                             | Need `GET /v1/messages/parent/threads`        | **PROPOSED**                    |
| **`SCR-COMM-06` Helpdesk**       | Parent inquiry tickets           | None                               | None                                             | Need `GET /v1/helpdesk/tickets`               | **PROPOSED**                    |
| **`SCR-PROF-01` Profile**        | Parent details & children        | `authApi.getMe()`                  | `GET /v1/auth/me`                                | None                                          | **EXISTING AND VERIFIED**       |
| **`SCR-PROF-02` Student**        | Biographical, medical records    | None                               | `GET /v1/students/:id`                           | Mobile student profile hook                   | **BACKEND IMPLEMENTATION ONLY** |
| **`SCR-PROF-03` Transport**      | Bus route, stops, driver info    | None                               | None                                             | Need `GET /v1/transport/student/:id`          | **PROPOSED**                    |
| **`SCR-PROF-04` Library**        | Issued books & due dates         | None                               | None                                             | Need `GET /v1/library/loans/student/:id`      | **PROPOSED**                    |
| **`SCR-SYS-01` Notifs**          | Notification list & counter      | `notificationsApi.list()`          | `GET /v1/notifications`                          | None                                          | **EXISTING AND VERIFIED**       |
| **`SCR-SYS-01` WS Stream**       | Realtime notification socket     | `notificationSocket.connect()`     | `/api/v1/notifications/stream`                   | Secure subprotocol migration (`ISSUE-SEC-01`) | **PARTIALLY AVAILABLE**         |
| **`SCR-SYS-01` Push**            | Device push token registration   | `pushNotificationService`          | Missing in backend schema                        | Add `user_devices` model (Post-Freeze)        | **MISSING**                     |

---

## 3. Recommended Contracts for Missing / Proposed Endpoints

### 3.1 `POST /v1/auth/forgot-password` (Required for `SCR-AUTH-04`)

- **Request Body:**
  ```json
  {
    "email": "parent@example.com"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "If this email is registered, a 6-digit recovery code has been sent."
  }
  ```

### 3.2 `POST /v1/auth/reset-password` (Required for `SCR-AUTH-06`)

- **Request Body:**
  ```json
  {
    "email": "parent@example.com",
    "otp": "491028",
    "newPassword": "SecurePassword123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Password updated successfully. Please login with your new credentials."
  }
  ```

### 3.3 `GET /v1/academics/student/:id/summary` (Required for `SCR-ACAD-01`)

- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "attendancePercentage": 94.5,
      "pendingHomeworkCount": 3,
      "nextExam": {
        "subject": "Mathematics",
        "date": "2026-11-10T09:00:00Z"
      },
      "activePeriod": {
        "periodNumber": 3,
        "subject": "General Science",
        "room": "Lab 2",
        "teacher": "Dr. A. P. Rao"
      }
    }
  }
  ```
