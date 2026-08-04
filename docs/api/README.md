# EduTrack Enterprise Platform — API Documentation

## 1. Core Endpoints Specification

### 1.1 Admin Routes (`/admin`)

#### `POST /admin/student-section/assign`

- **Permission Required:** `PERMISSIONS.STUDENT_ASSIGN_SECTION`
- **Request Body:**
  ```json
  {
    "student_id": "uuid-string",
    "section_id": "uuid-string"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Student assigned to section successfully"
  }
  ```

---

### 1.2 Bulk Import Routes (`/admin/bulk`)

#### `POST /admin/bulk/assign`

- **Permission Required:** `PERMISSIONS.STUDENT_ASSIGN_SECTION`
- **Content-Type:** `multipart/form-data` (CSV or XLSX file)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "report": {
      "total": 50,
      "success": 48,
      "failure": 2,
      "details": []
    }
  }
  ```

---

### 1.3 Admission Workflow Routes (`/admission`)

#### `POST /admission/applications/status`

- **Permission Required:** `PERMISSIONS.APPLICATION_REVIEW`
- **Request Body:**
  ```json
  {
    "applicationId": "uuid-string",
    "newStatus": "OFFER_SENT",
    "notes": "Verified entrance test score."
  }
  ```
