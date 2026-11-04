# EduTrack ERP — Parent Mobile App

# Phase 3 — Backend API Integration Matrix

## 1. Overview

This matrix documents every backend API endpoint integrated into the Parent Mobile App during Phase 3, mapped against the backend controller, service, and HTTP contract.

---

## 2. API Endpoint Matrix

| Module            | HTTP Method | Endpoint Path                         | Backend Controller / Route Handler                           | Auth Guard / RBAC                        | Payload / Parameters                                             |
| ----------------- | ----------- | ------------------------------------- | ------------------------------------------------------------ | ---------------------------------------- | ---------------------------------------------------------------- |
| **Auth**          | `POST`      | `/v1/auth/login`                      | `auth.controller.ts`                                         | Public                                   | `{ email, password }`                                            |
| **Auth**          | `POST`      | `/v1/admission/register`              | `admission.routes.ts`                                        | Public                                   | `{ email, phone, name }`                                         |
| **Auth**          | `POST`      | `/v1/admission/verify-otp`            | `admission.routes.ts`                                        | Public                                   | `{ phone, otp }`                                                 |
| **Auth**          | `POST`      | `/v1/auth/refresh`                    | `auth.controller.ts`                                         | Public / Refresh Token                   | `{ refreshToken }`                                               |
| **Auth**          | `POST`      | `/v1/auth/logout`                     | `auth.controller.ts`                                         | Bearer Token                             | None                                                             |
| **Parents**       | `GET`       | `/v1/parents/:id/students`            | `parent-student.controller.ts`                               | Bearer Token (Self-service enabled)      | `parentId` in URL                                                |
| **Finance**       | `GET`       | `/v1/fees/my`                         | `fees.routes.ts` (`ParentFinanceService.getMyChildrenFees`)  | Bearer Token                             | Query: None (authenticated parent)                               |
| **Finance**       | `GET`       | `/v1/fees/my/children/:studentId`     | `fees.routes.ts` (`ParentFinanceService.getChildFeeDetails`) | Bearer Token (Strict relationship check) | `studentId` in URL                                               |
| **Finance**       | `GET`       | `/razorpay/config`                    | `razorpay.routes.ts`                                         | Bearer Token / Public safe               | None                                                             |
| **Finance**       | `POST`      | `/create-order`                       | `razorpay.routes.ts`                                         | Bearer Token                             | `{ studentId, studentChargeDueId, amount }`                      |
| **Finance**       | `POST`      | `/verify-payment`                     | `razorpay.routes.ts`                                         | Bearer Token                             | `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }` |
| **Finance**       | `GET`       | `/v1/fees/receipts/:id`               | `fees.routes.ts`                                             | Bearer Token                             | `id` in URL                                                      |
| **Admissions**    | `GET`       | `/v1/applications?mine=true`          | `admission.routes.ts`                                        | Bearer Token                             | `mine=true` query                                                |
| **Admissions**    | `GET`       | `/v1/applications/:id`                | `admission.routes.ts`                                        | Bearer Token                             | `id` in URL                                                      |
| **Admissions**    | `POST`      | `/v1/applications`                    | `admission.routes.ts`                                        | Bearer Token                             | Application form body                                            |
| **Admissions**    | `GET`       | `/v1/applications/:id/documents`      | `admission.routes.ts`                                        | Bearer Token                             | `id` in URL                                                      |
| **Admissions**    | `POST`      | `/v1/applications/:id/documents`      | `admission.routes.ts`                                        | Bearer Token                             | FormData multipart                                               |
| **Admissions**    | `GET`       | `/v1/applications/:id/assessment`     | `admission.routes.ts`                                        | Bearer Token                             | `id` in URL                                                      |
| **Admissions**    | `GET`       | `/v1/applications/:id/decision`       | `admission.routes.ts`                                        | Bearer Token                             | `id` in URL                                                      |
| **Admissions**    | `GET`       | `/v1/applications/:id/fee`            | `admission.routes.ts`                                        | Bearer Token                             | `id` in URL                                                      |
| **Admissions**    | `POST`      | `/v1/applications/:id/payment`        | `admission.routes.ts`                                        | Bearer Token                             | `{ payment_mode }`                                               |
| **Admissions**    | `GET`       | `/v1/applications/:id/receipt`        | `admission.routes.ts`                                        | Bearer Token                             | `id` in URL                                                      |
| **Admissions**    | `GET`       | `/v1/applications/:id/timeline`       | `admission.routes.ts`                                        | Bearer Token                             | `id` in URL                                                      |
| **Notifications** | `GET`       | `/v1/notifications`                   | `notification.routes.ts`                                     | Bearer Token                             | Optional: `page`, `limit`                                        |
| **Notifications** | `GET`       | `/v1/notifications/unread-count`      | `notification.routes.ts`                                     | Bearer Token                             | None                                                             |
| **Notifications** | `PATCH`     | `/v1/notifications/:id/read`          | `notification.routes.ts`                                     | Bearer Token                             | `id` in URL                                                      |
| **Notifications** | `POST`      | `/v1/notifications/mark-all-read`     | `notification.routes.ts`                                     | Bearer Token                             | None                                                             |
| **Academics**     | `GET`       | `/v1/students/:id/attendance/summary` | `academicsApi` (with resilient fallback)                     | Bearer Token                             | `id` in URL, `month` query                                       |
| **Academics**     | `GET`       | `/v1/students/:id/timetable/week`     | `academicsApi` (with resilient fallback)                     | Bearer Token                             | `id` in URL                                                      |
| **Academics**     | `GET`       | `/v1/students/:id/homework`           | `academicsApi` (with resilient fallback)                     | Bearer Token                             | `id` in URL                                                      |
| **Academics**     | `GET`       | `/v1/students/:id/exams`              | `academicsApi` (with resilient fallback)                     | Bearer Token                             | `id` in URL                                                      |
| **Academics**     | `GET`       | `/v1/students/:id/results`            | `academicsApi` (with resilient fallback)                     | Bearer Token                             | `id` in URL                                                      |
| **Helpdesk**      | `GET`       | `/v1/helpdesk/tickets`                | `helpdeskApi` (with resilient fallback)                      | Bearer Token                             | None                                                             |
| **Helpdesk**      | `POST`      | `/v1/helpdesk/tickets`                | `helpdeskApi` (with resilient fallback)                      | Bearer Token                             | `{ category, priority, subject, description }`                   |
| **Helpdesk**      | `GET`       | `/v1/helpdesk/tickets/:id/replies`    | `helpdeskApi` (with resilient fallback)                      | Bearer Token                             | `id` in URL                                                      |
| **Helpdesk**      | `POST`      | `/v1/helpdesk/tickets/:id/replies`    | `helpdeskApi` (with resilient fallback)                      | Bearer Token                             | `{ message }`                                                    |
| **Transport**     | `GET`       | `/v1/students/:id/transport`          | `transportApi` (with resilient fallback)                     | Bearer Token                             | `id` in URL                                                      |
| **Library**       | `GET`       | `/v1/students/:id/library`            | `libraryApi` (with resilient fallback)                       | Bearer Token                             | `id` in URL                                                      |

---

## 3. Resilience & Degradation Guarantees

1. **Network Error Containment**: Every API call is wrapped with try/catch blocks that prevent unhandled promise rejections from crashing the UI thread.
2. **Offline Mode**: If the device loses network connectivity, cached state remains accessible in Zustand and AsyncStorage.
3. **No Phantom Production Data**: In the absence of server data, modules display honest, dignified empty states rather than hardcoded mock records.
