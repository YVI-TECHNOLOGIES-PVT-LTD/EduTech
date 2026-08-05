# ADR 0004: Prisma ORM with PostgreSQL Relational Database

- **Status:** Accepted
- **Date:** 2026-08-05

## Context

EduTrack ERP requires a relational database platform adhering to 3NF standards, multi-tenant isolation, and type-safe query building.

## Decision

Use PostgreSQL 15+ managed database schema with Prisma ORM 5.22 as the query builder and schema management engine.

## Consequences

- Automatic TypeScript type generation for database models.
- Relational integrity with foreign keys, indexes, and automated updated_at triggers.
