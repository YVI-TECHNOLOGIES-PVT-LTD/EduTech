# EduTrack ERP Workspace Rules & Source of Truth Hierarchy

## Primary Governing Constraints

1. **`schema.prisma` (`apps/backend/prisma/schema.prisma`) is the SOLE Source of Truth for Database Models**.
   - Every repository, service, controller, DTO mapper, validator, and query MUST use only models, relations, enums, and fields that exist in `apps/backend/prisma/schema.prisma`.
   - Never invent fields, relations, enums, tables, or assumptions from older SQL scripts, planning documents, or reports.
   - If older design docs, reports, or SQL files conflict with `schema.prisma`, **`schema.prisma` wins without exception**.

2. **Existing Backend API Implementation Contract**:
   - Backend APIs must be built strictly against `schema.prisma`.
   - Existing backend controller/service implementations are the authoritative contract unless an explicit defect is identified.
   - Frontend RTK Query endpoints must consume existing backend API endpoints rather than creating parallel API contracts.

3. **Stage-1 & Implementation Freeze**:
   - Absolutely ZERO database DDL, SQL, or Prisma schema changes allowed during frontend or business module implementation.
   - If a required feature cannot be implemented because `schema.prisma` lacks the necessary table or column, document it as a recommendation instead of modifying the schema or inventing fields.

---

## Architectural Guidelines

1. **Prisma-First Domain Model**:
   - Operate directly on Prisma models and mapped response DTOs.
   - Do NOT create unnecessary Domain Entity layers.

2. **Decoupled Read & Write Operations**:
   - Encapsulate complex read aggregations, searches, and metrics inside dedicated `queries/` objects.
   - Keep transactional writes and state transitions inside dedicated services.

3. **Working Source-of-Truth Hierarchy**:
   ```text
   FINALIZED DATABASE
          │
          ▼
   apps/backend/prisma/schema.prisma
          │
          ▼
   Existing Backend API Implementation
          │
          ▼
   Backend Routes / Controllers / Services
          │
          ▼
   RTK Query API Layer
          │
          ▼
   Web Application UI
   ```
