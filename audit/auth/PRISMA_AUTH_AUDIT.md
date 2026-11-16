# Prisma Auth Audit Report

**Schema Reference**: `apps/backend/prisma/schema.prisma`

---

## 1. Identity & Auth Schema Models

- `User`: Primary account model with `id`, `email`, `organization_id`, `status`, `login_status`.
- `Role`: System role model with `id`, `name`, `description`.
- `Permission`: System permission model with `id`, `code`, `description`.
- `UserRole`: Join model mapping users to roles (`user_id`, `role_id`).
- `RolePermission`: Join model mapping roles to permissions (`role_id`, `permission_id`).
- `UserSession`: Active session tracking model with `user_id`, `token_hash`, `expires_at`.
