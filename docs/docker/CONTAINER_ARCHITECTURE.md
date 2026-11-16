# EduTrack container architecture

Local Docker Compose runs three services. `apps/mobile_app` is not containerized.

| Service | Image | Container port | Host bind |
| --- | --- | --- | --- |
| `postgres` | `pgvector/pgvector:pg16` | 5432 | `127.0.0.1:5432` |
| `backend` | multi-stage Node 20 build of `@edutrack/api` | 3000 | `127.0.0.1:3000` |
| `web` | Vite build of `@edutrack/web`, then `nginxinc/nginx-unprivileged` | 8080 | `127.0.0.1:8080` |

The API process listens on `0.0.0.0` inside its container so the published port and the web container can reach it. Compose publishes that port on the host loopback interface only.

Redis is not part of the stack. The backend does not use Redis.

## Images

Both Dockerfiles use the repository root as the build context.

1. `turbo prune <package> --docker` keeps only that package and its workspace dependencies.
2. `pnpm install --frozen-lockfile` installs the pruned lockfile.
3. `turbo run build` builds the package and its workspace dependencies.
4. The API runtime stage is the `pnpm deploy --prod` output plus `dist/` and a freshly generated Prisma client. It runs as the `node` user.
5. The web runtime stage copies the Vite `dist/` into an unprivileged nginx image and runs as `nginx` on port 8080.

`.dockerignore` excludes `node_modules`, `.git`, and every `.env` file. Image builds do not receive secret files. Vite `VITE_*` build args default to placeholders. Do not pass the Supabase service-role key into the web image; that value would be inlined into the browser bundle.

Puppeteer is a backend dependency, but the server does not launch a browser. The runtime image does not install Chromium, and `PUPPETEER_SKIP_DOWNLOAD` is set so the image build does not download a browser.

## Database

Postgres is local to Compose. `docker/postgres/init.sql` creates the `pgcrypto` and `vector` extensions the first time the volume is created.

There is no `prisma/migrations` history and no seed script. On startup the API container runs:

```bash
prisma db push --schema=./prisma/schema.prisma --skip-generate --accept-data-loss
```

That syncs `apps/backend/prisma/schema.prisma` to the empty database. Set `EDUTRACK_RUN_DB_PUSH=false` to skip it.

`apps/database/stage_1/schema/*.sql` is the historical Supabase DDL. Compose does not apply those files. The custom runner `pnpm --filter @edutrack/api migrate` looks for `database/migrations`, which is not in this repository.

The API still requires `SUPABASE_URL` and `SUPABASE_KEY` before it will boot. Compose supplies placeholders so the process starts against local Postgres. Login against Supabase Auth will not succeed until those values are real. `GET /health/live` and `GET /api/health` do not need Supabase.

## Commands

From a clean checkout, at the repository root:

```bash
docker compose up --build -d
```

No env file is required. Defaults are in `docker-compose.yml`. To override them, copy the template and pass it explicitly. Compose also interpolates a repo-root `.env` if one exists; the template uses an `EDUTRACK_` prefix so that file cannot redirect this stack at a developer database.

```bash
cp .env.docker.example .env.docker
docker compose --env-file .env.docker up --build -d
```

Apply the schema again without restarting the whole stack:

```bash
docker compose run --rm -e RUN_DB_PUSH=true backend ./node_modules/.bin/prisma db push --schema=prisma/schema.prisma --skip-generate --accept-data-loss
```

There is no seed command.

Logs:

```bash
docker compose logs -f backend web postgres
```

Stop the stack, and remove the database volume when you want a fresh database:

```bash
docker compose down
docker compose down -v
```

After the stack is healthy:

- Web login page: `http://127.0.0.1:8080/login`
- API liveness: `http://127.0.0.1:3000/health/live`
- API health: `http://127.0.0.1:3000/api/health`

The web bundle calls `http://127.0.0.1:3000/api` from the browser. Nginx also proxies `/api/` to the backend for same-origin calls.
