# ADR 0001: Monorepo Architecture with pnpm and Turbo

- **Status:** Accepted
- **Date:** 2026-08-05

## Context

EduTrack ERP requires a scalable codebase supporting multiple client applications (Express API, React Web, Expo Mobile) and shared core libraries (Types, UI, Validation, Configs).

## Decision

Adopt a monorepo structure using `pnpm` workspaces for package management and `Turborepo` (`turbo`) for build orchestration and caching.

## Consequences

- High build efficiency with task caching.
- Centralized dependency management via workspace protocols (`workspace:*`).
- Enforced clean architectural boundaries across packages.
