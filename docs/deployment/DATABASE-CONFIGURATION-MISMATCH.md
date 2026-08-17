# Database Configuration — Resolved (Production Project Confirmed)

> **Status:** RESOLVED. `umvbyywkojuxnxgkuwbt` is the confirmed production
> Supabase project. This document is kept as a record of the investigation
> and the decision, and as a standing warning not to reintroduce the old
> project into any deployment configuration.

## 1. Decision

- **Production Supabase project: `umvbyywkojuxnxgkuwbt`.**
  Both Prisma (`DATABASE_URL` / `DIRECT_URL`) and the Supabase JS client
  (`SUPABASE_URL`) must point to this project — confirmed and aligned in
  `apps/backend/.env` (untracked, local-only file; Render must be
  configured with the same values via its dashboard, not this file).
- **`blvseyhzsehfwdmevtyp` is an old/other project. It must NOT be used
  for production, must NOT be deleted, and must NOT be modified or
  migrated as part of deployment prep.** It may only ever be used
  read-only for investigation/reference if ever needed again.

## 2. What was originally wrong

As committed on this branch, `apps/backend/.env` had two independent DB
access paths pointing at **two different Supabase projects**:

| Variable                                                | Project ref (before fix) |
| ------------------------------------------------------- | ------------------------ |
| `SUPABASE_URL`                                          | `umvbyywkojuxnxgkuwbt`   |
| `DATABASE_URL` / `DIRECT_URL`                           | `blvseyhzsehfwdmevtyp`   |
| `DATABASE_URL` (in `.env.local`, not loaded by the app) | `umvbyywkojuxnxgkuwbt`   |

Every server boot wrote RBAC data (via the Supabase client) to
`umvbyywkojuxnxgkuwbt`, while every business-data query (via Prisma) read
and wrote `blvseyhzsehfwdmevtyp` — two completely disjoint databases.

## 3. Evidence gathered (which led to the now-confirmed decision)

- `umvbyywkojuxnxgkuwbt` appears in `SUPABASE_URL`, in `.env.local`'s
  `DATABASE_URL`/`DIRECT_URL`, in `apps/web_app/.env`'s
  `VITE_SUPABASE_URL`, in the historical migration-runner scripts
  (`apps/backend/scripts/run-migration-114.ps1` through
  `run-migration-120.ps1`, which executed schema migrations 114–120
  directly against this project), and in demo document URLs in
  `StudentDetailsPage.tsx`.
- `blvseyhzsehfwdmevtyp` appeared **only** in `apps/backend/.env`'s
  `DATABASE_URL`/`DIRECT_URL`, introduced in commit `842161a` by a
  different author than the surrounding deployment-fix commits. No other
  file in the repository ever referenced it.
- This inference was **not** treated as sufficient on its own to change a
  live database connection string. The project was formally confirmed by
  the human operator before `apps/backend/.env` was updated.

## 4. What was actually changed (and what was not)

- `apps/backend/.env`'s `DATABASE_URL` and `DIRECT_URL` were updated to
  the same values already present in `apps/backend/.env.local` (both now
  reference `umvbyywkojuxnxgkuwbt`), copied file-to-file without ever
  displaying the password in any tool output or transcript.
- A stray, unassigned leftover connection-string line referencing
  `blvseyhzsehfwdmevtyp` (not a valid `KEY=VALUE` line, so never actually
  loaded by `dotenv`) was removed from `apps/backend/.env` as cleanup —
  this did not involve connecting to that project in any way, only
  deleting a dead line of local text.
- **No connection was made to either Supabase project as part of this
  change.** This was a text edit of a local, untracked `.env` file only.
- `blvseyhzsehfwdmevtyp` was not deleted, reset, migrated, or modified.

## 5. Required action in Render

Render's environment variables (not this repository) are the actual
source of truth for production. Before/at deploy time, set in Render:

- `SUPABASE_URL` → the `umvbyywkojuxnxgkuwbt` project URL
- `DATABASE_URL` / `DIRECT_URL` → the `umvbyywkojuxnxgkuwbt` pooler
  connection strings
- `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_KEY` → the `umvbyywkojuxnxgkuwbt`
  service role key

## 6. Note on secret exposure encountered during this investigation

Two separate incidents in this session inadvertently displayed secret
values in the conversation transcript:

1. An earlier investigation pass displayed a full `blvseyhzsehfwdmevtyp`
   connection string, including its plaintext password, while inspecting
   `git show` diff output with an incomplete masking regex.
2. A later pass, while listing `apps/backend/.env`'s relevant variable
   lines, masked the `DATABASE_URL`/`DIRECT_URL` passwords but did not
   mask `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_KEY`, so both JWTs were
   displayed in full.

**All of the following must be treated as compromised and rotated in the
Supabase dashboard, independent of anything else in this document:**
the `blvseyhzsehfwdmevtyp` database password, and the
`umvbyywkojuxnxgkuwbt` project's `SUPABASE_SERVICE_ROLE_KEY` and
`SUPABASE_KEY`. See the Security section of the remediation reports for
details.
