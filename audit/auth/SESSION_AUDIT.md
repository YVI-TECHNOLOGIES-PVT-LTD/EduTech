# Session Management Audit Report

**Service Layer**: `sessionService` (`src/auth/session.service.ts`)

---

## 1. Session Storage & Revocation

- **Session Table**: Active user sessions tracked in `user_sessions` with expiration timestamps.
- **Logout Action**: `POST /auth/logout` deletes active session record.
- **Invalidation**: Inactive or expired sessions return `401 Unauthorized`.
