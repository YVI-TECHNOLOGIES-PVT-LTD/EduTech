# EduTrack API Versioning Strategy

> **Document Version:** 1.0.0  
> **Owner:** EduTrack Platform Team  
> **Status:** Approved  
> **Last Updated:** 2026-07-29  

---

## 1. Versioning Policy
- **URI-Path Versioning**: All API requests MUST use explicit version prefixes: `/api/v1/...`
- **Mandatory Versioning**: Versioning is strictly required for all endpoints. Unversioned API routes are forbidden.
- **No Version Mixing**: Clients must target a single API version per workflow session.
- **No `/api/latest` Alias**: `/api/latest` is explicitly forbidden to prevent breaking changes for clients when new API major versions launch.

---

## 2. Lifecycle & Deprecation
- **v1 (Current)**: Active production API release.
- **Breaking Changes**: Require incrementing major version (`/api/v2/...`).
- **Deprecation Notice**: Deprecated endpoints return `X-API-Deprecated: true` response header with a 90-day grace period prior to retirement.
