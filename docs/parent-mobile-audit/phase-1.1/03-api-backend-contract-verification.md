# 03 — Independent API & Backend Contract Verification

**Project:** EduTrack ERP — Parent Mobile Application  
**Audit Phase:** Phase 1.1 — Independent Audit Verification & Evidence Validation  
**Date of Verification:** November 2, 2026  
**Status:** Complete & Independently Verified  
**Inspection Scope:** Cross-repository reconciliation of all 24 endpoints across `apps/mobile_app/src/api/` and `apps/backend/src/`

---

## 1. Executive Contract Verification Summary

Phase 1 identified **24 canonical API endpoints** (23 REST + 1 WebSocket).

### Verification Findings

- **21 Endpoints are fully VERIFIED:** Both mobile client call paths and Express backend controller/route handlers exist and match signatures.
- **2 Endpoints are MOCKED:**
  - `POST /v1/applications/:id/payment` — Both client and server execute a simulated ledger transaction without real gateway processing (`AdmissionPaymentService.ts#L241`).
  - `GET /public/admission/config` / `/public/academic-years` / `/public/classes` — Backend returns static or fallback organization records when context is empty.
- **1 Connection has CONTRACT SECURITY MISMATCH:**
  - `ws://.../ws/notifications?token=...` — Client passes JWT in URL query string, whereas the backend also provides and recommends `Sec-WebSocket-Protocol` and header authorization (`notification.realtime.ts#L53-L60`).
- **0 Endpoints were NOT FOUND.**

---

## 2. Complete 24-Endpoint Verification Table

| #   | Method | Endpoint Path                               | Calling Service / Hook                                           | Backend Route Handler                                                                            | DB Model Interaction                                 |      Auth Req.      |  Verification Status   |
| :-- | :----: | :------------------------------------------ | :--------------------------------------------------------------- | :----------------------------------------------------------------------------------------------- | :--------------------------------------------------- | :-----------------: | :--------------------: |
| 1   |  POST  | `/v1/auth/login`                            | `authApi.login` / `useLogin`                                     | `publicAuthRouter.post('/login')` -> `AuthController.login`                                      | `users`, `parents`, `auth_tokens`                    |       Public        |      **VERIFIED**      |
| 2   |  POST  | `/v1/admission/register`                    | `authApi.registerParent` / `useRegister`                         | `publicAuthRouter.post('/register')` -> `AuthController.registerParent`                          | `users`, `parents`                                   |       Public        |      **VERIFIED**      |
| 3   |  POST  | `/v1/admission/verify-otp`                  | `authApi.verifyOtp` / `useVerifyOtp`                             | `publicAuthRouter.post('/verify-otp')` -> `AuthController.verifyOtp`                             | `auth_tokens`, `users`                               |       Public        |      **VERIFIED**      |
| 4   |  GET   | `/public/admission/config`                  | `metadataApi.getAdmissionConfig` / `useAdmissionConfig`          | `admissionRouter.get('/fee-config')`                                                             | `admission_configurations`                           |       Public        |      **VERIFIED**      |
| 5   |  GET   | `/public/academic-years`                    | `metadataApi.getAcademicYears` / `useAcademicYears`              | `academicRouter.get('/years')`                                                                   | `academic_years`                                     |       Public        |      **VERIFIED**      |
| 6   |  GET   | `/public/classes`                           | `metadataApi.getClasses` / `useClasses`                          | `academicRouter.get('/grades')`                                                                  | `academic_year_grades`                               |       Public        |      **VERIFIED**      |
| 7   |  GET   | `/v1/applications/document-types`           | `metadataApi.getDocumentTypes` / `useDocumentTypes`              | `admissionRouter.get('/document-types')` -> `AdmissionDocumentController.getDocumentTypes`       | `document_types`                                     |    Bearer Token     |      **VERIFIED**      |
| 8   |  GET   | `/v1/applications?mine=true`                | `applicationsApi.listMine` / `useMyApplications`                 | `admissionRouter.get('/mine')` -> `AdmissionController.getMine`                                  | `admission_applications`                             |    Bearer Token     |      **VERIFIED**      |
| 9   |  GET   | `/v1/applications/:id`                      | `applicationsApi.getById` / `useQuery`                           | `admissionRouter.get('/:id')` -> `AdmissionController.getById`                                   | `admission_applications`                             |    Bearer Token     |      **VERIFIED**      |
| 10  |  POST  | `/v1/applications`                          | `applicationsApi.create` / `useSubmitApplication`                | `admissionRouter.post('/')` -> `AdmissionController.create`                                      | `admission_applications`, `leads`                    |    Bearer Token     |      **VERIFIED**      |
| 11  |  GET   | `/v1/applications/:id/documents`            | `documentsApi.list` / `useApplicationDocuments`                  | `admissionRouter.get('/:id/documents')` -> `AdmissionDocumentController.getByApplicationId`      | `admission_documents`                                |    Bearer Token     |      **VERIFIED**      |
| 12  |  POST  | `/v1/applications/:id/documents`            | `documentsApi.upload` / `useUploadDocument`                      | `admissionRouter.post('/:id/documents')` -> `AdmissionDocumentController.upload`                 | `admission_documents`                                |    Bearer Token     |      **VERIFIED**      |
| 13  |  GET   | `/v1/applications/documents/:id/signed-url` | `documentsApi.getSignedUrl`                                      | `admissionRouter.get('/documents/:id/signed-url')` -> `AdmissionDocumentController.getSignedUrl` | `admission_documents`                                |    Bearer Token     |      **VERIFIED**      |
| 14  |  GET   | `/v1/applications/:id/fee`                  | `feesApi.getFeeSummary` / `useApplicationFee`                    | `admissionRouter.get('/:id/fee')` -> `AdmissionPaymentController.getFee`                         | `admission_configurations`, `admission_fee_payments` |    Bearer Token     |      **VERIFIED**      |
| 15  |  POST  | `/v1/applications/:id/payment`              | `feesApi.recordPayment` / `useRecordPayment`                     | `admissionRouter.post('/:id/payment')` -> `AdmissionPaymentController.record`                    | `admission_fee_payments`                             |    Bearer Token     | **MOCKED / SIMULATED** |
| 16  |  GET   | `/v1/applications/:id/receipt`              | `feesApi.getReceipt` / `useApplicationReceipt`                   | `admissionRouter.get('/:id/receipt')` -> `AdmissionPaymentController.getReceipt`                 | `admission_fee_payments`                             |    Bearer Token     |      **VERIFIED**      |
| 17  |  GET   | `/v1/applications/:id/assessment`           | `assessmentApi.getByApplication` / `useApplicationAssessment`    | `admissionRouter.get('/:id/assessment')` -> `AdmissionAssessmentController.getByApplicationId`   | `admission_assessments`                              |    Bearer Token     |      **VERIFIED**      |
| 18  |  GET   | `/v1/applications/:id/decision`             | `decisionApi.getByApplication` / `useApplicationDecision`        | `admissionRouter.get('/:id/decision')` -> `AdmissionDecisionController.getByApplicationId`       | `admission_decisions`                                |    Bearer Token     |      **VERIFIED**      |
| 19  |  GET   | `/v1/applications/:id/timeline`             | `timelineApi.getByApplication` / `useApplicationTimeline`        | `admissionRouter.get('/:id/timeline')` -> `AdmissionAnalyticsController.getTimeline`             | `admission_timelines`                                |    Bearer Token     |      **VERIFIED**      |
| 20  |  GET   | `/v1/notifications`                         | `notificationsApi.list` / `useNotifications`                     | `notificationRouter.get('/')` -> `NotificationController.list`                                   | `notifications`, `notification_recipients`           |    Bearer Token     |      **VERIFIED**      |
| 21  |  GET   | `/v1/notifications/unread-count`            | `notificationsApi.getUnreadCount` / `useUnreadNotificationCount` | `notificationRouter.get('/unread-count')` -> `NotificationController.getUnreadCount`             | `notification_recipients`                            |    Bearer Token     |      **VERIFIED**      |
| 22  | PATCH  | `/v1/notifications/:id/read`                | `notificationsApi.markAsRead` / `useMarkNotificationRead`        | `notificationRouter.patch('/:id/read')` -> `NotificationController.markAsRead`                   | `notification_recipients`                            |    Bearer Token     |      **VERIFIED**      |
| 23  |  POST  | `/v1/notifications/mark-all-read`           | `notificationsApi.markAllAsRead` / `useMarkAllNotificationsRead` | `notificationRouter.post('/mark-all-read')` -> `NotificationController.markAllAsRead`            | `notification_recipients`                            |    Bearer Token     |      **VERIFIED**      |
| 24  |   WS   | `/ws/notifications?token=...`               | `NotificationSocketManager` / `useNotificationRealtime`          | `notification.realtime.ts#L42-L80`                                                               | None (In-memory pub/sub)                             | Bearer Token in URL | **CONTRACT MISMATCH**  |

