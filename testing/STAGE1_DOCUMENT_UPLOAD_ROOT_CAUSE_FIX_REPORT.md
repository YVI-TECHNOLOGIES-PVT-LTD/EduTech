# STAGE-1 DOCUMENT UPLOAD ROOT CAUSE & PERSISTENCE FIX REPORT

**Date**: August 17, 2026  
**Module**: Admission Management (`POST /api/v1/applications/:id/documents`)  
**Status**: **RESOLVED & CERTIFIED**

---

## 1. Executive Summary

During Stage-1 Admission Application persistence testing, document uploads (`POST /api/v1/applications/:id/documents`) returned HTTP 500 across `academic_records`, `aadhaar_card`, `birth_certificate`, and `passport_photo`.

A forensic investigation was conducted across the execution stack without altering any database tables or `schema.prisma`. The underlying issues were identified, fixed with minimal targeted code changes, and proven with end-to-end multi-layer tests across PostgreSQL, Supabase Storage, and REST API.

---

## 2. Root Cause Analysis

### Root Cause 1: Unhandled Unique Constraint Violation on Duplicate / Re-upload (`P2002`)

- **Location**: [`AdmissionDocumentRepository.create`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission-management/repositories/admission.document.repository.ts#L7)
- **Mechanism**: The database table `admission_documents` has a compound unique constraint `@@unique([application_id, document_type_id])`. When `create()` was invoked on re-upload, retry, or file replacement, Prisma threw `PrismaClientKnownRequestError` (`P2002: Unique constraint failed`), resulting in an unhandled HTTP 500.
- **Fix**: Replaced `prisma.admission_documents.create()` with `prisma.admission_documents.upsert()` using composite key `application_id_document_type_id`.

### Root Cause 2: DTO Field Mismatch (`document_type_code` vs `document_code`)

- **Location**: [`uploadDocumentSchema`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission-management/dto/request/upload-document.dto.ts) and [`AdmissionDocumentService.uploadDocument`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission-management/services/admission.document.service.ts#L65)
- **Mechanism**: Frontend API clients (`uploadCrmDocument`) submitted `document_type_code`, whereas backend schema only validated `document_code` / `document_type`, leading to validation failure.
- **Fix**: Added `document_type_code` to `uploadDocumentSchema` and included it in the fallback resolution chain in `AdmissionDocumentService`.

### Root Cause 3: Database Connection Pool Exhaustion from Multiple `PrismaClient` Instantiations

- **Location**: `auth.service.ts`, `admission.service.ts`, `driver.strategy.ts`, `faculty.strategy.ts`, `staffProfileImport.strategy.ts`, `facultyProfileImport.strategy.ts`
- **Mechanism**: Multiple modules instantiated standalone `new PrismaClient()` instances instead of using the central singleton `import prisma from '@/lib/prismaClient'`. This exhausted Supabase Postgres session connection limits (limit: 15) during concurrent operations.
- **Fix**: Converted all backend modules to consume the centralized singleton in [`apps/backend/src/lib/prismaClient.ts`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/lib/prismaClient.ts).

### Root Cause 4: Node 20 Native WebSocket Incompatibility with Supabase Realtime

- **Location**: [`apps/backend/src/config/supabase.ts`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/config/supabase.ts) and [`apps/backend/nodemon.json`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/nodemon.json)
- **Mechanism**: Node 20 runtime lacked full global `WebSocket` support required by `@supabase/supabase-js`, causing runtime startup failure.
- **Fix**: Added `ws` fallback and `--experimental-websocket` flag in `nodemon.json`.

---

## 3. Implementation Changes

| File                                                                                                                                                                                                                               | Change                                                                                       |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [`apps/backend/src/modules/admission-management/repositories/admission.document.repository.ts`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission-management/repositories/admission.document.repository.ts) | Implemented `upsert()` on `application_id_document_type_id` for idempotent document uploads. |
| [`apps/backend/src/modules/admission-management/dto/request/upload-document.dto.ts`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission-management/dto/request/upload-document.dto.ts)                       | Added `document_type_code: z.string().optional()` to Zod schema.                             |
| [`apps/backend/src/modules/admission-management/services/admission.document.service.ts`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission-management/services/admission.document.service.ts)               | Included `dto.document_type_code` in `docCode` resolution chain.                             |
| [`apps/backend/src/modules/admission-management/controllers/admission-document.controller.ts`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission-management/controllers/admission-document.controller.ts)   | Added structured error logging via `logger.error()`.                                         |
| [`apps/backend/src/auth/auth.service.ts`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/auth/auth.service.ts)                                                                                                             | Switched from `new PrismaClient()` to singleton `prisma`.                                    |
| [`apps/backend/src/modules/admission/admission.service.ts`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission/admission.service.ts)                                                                         | Switched from `new PrismaClient()` to singleton `prisma`.                                    |
| `apps/backend/src/modules/import/strategies/*.ts`                                                                                                                                                                                  | Switched from `new PrismaClient()` to singleton `prisma`.                                    |

---

## 4. Multi-Layer Verification Results

### Step 9: Single Document Test (`academic_records`)

- **HTTP Status**: `201 Created`
- **PostgreSQL**: Row verified in `admission_documents` with matching `document_id` and `verify_status: 'pending'`.
- **Supabase Storage**: Object verified in bucket `admission-documents` at storage path.
- **Other 3 Documents**: `aadhaar_card`, `birth_certificate`, `passport_photo` uploaded successfully (HTTP 201).

### Step 10: Full Application Persistence & Read-Back Verification

- **Application ID**: `54f33740-7843-430f-a0be-dcda42468cdf`
- **Metadata Fields Verified**:
  - `nationality`: `"Indian"` (Exact match)
  - `previous_school_name`: `"Delhi Public Global Academy"` (Exact match)
  - `previous_school_address`: `"Sector 21, Institutional Area, New Delhi 110075"` (Exact match)
  - `previous_school_board`: `"CBSE"` (Exact match)
  - `previous_grade`: `"Grade 4"` (Exact match)
  - `previous_school_year`: `"2024-2025"` (Exact match)
- **Document Rows in PostgreSQL**: `4 / 4`
- **Objects in Supabase Storage**: `4 / 4`
- **GET `/api/v1/applications/:id`**: Returns HTTP 200 with all 6 metadata fields and all 4 document records populated.

---

## 5. Certification Checklist

- [x] Zero changes to database tables, DDL, or `schema.prisma`.
- [x] Singleton connection pool utilized across entire backend.
- [x] Upload idempotent for re-submission and replacement.
- [x] 4/4 documents verified in PostgreSQL and Supabase Storage.
- [x] Typecheck passed (`tsc --noEmit` 0 errors).
- [x] Backend port 3000 freed and ready for terminal dev server.
