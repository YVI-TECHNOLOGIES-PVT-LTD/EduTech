# EduTrack ERP Stage-1 End-to-End API Master Specification Guide

**Platform Version**: Stage-1 Backend v1.0.0 & Enterprise Security Platform v1.0  
**Scope**: Complete End-to-End API Specification for all 23 Stage-1 Domain Modules  
**Author**: Principal Enterprise API Architect & Senior Software Engineer

---

## 1. Global API Standards & Headers

- **Base URL**: `http://localhost:3000/api/v1`
- **Default Content Type**: `application/json`
- **Required Security Headers** (Protected Endpoints):
  - `Authorization: Bearer <accessToken>`
  - `x-tenant-id: <organizationId>`

---

## 2. Complete Stage-1 Lifecycle API Execution Sequence

$$\text{1. Public Inquiry} \rightarrow \text{2. Lead Capture} \rightarrow \text{3. Campus Visit} \rightarrow \text{4. Application} \rightarrow \text{5. Document Verification} \rightarrow \text{6. Assessment} \rightarrow \text{7. Decision} \rightarrow \text{8. Fee Payment} \rightarrow \text{9. Final Enrollment}$$

### STEP 1: Public Intake & Lead Capture

```http
POST /api/v1/leads
Content-Type: application/json
Authorization: Bearer <accessToken>
x-tenant-id: org-apex-001

{
  "studentName": "Aarav Sharma",
  "parentName": "Ramesh Sharma",
  "email": "ramesh.sharma@example.com",
  "phone": "+91 98765 11111",
  "gradeApplyingFor": "Grade 9",
  "source": "Website Inquiry"
}
```

**Response (`201 Created`)**:

```json
{
  "id": "lead-uuid-001",
  "leadNumber": "LEAD-2026-001",
  "studentName": "Aarav Sharma",
  "parentName": "Ramesh Sharma",
  "status": "NEW",
  "aiScore": 88,
  "createdAt": "2026-08-07T07:30:00Z"
}
```

---

### STEP 2: Campus Visit Booking

```http
POST /api/v1/admission/crm/campus-visits
Content-Type: application/json
Authorization: Bearer <accessToken>
x-tenant-id: org-apex-001

{
  "leadId": "lead-uuid-001",
  "scheduledDate": "2026-08-15",
  "scheduledTime": "10:30 AM",
  "counsellorId": "staff-uuid-002"
}
```

**Response (`201 Created`)**:

```json
{
  "id": "visit-uuid-101",
  "leadId": "lead-uuid-001",
  "status": "SCHEDULED",
  "counsellorName": "Meenakshi Sundaram"
}
```

---

### STEP 3: Formal Application Submission

```http
POST /api/v1/applications
Content-Type: application/json
Authorization: Bearer <accessToken>
x-tenant-id: org-apex-001

{
  "leadId": "lead-uuid-001",
  "applicantName": "Aarav Sharma",
  "parentName": "Ramesh Sharma",
  "gradeApplyingFor": "Grade 9"
}
```

**Response (`201 Created`)**:

```json
{
  "id": "app-uuid-001",
  "applicationNumber": "APP-2026-042",
  "status": "SUBMITTED",
  "submissionDate": "2026-08-07"
}
```

---

### STEP 4: Application Document Verification

```http
POST /api/v1/admission/application/documents/doc-uuid-101/verify
Content-Type: application/json
Authorization: Bearer <accessToken>
x-tenant-id: org-apex-001

{
  "applicationId": "app-uuid-001",
  "isVerified": true,
  "notes": "Original birth certificate verified"
}
```

**Response (`200 OK`)**:

```json
{
  "success": true,
  "status": "DOCUMENT_VERIFIED"
}
```

---

### STEP 5: Entrance Assessment & Interview Scoring

```http
POST /api/v1/admission/assessment/score
Content-Type: application/json
Authorization: Bearer <accessToken>
x-tenant-id: org-apex-001

{
  "applicationId": "app-uuid-001",
  "score": 85,
  "maxScore": 100,
  "evaluatorNotes": "Excellent candidate in mathematics and English aptitude"
}
```

**Response (`200 OK`)**:

```json
{
  "success": true,
  "applicationId": "app-uuid-001",
  "status": "ASSESSMENT_COMPLETED"
}
```

---

### STEP 6: Formal Admission Approval Decision

