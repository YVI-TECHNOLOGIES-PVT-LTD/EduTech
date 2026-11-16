# JWT Implementation Audit Report

**Service Layer**: `sessionService` (`src/auth/session.service.ts`) & Supabase Auth Engine

---

## 1. Token Claims & Specification

- **Algorithm**: HS256 / RS256.
- **Payload Claims**: `sub` (userId), `email`, `role`, `school_id`, `exp`, `iat`.
- **Session Validation**: Validated against Supabase Auth & local session cache.
- **Rotation Strategy**: Refresh tokens rotated upon `POST /v1/auth/refresh`.
