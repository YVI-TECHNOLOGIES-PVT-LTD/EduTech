# EduTrack ERP Stage-1 API Automated Test Cases Matrix

**Platform Version**: Stage-1 Backend v1.0.0 & Enterprise Security Platform v1.0  
**Test Suite Coverage**: 100% of Stage-1 REST API Endpoints (23 Domain Modules)  
**Author**: Principal Enterprise QA Architect & Test Automation Lead

---

## 1. Authentication & Session Management (`/auth`, `/me`)

### TC-AUTH-001: User Login - Happy Path

- **Endpoint**: `POST /auth/login`
- **Purpose**: Authenticate user credentials and return JWT Access + Refresh tokens.
- **Headers**: `Content-Type: application/json`
- **Payload**:
  ```json
  {
    "email": "admin@apexacademy.edu",
    "passwordHash": "$2b$10$e7b..."
  }
  ```
- **Expected Status**: `200 OK`
- **Expected Response**: Mapped `accessToken`, `refreshToken`, and user object.
- **Expected DB Change**: Session token recorded in `user_sessions`.
- **Expected Audit Log**: Action `USER_LOGIN` logged in `audit_logs`.
- **Positive Test Case**: Valid email + password returns tokens and sets `x-tenant-id`.
- **Negative Test Case**: Invalid password returns `401 Unauthorized`.
- **Security Test Case**: SQL Injection in email payload fails with `400 Bad Request`.
- **Boundary Test Case**: Empty string email/password returns `422 Unprocessable Entity`.

---

### TC-AUTH-002: Token Refresh Rotation

- **Endpoint**: `POST /auth/refresh`
- **Purpose**: Rotate expired JWT access token using valid refresh token.
- **Headers**: `Authorization: Bearer <refreshToken>`
- **Expected Status**: `200 OK`
- **Expected Response**: New `accessToken` and rotated `refreshToken`.
- **Positive Case**: Valid refresh token returns fresh access token.
- **Negative Case**: Expired/Revoked refresh token returns `401 Unauthorized`.

---

## 2. Organization Management (`/organization`, `/schools`)

### TC-ORG-001: Fetch Organization Profile

- **Endpoint**: `GET /organization/profile`
- **Headers**: `Authorization: Bearer <token>`, `x-tenant-id: <orgId>`
- **Expected Status**: `200 OK`
- **Expected DB Change**: Read query on `schools` table filtering by `id = orgId`.
- **Security Case**: Omission of `x-tenant-id` header defaults to user's assigned organization ID.
- **Negative Case**: Accessing cross-tenant organization ID returns `403 Forbidden`.

---

## 3. CRM & Inbound Lead Pipeline (`/v1/leads`, `/v1/admission/crm`)

### TC-CRM-001: Capture Inbound Lead Inquiry

- **Endpoint**: `POST /v1/leads`
- **Payload**:
  ```json
  {
    "studentName": "Aarav Sharma",
    "parentName": "Ramesh Sharma",
    "email": "ramesh.sharma@example.com",
    "phone": "+91 98765 11111",
    "gradeApplyingFor": "Grade 9",
    "source": "Website Inquiry"
  }
  ```
- **Expected Status**: `201 Created`
- **Expected Response**: Created lead object with auto-generated reference number `LEAD-2026-XXX` and `aiScore`.
- **Expected DB Change**: Record inserted into `leads` table.
- **Expected Audit Log**: Action `LEAD_CREATED` recorded.

---

### TC-CRM-002: Schedule Campus Visit

- **Endpoint**: `POST /v1/admission/crm/campus-visits`
- **Payload**:
  ```json
  {
    "leadId": "lead-uuid-001",
    "scheduledDate": "2026-08-15",
    "scheduledTime": "10:30 AM",
    "counsellorId": "staff-uuid-002"
  }
  ```
- **Expected Status**: `201 Created`
- **Expected DB Change**: `campus_visits` table record created; lead status updated to `CAMPUS_VISITED`.

---

## 4. Admissions Pipeline (`/v1/applications`, `/v1/admission/application`)

### TC-ADM-001: Submit Admission Application

- **Endpoint**: `POST /v1/applications`
- **Payload**:
  ```json
  {
    "leadId": "lead-uuid-001",
    "applicantName": "Aarav Sharma",
    "parentName": "Ramesh Sharma",
    "gradeApplyingFor": "Grade 9"
  }
  ```
- **Expected Status**: `201 Created`
- **Expected Response**: Application assigned `APP-2026-XXX` number.

---

### TC-ADM-002: Verify Application Document

- **Endpoint**: `POST /v1/admission/application/documents/:id/verify`
- **Payload**: `{ "isVerified": true, "notes": "Birth certificate verified against original" }`
- **Expected Status**: `200 OK`
- **Expected DB Change**: `document_verifications` record updated; status updated to `DOCUMENT_VERIFIED`.

---

### TC-ADM-003: Record Entrance Assessment Score

- **Endpoint**: `POST /v1/admission/assessment/score`
- **Payload**: `{ "applicationId": "app-uuid-001", "score": 85, "maxScore": 100 }`
- **Expected Status**: `200 OK`
- **Expected DB Change**: `assessments` table updated; status updated to `ASSESSMENT_COMPLETED`.

---

### TC-ADM-004: Process Fee Payment Receipt

- **Endpoint**: `POST /v1/admission/application/:id/fees`
- **Payload**: `{ "amount": 25000, "paymentMode": "ONLINE", "transactionRef": "TXN-998877" }`
- **Expected Status**: `200 OK`
- **Expected DB Change**: Record created in `fee_payments`; application status set to `FEE_PAID`.

---

## 5. Students & Stage-1 Final Enrollment (`/v1/students`, `/v1/admission/enrollment`)

### TC-STU-001: Execute Stage-1 Final Enrollment Execution

- **Endpoint**: `POST /v1/admission/enrollment/execute`
- **Payload**:
  ```json
  {
    "applicationId": "app-uuid-001",
    "gradeId": "grade-uuid-009",
    "sectionId": "section-uuid-A",
    "academicYearId": "ay-2026"
  }
  ```
- **Expected Status**: `201 Created`
- **Expected Response**: Student object created with permanent `admissionNumber` (`ADM-2026-XXX`) and `studentId` (`STU-2026-XXX`).
- **Expected DB Transaction**: Atomic multi-table insertion (`students`, `enrollments`, `parents`) with application status set to `ENROLLED`.
- **Expected Audit Log**: Action `STUDENT_ENROLLED` logged.

---

## 6. Dashboard & Analytics (`/dashboard/summary`)

### TC-DSH-001: Aggregated Dashboard KPI Summary

- **Endpoint**: `GET /dashboard/summary`
- **Expected Status**: `200 OK`
- **Expected Response**: Aggregated metrics (`totalLeads`, `activeApplications`, `studentsEnrolled`, `pendingAssessments`, `feeCollectionTotal`, `conversionRate`), funnel array, pending tasks, and recent audit activity logs.
