# ADR 0003: Adoption of Prisma ORM

## Status

Accepted

## Context

EduTrack requires multi-schema PostgreSQL management (`auth` and `public` schemas) with end-to-end type safety between database tables and API services.

## Decision

We adopted Prisma ORM (`@prisma/client@5.22.0`).

## Consequences

- **Positive:** Declarative schema definition in `schema.prisma`.
- **Positive:** Automatically generated TypeScript types matching database schemas.
