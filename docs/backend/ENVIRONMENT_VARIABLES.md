# Backend Environment Variables (`docs/backend/ENVIRONMENT_VARIABLES.md`)

**Generated Date:** August 5, 2026  
**Target Application:** `@edutrack/api` (`apps/backend`)

---

## Variable Reference Table

| Variable Name          | Required | Default Value           | Purpose / Description                              |   Security Level    |
| :--------------------- | :------: | :---------------------- | :------------------------------------------------- | :-----------------: |
| `NODE_ENV`             |   Yes    | `development`           | Node execution mode (`development` / `production`) |        `LOW`        |
| `PORT`                 |   Yes    | `3000`                  | Express HTTP server port listener                  |        `LOW`        |
| `HOST`                 |    No    | `0.0.0.0`               | Host binding interface                             |        `LOW`        |
| `DATABASE_URL`         |   Yes    | -                       | PostgreSQL connection URL string for Prisma        |   `HIGH` (Secret)   |
| `DIRECT_URL`           |   Yes    | -                       | PostgreSQL direct connection URL string            |   `HIGH` (Secret)   |
| `FRONTEND_URL`         |    No    | `http://localhost:5173` | Allowed CORS origin URL for web application        |      `MEDIUM`       |
| `JWT_SECRET`           |   Yes    | -                       | Secret key used for signing JWT access tokens      | `CRITICAL` (Secret) |
| `JWT_EXPIRES_IN`       |    No    | `1d`                    | Token lifetime expiration duration                 |        `LOW`        |
| `REFRESH_TOKEN_SECRET` |   Yes    | -                       | Secret key used for signing refresh tokens         | `CRITICAL` (Secret) |
| `SUPABASE_URL`         |   Yes    | -                       | Supabase project API gateway endpoint URL          |      `MEDIUM`       |
| `SUPABASE_KEY`         |   Yes    | -                       | Supabase API key (service role bypasses RLS)       | `CRITICAL` (Secret) |
