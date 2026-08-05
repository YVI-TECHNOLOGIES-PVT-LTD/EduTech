# EduTrack ERP — API Endpoint Inventory Ledger

**Generated Date:** August 5, 2026  
**Source of Truth:** Physical code parsing of [`apps/backend/src/routes.ts`](file:///c:/Program%20Files/EduTech/apps/backend/src/routes.ts) and module router definitions.

---

## 1. Public & System Infrastructure Endpoints

| Method | Endpoint Path            | Auth Requirement | Controller / Handler  | Response Payload                                                |
| :----- | :----------------------- | :--------------- | :-------------------- | :-------------------------------------------------------------- |
| `GET`  | `/health`                | None             | Inline Handler        | `{ status: 'ok', timestamp: string }`                           |
| `GET`  | `/health/liveness`       | None             | Inline Handler        | `{ status: 'alive', service: string, timestamp: string }`       |
| `GET`  | `/health/readiness`      | None             | Database Ping Handler | `{ status: 'ready', service: string, database: 'connected' }`   |
| `GET`  | `/system/info`           | None             | Inline Handler        | `{ mode: string }`                                              |
| `GET`  | `/schools`               | None             | Inline DB Query       | `Array<{ id: string, name: string, code: string }>`             |
| `GET`  | `/public/academic-year`  | None             | Inline DB Query       | `{ id: string, year_label: string }`                            |
| `GET`  | `/public/academic-years` | None             | Inline DB Query       | `Array<{ id: string, year_label: string, is_active: boolean }>` |

---

## 2. Admission & CRM Module Endpoints

| Method | Endpoint Path                    | Auth / Permission Requirement                    | Router Location                                                                                                      |
| :----- | :------------------------------- | :----------------------------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/v1/admission/public-apply`     | None (Public Application)                        | [admission.routes.ts](file:///c:/Program%20Files/EduTech/apps/backend/src/modules/admission/admission.routes.ts)     |
| `POST` | `/admissions/public-apply`       | None (Public Legacy Alias)                       | [admission.routes.ts](file:///c:/Program%20Files/EduTech/apps/backend/src/modules/admission/admission.routes.ts)     |
| `POST` | `/admissions`                    | `authenticateOptional`                           | [admission.routes.ts](file:///c:/Program%20Files/EduTech/apps/backend/src/modules/admission/admission.routes.ts)     |
| `GET`  | `/v1/admission/crm/leads`        | `authenticate` + `checkPermission(LEADS_VIEW)`   | [crm.routes.ts](file:///c:/Program%20Files/EduTech/apps/backend/src/modules/admission/crm.routes.ts)                 |
| `POST` | `/v1/admission/crm/leads`        | `authenticate` + `checkPermission(LEADS_CREATE)` | [crm.routes.ts](file:///c:/Program%20Files/EduTech/apps/backend/src/modules/admission/crm.routes.ts)                 |
| `GET`  | `/v1/admission/application/my`   | `authenticate`                                   | [application.routes.ts](file:///c:/Program%20Files/EduTech/apps/backend/src/modules/admission/application.routes.ts) |
| `POST` | `/v1/admission/documents/upload` | `authenticate`                                   | [document.routes.ts](file:///c:/Program%20Files/EduTech/apps/backend/src/modules/admission/document.routes.ts)       |
| `POST` | `/v1/admission/evaluations`      | `authenticate` + Permission                      | [evaluation.routes.ts](file:///c:/Program%20Files/EduTech/apps/backend/src/modules/admission/evaluation.routes.ts)   |
| `GET`  | `/v1/admission/assessment`       | `authenticate`                                   | [assessment.routes.ts](file:///c:/Program%20Files/EduTech/apps/backend/src/modules/admission/assessment.routes.ts)   |
| `POST` | `/v1/admission/enrollment`       | `authenticate` + Admin Permission                | [enrollment.routes.ts](file:///c:/Program%20Files/EduTech/apps/backend/src/modules/admission/enrollment.routes.ts)   |

---

## 3. Student & Attendance Endpoints

| Method | Endpoint Path             | Auth / Permission Requirement     | Router Location                                                                                                  |
| :----- | :------------------------ | :-------------------------------- | :--------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/v1/students`            | `authenticate` + Student Read     | [student.routes.ts](file:///c:/Program%20Files/EduTech/apps/backend/src/modules/student/student.routes.ts)       |
| `GET`  | `/v1/students/attendance` | `authenticate`                    | [attendance.routes.ts](file:///c:/Program%20Files/EduTech/apps/backend/src/modules/student/attendance.routes.ts) |
| `POST` | `/v1/students/attendance` | `authenticate` + Attendance Write | [attendance.routes.ts](file:///c:/Program%20Files/EduTech/apps/backend/src/modules/student/attendance.routes.ts) |

---

## 4. Fees, Administration & Data Import Endpoints

| Method | Endpoint Path           | Auth / Permission Requirement | Router Location                                                                                         |
| :----- | :---------------------- | :---------------------------- | :------------------------------------------------------------------------------------------------------ |
| `GET`  | `/v1/fees/structures`   | `authenticate`                | [fees.routes.ts](file:///c:/Program%20Files/EduTech/apps/backend/src/modules/fees/fees.routes.ts)       |
| `POST` | `/v1/fees/payments`     | `authenticate`                | [fees.routes.ts](file:///c:/Program%20Files/EduTech/apps/backend/src/modules/fees/fees.routes.ts)       |
| `GET`  | `/v1/admin/users`       | `authenticate` + Admin Role   | [admin.routes.ts](file:///c:/Program%20Files/EduTech/apps/backend/src/modules/admin/admin.routes.ts)    |
| `POST` | `/v1/admin/bulk-export` | `authenticate` + Admin Role   | [bulk.routes.ts](file:///c:/Program%20Files/EduTech/apps/backend/src/modules/admin/bulk.routes.ts)      |
| `POST` | `/v1/import/upload`     | `authenticate` + Admin Role   | [import.routes.ts](file:///c:/Program%20Files/EduTech/apps/backend/src/modules/import/import.routes.ts) |

---

## 5. Workflow & System Task Endpoints

| Method | Endpoint Path                 | Auth / Permission Requirement | Router Location                                                                                        |
| :----- | :---------------------------- | :---------------------------- | :----------------------------------------------------------------------------------------------------- |
| `GET`  | `/v1/workflows`               | `authenticate`                | [workflow.routes.ts](file:///c:/Program%20Files/EduTech/apps/backend/src/workflows/workflow.routes.ts) |
| `POST` | `/v1/workflows/tasks/approve` | `authenticate`                | [task.routes.ts](file:///c:/Program%20Files/EduTech/apps/backend/src/workflows/task.routes.ts)         |
