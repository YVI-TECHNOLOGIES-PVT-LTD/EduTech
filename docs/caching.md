# EduTrack Caching & Distributed State Platform

> **Document Version:** 1.0.0  
> **Owner:** EduTrack Platform Team  
> **Status:** Approved  
> **Last Updated:** 2026-07-29

---

## 1. Overview & Architecture

The `@edutrack/api` backend utilizes a portable caching abstraction (`CacheService`) backed by an in-memory TTL adapter with Redis interface preparation. Direct imports of Redis or external cache libraries in application services are strictly FORBIDDEN.

## 2. Cache Key Governance & Factory (`CacheKeyFactory`)

All cache keys MUST originate from `CacheKeyFactory` (`apps/api/src/cache/cache-key.factory.ts`).

### Canonical Key Schemes

- **RBAC Permissions**: `cache:rbac:permissions:<role>`
- **User Roles**: `cache:rbac:user_roles:<userId>`
- **Auth Session**: `cache:auth:session:<sessionId>`
- **Admission Master Data**: `cache:admission:master_data`
- **Admission Enquiries**: `cache:admission:enquiries:<queryHash>`

---

## 3. Cache Ownership Governance Table

| Cache Domain           | Owner Service     | Default TTL | Invalidation Trigger             | Fallback Behavior             |
| :--------------------- | :---------------- | :---------: | :------------------------------- | :---------------------------- |
| **RBAC Permissions**   | RBAC Service      |     30m     | Role or permission update        | Query DB & refresh cache      |
| **Master Data**        | Admission Service |     24h     | Master data configuration change | Query DB & refresh cache      |
| **User Session State** | Auth Service      |     15m     | User logout / password reset     | Return null & re-authenticate |
| **Enquiries Query**    | Admission Service |     10m     | New enquiry submission           | Query DB                      |

---

## 4. Current Production Limitation — Single-Instance Only (No Redis)

As of this branch, `CacheService` is backed exclusively by
`InMemoryCacheAdapter` — a plain in-process JavaScript `Map`. No Redis (or
any other external) backend is installed or wired up
(`ioredis`/`bullmq` are not dependencies anywhere in this monorepo). The
same is true of the background job queue (`JobService` /
`QueueAdapter` in `apps/backend/src/jobs/`), which is also an in-process
array-backed queue.

This is safe to deploy to a single Render web service instance, but it has
real consequences that must be understood before scaling:

- **Not persistent.** Every cache entry and every queued job
  (`email-queue`, `sms-queue`, `push-queue`, `report-queue`,
  `export-queue`, `import-queue`, `audit-queue`) is lost on any process
  restart — including routine Render deploys, crashes, and dyno
  cycling.
- **Not shared across instances.** If the Render service is ever scaled
  to more than one instance, each instance has its own independent cache
  and queue with no coordination between them. A job enqueued on one
  instance will never be picked up by another.
- **No distributed locking or rate limiting.** Any future feature that
  needs cross-instance coordination (distributed locks, shared rate
  limits, OTP throttling, etc.) cannot be safely built on top of this
  adapter.

**This remediation pass deliberately did not introduce Redis.** Replacing
`InMemoryCacheAdapter`/`QueueAdapter` with a real Redis-backed
implementation (e.g. `ioredis` for caching, `bullmq` for queues) is a
tracked future scalability requirement, to be taken up as its own piece of
work once horizontal scaling or job durability is actually needed — not
bundled into a deployment-configuration change.
