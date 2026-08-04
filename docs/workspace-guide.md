# EduTrack Enterprise Monorepo Developer Guide

## Overview
This repository uses **pnpm workspaces** and **Turborepo** for scalable monorepo development.

## Structure
- `apps/api`: Express Node.js Backend API (`@edutrack/api`)
- `apps/web`: React Vite Web Application (`@edutrack/web`)
- `apps/mobile`: Expo React Native Application (`@edutrack/mobile`)
- `packages/config`: Shared TSConfig and ESLint rules (`@edutrack/config`)
- `packages/types`: Shared TypeScript interfaces & DTOs (`@edutrack/types`)
- `packages/validation`: Shared Zod validation schemas (`@edutrack/validation`)
- `packages/ui`: Shared presentation UI primitives (`@edutrack/ui`)
- `postman/`: Postman Collections (`auth`, `admission`, `common`), Environment Templates & Globals
- `newman/reports/`: HTML, JSON, and JUnit API testing report output
- `docs/`: Architecture docs, API Standards (`docs/api/`), Environment Governance (`docs/configuration.md`), Caching Guide (`docs/caching.md`), Operations Runbook (`docs/backend-operations-runbook.md`), Background Jobs (`docs/background-*.md`), Observability (`docs/observability.md`, `docs/slo.md`), Release Engineering (`docs/release-*.md`), Containerization (`docs/containerization.md`), Governance (`docs/engineering-standards.md`, `docs/security-baseline.md`, `docs/architecture-map.md`, `docs/governance-checklist.md`), and ADRs (`docs/adr/`)
- `tools/`: Workspace utility tools

## Developer Setup
1. Prerequisites: Node.js >= 20, pnpm >= 9 (`npm install -g pnpm` or `npx pnpm`)
2. Install workspace dependencies:
   ```bash
   pnpm install
   ```
3. Run all applications concurrently:
   ```bash
   pnpm run dev
   ```

## Standard Monorepo Commands
- `pnpm run build`: Build all workspaces via Turborepo
- `pnpm run typecheck`: Run TypeScript type-checking across all packages
- `pnpm run lint`: Run ESLint compliance checks
- `pnpm run format`: Format code using Prettier
- `pnpm run verify`: Run complete verification suite (typecheck + lint + build)

## API Testing Commands (Postman + Newman)
- `pnpm run test:all`: Run all Postman API test collections via Newman
- `pnpm run test:auth`: Run Authentication API collection
- `pnpm run test:admission`: Run Admission API collection
- `pnpm run test:api`: Run Common API collection

## Master Platform Architecture Index
- [`docs/adr/README.md`](file:///c:/Users/DELL/OneDrive/Desktop/School_Management_System/docs/adr/README.md) (ADR Master Index `ADR-001` through `ADR-014`)
- [`docs/architecture-map.md`](file:///c:/Users/DELL/OneDrive/Desktop/School_Management_System/docs/architecture-map.md) (Platform Architecture Version 2.12.0)
- [`docs/engineering-standards.md`](file:///c:/Users/DELL/OneDrive/Desktop/School_Management_System/docs/engineering-standards.md) (Engineering Standards Handbook)
- [`docs/security-baseline.md`](file:///c:/Users/DELL/OneDrive/Desktop/School_Management_System/docs/security-baseline.md) (Operational Security Baseline)
- [`docs/operations-master-runbook.md`](file:///c:/Users/DELL/OneDrive/Desktop/School_Management_System/docs/operations-master-runbook.md) (Master Operations Runbook)
- [`docs/governance-checklist.md`](file:///c:/Users/DELL/OneDrive/Desktop/School_Management_System/docs/governance-checklist.md) (Architecture Governance PR Checklist)
- [`docs/dependency-governance.md`](file:///c:/Users/DELL/OneDrive/Desktop/School_Management_System/docs/dependency-governance.md) (Dependency Governance Guide)
- [`docs/adr/ADR-014-architecture-governance.md`](file:///c:/Users/DELL/OneDrive/Desktop/School_Management_System/docs/adr/ADR-014-architecture-governance.md) (Capstone ADR)

## Git & Commit Standards
Conventional Commits are enforced via Husky and Commitlint:
- Format: `<type>: <description>`
- Allowed types: `feat`, `fix`, `refactor`, `docs`, `test`, `build`, `ci`, `chore`, `perf`, `style`, `revert`
