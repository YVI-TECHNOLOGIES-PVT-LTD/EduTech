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

| Cache Domain | Owner Service | Default TTL | Invalidation Trigger | Fallback Behavior |
| :--- | :--- | :---: | :--- | :--- |
| **RBAC Permissions** | RBAC Service | 30m | Role or permission update | Query DB & refresh cache |
| **Master Data** | Admission Service | 24h | Master data configuration change | Query DB & refresh cache |
| **User Session State** | Auth Service | 15m | User logout / password reset | Return null & re-authenticate |
| **Enquiries Query** | Admission Service | 10m | New enquiry submission | Query DB |
