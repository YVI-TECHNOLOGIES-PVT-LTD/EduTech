# EduTrack ERP Workspace Rules

## Phase 3 Business Module Rules

> **Never assume database objects. Every repository, DTO mapper, validator, service, and query must use only models, relations, enums, and fields that exist in the current generated Prisma Client. If a required business feature cannot be implemented because the finalized schema lacks the necessary table or column, document it as a recommendation instead of inventing it.**

---

## Architectural Guidelines

1. **Prisma-First Domain Model**:
   - Operate directly on Prisma models and mapped response DTOs.
   - Do NOT create unnecessary Domain Entity layers.

2. **Decoupled Read & Write Operations**:
   - Encapsulate complex read aggregations, searches, and metrics inside dedicated `queries/` objects.
   - Keep transactional writes and state transitions inside dedicated services.

3. **Stage-1 Constraints**:
   - Absolutely ZERO database DDL, SQL, or Prisma schema changes allowed during business module implementation.
