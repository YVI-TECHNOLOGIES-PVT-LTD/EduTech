# Migration Path Gap — Current State

> **No production migration was performed as part of this remediation.**
> This document only records the current state so the gap is visible and
> is treated as its own follow-up task, not silently worked around.

## What exists

- `apps/backend/prisma/schema.prisma` declares the full current data model
  and is the source of truth Prisma Client is generated from
  (`prisma generate`, run as part of the `build` script).
- A custom, homegrown SQL migration runner exists at
  `apps/backend/scripts/migration-runner.ts` (plus `migration-config.ts`,
  `migration-validator.ts`, `migration-history.ts`,
  `migration-backup.ts`, `migration-report.ts`, `rollback-runner.ts`),
  invoked via `pnpm run migrate` / `migrate:status` / `migrate:dry-run` /
  `migrate:decommission` at the root `package.json`. It expects numbered
  `.sql` files in `apps/backend/database/migrations/`.
- Dozens of one-off `run-migration-1NN.js`/`.ps1` scripts under
  `apps/backend/scripts/` record historically-applied migrations
  (numbers 110–~140+), executed directly against a specific Supabase
  project's REST RPC endpoint (see
  `docs/deployment/DATABASE-CONFIGURATION-MISMATCH.md` for which project).

## What is missing

- **`apps/backend/prisma/migrations/` does not exist.** There is no
  Prisma migration history in this repository, so `prisma migrate deploy`
  has nothing to apply.
- **`apps/backend/database/migrations/` does not exist either** — the
  directory the custom `migration-runner.ts` expects to read `.sql` files
  from is absent, so that tooling is currently non-functional/orphaned
  as committed on this branch.

## Consequence

There is currently **no reproducible, version-controlled way to
(re)create or evolve the production Postgres schema from this repository
alone.** The only schema-sync command available via `package.json`
(`prisma db push` / `db:push`) pushes `schema.prisma` directly against
whatever `DIRECT_URL` points to, with no migration history, and can
silently alter or drop columns if the target schema has diverged. It
should not be run against a database that may already hold real
production data without a verified backup and a deliberate decision to
do so — not as a byproduct of a deployment-configuration pass.

## What was deliberately NOT done in this remediation

- `prisma db push` / `prisma migrate` was **not** run against any
  database.
- No `.sql` migration files were invented or reconstructed.
- No changes were made to `apps/backend/prisma/schema.prisma`.

## Recommended follow-up (separate task)

1. Confirm the correct production Supabase project (see
   `DATABASE-CONFIGURATION-MISMATCH.md`).
2. Introspect its current live schema (`prisma db pull` against a
   **read-only** connection, or a Supabase dashboard export) and diff it
   against `schema.prisma` to establish whether they already match.
3. Once confirmed to match, initialize a real Prisma migration history
   (`prisma migrate diff` / baselining) so that future schema changes go
   through `prisma migrate deploy` instead of ad-hoc scripts or
   unmanaged `db push`.
