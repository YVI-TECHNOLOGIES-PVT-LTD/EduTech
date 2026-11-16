# Authentication Endpoints Audit Report

**Scope**: Read-Only Inspection of Authentication Endpoints  
**Output Path**: `/audit/auth/AUTH_ENDPOINTS.md`

---

## 1. Discovered Auth Endpoints Summary

| Endpoint                         | Method |          Public / Protected           | Route Mount Location                                | Controller / Handler                |
| -------------------------------- | :----: | :-----------------------------------: | --------------------------------------------------- | ----------------------------------- |
| `/api/v1/auth/login`             | `POST` | Public Intent (Blocked by Middleware) | `src/modules/user-management/routes/user.routes.ts` | `UserController.login`              |
| `/api/v1/auth/logout`            | `POST` |               Protected               | `src/modules/user-management/routes/user.routes.ts` | `UserController.logout`             |
| `/api/v1/auth/refresh`           | `POST` |               Protected               | `src/modules/user-management/routes/user.routes.ts` | `UserController.refresh`            |
| `/api/v1/auth/change-password`   | `POST` |               Protected               | `src/modules/user-management/routes/user.routes.ts` | `UserController.changePassword`     |
| `/api/v1/me`                     | `GET`  |               Protected               | `src/routes.ts` (Line 360)                          | Express inline async handler        |
| `/api/v1/admission/public-apply` | `POST` |                Public                 | `src/routes.ts` (Line 70)                           | `publicApplicationController.apply` |
