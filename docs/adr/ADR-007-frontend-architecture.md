# ADR-007: Enterprise Frontend Architecture & Performance Optimization

## Status
Accepted

## Context
The `@edutrack/web` React application required modernizing into an enterprise-grade, feature-oriented architecture with standardized provider hierarchy, multi-tiered error boundaries, shared package adoption (`@edutrack/ui`, `@edutrack/types`, `@edutrack/validation`), and TanStack Query key governance.

## Decision
We adopt the following frontend architecture standards:
1. **Feature Module Architecture**: Feature code organized under `apps/web/src/features/[featureName]/`.
2. **Provider Hierarchy**: Standardized execution order (`GlobalErrorBoundary -> QueryClientProvider -> AuthProvider -> WorkspaceProvider`).
3. **TanStack Query Key Factory**: Centralized `QUERY_KEYS` definition preventing string key drift.
4. **Multi-Tier Error Boundaries**: Four-tier React error isolation (`Global`, `Layout`, `Feature`, `Component`).
5. **Shared Package Adoption**: Consuming `@edutrack/ui`, `@edutrack/types`, and `@edutrack/validation` directly from package root exports.
6. **Code Splitting & Suspense**: Lazy loading feature pages with `PageSkeleton` fallbacks.

## Consequences
### Positive
- Predictable provider lifecycle and error isolation.
- Reduced initial bundle sizes via route-level code splitting.
- Zero duplication between server state and Zustand stores.

### Negative
- Require strict adherence to feature module structure and import governance.

## Rollback Strategy
Revert `apps/web/src/app/providers.tsx` and `apps/web/src/app/router.tsx` to previous configurations.
