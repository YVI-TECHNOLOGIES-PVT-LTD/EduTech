# EduTrack Enterprise Platform — Web Architecture (`apps/web_app`)

## 1. Single Page Application Architecture

The `@edutrack/web` application is built with React 18, Vite 5, Tailwind CSS, and Radix UI primitives.

```text
apps/web_app/src/
├── components/              # Shared UI components, layout, header, navigation
├── modules/                 # Feature modules (admission, dashboard, fees, student, import)
├── pages/                   # Top-level route pages (Login, Home, Profile, Settings, NotFound)
├── routes/                  # Route definitions and permission guards
├── services/                # Axios API client services and interceptors
├── store/                   # Zustand global state stores (auth, profile, settings)
├── theme/                   # Tokens, glassmorphism styles, typography
└── App.tsx                  # Root application router and React Query provider
```

---

## 2. State Management & Data Fetching Layer

- **Client State:** Zustand stores manage auth tokens, user context, active profile data, theme preferences, and UI sidebar state.
- **Server State:** TanStack React Query handles caching, background invalidation, and optimistic UI updates for API calls.
