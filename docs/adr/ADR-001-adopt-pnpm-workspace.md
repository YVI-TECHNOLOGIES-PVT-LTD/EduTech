# ADR-001: Adopt pnpm Workspaces & Single Lockfile

## Status
Accepted

## Context
The EduTrack repository previously relied on standard npm workspaces with fragmented `package-lock.json` files across app subdirectories (`apps/api`, `apps/web`, `apps/mobile`), leading to non-deterministic dependency resolution, duplicate package installations, and slow installation times.

## Decision
We adopt `pnpm` as the sole package manager for the monorepo via `pnpm-workspace.yaml` and a single root `pnpm-lock.yaml`.

## Consequences
### Positive
- Strict dependency isolation preventing phantom dependency access.
- Significant disk space savings and faster installation via content-addressable storage.
- Unified root lockfile ensuring deterministic builds across environments.

### Negative
- Require team developers and CI pipelines to use `pnpm` instead of `npm` or `yarn`.

## Rollback Strategy
If critical regressions occur, restore `package-lock.json` files and revert `package.json` to npm workspace glibs.
