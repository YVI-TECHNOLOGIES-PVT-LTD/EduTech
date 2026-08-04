# ADR 0001: EduTrack Monorepo Layout

## Status
Accepted

## Context
EduTrack ERP was organized into standalone top-level folders (`backend/`, `frontend/`, `mobile-app/`). To scale the solution to an enterprise level while enabling shared tooling and clear project boundaries, a structured monorepo layout is required.

## Decision
Adopt the enterprise monorepo layout:
- `apps/api/`: Express.js + TypeScript Backend API.
- `apps/web/`: React + Vite Frontend Web App.
- `apps/mobile/`: React Native Expo Mobile App.
- `packages/`: Shared packages (extraction deferred until code is shared by 2+ apps).
- `infrastructure/`: Infrastructure configurations (Docker, Kubernetes, Terraform, monitoring, scripts).
- `docs/`: Centralized documentation and Architecture Decision Records.

## Consequences
- Clean separation of workspace concerns.
- Unified scripts at root workspace level.
- Unchanged internal code paths or business logic.
