# ADR 0002: Express.js with TypeScript for Backend API Platform

- **Status:** Accepted
- **Date:** 2026-08-05

## Context

The backend API service requires a fast, predictable, and maintainable Node.js framework for handling HTTP requests, authentication middleware, and database operations.

## Decision

Use Express 4.22 with TypeScript 5.3 as the primary backend API platform (`@edutrack/api`).

## Consequences

- Lightweight, unopinionated routing pipeline.
- Comprehensive middleware ecosystem (`helmet`, `cors`, `express-rate-limit`, `compression`).
- Type safety across API endpoints and request handlers.
