# Frequently Asked Questions (FAQ)

### 1. How do I start all dev servers simultaneously?

Run `pnpm run dev` in the repository root. This triggers Turborepo to run `apps/backend`, `apps/web_app`, and `apps/mobile_app` concurrently.

### 2. What should I do if Turborepo cache seems stale?

Run `pnpm run clean` or execute commands with the `--force` flag (e.g. `pnpm turbo run lint --force`).

### 3. How are database migrations managed?

Database models are defined in `apps/backend/prisma/schema.prisma`. Run `pnpm --filter @edutrack/api prisma migrate dev` to generate new migrations.
