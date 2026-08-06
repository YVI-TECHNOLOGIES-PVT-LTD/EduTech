# EduTrack ERP — Backend Architecture (`BACKEND_ARCHITECTURE.md`)

**Generated Date:** August 5, 2026  
**Source of Truth:** Physical code audit of [`apps/backend/src/app.ts`](file:///c:/Program%20Files/EduTech/apps/backend/src/app.ts) and [`apps/backend/src/server.ts`](file:///c:/Program%20Files/EduTech/apps/backend/src/server.ts).

---

## 1. Express Application Architecture & Pipeline

```
                              HTTP Request
                                   |
                                   v
                  +----------------------------------+
                  |  1. Trust Proxy Configuration    |
                  +----------------+-----------------+
                                   |
                                   v
                  +----------------------------------+
                  |  2. Compression Middleware (Gzip)|
                  +----------------+-----------------+
                                   |
                                   v
                  +----------------------------------+
                  |  3. Request ID Correlation       |
                  +----------------+-----------------+
                                   |
                                   v
                  +----------------------------------+
                  |  4. Helmet HTTP Security Headers |
                  +----------------+-----------------+
                                   |
                                   v
                  +----------------------------------+
                  |  5. Centralized CORS Middleware  |
                  +----------------+-----------------+
                                   |
                                   v
                  +----------------------------------+
                  |  6. Express JSON Body Parser     |
                  +----------------+-----------------+
                                   |
                                   v
                  +----------------------------------+
                  |  7. Express Rate Limiter         |
                  +----------------+-----------------+
                                   |
                                   v
                  +----------------------------------+
                  |  8. Structured Request Logger    |
                  +----------------+-----------------+
                                   |
                                   v
                  +----------------------------------+
                  |  9. API Router (/api)            |
                  |     (auth -> rbac -> controller) |
                  +----------------+-----------------+
                                   |
                       +-----------+-----------+
                       |                       |
                       v                       v
            +--------------------+   +--------------------+
            | 10. 404 Not Found  |   | 11. Error Handler  |
            +--------------------+   +--------------------+
```

---

## 2. Controller & Service Component Mapping

| Layer Component               | Implementation Directory                                                                                          | Primary Responsibility                                |
| :---------------------------- | :---------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------- |
| **Authentication Middleware** | [`apps/backend/src/auth/`](file:///c:/Program%20Files/EduTech/apps/backend/src/auth)                              | Validates Supabase JWTs & builds `req.context.user`   |
| **RBAC Authorization**        | [`apps/backend/src/rbac/`](file:///c:/Program%20Files/EduTech/apps/backend/src/rbac)                              | Enforces role and granular permission codes           |
| **Module Routers**            | [`apps/backend/src/modules/`](file:///c:/Program%20Files/EduTech/apps/backend/src/modules)                        | Defines endpoint URIs, HTTP verbs, and handlers       |
| **Controllers**               | `*.controller.ts` files                                                                                           | Validates input DTOs and sends HTTP JSON responses    |
| **Services**                  | `*.service.ts` files                                                                                              | Executes business validation and data transformations |
| **ORM / Client Layer**        | [`apps/backend/src/lib/prismaClient.ts`](file:///c:/Program%20Files/EduTech/apps/backend/src/lib/prismaClient.ts) | Executes PostgreSQL queries via Prisma & Supabase     |
