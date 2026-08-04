# ADR-002: Adopt Turborepo Build Orchestration

## Status
Accepted

## Context
Build, lint, and typecheck operations were previously run serially using `npm --prefix` scripts, creating high developer overhead and preventing build output caching.

## Decision
We adopt **Turborepo** (`turbo.json`) as the monorepo build system to manage tasks (`dev`, `build`, `lint`, `typecheck`, `format`, `clean`).

## Consequences
### Positive
- Incremental compilation and smart task caching.
- Parallelized execution based on dependency graph topology.
- Standardized task runner interfaces across all workspace applications.

### Negative
- Task configurations must be maintained in `turbo.json`.

## Rollback Strategy
Revert top-level package scripts to direct workspace invocations.
