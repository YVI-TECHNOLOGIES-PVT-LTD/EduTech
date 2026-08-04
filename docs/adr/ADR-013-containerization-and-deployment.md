# ADR-013: Containerization & Production Deployment Platform

## Status
Accepted

## Context
The EduTrack monorepo required reproducible, multi-stage production container images (`apps/api/Dockerfile`, `apps/web/Dockerfile`), non-root container security (`USER node`), OCI image labeling standards, container health check probes, and multi-container orchestration (`docker-compose.yml`) to support zero-downtime deployment strategies.

## Decision
We implement enterprise containerization:
1. **Multi-Stage Dockerfiles**: Compact runtime images built on `node:20-alpine` (API) and `nginx:1.25-alpine` (Web).
2. **OCI Image Standards**: OCI-compliant image labeling and immutable version tags (`ghcr.io/edutrack/*:2.11.0`).
3. **Non-Root Execution**: Backend API container executes under non-privileged `USER node`.
4. **Health Probe Integration**: Container runtime `HEALTHCHECK` directives ping `/health/live`.
5. **Orchestration**: `docker-compose.yml` defining port bindings (API: 3000, Web: 80) and bridge network isolation (`edutrack-network`).

## Consequences
### Positive
- Reproducible production environments across staging, UAT, and production clouds.
- Reduced container attack surfaces via non-root execution and Alpine base images.
- Zero changes to application business logic, API contracts, database schemas, or client interfaces.

### Negative
- Requires maintaining Docker engine dependencies and container image registries.

## Rollback Strategy
Revert container image tags in `docker-compose.yml` to previous release tag (`2.10.0`).
