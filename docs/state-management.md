# EduTrack State Management Policy

## Server State vs Client UI State
- **Server State**: All data fetched from backend REST APIs is managed strictly by **TanStack Query** (`useQuery`, `useMutation`).
  - Query keys MUST use the centralized factory in `apps/web/src/config/queryKeys.ts`.
  - Server responses are cached and invalidated via `QueryClient`.
- **Client UI State**: Transient UI preferences (sidebar toggle, active tabs, theme mode) are stored in **Zustand** stores (`apps/web/src/store/`).
- **Rule against State Duplication**: Never copy server API data into Zustand stores or React local state.
