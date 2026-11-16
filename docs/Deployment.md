# EduTrack ERP Production Deployment Guide

## Prerequisites

- Node.js v20.x+
- PostgreSQL v15+
- Docker & Docker Compose (optional for containerized deployment)

---

## 1. Environment Setup

### Backend Environment Variables (`apps/backend/.env`)

```ini
DATABASE_URL="postgresql://user:password@localhost:5432/edutrack_db?schema=public"
JWT_SECRET="super-secret-jwt-key"
JWT_REFRESH_SECRET="super-secret-refresh-key"
PORT=3000
NODE_ENV="production"
```

### Web App Environment Variables (`apps/web_app/.env`)

```ini
VITE_API_BASE_URL="http://localhost:3000/api/v1"
VITE_APP_ENV="production"
```

---

## 2. Build & Launch Sequence

```bash
# 1. Run database migrations
npx prisma migrate deploy

# 2. Build backend bundle
npm run build --workspace=apps/backend

# 3. Build web app production bundle
npm run build --workspace=apps/web_app

# 4. Start production backend server
npm run start:prod --workspace=apps/backend
```
