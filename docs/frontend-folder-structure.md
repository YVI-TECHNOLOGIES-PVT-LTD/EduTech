# EduTrack Frontend Folder Structure Guide

## Directory Tree (`apps/web/src/`)
```text
apps/web/src/
  ├── app/          # Application bootstrap, AppRouter, providers
  ├── assets/       # Static assets, images, icons
  ├── components/   # Shared application components & ErrorBoundary
  ├── config/       # Route registry, query keys factory (QUERY_KEYS)
  ├── context/      # Context providers (AuthContext, ThemeContext)
  ├── features/     # Feature-oriented business modules (admission, crm, staff, etc.)
  │   └── [feature]/
  │       ├── components/
  │       ├── hooks/
  │       ├── pages/
  │       ├── services/
  │       ├── types/
  │       ├── validation/
  │       └── index.ts
  ├── layouts/      # Reusable layouts (PublicLayout, DashboardLayout, AuthLayout)
  ├── pages/        # Standalone public & utility pages
  ├── routes/       # Centralized route definition modules
  ├── store/        # Zustand client UI state stores
  └── styles/       # Tailwind CSS & global styling tokens
```
