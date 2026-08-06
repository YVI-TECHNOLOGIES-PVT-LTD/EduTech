# EduTrack Enterprise ERP — Production Docker Hardening & Infrastructure Specification

This document provides production operation guidelines, security standards, resource limits, and log management policies for the EduTrack Enterprise ERP container platform.

---

## Production Security & Hardening Features

1. **Non-Root Execution:** Backend API runs strictly under unprivileged `USER node` (UID 1000) with file ownership set to `node:node`.
2. **Privilege Escalation Prevention:** Enforces `security_opt: ["no-new-privileges:true"]` across all containers.
3. **Attack Surface Minimization:** Web Frontend runner uses lightweight `nginx:1.27-alpine` containing zero Node.js runtimes, zero build tools, and zero package managers.
4. **Information Hiding:** Nginx server tokens are disabled (`server_tokens off;`).
5. **Security Headers:** Strict enforcement of `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, and `Referrer-Policy`.

---

## Production Resource Limits & Allocation

| Container            | Service Name   | CPU Limit  | CPU Reservation | Memory Limit | Memory Reservation |
| :------------------- | :------------- | :--------: | :-------------: | :----------: | :----------------: |
| **Backend REST API** | `edutrack-api` | 2.00 Cores |   0.50 Cores    |   2048 MB    |       512 MB       |
| **Web Frontend SPA** | `edutrack-web` | 1.00 Cores |   0.25 Cores    |   1024 MB    |       256 MB       |

---

## Production Logging Policy (JSON Log Rotation)

Container logs use the `json-file` driver with automated log rotation to prevent host disk exhaustion:

- **Backend API (`edutrack-api`):** Max size per log file: `10m` / `20m` (Production override); Max retained log files: `3` to `5`.
- **Web Frontend (`edutrack-web`):** Max size per log file: `10m`; Max retained log files: `3`.

---

## Production Service Management Commands

### 1. Launch Primary Hardened Stack

```bash
# Build and run containers in detached mode using primary specification
docker-compose up --build -d
```

### 2. Launch Production Stack with Hardened Overrides

```bash
# Run with explicit production resource limits and logging policies
docker-compose -f docker/compose/docker-compose.yml -f docker/compose/docker-compose.prod.yml up -d
```

### 3. Check System Health & Diagnostics

```bash
# Inspect running container status & health checks
docker-compose ps

# View real-time service logs
docker-compose logs -f --tail=100
```

### 4. Graceful Shutdown

```bash
# Gracefully stop containers and clean up bridge networks
docker-compose down
```

---

## Future Enterprise Modular Expansion

The multi-network bridge layout allows expanding services without altering existing container definitions:

- **Redis Cache & Queue Broker:** `docker-compose -f docker/compose/docker-compose.yml -f docker/compose/docker-compose.redis.yml up -d`
- **Prometheus & Grafana Telemetry:** `docker-compose -f docker/compose/docker-compose.yml -f docker/compose/docker-compose.monitoring.yml up -d`
- **Dedicated Queue Workers:** `docker-compose -f docker/compose/docker-compose.yml -f docker/compose/docker-compose.workers.yml up -d`
