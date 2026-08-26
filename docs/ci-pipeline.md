# EduTrack CI Pipeline

> **Scope:** Continuous Integration only. No deployment/CD, no AWS, no registry
> push. This document describes `.github/workflows/ci.yml`.

## 1. What runs, and when

Triggers: `pull_request` and `push` targeting `main` or `docker-cicd-mani`, plus
manual `workflow_dispatch`. Superseded runs on the same branch/PR are
cancelled automatically to avoid wasting CI minutes.

Three jobs, using GitHub-hosted `ubuntu-latest` runners, Node `20.18.0` and
pnpm `9.15.4` (the repo's pinned versions):

| Job                       | What it does                                                                                                                                                                                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `quality-backend-web`     | `pnpm install --frozen-lockfile` → `prisma generate` → Turbo-filtered `lint`, `typecheck`, `build` for `@edutrack/api` + `@edutrack/web` (and their workspace dependencies: `@edutrack/types`, `@edutrack/validation`, `@edutrack/ui`, `@edutrack/config`) |
| `quality-mobile`          | `pnpm install --frozen-lockfile` → Turbo-filtered `lint`, `typecheck`, `test` for `@edutrack/mobile`                                                                                                                                                       |
| `docker-build-validation` | Builds `apps/backend/Dockerfile` and `apps/web_app/Dockerfile` from the repo root context via `docker/build-push-action` with `push: false`. Depends on `quality-backend-web` passing first.                                                               |

All three run on every push/PR to the targeted branches. `docker-build-validation`
is gated behind `quality-backend-web` so a broken lint/typecheck/build fails
fast without spending runner minutes on a Docker build that would fail anyway.

## 2. Why mobile is not containerized

`apps/mobile_app` is an Expo/React Native app — it ships through Expo/EAS, not
a Docker image, and is not part of `docker-compose.yml`. Its CI job uses plain
Node/pnpm tooling (lint, typecheck, Jest) and never touches Docker. Native
builds (`eas build`) are out of scope for this pipeline and require Expo
credentials this pipeline intentionally does not have.

## 3. Why Docker images are built but not pushed

This task is CI-only. `docker-build-validation` proves both images still
build from a clean checkout — it does not authenticate to GHCR/ECR/Docker Hub
and has no registry credentials configured. Pushing/publishing images is a CD
concern and is deferred to a future task.

## 4. Why AWS is not involved

No AWS credentials, ECR, ECS, RDS, ALB, Route 53, or IaC (Terraform/CDK/
CloudFormation) exist in this repo or this workflow. Provisioning production
infrastructure is out of scope for CI; it belongs to a later, separate task.

## 5. Tests that are intentionally excluded (and why)

| Test surface                                                                                                                                                                                                                                | Status                                           | Why it's excluded from CI                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run test:api` / `test:auth` / `test:admission` / `test:all`                                                                                                                                                                           | Real, but infra-dependent                        | Runs Newman against Postman collections in `postman/collections/`, which require a live backend process **and** a seeded database. Neither exists on a GitHub-hosted runner in this pipeline.                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `@edutrack/api`'s `"test"` script                                                                                                                                                                                                           | Placeholder                                      | Literally `echo "[Backend Test Platform] Standard tests passed"` — it asserts nothing. Running it would give a false sense of coverage, so CI does not invoke it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `apps/backend/src/**/*.spec.ts` (e.g. `lead.service.spec.ts`, `admission.service.spec.ts`, `validation-and-lead-claiming.spec.ts`, `parent-idor-authorization.spec.ts`, `campus-visits-followups.spec.ts`, notification/e2e-realtime specs) | Real, hand-rolled test scripts, but DB-dependent | These are plain `.ts` files with an `assert`-based test runner (no Jest/Vitest wired up). Several query `organizations`, `academic_years`, `leads`, etc. directly through the real Prisma client and expect pre-seeded rows to exist; even the more "unit-like" specs (e.g. `LeadService.checkDuplicates` in `lead.service.spec.ts`) call through to a repository that hits Prisma. None of them are safely runnable on a GitHub-hosted runner without a live, seeded PostgreSQL/Supabase database, so none are wired into CI. Wiring a subset in without full confidence they're DB-free risked flaky/misleading CI, which the task explicitly disallows. |
| `@edutrack/web`                                                                                                                                                                                                                             | No test script                                   | The web app has no `"test"` entry in `package.json` at all.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `apps/mobile_app/tests/unit/**/*.test.ts` (179 tests, 14 suites)                                                                                                                                                                            | Real, runs in CI                                 | Jest with `react-native`, Expo modules, `expo-secure-store`, `@react-native-async-storage`, `expo-router`, and the app's own `axios`/`SecureStorage` layer all mocked in `tests/jest.setup.js` / per-test `jest.mock(...)`. No network, no device, no live backend required — included in `quality-mobile`.                                                                                                                                                                                                                                                                                                                                                |
| `apps/mobile_app/tests/integration/auth.test.ts`                                                                                                                                                                                            | Placeholder                                      | `jest.config.js`'s `testMatch` only matches `tests/unit/**`, so this file isn't even picked up by `pnpm --filter @edutrack/mobile test` today. Its single test is `expect(true).toBe(true)`.                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

## 6. Docker build args are placeholders, not secrets

The web image's `ARG`/`ENV` list is Vite build-time configuration
(`VITE_*`), compiled directly into the static JS bundle — by definition
client-visible, not secret (e.g. `VITE_SUPABASE_ANON_KEY` is Supabase's public
anon key). `docker-build-validation` passes fixed, non-functional placeholder
values (e.g. `https://ci-placeholder.supabase.co`) purely so the Vite build
has something to compile against. No real Supabase key, JWT secret, database
password, or other production secret is ever used, read from `.env*` files,
or baked into either image.

Docker Buildx's `SecretsUsedInArgOrEnv` linter warning fires on the
`VITE_SUPABASE_ANON_KEY` / `VITE_TRANSLATION_API_KEY` arg names because they
contain the substring "KEY" — this is a heuristic false positive; both are
public, client-facing values by design.

## 7. Security posture

- No `.env`, `.env.local`, or `.env.docker` files are read by CI or committed.
- No `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, or JWT secret is referenced
  anywhere in the workflow.
- No registry login step exists (no GHCR/ECR/Docker Hub credentials).
- `permissions: contents: read` at the workflow level (least privilege).

## 8. Known pre-existing audit finding (not fixed by this task)

`docs/release-engineering.md` and `docs/containerization.md` describe a
`.github/workflows/release.yml` release pipeline and `ghcr.io/edutrack/*`
published images that do not exist in this repository. That documentation
predates/anticipates a release pipeline this task does not implement (release/
CD is explicitly out of scope here) — flagged for whoever picks up that work
next, left unmodified.

## 9. Next step after this task

Once this CI pipeline is merged and has run successfully on GitHub, the next
task is CD: pushing validated images to a registry and deploying them (ECR/
ECS/RDS/ALB/Route 53/Terraform, or equivalent) — explicitly not part of this
task.
