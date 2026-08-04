# EduTrack Mobile Application

Production-ready enterprise ERP Mobile Application for School Management built on Expo, React Native, TypeScript, Expo Router, NativeWind, Zustand, and TanStack React Query.

## Quick Start
```bash
npm install
npm run start
```

## Available Scripts
- `npm run start`: Launch Expo dev server.
- `npm run type-check`: Run TypeScript compiler check.
- `npm run lint`: Run ESLint checks.
- `npm run format`: Format codebase with Prettier.

## Architecture Highlights
- Multi-Tenant Support (`X-Tenant-ID`, `Workspace-ID`, `School-ID`, `Academic-Year-ID`).
- Atomic UI Design System (`atoms`, `molecules`, `organisms`, `templates`).
- Granular Permission Engine (`RBAC` + `ABAC` support for 17 Roles).
- Decoupled `src/core/` services layer.
- 21 Module Shells ready for enterprise feature scaling.
