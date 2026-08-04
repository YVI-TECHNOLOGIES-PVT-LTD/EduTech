# ADR 0003: Prisma Schema Ownership

## Status
Accepted

## Context
Deciding whether Prisma ORM schema and client generation should be extracted into a shared `packages/database` or retained within the backend API.

## Decision
Retain Prisma schema and client directly within `apps/api/src/prisma` owned by the backend service. Extract to `packages/database` only if an additional service (e.g. background worker or separate microservice) directly queries the database.

## Consequences
- Adheres to YAGNI ("You Aren't Gonna Need It").
- Avoids premature package abstraction overhead.
- Simple single-service deployment and migration management.
