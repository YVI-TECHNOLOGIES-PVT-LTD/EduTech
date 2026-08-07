# EduTrack Monorepo Configuration & Environment Governance

## Overview

This document specifies all environment variables utilized across `@edutrack/api`, `@edutrack/web`, and `@edutrack/mobile`.

## `@edutrack/api` Environment Variables

| Variable Name                                | Default Value | Type                                                  | Description                                                                                       |    Status    |
| :------------------------------------------- | :------------ | :---------------------------------------------------- | :------------------------------------------------------------------------------------------------ | :----------: |
| `PORT`                                       | `3000`        | Number                                                | Port number for Express HTTP server                                                               |   Optional   |
| `NODE_ENV`                                   | `development` | Enum (`development`, `staging`, `production`, `test`) | Operational runtime environment                                                                   |   Optional   |
| `SUPABASE_URL`                               | -             | String (URL)                                          | Supabase PostgreSQL database URL                                                                  | **Required** |
| `SUPABASE_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | -             | String (JWT)                                          | Supabase database access key                                                                      | **Required** |
| `SYSTEM_MODE`                                | `UAT`         | Enum (`UAT`, `PRODUCTION`)                            | Application operating mode                                                                        |   Optional   |
| `FRONTEND_URL`                               | -             | String (URL)                                          | Allowed origin for web application CORS                                                           |   Optional   |
| `CACHE_PROVIDER`                             | `memory`      | Enum (`memory`, `redis`)                              | Selects the `ICacheAdapter` used by `CacheService` (ADR-009)                                      |   Optional   |
| `REDIS_URL`                                  | -             | String (URL)                                          | Redis connection string, e.g. `redis://localhost:6379`; required only when `CACHE_PROVIDER=redis` |   Optional   |
| `REDIS_CONNECT_TIMEOUT_MS`                   | `5000`        | Number                                                | ioredis connection timeout in milliseconds                                                        |   Optional   |
| `REDIS_MAX_RETRIES_PER_REQUEST`              | `3`           | Number                                                | ioredis per-command retry limit before rejecting                                                  |   Optional   |

See `docs/caching.md` for how to enable Redis and the current rollout status.

## Fail-Fast Validation Rule

The backend process verifies all environment variables using Zod during startup (`apps/api/src/config/env.ts`). If any required variable is missing or malformed, process execution terminates immediately with status code `1`.
