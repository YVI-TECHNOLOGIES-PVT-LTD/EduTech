# EduTrack ERP — Redis Service Configuration

> **Status:** Foundation Active — Redis is wired into `CacheService` (ADR-009) but no endpoint reads from or writes to it yet.
> **Phase:** Caching Foundation (endpoint-level cache-aside usage is a future phase)

## Overview

This directory is reserved for Redis configuration files (`redis.conf`, ACL definitions, TLS certs) as the deployment grows more advanced. The container itself runs with sane defaults (`redis-server --appendonly yes`) defined in `docker/compose/docker-compose.redis.yml` — no config file is required to get started.

## Enabling Redis

Redis is off by default; the backend runs on `InMemoryCacheAdapter` until you opt in.

1. Start the Redis container (overlay on top of the base stack):
   ```bash
   docker-compose -f docker/compose/docker-compose.yml -f docker/compose/docker-compose.redis.yml up -d redis
   ```
2. In `apps/backend/.env`, set:
   ```bash
   CACHE_PROVIDER=redis
   REDIS_URL=redis://localhost:6379   # or redis://redis:6379 when the API also runs in Docker
   ```
3. Restart the API. `CacheService` will select `RedisCacheAdapter` and connect on startup — see `docs/caching.md`.

If Redis is unreachable, connection errors are logged and the process keeps running; it does not fall back to memory mid-flight (the provider is chosen once at startup), so treat Redis as available whenever `CACHE_PROVIDER=redis` is set.

## Current Capabilities

- `RedisCacheAdapter implements ICacheAdapter` — `get`, `set`, `delete`, `clear`, `exists`, `ttl`, `invalidatePattern`.
- Singleton connection with automatic reconnect, startup connect, and graceful shutdown (`apps/backend/src/cache/redis.client.ts`).
- Redis status surfaced through `cacheService.getMetrics()` and the `/health` endpoints.

## Reserved for Future Phases

- Distributed BullMQ queue broker
- Distributed rate limiting (`express-rate-limit-redis`)
- WebSocket pub/sub state synchronization
- Endpoint-level cache-aside reads/writes (RBAC permissions, master data, sessions, enquiries — see `docs/caching.md`)
