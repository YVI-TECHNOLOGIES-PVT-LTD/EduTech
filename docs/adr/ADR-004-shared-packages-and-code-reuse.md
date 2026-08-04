# ADR-004: Shared Packages & Code Reuse Architecture (@edutrack/types, @edutrack/validation, @edutrack/ui)

## Status
Accepted

## Context
Code duplication existed across `apps/api`, `apps/web`, and `apps/mobile` for DTO interfaces, API response structures, validation schemas, and presentational UI primitives.

## Decision
We introduce three decoupled shared packages in `packages/`:
1. `@edutrack/types` (`packages/types`): Pure TypeScript type definitions and interfaces. Zero runtime code.
2. `@edutrack/validation` (`packages/validation`): Pure Zod request/form validation schemas. Depends on `@edutrack/types`.
3. `@edutrack/ui` (`packages/ui`): Presentation-only UI component primitives. Depends **ONLY** on `@edutrack/types` (no dependency on `@edutrack/validation`).

## Rules & Constraints
- **Public API Policy**: Every package exports exclusively through `src/index.ts`. Applications must never import internal files.
- **Versioning**: All packages start at version `0.1.0` using `"workspace:*"` references.
- **Package Maturity Rule**: Create packages only when audited, duplicated code exists.

## Consequences
### Positive
- Single source of truth for DTO interfaces, Zod schemas, and UI primitives.
- Presentation UI remains decoupled from validation logic and Zod dependencies.
- Zero circular dependencies across applications and packages.

### Negative
- Inter-package updates require workspace building.

## Rollback Strategy
Revert package dependencies in `apps/*/package.json` and restore local type definitions if needed.
