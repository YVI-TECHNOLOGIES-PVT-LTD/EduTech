# EduTrack ERP — Document Upload vs Document Verification UX Separation Report

## 1. Executive Summary

This report documents the architectural and visual refactoring of the Parent Portal document UX, establishing a strict separation of concerns between:
1. **Application Wizard — Step 05 (`/app/admissions/wizard` -> Step 05)**: Pure **Document Upload** semantics.
2. **Parent Portal — Document Center (`/app/admissions/documents`)**: Canonical location for **Document Verification & Review Lifecycle**.

---

## 2. Problem Statement & Old Behavior

Previously, Step 05 of the Application Wizard rendered school desk verification badges (`VERIFIED`, `VERIFICATION SUCCESS`, `IN REVIEW`, `PENDING VERIFICATION`, `ACTION NEEDED`) during initial document upload.

This created visual confusion by collapsing two separate lifecycle phases into one:
- **Uploading a file is NOT document verification.**
- **Security scan passing is NOT school desk verification.**

---

## 3. New Architecture & UX Separation

### A. Application Wizard Step 05 (Upload Documents)
Component: [`ParentDocumentsStep.tsx`](file:///C:/Users/DELL/Desktop/EduTech/apps/web_app/src/modules/admission/pages/parent/ParentDocumentsStep.tsx) & [`DocumentUploadCard.tsx`](file:///C:/Users/DELL/Desktop/EduTech/apps/web_app/src/modules/admission/components/DocumentUploadCard.tsx)

- **Responsibilities**: Collecting/uploading required documents, enforcing file size limits (max 5 MB), file format guidelines (PDF/JPG/PNG), displaying upload status (`No file uploaded`, `Uploaded ✓`, file name, file size), and providing upload/replace/remove actions.
- **Removed Badges**: ALL business review/verification statuses (`VERIFIED`, `VERIFICATION SUCCESS`, `IN REVIEW`, `PENDING VERIFICATION`, `ACTION NEEDED`, `AI VERIFIED`) have been completely removed from Step 05.

### B. Document Center (Verification Vault)
Component: [`ParentDocumentCenterPage.tsx`](file:///C:/Users/DELL/Desktop/EduTech/apps/web_app/src/modules/admission/pages/parent/ParentDocumentCenterPage.tsx) & [`DocumentVerificationCard.tsx`](file:///C:/Users/DELL/Desktop/EduTech/apps/web_app/src/modules/admission/components/DocumentVerificationCard.tsx)

- **Responsibilities**: Serving as the single authoritative portal for school admission desk verification status (`VERIFIED`, `IN REVIEW`, `ACTION NEEDED`, `REJECTED`, `APPROVED`).
- **Card Design**: Renders clean document cards displaying document title, requirement badge (`Required` / `Optional`), file metadata, verification status pill, rejection/action reason message, and document actions (`View`, `Replace`, `Remove`).

---

## 4. Preservation of System Constraints

- **Backend Changes**: 0
- **Database / Schema / SQL / DDL / Migration Changes**: 0
- **Existing API Contracts & Auth**: 100% preserved.

---

## 5. Verification Results

- **Frontend Typecheck (`pnpm --filter @edutrack/web typecheck`)**: Exit Code 0 (PASS)
- **Frontend Build (`pnpm --filter @edutrack/web build`)**: Exit Code 0 (PASS)
- **Backend Typecheck (`pnpm --filter @edutrack/api typecheck`)**: Exit Code 0 (PASS)
- **Backend Build (`npx tsc`)**: Exit Code 0 (PASS)
- **Git Audit (`git status --short`)**: Verified zero database / backend modification.
