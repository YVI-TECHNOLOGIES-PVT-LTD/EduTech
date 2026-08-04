# ADR-003: Create Shared Configuration Package (@edutrack/config)

## Status
Accepted

## Context
TypeScript compiler options, ESLint rules, and Prettier configurations were duplicated or completely missing across `apps/api`, `apps/web`, and `apps/mobile`.

## Decision
We create `@edutrack/config` in `packages/config` containing base configurations for:
- TypeScript (`base.json`, `node.json`, `react.json`, `react-native.json`)
- ESLint (`base.js`, `node.js`, `react.js`, `react-native.js`)

## Consequences
### Positive
- Single source of truth for code quality and compiler flags.
- Zero duplication of compiler settings across sub-projects.
- New apps automatically inherit production-grade standards.

### Negative
- Configuration updates require updating `packages/config`.

## Rollback Strategy
Re-inline local tsconfig and eslint files in individual app directories.
