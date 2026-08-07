# Native Session Management Specification

**Session Cache**: In-Memory Cache with 5-minute TTL + Prisma Database Verification

---

## 1. Session Lifecycle

1. **Authentication**: Successful `AuthService.login()` issues signed JWT token containing user identity claims.
2. **Validation**: `authenticate` middleware calls `SessionService.validateSession(token)`.
3. **Prisma Lookup**: `SessionService` verifies JWT signature via `jwt.verify()` and checks user active status via `prisma.users.findUnique()`.
4. **Context Attachment**: Attaches `req.context.user` with `id`, `email`, `school_id`, `roles`, `permissions`, and `login_status`.
5. **Logout**: `POST /auth/logout` invalidates local session cache and completes cleanly.
