# EduTrack ERP Platform Architecture Blueprint

## System Architecture Diagram

```text
[ React 19 Admin Web App ] ──(HTTP/REST + JWT)──> [ NestJS Backend API Gateway ]
        │                                                     │
   RTK Query Caching                                  Prisma ORM Layer
        │                                                     │
[ Local Redux Store ]                                [ PostgreSQL Database ]
```

---

## Technical Principles

1. **Prisma-First Domain Model**: Backend operates directly on Prisma models and mapped response DTOs without redundant entity mappers.
2. **Decoupled Client Architecture**: Frontend is a thin consumer communicating over REST APIs with JWT auth and `x-tenant-id` multi-tenancy header propagation.
3. **Redux Toolkit & RTK Query**: Single source of truth for global state and server data fetching with tag-based invalidation.
4. **Feature-Based Isolation**: Each frontend feature module is self-contained under `src/features/<module>/`.
5. **Strict Security & RBAC**: Double-layer authorization (Route Guards + UI PermissionGuards) enforcing role and permission matrices.
