# EduTrack ERP — Stage 3 Phase 2: Background Workers, Queues & Cache Hardening Report (WS9)

> **Workstream:** WS9 — Bounded In-Memory Runtimes, Graceful Timer Shutdown & Explicit Health Honesty  
> **Primary Artifacts:** [`apps/backend/src/jobs/queue.adapter.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/jobs/queue.adapter.ts), [`apps/backend/src/jobs/worker.service.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/jobs/worker.service.ts), [`apps/backend/src/jobs/scheduler.service.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/jobs/scheduler.service.ts), [`apps/backend/src/cache/cache.adapter.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/cache/cache.adapter.ts), [`apps/backend/src/routes/health.routes.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/routes/health.routes.ts)  
> **Verification Status:** **PASSED** (`stage3-phase2-hardening.spec.ts` WS9 checks)

---

## 1. Objectives & Hardening Changes

### 1.1 Bounded Queue Adapter & Retry Timer Lifecycle ([`queue.adapter.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/jobs/queue.adapter.ts))

- Added `QueueAdapter.MAX_PROCESSED_HISTORY = 5000` with FIFO eviction (`processedOrder` + `processedJobIds`) so unbounded `Set` growth cannot leak memory in long-running processes.
- Tracked retry backoff `setTimeout` handles in `this.retryTimers`, marked handles `.unref?.()` so pending retries do not prevent clean process exit, and implemented `clearRetryTimers()` called during shutdown.
- Exposed explicit runtime honesty metadata via `getRuntimeMetadata()` (`mode: 'IN_MEMORY_BEST_EFFORT'`, `durable: false`, `persistence: 'volatile_process_memory'`, `processedHistorySize`, `maxProcessedHistory`, `pendingRetryTimers`).

### 1.2 Worker & Scheduler Non-Overlap & Shutdown Safety ([`worker.service.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/jobs/worker.service.ts), [`scheduler.service.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/jobs/scheduler.service.ts))

- Added `isTicking` re-entrancy guards in both `WorkerService` (3s tick) and `SchedulerService` (10m tick) so slow iterations cannot overlap concurrently.
- Applied `.unref?.()` on `setInterval` handles and explicitly cleared `intervalId = null` (plus `queueAdapter.clearRetryTimers()`) inside `stop()`.
- Logs explicitly disclose `IN_MEMORY_BEST_EFFORT mode (non-durable)` on startup; `getStatus()` surfaces live `isRunning`, `isTicking`, and volatility flags.

### 1.3 Bounded Cache Adapter ([`cache.adapter.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/cache/cache.adapter.ts), [`cache.service.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/cache/cache.service.ts))

- Enforced `InMemoryCacheAdapter.MAX_ENTRIES = 5000` inside `set()`: when full, purges expired entries first (`purgeExpired()`), then evicts the oldest key (FIFO) if still at capacity.
- `CacheService.getMetrics()` explicitly reports `provider: 'InMemory'`, `mode: 'IN_MEMORY_SINGLE_INSTANCE'`, `durable: false`, `maxEntries: 5000`.

### 1.4 Honest PostgreSQL Health & Readiness Probes ([`health.routes.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/routes/health.routes.ts))

- `GET /health` and `GET /health/ready` execute `await prisma.$queryRaw\`SELECT 1\``directly against PostgreSQL instead of probing REST endpoints, returning`503 not_ready` when DB connectivity fails.
- Both endpoints expose `cache` (`durable: false`) and `queueRuntime: jobService.getRuntimeStatus()` (`mode: 'IN_MEMORY_BEST_EFFORT'`, `durable: false`) so operators/load balancers have transparent single-instance durability signals before Stage 3 AI Copilot job orchestration is added.

### 1.5 Unused Event Bus Clarity ([`events/event-bus.service.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/events/event-bus.service.ts))

- Annotated the unused `events/event-bus.service.ts` stub with `@deprecated` JSDoc noting zero production callers and pointing to active [`workflows/event-bus.service.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/workflows/event-bus.service.ts).
