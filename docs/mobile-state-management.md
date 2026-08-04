# EduTrack Mobile State Management Policy

## Server State vs Client UI State
- **Server State**: Managed strictly by **TanStack Query** (`useQuery`, `useMutation`) with query cache persistence for offline access.
- **Client UI State**: Transient UI preferences stored in **Zustand** stores (`apps/mobile/src/stores/`).
- **Secure Token Storage**: Encrypted using `SecureStorageService` (`expo-secure-store`). Plain credential storage in `AsyncStorage` is strictly FORBIDDEN.
