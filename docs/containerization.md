# EduTrack Containerization & Deployment Platform

> **Document Version:** 1.0.0  
> **Owner:** EduTrack Platform Team  
> **Status:** Approved  
> **Last Updated:** 2026-07-29  

---

## 1. Overview & Image Specifications
The EduTrack platform employs multi-stage Docker containerization for production deployment:
- **Backend API (`apps/api/Dockerfile`)**: Base image `node:20-alpine`, non-root execution (`USER node`), container health check on `/health/live`. Published as `ghcr.io/edutrack/api:2.11.0`.
- **Web Frontend (`apps/web/Dockerfile`)**: Base image `nginx:1.25-alpine`, custom SPA fallback configuration (`nginx.conf`), container health check on `/`. Published as `ghcr.io/edutrack/web:2.11.0`.

## 2. OCI Image Label Governance
Every container image includes standardized OpenContainers labels:
- `org.opencontainers.image.title`
- `org.opencontainers.image.description`
- `org.opencontainers.image.version`
- `org.opencontainers.image.authors`

## 3. Container Orchestration Commands
- Build and run containers: `docker-compose up -d --build`
- Stop container stack: `docker-compose down`
- Inspect container health: `docker-compose ps`