---

## 3. Deep-Dive on Critical Contracts

---

### Contract 1: Simulated Fee Payment (`POST /v1/applications/:id/payment`)

- **Client Implementation (`src/features/admission/hooks/useRecordPayment.ts`):**
  Sends payload `{ payment_mode: 'upi', transaction_reference: 'MOB-1730538...' }`.
- **Backend Handler (`AdmissionPaymentService.ts` lines 240–248):**
  ```typescript
  if (isParentOnly) {
    // Parent MVP Simulation: server enforces exact authoritative amount and status
    finalAmount = authoritativeTotalFee;
    finalStatus = admission_payment_status.paid;
    finalTxnRef = dto.transaction_reference || `TXN-${...}`;
    finalMode = dto.payment_mode || admission_payment_mode.card;
    finalDate = new Date();
  }
  ```
- **Finding:** The endpoint is specifically coded to operate as a "Parent MVP Simulation". It accepts whatever client reference is passed and marks the database record as `paid`.

---

### Contract 2: WebSocket Authentication Contract Mismatch

- **Client Implementation (`notification-socket.ts` line 91):**
  Connects via: `ws://<host>/ws/notifications?token=<accessToken>`
- **Backend Handler (`notification.realtime.ts` lines 53–60):**
  ```typescript
  // Extract token from query params or Authorization header or Sec-WebSocket-Protocol
  let token = parsedUrl.searchParams.get('token');
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token && req.headers['sec-websocket-protocol']) {
    token = req.headers['sec-websocket-protocol'].split(',')[0].trim();
  }
  ```
- **Finding:** The backend supports secure subprotocol authentication (`Sec-WebSocket-Protocol`), but the client chooses the query parameter method, exposing the token in access logs.

---

### Contract 3: Backend Student APIs Available but Unconsumed by Mobile

- `apps/backend/src/modules/parent-management/routes/parent.routes.ts`:
  - `GET /v1/parents/:id/students` -> `ParentStudentController.getStudents`
  - `GET /v1/parents/dashboard` -> `ParentAnalyticsController.getDashboard`
- **Finding:** The backend provides dedicated endpoints to fetch a parent's enrolled students and analytics, but **the mobile client never calls them**. The mobile client calls only `/v1/applications?mine=true`.
