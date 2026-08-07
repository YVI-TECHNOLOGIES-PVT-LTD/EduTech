# EduTrack Caching & Distributed State Platform

> **Document Version:** 1.0.0  
> **Owner:** EduTrack Platform Team  
> **Status:** Approved  
> **Last Updated:** 2026-07-29

---

## 1. Overview & Architecture

The `@edutrack/api` backend utilizes a portable caching abstraction (`CacheService`) backed by a pluggable `ICacheAdapter`. Two adapters exist today — `InMemoryCacheAdapter` (default) and `RedisCacheAdapter` — selected centrally by `CacheService` based on the `CACHE_PROVIDER` environment variable. Direct imports of Redis or external cache libraries in application services are strictly FORBIDDEN; `apps/backend/src/cache/redis.client.ts` is the only module permitted to import `ioredis`.

**Status:** The Redis foundation (adapter, connection management, health reporting) is implemented and production-ready, but no endpoint currently reads from or writes through the cache — see §5.

## 1.1 Enabling Redis

Redis is disabled by default (`CACHE_PROVIDER=memory`), so existing behaviour is unchanged unless a developer opts in.

| Variable                        | Default  | Description                                                            |
| :------------------------------ | :------- | :--------------------------------------------------------------------- |
| `CACHE_PROVIDER`                | `memory` | `memory` uses `InMemoryCacheAdapter`; `redis` uses `RedisCacheAdapter` |
| `REDIS_URL`                     | -        | Required when `CACHE_PROVIDER=redis`, e.g. `redis://localhost:6379`    |
| `REDIS_CONNECT_TIMEOUT_MS`      | `5000`   | ioredis connection timeout                                             |
| `REDIS_MAX_RETRIES_PER_REQUEST` | `3`      | ioredis per-command retry limit                                        |

To enable Redis locally:

```bash
docker-compose -f docker/compose/docker-compose.yml -f docker/compose/docker-compose.redis.yml up -d redis
```

then set `CACHE_PROVIDER=redis` and `REDIS_URL=redis://localhost:6379` in `apps/backend/.env` and restart the API. If `CACHE_PROVIDER=redis` is set without `REDIS_URL`, `CacheService` logs a warning and falls back to `InMemoryCacheAdapter` rather than failing to start. Once running, connection lifecycle (`Connected` / `Disconnected` / `Reconnecting` / errors) is logged, and Redis reachability + latency are reported via `cacheService.getMetrics()` and the `/health` and `/health/ready` endpoints.

## 1.2 Using CacheService (future endpoint integration)

Callers only ever depend on `CacheService` — never on `ICacheAdapter`, `RedisCacheAdapter`, or `ioredis` directly. The intended cache-aside pattern for future work:

```ts
const key = CacheKeyFactory.students.detail(id);
const cached = await cacheService.get(key);
if (cached) return cached;

const data = await studentRepository.findById(id);
await cacheService.set(key, data, { ttlMs: CacheTTL.MASTER_DATA });
return data;
```

This pattern is **not yet applied to any endpoint** — see §5.

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

## 5. Rollout Status

The table above documents the _intended_ ownership for each cache domain once endpoint integration lands; it does not describe current runtime behaviour. As of this writing:

- ✅ `CacheService`, `InMemoryCacheAdapter`, `RedisCacheAdapter`, provider switching, connection management, and health reporting are complete (see §1.1–1.2).
- ❌ No controller, service, or repository calls `cacheService.get/set` for any of the domains above yet. All reads still go straight to the database/Supabase.
- ❌ Session migration to Redis, BullMQ queue migration, pub/sub, and rate limiting remain future, separately-scoped phases.

Endpoint-level cache-aside integration (RBAC permissions, master data, sessions, enquiries) is deliberately deferred until the current backend refactor is complete, to avoid caching data shapes that are still in flux.
