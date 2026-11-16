# EduTrack ERP — Validation Audit Report

**Scope**: Request DTOs, Payload Schemas, Data Transformers & Field Constraints

---

## 1. DTO Schema Inspection Matrix

| DTO Schema              | Required Fields                                                   | Optional Fields        | Enums / Formats     | Validation Rules                    | Status  |
| ----------------------- | ----------------------------------------------------------------- | ---------------------- | ------------------- | ----------------------------------- | :-----: |
| `LoginDto`              | `email`, `passwordHash`                                           | None                   | Email regex         | Min 8 chars, valid email format     | ✅ PASS |
| `CreateOrganizationDto` | `name`, `code`, `email`                                           | `branding`, `settings` | Code regex          | Code must be uppercase alphanumeric | ✅ PASS |
| `CreateLeadDto`         | `studentName`, `parentName`, `email`, `phone`, `gradeApplyingFor` | `source`               | Enum: `Source`      | Valid email, phone regex            | ✅ PASS |
| `CreateApplicationDto`  | `applicantName`, `parentName`, `gradeApplyingFor`                 | `leadId`               | UUID `leadId`       | Valid UUID format                   | ✅ PASS |
| `VerifyDocumentDto`     | `isVerified`                                                      | `notes`                | Boolean             | Boolean constraint                  | ✅ PASS |
| `RecordAssessmentDto`   | `applicationId`, `score`, `maxScore`                              | `evaluatorNotes`       | Numeric             | Score $\le$ maxScore                | ✅ PASS |
| `CollectFeePaymentDto`  | `amount`, `paymentMode`, `transactionRef`                         | `notes`                | Enum: `PaymentMode` | Positive amount                     | ✅ PASS |
| `ExecuteEnrollmentDto`  | `applicationId`, `gradeId`, `sectionId`, `academicYearId`         | `rollNumber`           | UUIDs               | Valid UUID foreign keys             | ✅ PASS |

---

## 2. Transformer & Pipe Integrity

- **UUID Validation**: All `:id` path parameters use `ParseUUIDPipe` returning `400 Bad Request` on invalid UUID strings.
- **Enum Validation**: Unrecognized enum values trigger `422 Unprocessable Entity` response.
- **Data Sanitization**: Strings are trimmed and sanitized against SQL/HTML injection.
