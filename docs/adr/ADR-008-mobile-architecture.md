# ADR-008: Enterprise Mobile Architecture & Offline Platform

## Status
Accepted

## Context
The `@edutrack/mobile` Expo React Native application required modernizing into an enterprise-grade mobile platform with standardized provider hierarchy, secure token storage (`expo-secure-store`), offline-first query caching, request correlation headers (`X-Request-Id`), and design system tokens.

## Decision
We adopt the following mobile architecture standards:
1. **Provider Sequence**: Standardized in `AppProvider.tsx` (`GlobalErrorBoundary -> QueryProvider -> ThemeProvider -> AuthProvider -> TenantProvider -> PermissionProvider -> NetworkProvider`).
2. **Secure Token Storage**: Encrypted JWT storage using `expo-secure-store`.
3. **Correlation Headers**: Injecting `X-Request-Id` and `Authorization` into outgoing API calls.
4. **Offline Resilience**: Network connectivity monitoring, offline banner UI, and query cache persistence.
5. **Shared Package Adoption**: Consuming `@edutrack/ui`, `@edutrack/types`, and `@edutrack/validation` from package root exports.

## Consequences
### Positive
- Enterprise mobile security with hardware-backed keychains/keystores.
- Resilient user experience during network connectivity dropouts.
- Zero change to application business logic, Prisma schemas, or web runtime.

### Negative
- Requires maintaining `expo-secure-store` native configuration across Expo updates.

## Rollback Strategy
Revert `AppProvider.tsx` and `services/secure-storage.service.ts` to previous implementation.
