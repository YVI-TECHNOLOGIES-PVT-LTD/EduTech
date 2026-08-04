# EduTrack Backend Operations Runbook

## Overview
This operational runbook details the backend platform hardening infrastructure, middleware execution sequence, health check probes, structured logging, and configuration governance for `@edutrack/api`.

## Middleware Execution Order
HTTP requests pass through the following strict middleware chain:
1. **Request Correlation**: Attaches `req.id` and `X-Request-Id` response header.
2. **Security Headers (`helmet`)**: Configures security headers (`nosniff`, `DENY`, `X-Request-Id`, `X-API-Version`).
3. **CORS Configuration**: Restricts origin access based on environment configuration.
4. **Three-Tier Rate Limiting**:
   - `authRateLimiter`: Login/Refresh endpoints (30 requests / 15m)
   - `publicRateLimiter`: Public endpoints (300 requests / 15m)
   - `authenticatedRateLimiter`: Authenticated endpoints (1000 requests / 15m)
5. **Structured Request Logger**: Emits JSON log records with sensitive field redaction.
6. **Authentication & RBAC**: Session validation and permission enforcement.
7. **Module Controllers**: Request handling and business execution.
8. **Central Exception Handler**: Converts uncaught errors into Phase 2.3 error envelopes.

## Health Probes
- `GET /health`: General health summary.
- `GET /health/live`: Process liveness probe (HTTP 200 OK, proves Node process is running).
- `GET /health/ready`: Readiness probe (HTTP 200 OK if DB connection is active, HTTP 503 if disconnected).

## Operational Signal Handling
- `SIGTERM` / `SIGINT`: Server initiates graceful shutdown, stopping new connections and closing HTTP listeners within a 10-second timeout window.
