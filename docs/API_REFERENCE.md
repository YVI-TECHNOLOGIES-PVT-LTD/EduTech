# EduTrack ERP — REST API Reference Manual

**Base URL**: `http://localhost:3000/api/v1`  
**Authentication**: `Authorization: Bearer <accessToken>`  
**Tenant Scoping**: `x-tenant-id: <organizationId>`

---

## 1. Authentication Endpoints

### `POST /auth/login`

Authenticates credentials and returns JWT tokens.

- **Request Body**:
  ```json
  { "email": "admin@apexacademy.edu", "passwordHash": "Pass123!" }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "user": { "id": "usr-1", "email": "admin@apexacademy.edu" }
  }
  ```

---

## 2. Lead Management Endpoints

### `POST /leads`

Captures an inbound prospective lead inquiry.

- **Request Body**:
  ```json
  {
    "studentName": "Aarav Sharma",
    "parentName": "Ramesh Sharma",
    "email": "ramesh@example.com",
    "phone": "+91 98765 11111",
    "gradeApplyingFor": "Grade 9"
  }
  ```
- **Response (`201 Created`)**:
  ```json
  { "id": "lead-1", "leadNumber": "LEAD-2026-001", "status": "NEW", "aiScore": 88 }
  ```

---

## 3. Admissions Endpoints

### `POST /applications`

Submits a formal admission application.

- **Request Body**:
  ```json
  {
    "leadId": "lead-1",
    "applicantName": "Aarav Sharma",
    "parentName": "Ramesh Sharma",
    "gradeApplyingFor": "Grade 9"
  }
  ```
- **Response (`201 Created`)**:
  ```json
  { "id": "app-1", "applicationNumber": "APP-2026-042", "status": "SUBMITTED" }
  ```
