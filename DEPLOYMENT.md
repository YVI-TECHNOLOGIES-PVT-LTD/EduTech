# EduTrack ERP — Deployment Specifications (`DEPLOYMENT.md`)

**Generated Date:** August 5, 2026  
**Source of Truth:** Deployment configurations for EduTrack ERP.

---

## 1. Containerized Deployment Strategy

The system is configured for containerized deployment using Docker:

- **Backend API Container (`edutrack-api`):** Built using [`apps/backend/Dockerfile`](file:///c:/Program%20Files/EduTech/apps/backend/Dockerfile). Serves Express API on Port 3000.
- **Web Frontend Container (`edutrack-web`):** Built using [`apps/web_app/Dockerfile`](file:///c:/Program%20Files/EduTech/apps/web_app/Dockerfile). Serves Nginx static React SPA bundle on Port 80.

---

## 2. Environment Prerequisites

Ensure production environment variables are configured before launching containers:

- `DATABASE_URL` (PostgreSQL production URL)
- `JWT_SECRET` (Cryptographically strong secret)
- `SUPABASE_URL` and `SUPABASE_KEY`
