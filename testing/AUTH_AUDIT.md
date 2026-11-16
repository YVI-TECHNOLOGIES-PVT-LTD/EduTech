# EduTrack ERP — Authentication & Authorization Audit

**Security Baseline**: JWT Bearer Tokens + Refresh Token Rotation + Multi-Tenant Scoping (`x-tenant-id`)

---

## 1. Authentication Lifecycle Audit

| Security Feature                         | Implementation Mechanism                                                                                     | Verification Result |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------ | :-----------------: |
| **Login (`POST /auth/login`)**           | Validates bcrypt password hash, generates `accessToken` + `refreshToken`, stores session in `user_sessions`. |       ✅ PASS       |
| **Token Refresh (`POST /auth/refresh`)** | Rotates access token and invalidates previous refresh token in single transaction.                           |       ✅ PASS       |
| **Logout (`POST /auth/logout`)**         | Deletes active session from `user_sessions` table.                                                           |       ✅ PASS       |
| **Session Invalidation**                 | Expired tokens return `401 Unauthorized` with `TOKEN_EXPIRED` code.                                          |       ✅ PASS       |

---

## 2. Multi-Tenant & RBAC Scoping Audit

- **Tenant Scoping (`x-tenant-id`)**: Enforced by `TenantMiddleware`. Every database query is scoped to `organization_id`.
- **SuperAdmin Bypass**: Role `SUPERADMIN` bypasses tenant scoping for system-wide operations.
- **RBAC Matrix**: `checkPermission` guard checks user permission set against endpoint requirements.
