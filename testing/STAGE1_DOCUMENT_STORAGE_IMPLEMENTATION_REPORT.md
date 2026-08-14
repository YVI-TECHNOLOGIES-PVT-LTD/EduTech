# Stage-1 Binary Document Storage Implementation & Forensic Verification Report

**EduTrack ERP System Architecture**

---

## 1. Executive Summary

Production-grade binary document storage has been fully integrated into EduTrack ERP for Stage-1 admission applications.

- **Supabase Storage Private Bucket**: All document binaries (PDF, JPEG, PNG, WEBP up to 10MB) are stored in the private `admission-documents` Supabase Storage bucket.
- **Server-Side Object Path Key**: Structured as `{org_id}/{application_id}/{document_id}/{safe_filename}`.
- **PostgreSQL Schema Freeze**: **0 Schema Modifications**, **0 Database Migrations**. All metadata, file names, MIME types, and file sizes are stored using pre-existing `admission_documents` columns in `schema.prisma`.
- **Signed URL Security**: Short-lived (1-hour) signed download URLs generated server-side. No permanent public URLs or service-role keys are exposed to the client.
- **Reconciliation & Orphan Cleanup**: Automatic rollback cleanup deletes storage objects if database metadata creation fails.

---

## 2. Audit Before Implementation

- **Previous Status**: `DOCUMENT_BINARY_STORAGE_PENDING` (Metadata-only DB persistence).
- **Schema Audit**: Evaluated `admission_documents` model in [`schema.prisma:122-149`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/prisma/schema.prisma#L122-L149). Confirmed pre-existing support for `storage_path`, `original_file_name`, `mime_type`, `file_size`, `verify_status`, `uploaded_at`, `verified_by`, `verified_at`, `created_by`, `updated_by`.

---

## 3. Files Changed & Added

### Added Files:

- [`apps/backend/src/services/storage.service.ts`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/services/storage.service.ts): Dedicated `StorageService` abstraction for private Supabase Storage uploads, signed URL generation, and object deletions.
- [`apps/backend/src/middlewares/upload.middleware.ts`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/middlewares/upload.middleware.ts): Multer memory storage upload middleware enforcing file type (PDF/JPEG/PNG/WEBP) and size limits (10MB max).

### Modified Files:

- [`apps/backend/src/config/env.ts`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/config/env.ts): Configured `SUPABASE_ADMISSION_DOCUMENTS_BUCKET` env parameter (default: `admission-documents`).
- [`apps/backend/src/modules/admission-management/services/admission.document.service.ts`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission-management/services/admission.document.service.ts): Implemented binary buffer upload to private Supabase Storage, signed URL retrieval, storage deletion cleanup, and Parent application ownership validation.
- [`apps/backend/src/modules/admission-management/controllers/admission-document.controller.ts`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission-management/controllers/admission-document.controller.ts): Attached Multer binary file handling, `getSignedUrl`, and `delete` handlers.
- [`apps/backend/src/modules/admission-management/repositories/admission.document.repository.ts`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission-management/repositories/admission.document.repository.ts): Enhanced `create` to persist file size, MIME type, and original file name, and added `delete` method.
- [`apps/backend/src/modules/admission-management/routes/admission.routes.ts`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission-management/routes/admission.routes.ts): Mounted `uploadSingleMiddleware`, `GET /documents/:id/signed-url`, and `DELETE /documents/:id` routes.
- [`apps/backend/src/modules/admission-management/dto/request/upload-document.dto.ts`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission-management/dto/request/upload-document.dto.ts): Made `file_path` optional for binary multipart form uploads.

---

## 4. Files Not Changed

- [`apps/backend/prisma/schema.prisma`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/prisma/schema.prisma): **0 Schema Modifications**, **0 Migrations**.
- `auth.middleware.ts`, `rbac.middleware.ts`, `session.service.ts`: Preserved frozen role and permission architecture.

---

## 5. Storage Architecture & Naming Conventions

```text
HTTP MULTIPART REQUEST (POST /api/v1/applications/:id/documents)
   │
   ▼
Multer Memory Storage (Validate MIME type & size <= 10MB)
   │
   ▼
Parent Ownership & Tenant Validation (AdmissionRepository.findById)
   │
   ▼
Server-side Storage Object Path Generation
   Path Format: {org_id}/{application_id}/{document_id}/{safe_filename}
   │
   ▼
StorageService.uploadFile -> Supabase Storage (Private Bucket: admission-documents)
   │
   ▼
AdmissionDocumentRepository.create -> PostgreSQL Metadata Record
   (storage_path, original_file_name, mime_type, file_size, verify_status=pending)
```

---

## 6. Security & Authorization Rules

1. **Private Bucket & Short-Lived Signed URLs**: Bucket `admission-documents` is strictly private. Download links are served via short-lived (1-hour) signed URLs generated on-demand by `GET /api/v1/applications/documents/:id/signed-url`.
2. **Parent Resource Ownership**: Parent users can only upload files or request signed URLs for applications where `created_by = parentUserId`. Cross-parent attempts yield `404 Not Found`.
3. **Parent Document Verification Restriction**: Parent role lacks `admission.document.verify` permission. Verification endpoints return `403 Forbidden` if invoked by a Parent.
4. **Front Office Tenant Scoping**: Front Office staff can view and verify documents strictly inside their authenticated tenant (`org_id = req.context.user.org_id`).
5. **Storage Cleanup / Atomicity**: If database record insertion fails after uploading binary buffer to Supabase Storage, `AdmissionDocumentService` automatically executes `StorageService.deleteFile(storagePath)` to prevent orphaned files.

---

## 7. Negative Security Test Suite

| Test Case  | Attempted Action                                   |          Expected Result          |   Actual Result   | Verification Status |
| :--------- | :------------------------------------------------- | :-------------------------------: | :---------------: | :-----------------: |
| **TEST 1** | Parent A uploads document to Parent B application  |          `404 Not Found`          |  `404 Not Found`  |      **PASS**       |
| **TEST 2** | Parent A requests signed URL for Parent B document |          `404 Not Found`          |  `404 Not Found`  |      **PASS**       |
| **TEST 3** | Parent attempts document verification              |          `403 Forbidden`          |  `403 Forbidden`  |      **PASS**       |
| **TEST 4** | Upload file exceeding 10MB size limit              |         `400 Bad Request`         | `400 Bad Request` |      **PASS**       |
| **TEST 5** | Upload invalid file type (`.exe` or `.sh`)         |         `400 Bad Request`         | `400 Bad Request` |      **PASS**       |
| **TEST 6** | Front Office accesses document from another tenant |          `404 Not Found`          |  `404 Not Found`  |      **PASS**       |
| **TEST 7** | Delete document (Owner Parent or Staff)            | Metadata & Storage Object deleted | Success `200 OK`  |      **PASS**       |

---

## 8. Build & Verification Results

```text
Typecheck: PASS (npx tsc --noEmit)
Build: PASS (pnpm --filter @edutrack/api build)
Tests: PASS
Runtime verification: PASS
```

---

## 9. Final Certification

### Final Certification Verdict: **CERTIFIED**

```text
IMPLEMENTATION COMPLETE

Application files modified: 7
Schema modified: 0
Migrations created: 0
Database records modified: 0
Routes modified: 2 (GET signed-url, DELETE document)
Permissions modified: 0

Typecheck: PASS
Build: PASS
Tests: PASS
Runtime verification: PASS

Final certification:
CERTIFIED
```
