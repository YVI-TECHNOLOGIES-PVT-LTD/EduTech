# EduTrack Frontend Architecture Guide

## Overview
The `@edutrack/web` application is structured as a feature-oriented React monorepo package powered by Vite, TanStack Query, Zustand, and `@edutrack/ui`.

## Architecture Layers
```text
Application Entry (main.tsx)
  └── Providers (providers.tsx - QueryClient, Auth, Workspace)
      └── Router Container (router.tsx)
          └── Reusable Layouts (PublicLayout, DashboardLayout, AuthLayout)
              └── Feature Modules (apps/web/src/features/*)
                  └── Shared Packages (@edutrack/ui, @edutrack/types, @edutrack/validation)
```

## Core Architectural Rules
1. **Import Hierarchy**: `features -> shared -> packages (@edutrack/*) -> third-party`.
2. **Public Package Entry Points**: All imports from `@edutrack/*` MUST consume package root exports (`@edutrack/ui`). Deep imports into package internal source files are forbidden.
3. **State Management**: Server state is managed exclusively via TanStack Query. Client UI state is managed via Zustand stores without duplicating server state.
