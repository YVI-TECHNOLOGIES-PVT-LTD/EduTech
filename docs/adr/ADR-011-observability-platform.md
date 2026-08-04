# ADR-011: Observability & Operational Excellence Platform

## Status
Accepted

## Context
The EduTrack platform required centralized observability, structured JSON logging, distributed tracing propagation (`requestId`, `correlationId`), metrics collection, operational alert thresholds, and Service Level Objectives (SLOs) without altering business logic or database schemas.

## Decision
We implement enterprise observability in `@edutrack/api`:
1. **`LoggerService`**: `apps/api/src/observability/logger.service.ts` providing structured JSON log records with automatic sensitive field masking (`password`, `token`, `secret`).
2. **`MetricsService`**: `apps/api/src/observability/metrics.service.ts` capturing HTTP request volume, error rates, average latency, and queue depths.
3. **Trace Correlation**: Propagating `X-Request-Id` and `X-Correlation-Id` across API endpoints, background workers, and event subscribers.
4. **Health Probe Extension**: Exposing DB, Cache, Queue, Worker, and Metrics telemetry in `/health` and `/health/ready`.
5. **SLO Targets**: Documented SLO objectives and alert thresholds in `docs/slo.md`.

## Consequences
### Positive
- End-to-end operational visibility across microservices, background queues, and worker runtimes.
- Standardized SLO definitions and metric reporting in production.
- Zero change to application business logic, Prisma schemas, or client interfaces.

### Negative
- Slight CPU overhead for JSON log formatting and metric aggregation.

## Rollback Strategy
Revert `apps/api/src/observability/` files and remove telemetry calls from backend entry points.
