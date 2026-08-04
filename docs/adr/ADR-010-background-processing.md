# ADR-010: Background Processing & Event-Driven Platform

## Status
Accepted

## Context
The `@edutrack/api` backend required asynchronous background job execution, scheduled maintenance tasks, and versioned domain event broadcasting without coupling business modules to specific queue engines or third-party message brokers.

## Decision
We implement background processing and event-driven architecture in `@edutrack/api`:
1. **`JobService` Abstraction Layer**: `apps/api/src/jobs/job.service.ts` provides a portable job enqueueing interface. Direct queue driver imports in business services are prohibited.
2. **Queue Governance**: Defined priority, concurrency, retry limits, exponential backoff, and dead-letter queues (DLQ).
3. **Worker & Scheduler Runtime**: Created `worker.service.ts` and `scheduler.service.ts` for background execution and periodic cron maintenance.
4. **Versioned Domain Events**: Created `event-bus.service.ts` publishing versioned domain events (`AdmissionCreated.v1`, `StudentEnrolled.v1`, `FeePaid.v1`).
5. **Idempotent Workers**: All queue workers enforce idempotency to prevent duplicate side-effects.

## Consequences
### Positive
- Modular asynchronous queue execution decoupled from specific queue providers.
- Operationally inspectable Dead-Letter Queues and health probe metrics.
- Zero change to business logic, API contracts, database schemas, or frontend/mobile runtimes.

### Negative
- Requires worker runtime initialization during server bootstrap.

## Rollback Strategy
Revert `apps/api/src/jobs/` and `apps/api/src/events/` files and stop worker runtimes in `server.ts`.
