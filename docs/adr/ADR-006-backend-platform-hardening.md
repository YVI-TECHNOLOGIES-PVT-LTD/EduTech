# ADR-006: Backend Platform Hardening & Operational Security

## Status
Accepted

## Context
The `@edutrack/api` backend required enterprise-grade operational hardening, including standardized middleware ordering, request correlation tracing, structured JSON logging, fail-fast startup environment validation, and operational health check probes.

## Decision
We implement cross-cutting platform infrastructure in `@edutrack/api`:
1. **Request Correlation (`X-Request-Id`)**: Propagated across request headers, response headers, structured logs, and Phase 2.3 error envelopes.
2. **Structured Logging Abstraction**: Standardized JSON format with automatic masking of sensitive keys (`password`, `token`, `secret`).
3. **Three-Tier Rate Limiting**: Separate limits for public, auth, and authenticated routes.
4. **Phase 2.3 Error Envelope Compliance**: Global exception handler returning standardized error envelopes.
5. **Fail-Fast Environment Validation**: Startup verification using Zod in `config/env.ts` with documentation in `docs/configuration.md`.
6. **Operational Probes**: `/health`, `/health/live`, `/health/ready`.
7. **Graceful Shutdown**: `SIGTERM` / `SIGINT` handlers closing HTTP server cleanly.

## Consequences
### Positive
- Unified request correlation tracing and log auditing.
- Fail-fast process startup preventing runtime misconfiguration crashes.
- Zero impact on application business logic, Prisma schemas, or DB data.

### Negative
- Require strict adherence to middleware execution ordering when adding new global middlewares.

## Rollback Strategy
Revert backend application entry points (`app.ts`, `server.ts`) to previous middleware configurations.
