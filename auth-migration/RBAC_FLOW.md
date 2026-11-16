# Native RBAC & Permission Flow Specification

**Database Models**: `users` ➔ `user_roles` ➔ `roles` ➔ `role_permissions` ➔ `permissions`

---

## 1. RBAC Authorization Pipeline

1. `SessionService` fetches user roles and permissions dynamically via Prisma ORM joins.
2. `req.context.user.roles` and `req.context.user.permissions` are populated on every request.
3. `checkPermission(PERMISSIONS.*)` middleware evaluates `req.context.user.permissions`.
4. Role `SUPERADMIN` bypasses permission evaluations.
5. All database operations enforce tenant isolation using `org_id` / `school_id`.
