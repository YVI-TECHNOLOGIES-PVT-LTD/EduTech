# EduTrack Architecture Dependency Map

> **Architecture Version:** 2.12.0  
> **Owner:** EduTrack Platform Team  
> **Status:** Active Governance  
> **Last Updated:** 2026-07-29  

---

## Complete Platform Dependency Hierarchy

```text
                               ┌───────────────────────────┐
                               │  EduTrack Client Layer    │
                               └─────────────┬─────────────┘
                                             │
                      ┌──────────────────────┴──────────────────────┐
                      ▼                                             ▼
          ┌───────────────────────┐                     ┌───────────────────────┐
          │  @edutrack/web        │                     │  @edutrack/mobile     │
          │  React 18 + Vite      │                     │  Expo React Native    │
          └───────────┬───────────┘                     └───────────┬───────────┘
                      │                                             │
                      └──────────────────────┬──────────────────────┘
                                             │ (HTTP REST API)
                                             ▼
                               ┌───────────────────────────┐
                               │  @edutrack/api            │
                               │  Express Backend Hardened │
                               └─────────────┬─────────────┘
                                             │
         ┌───────────────────────────────────┼───────────────────────────────────┐
         ▼                                   ▼                                   ▼
┌─────────────────┐                 ┌─────────────────┐                 ┌─────────────────┐
│ Cache Platform  │                 │ Job Queue Platform│                 │ Event Bus       │
│ CacheService    │                 │ JobService       │                 │ Versioned .v1   │
└─────────────────┘                 └─────────────────┘                 └─────────────────┘
         │                                   │                                   │
         └───────────────────────────────────┼───────────────────────────────────┘
                                             ▼
                               ┌───────────────────────────┐
                               │  Supabase PostgreSQL DB   │
                               └───────────────────────────┘
```

## Shared Packages Core Dependency Matrix
- `@edutrack/config` → Provides TSConfig and ESLint presets to all monorepo workspaces.
- `@edutrack/types` → DTOs & API interfaces consumed by `web`, `mobile`, `api`, `ui`, `validation`. Zero runtime dependencies.
- `@edutrack/validation` → Zod schemas consumed by `web`, `mobile`, `api`. Depends on `@edutrack/types`.
- `@edutrack/ui` → Reusable presentational components. Depends on `@edutrack/types` ONLY.
