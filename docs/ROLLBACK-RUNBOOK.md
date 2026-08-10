# EduTrack ERP — Stage-1 Rollback Runbook

## 1. Emergency Policy & Database Safety Policy

> [!CRITICAL]
> **Database Immutability Statement**
> - **NO DATABASE ROLLBACK OR DESTRUCTIVE MIGRATION ACTION IS AUTHORIZED AS PART OF STAGE-1 PRODUCTION DEPLOYMENT.**
> - The Stage-1 database structure (`apps/database/stage_1/schema/*.sql` and `apps/backend/prisma/schema.prisma`) is frozen.
> - Database Structural Modification Count = **0**.

---

## 2. Application-Level Rollback Procedure

If a runtime issue is detected post-deployment:

### Step 1: Revert Deployment Image / Code Revision
```bash
# Revert git release tag / commit SHA to previous release candidate
git checkout tags/v1.0.0-rc1

# Re-build backend bundle
cd apps/backend
npm run build

# Restart backend process manager (e.g. PM2 / Systemd)
pm2 restart edutrack-backend
```

### Step 2: Revert Static Frontend Assets
```bash
# Revert frontend static distribution in web app
cd apps/web_app
npm run build
# Deploy updated dist folder to web server
```

---

## 3. Incident Evidence Collection

In case of runtime failure before rollback:
1. Capture backend process logs (`apps/backend/logs/` or `pm2 logs`).
2. Run health probes: `curl http://localhost:3000/v1/health/readiness`.
3. Export request correlation IDs associated with HTTP 500 errors.
4. Notify the Lead Release Engineer and Database Architect.
