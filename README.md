# EduTrack Enterprise Platform

Production-grade School Management SaaS System built with an enterprise monorepo architecture.

## Tech Stack
- **Monorepo Management:** pnpm Workspaces, Turborepo
- **Frontend App:** React 18, Vite, TypeScript, Tailwind CSS, Radix UI (`apps/web`)
- **Backend API:** Node.js, Express, TypeScript, Prisma, PostgreSQL (`apps/api`)
- **Mobile App:** Expo React Native, TypeScript (`apps/mobile`)
- **Shared Configs:** `@edutrack/config` (`packages/config`)

## Workspace Layout
```text
.
├── apps/
│   ├── api/        # Node.js Express API (@edutrack/api)
│   ├── web/        # React + Vite Web App (@edutrack/web)
│   └── mobile/     # Expo React Native App (@edutrack/mobile)
├── packages/
│   └── config/     # Shared TSConfig & ESLint rules (@edutrack/config)
├── docs/           # Documentation & Architecture Decision Records (ADRs)
└── tools/          # Monorepo utility tools
```

## Quick Start
```bash
# 1. Install dependencies
pnpm install

# 2. Run all dev servers
pnpm run dev

# 3. Monorepo quality checks
pnpm run typecheck
pnpm run lint
pnpm run build
```

Detailed developer instructions are available in the [Workspace Guide](file:///c:/Users/DELL/OneDrive/Desktop/School_Management_System/docs/workspace-guide.md).