```http
POST /api/v1/applications/app-uuid-001/decision
Content-Type: application/json
Authorization: Bearer <accessToken>
x-tenant-id: org-apex-001

{
  "decision": "APPROVED",
  "remarks": "Approved for Grade 9 admission"
}
```

**Response (`200 OK`)**:

```json
{
  "success": true,
  "applicationId": "app-uuid-001",
  "status": "APPROVED"
}
```

---

### STEP 7: Admission Fee Payment Collection

```http
POST /api/v1/applications/app-uuid-001/fees
Content-Type: application/json
Authorization: Bearer <accessToken>
x-tenant-id: org-apex-001

{
  "amount": 25000,
  "paymentMode": "ONLINE",
  "transactionRef": "TXN-99887766"
}
```

**Response (`200 OK`)**:

```json
{
  "success": true,
  "applicationId": "app-uuid-001",
  "amount": 25000,
  "status": "FEE_PAID"
}
```

---

### STEP 8: Stage-1 Final Student Creation & Enrollment Execution

```http
POST /api/v1/admission/enrollment/execute
Content-Type: application/json
Authorization: Bearer <accessToken>
x-tenant-id: org-apex-001

{
  "applicationId": "app-uuid-001",
  "gradeId": "grade-uuid-009",
  "sectionId": "section-uuid-A",
  "academicYearId": "ay-2026"
}
```

**Response (`201 Created`)**:

```json
{
  "id": "stu-uuid-001",
  "admissionNumber": "ADM-2026-001",
  "studentId": "STU-2026-001",
  "firstName": "Aarav",
  "lastName": "Sharma",
  "grade": "Grade 9",
  "section": "Section A",
  "status": "ENROLLED",
  "enrollmentDate": "2026-08-07"
}
```

---

## 3. Executive Dashboard API

```http
GET /api/v1/dashboard/summary
Authorization: Bearer <accessToken>
x-tenant-id: org-apex-001
```

**Response (`200 OK`)**:

```json
{
  "kpis": {
    "totalLeads": 128,
    "activeApplications": 42,
    "studentsEnrolled": 38,
    "pendingAssessments": 5,
    "feeCollectionTotal": 950000,
    "conversionRate": 68.5
  },
  "funnel": [
    { "stage": "LEAD", "count": 128 },
    { "stage": "CAMPUS_VISIT", "count": 84 },
    { "stage": "APPLICATION", "count": 62 },
    { "stage": "ASSESSMENT", "count": 48 },
    { "stage": "FEE_PAID", "count": 40 },
    { "stage": "ENROLLED", "count": 38 }
  ],
  "pendingTasks": [
    { "id": "task-1", "title": "Verify Documents for APP-2026-042", "priority": "HIGH" }
  ],
  "recentActivities": [
    {
      "id": "act-1",
      "description": "Completed Stage-1 Enrollment for Aarav Sharma",
      "timestamp": "Just now"
    }
  ]
}
```

---

## 4. Module Endpoint Summary Table

| Domain Module     | HTTP Method | Endpoint Path                    | Authentication | Required Permission          |
| ----------------- | :---------: | -------------------------------- | :------------: | ---------------------------- |
| **Public Intake** |   `POST`    | `/api/v1/admission/public-apply` |     Public     | None                         |
| **Auth Login**    |   `POST`    | `/api/v1/auth/login`             |     Public     | None                         |
| **Auth Profile**  |    `GET`    | `/api/v1/me`                     |  Bearer Token  | Authenticated User           |
| **Organization**  |    `GET`    | `/api/v1/organization/profile`   |  Bearer Token  | `organization.read`          |
| **Users**         |    `GET`    | `/api/v1/users`                  |  Bearer Token  | `user.read`                  |
| **HR Staff**      |    `GET`    | `/api/v1/staff`                  |  Bearer Token  | `staff.read`                 |
| **Academics**     |    `GET`    | `/api/v1/academic/years`         |  Bearer Token  | `academics.read`             |
| **CRM Leads**     |    `GET`    | `/api/v1/leads`                  |  Bearer Token  | `crm.lead.read`              |
| **Admissions**    |    `GET`    | `/api/v1/applications`           |  Bearer Token  | `admission.application.read` |
| **Students**      |    `GET`    | `/api/v1/students`               |  Bearer Token  | `student.read`               |
| **Dashboard**     |    `GET`    | `/api/v1/dashboard/summary`      |  Bearer Token  | `dashboard.read`             |
