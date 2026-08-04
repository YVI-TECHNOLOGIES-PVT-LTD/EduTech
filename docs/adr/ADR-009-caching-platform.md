# ADR-009: Caching & Distributed State Platform

## Status
Accepted

## Context
The `@edutrack/api` backend required a centralized caching platform to reduce database query loads, cache frequent RBAC permissions and master data queries, and provide a portable abstraction layer without tightly coupling business services to Redis or specific caching libraries.

## Decision
We implement a portable caching abstraction in `@edutrack/api`:
1. **`CacheService` Abstraction**: `apps/api/src/cache/cache.service.ts` provides `get()`, `set()`, `delete()`, `invalidatePattern()`. Application services depend strictly on `CacheService`. Direct imports of Redis or third-party cache clients are prohibited.
2. **`CacheKeyFactory` Governance**: Centralized key generation in `apps/api/src/cache/cache-key.factory.ts`.
3. **Cache Ownership Governance**: Documented TTLs, invalidation triggers, and fallback mechanisms in `docs/caching.md`.
4. **Health Probe Integration**: Integrated cache memory metrics into `/health` and `/health/ready` endpoints.

## Consequences
### Positive
- Portable caching abstraction allows seamless future migration from in-memory TTL to Redis without changing application service code.
- Predictable cache key names and TTL governance across all backend modules.
- Zero impact on database schemas or existing API contracts.

### Negative
- Require maintaining invalidation pattern calls during entity mutations.

## Rollback Strategy
Revert `apps/api/src/cache/` files and remove `cacheService` imports from backend routes.
