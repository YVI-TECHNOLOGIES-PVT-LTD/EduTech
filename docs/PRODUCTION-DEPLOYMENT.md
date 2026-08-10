# EduTrack ERP — Stage-1 Production Deployment Guide

## 1. Prerequisites & Environment Baseline
- **Node.js**: `v18.x` or `v20.x` LTS
- **Package Manager**: `npm` (v9+) or `pnpm` (v8+)
- **Database**: PostgreSQL 14+ with `gen_random_uuid()` extension enabled
- **ORM**: Prisma ORM (Client singleton generated from `apps/backend/prisma/schema.prisma`)

## 2. Environment Variables Configuration

### Backend Environment Variables (`apps/backend/.env`)
```env
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://user:password@localhost:5432/edutrack_stage1?schema=public
DIRECT_URL=postgresql://user:password@localhost:5432/edutrack_stage1?schema=public
JWT_SECRET=your_production_jwt_secret_key_change_me
CORS_ORIGIN=https://your-school-domain.edu
```

### Frontend Environment Variables (`apps/web_app/.env`)
```env
VITE_API_BASE_URL=https://api.your-school-domain.edu/v1
```

> [!WARNING]
> Never commit real secrets or production `DATABASE_URL` values to source control.

---

## 3. Build & Deployment Commands

### Backend Build & Startup
```bash
# Navigate to backend app
cd apps/backend

# Install production dependencies
npm install --production=false

# Generate Prisma Client singleton
npx prisma generate

# Build Express TypeScript bundle
npm run build

# Start Production Express Server
npm run start
```

### Frontend Production Build
```bash
# Navigate to web app
cd apps/web_app

# Install dependencies
npm install

# Build static assets via Vite
npm run build
```
Static bundle will be generated in `apps/web_app/dist`. Serve via Nginx, Caddy, or CDN.

---

## 4. Health & Readiness Verification

- **Liveness Probe**: `GET http://localhost:3000/v1/health/liveness`
  - Expected Response: `{ "status": "alive", "service": "edutrack-api" }`
- **Readiness Probe**: `GET http://localhost:3000/v1/health/readiness`
  - Expected Response: `{ "status": "ready", "service": "edutrack-api", "database": "connected" }`

---

## 5. Graceful Shutdown & Process Signals
- The Express server listens for `SIGTERM` and `SIGINT` signals.
- Stops accepting new HTTP requests, stops background worker/scheduler runtimes, disconnects Prisma ORM pool, and exits cleanly with exit code `0` within a bounded 10-second timeout.
