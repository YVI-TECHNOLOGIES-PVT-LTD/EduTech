# EduTrack ERP — System Audit Event Catalog

**Audit Architecture**: Centralized Audit Log Subsystem  
**Storage**: `audit_logs` table (PostgreSQL)

---

## 1. Security & Identity Events

- **`USER_LOGIN`**: Triggered upon successful authentication. Logs `userId`, `email`, `ipAddress`, `timestamp`.
- **`USER_LOGOUT`**: Triggered when session is invalidated.
- **`TOKEN_REFRESH`**: Triggered when access token is rotated.
- **`PASSWORD_RESET`**: Triggered when user changes or resets account password.
- **`ROLE_ASSIGNED`**: Triggered when administrative user assigns a role to a user.

---

## 2. CRM & Admissions Pipeline Events

- **`LEAD_CREATED`**: Triggered upon capturing an inbound lead inquiry.
- **`LEAD_STATUS_CHANGED`**: Triggered when lead status transitions (e.g. `NEW` ➔ `CAMPUS_VISITED`).
- **`CAMPUS_VISIT_SCHEDULED`**: Triggered when a campus tour appointment is booked.
- **`APPLICATION_SUBMITTED`**: Triggered when formal application is created.
- **`DOCUMENT_VERIFIED`**: Triggered when document verification status is set.
- **`ASSESSMENT_RECORDED`**: Triggered when entrance examination/interview score is logged.
- **`ADMISSION_DECISION_MADE`**: Triggered when application is set to `APPROVED` or `REJECTED`.
- **`FEE_PAYMENT_COLLECTED`**: Triggered when admission fee receipt is recorded.
- **`STUDENT_ENROLLED`**: Triggered upon atomic Stage-1 enrollment execution generating student profile and section allocation.
