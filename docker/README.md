# EduTrack ERP — Docker Infrastructure

This directory contains containerization and service orchestration configurations for EduTrack ERP.

## Services

- **`edutrack-api`**: Express.js REST API service built from [`apps/backend/Dockerfile`](../apps/backend/Dockerfile).
- **`edutrack-web`**: React / Vite SPA frontend web service served via Nginx from [`apps/web_app/Dockerfile`](../apps/web_app/Dockerfile).

## Local Container Orchestration

To run the containerized application stack locally:

```bash
# Build and start services in detached mode
docker-compose up --build -d

# View service container logs
docker-compose logs -f

# Stop running services
docker-compose down
```
