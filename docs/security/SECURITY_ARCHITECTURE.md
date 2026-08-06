# EduTrack ERP — Security Architecture (`SECURITY_ARCHITECTURE.md`)

**Generated Date:** August 5, 2026  
**Source of Truth:** Code audit of security components in [`apps/backend/src/auth`](file:///c:/Program%20Files/EduTech/apps/backend/src/auth) and [`apps/backend/src/rbac`](file:///c:/Program%20Files/EduTech/apps/backend/src/rbac).

---

## 1. Security Architecture Implementation Matrix

| Security Layer            |    Status     | Code Artifact / Package                                                                                      | Implementation Details                                                |
| :------------------------ | :-----------: | :----------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------- |
| **Authentication**        | `IMPLEMENTED` | [`session.service.ts`](file:///c:/Program%20Files/EduTech/apps/backend/src/auth/session.service.ts)          | Supabase Auth JWT token validation and user profile session retrieval |
| **RBAC Authorization**    | `IMPLEMENTED` | [`rbac.middleware.ts`](file:///c:/Program%20Files/EduTech/apps/backend/src/rbac/rbac.middleware.ts)          | Role checks & granular permission code enforcement (`permissions.ts`) |
| **HTTP Security Headers** | `IMPLEMENTED` | `helmet` (`^7.1.0`)                                                                                          | Cross-Origin resource policy & HTTP header protection in `app.ts`     |
| **CORS Policy**           | `IMPLEMENTED` | `cors` (`^2.8.5`)                                                                                            | Whitelisted origin validation in `app.ts`                             |
| **Rate Limiting**         | `IMPLEMENTED` | `express-rate-limit` (`^8.2.1`)                                                                              | Rate limiters on login (`/api/auth/login`) and public endpoints       |
| **Audit Trail Logging**   | `IMPLEMENTED` | [`audit.middleware.ts`](file:///c:/Program%20Files/EduTech/apps/backend/src/middlewares/audit.middleware.ts) | Captures incoming API requests and writes to `audit_log_entries`      |
| **Input Validation**      | `IMPLEMENTED` | `zod` (`^3.22.4`)                                                                                            | Strict schema validation across DTOs and API requests                 |
| **Secrets Management**    |   `PARTIAL`   | `.env` files                                                                                                 | Environment variable secret handling                                  |

---

## 2. Planned Security Enhancements (`ROADMAP / NOT IMPLEMENTED`)

- **ABAC Policy Engine:** Dynamic attribute-based policies (Planned for future phase).
- **Argon2 Hashing Migration:** Application-level password hashing (Currently delegated to Supabase Auth).
- **Vault / AWS Secrets Manager:** Centralized hardware security module secrets storage (Planned).
- **HTTP Parameter Pollution (HPP):** `hpp` Express protection package (Planned).
