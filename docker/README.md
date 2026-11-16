# EduTrack Docker

Compose runs Postgres (`pgvector/pgvector:pg16`), the API (`apps/backend/Dockerfile`), and the web app (`apps/web_app/Dockerfile`). The mobile app is not containerized.

Host ports bind to `127.0.0.1` (Postgres 5432, API 3000, web 8080). The API container runs `prisma db push` on startup. There is no seed script.

```bash
docker compose up --build -d
docker compose logs -f backend web postgres
docker compose run --rm backend ./node_modules/.bin/prisma db push --schema=prisma/schema.prisma --skip-generate --accept-data-loss
docker compose down
docker compose down -v
```

See [docs/docker/CONTAINER_ARCHITECTURE.md](../docs/docker/CONTAINER_ARCHITECTURE.md) for the image layout, environment overrides, and health URLs.
