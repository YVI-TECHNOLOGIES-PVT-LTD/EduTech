# EduTrack ERP — Mobile Implementation Gate

# Final Security Hardening, Verification & Implementation Approval

**Document**: `MOBILE_IMPLEMENTATION_GATE.md`  
**Date**: August 22, 2026  
**Status**: Approved & Verified

---

## A. Security Fixes

### 1. Assessment Query IDOR Fix

- **Files Modified**:
  - `apps/backend/src/modules/admission-management/controllers/admission-assessment.controller.ts` (`getByApplicationId`)
  - `apps/backend/src/modules/admission-management/services/admission.assessment.service.ts` (`getAssessmentByApplication`)
- **Fix Details**:
  Extracts `req.context?.user`, determines `isOnlyParent` role status, and passes `parentUserId` to `AdmissionAssessmentService.getAssessmentByApplication(id, orgId, parentUserId)`. The repository enforces parent ownership filtering:
  ```prisma
  where: {
    application_id: id,
    org_id: orgId,
    OR: [
      { leads: { parents: { user_id: parentUserId } } },
      { created_by: parentUserId },
      { leads: { created_by: parentUserId } }
    ]
  }
  ```
  Unauthorized access attempts (Parent A querying Parent B's application) immediately return `404 Not Found`.

### 2. Decision Query IDOR Fix

- **Files Modified**:
  - `apps/backend/src/modules/admission-management/controllers/admission-decision.controller.ts` (`getByApplicationId`)
  - `apps/backend/src/modules/admission-management/services/admission.decision.service.ts` (`getDecisionByApplication`)
- **Fix Details**:
  Extracts `req.context?.user`, determines `isOnlyParent` role status, and passes `orgId` and `parentUserId` to `AdmissionDecisionService.getDecisionByApplication(id, orgId, parentUserId)`. The service queries `AdmissionRepository.findById(applicationId, orgId, parentUserId)`. Unauthorized access attempts immediately return `404 Not Found`.

### 3. Fail-Closed Authentication Role Resolution

- **File Modified**: `apps/backend/src/auth/auth.service.ts` (`login`)
- **Fix Details**:
  Replaced unsafe fallback defaulting unknown users to `PARENT`. The authentication service now strictly verifies `prisma.parents` link and throws `401/403` error (`User account has no active assigned roles. Access denied.`) if no active role or parent record exists.

---

## B. Tests and Results

### 1. Dedicated Parent IDOR & Authorization Regression Suite

- **File**: `apps/backend/src/modules/admission-management/tests/parent-idor-authorization.spec.ts`
- **Execution Command**: `npx ts-node src/modules/admission-management/tests/parent-idor-authorization.spec.ts`
- **Results**: **8/8 PASSED (0 FAILED)**
  - `✓ TEST 1`: Parent A can access their own Application A assessment (Marks: 88, Result: Pass).
  - `✓ TEST 2`: Parent A can access their own Application A decision (Status: Approved, Scholarship: 15%).
  - `✓ TEST 3`: Parent A CANNOT access Parent B application assessment (**IDOR Blocked $\rightarrow$ 404**).
  - `✓ TEST 4`: Parent A CANNOT access Parent B application decision (**IDOR Blocked $\rightarrow$ 404**).
  - `✓ TEST 5`: Front Office / Staff within Org A can view Application A & B assessments.
  - `✓ TEST 6`: Front Office / Staff within Org A can view Application A & B decisions.
  - `✓ TEST 7`: Cross-tenant access is denied when Org B requests Org A application.
  - `✓ TEST 8`: Controller layer `getByApplicationId` enforces parent ownership and returns 404 for unauthorized parent.

### 2. Stage-1 Master Integration Test Runner

- **File**: `apps/backend/src/tests/stage1-master-test-runner.ts`
- **Execution Command**: `npx ts-node src/tests/stage1-master-test-runner.ts`
- **Results**: **44/44 TESTS PASSED (7/7 MODULES PASSED)**
  - `✓ Lead Management`: 7/7 passed.
  - `✓ Admission Management`: 22/22 passed.
  - `✓ Student Management`: 3/3 passed.
  - `✓ Parent Management`: 3/3 passed.
  - `✓ Academic Management`: 3/3 passed.
  - `✓ Staff Management`: 3/3 passed.
  - `✓ User Management`: 3/3 passed.

### 3. Backend Typecheck

- **Command**: `tsc --noEmit` in `apps/backend`
- **Result**: **0 TypeScript compilation errors (Exit Code 0)**.

---

## C. Final Canonical API List

The following are the **active, verified API endpoints** consumed by the Parent Portal and to be consumed by Mobile V1:

| Domain            | Method  | URL Endpoint                                | Auth / Role      | Purpose                                      |
| :---------------- | :------ | :------------------------------------------ | :--------------- | :------------------------------------------- |
| **Auth**          | `POST`  | `/v1/auth/login`                            | Public           | Parent login (Email/Phone + Password)        |
| **Auth**          | `POST`  | `/v1/admission/register`                    | Public           | Self-service Parent registration             |
| **Auth**          | `POST`  | `/v1/admission/verify-otp`                  | Public           | 6-digit OTP verification                     |
| **Metadata**      | `GET`   | `/public/admission/config`                  | Public           | School config, academic years, grades        |
| **Metadata**      | `GET`   | `/public/academic-years`                    | Public           | Available academic session years             |
| **Metadata**      | `GET`   | `/public/classes`                           | Public           | Grade / Class levels                         |
| **Metadata**      | `GET`   | `/v1/applications/document-types`           | Authenticated    | Mandatory & optional document categories     |
| **Applications**  | `GET`   | `/v1/applications?mine=true`                | `PARENT`         | List all child applications for parent       |
| **Applications**  | `GET`   | `/v1/applications/:id`                      | `PARENT` (Owned) | Fetch single application details             |
| **Applications**  | `POST`  | `/v1/applications`                          | `PARENT`         | Create new admission application draft       |
| **Applications**  | `PATCH` | `/v1/applications/:id/status`               | `PARENT` (Owned) | Submit application (validates document gate) |
| **Documents**     | `POST`  | `/v1/applications/:id/documents`            | `PARENT` (Owned) | Multipart binary upload to storage vault     |
| **Documents**     | `GET`   | `/v1/applications/documents/:id/signed-url` | `PARENT` (Owned) | 15-min pre-signed viewing URL                |
| **Assessment**    | `GET`   | `/v1/applications/:id/assessment`           | `PARENT` (Owned) | Retrieve entrance exam scores & remarks      |
| **Decision**      | `GET`   | `/v1/applications/:id/decision`             | `PARENT` (Owned) | Retrieve committee decision & scholarship    |
| **Fees**          | `GET`   | `/v1/applications/:id/fee`                  | `PARENT` (Owned) | Get authoritative fee breakdown & status     |
| **Fees**          | `POST`  | `/v1/applications/:id/payment`              | `PARENT` (Owned) | Record simulated ledger fee payment          |
| **Fees**          | `GET`   | `/v1/applications/:id/receipt`              | `PARENT` (Owned) | Fetch official itemized payment receipt      |
| **Notifications** | `GET`   | `/v1/notifications`                         | `PARENT`         | List user notification feed                  |
| **Notifications** | `GET`   | `/v1/notifications/unread-count`            | `PARENT`         | Count unread notification badge              |
| **Notifications** | `PATCH` | `/v1/notifications/:id/read`                | `PARENT`         | Mark single notification as read             |
| **Notifications** | `POST`  | `/v1/notifications/mark-all-read`           | `PARENT`         | Mark all notifications as read               |
| **Realtime**      | `WS`    | `/ws/notifications`                         | JWT Token        | Live WebSocket notification stream           |

---

## D. Final Verified Parent Screens

1. **Sign In Screen**: Mobile authentication with secure credential entry.
2. **Registration Screen**: Parent registration with dynamic password strength indicators.
3. **OTP Verification Screen**: 6-cell auto-focus PIN input with countdown timer.
4. **Parent Dashboard Screen**: Hero active application card, quick actions, child carousel.
5. **My Applications Screen**: Multi-child application list with status chips and search.
6. **8-Step Admission Wizard**:
   - Step 1: Admission Guidelines & Instructions
   - Step 2: Student Profile & Basic Demographics
   - Step 3: Parent / Guardian Information
   - Step 4: Academic History & Previous School
   - Step 5: Document Upload Vault
   - Step 6: Fee Statement & Payment Selection
   - Step 7: Comprehensive Review & Declaration
   - Step 8: Submission Confirmation & Application Number
7. **Admission Status & Decision Tracker**: 5-stage timeline, decision alert (Offer/Waitlist), SIS Enrolled Student Card.
8. **Fee Statement & Payment Screen**: Authoritative fees, mode selection, receipt viewing.
9. **Read-Only Application Viewer**: Post-submission field inspection with change request modal.
10. **Notifications Feed**: Chronological event feed with unread count badge.

---

## E. Final Mobile V1 Scope

The Mobile V1 scope is restricted to exact web parity plus necessary native UX adaptations:

- **Authentication**: JWT token storage in `SecureStore`, biometric unlock hooks.
- **Draft Persistence**: Auto-save form state to `AsyncStorage` (replacing web `localStorage`).
- **Camera & Files**: Native camera capture and document picker (`expo-image-picker` / `expo-document-picker`).
- **Receipt Sharing**: Native document sharing and PDF printing (`expo-sharing` / `expo-print`).
- **Realtime Alerts**: WebSocket client connection to `/ws/notifications` + HTTP polling fallback.
- **Child Switcher**: Carousel / Pill selector for multi-student guardian workflows.

---

## F. Explicit Exclusions

The following features are **strictly excluded** from Mobile V1:

1. **Third-Party Payment Gateway SDKs (Razorpay / Stripe)**: Excluded until production gateway keys and webhook endpoints are deployed. Mobile V1 will match Web V1 ledger settlement.
2. **Native FCM / APNs Push Daemons**: Backend lacks device token storage models. Handled via WebSocket and polling.
3. **Staff Desks & Review Portals**: Staff workflows are strictly reserved for the Web Admin Portal.
4. **Dormant Prototype Endpoints**: `/dashboard/parent/overview`, `/v1/admission/my`, `/v1/admission/apply`, `/v1/admission/application/documents/upload` are completely excluded.

---

## G. Remaining Risks

- **Payment Webhooks**: In Stage-2, when integrating live Razorpay/Stripe gateways, webhook signature verification endpoints must be added to the backend.
- **Push Notification Token Storage**: In Stage-2, a `user_device_tokens` table should be added to `schema.prisma` to enable native background push notifications when the app is closed.

---

## Final Verdict

# READY FOR MOBILE IMPLEMENTATION
