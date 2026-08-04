# EduTrack Master Operational Runbook

> **Architecture Version:** 2.12.0  
> **Owner:** EduTrack Platform Operations  
> **Status:** Active Governance  
> **Last Updated:** 2026-07-29  

---

## 1. Production Deployment Procedure
1. Verify release tags and run `pnpm run verify`.
2. Execute `docker-compose -f docker-compose.prod.yml up -d --build`.
3. Verify readiness probe: `curl http://localhost:3000/health/ready`.

## 2. Emergency Rollback Procedure
Refer to [`docs/rollback-procedure.md`](file:///c:/Users/DELL/OneDrive/Desktop/School_Management_System/docs/rollback-procedure.md):
1. Identify last known good release tag (e.g. `v2.10.0`).
2. Re-route container routing to previous image tag (`ghcr.io/edutrack/api:2.10.0`).
3. Verify post-rollback API health via `pnpm run test:all`.
