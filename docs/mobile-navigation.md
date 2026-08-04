# EduTrack Mobile Navigation Governance

## Navigation Architecture (Expo Router)
- `index.tsx`: Session checking & initial redirect logic.
- `(auth)/`: Authentication stack (Login, Forgot Password, Reset Password).
- `(tabs)/`: Primary bottom tab navigation (Dashboard, Modules, Notifications, Profile).
- `(admission)/`, `(student)/`, `(teacher)/`, `(parent)/`: Domain workspace navigation stacks.
- `(common)/`: Shared modals, settings screens, and detail views.
