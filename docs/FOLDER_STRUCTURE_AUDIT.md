# EduTrack ERP — Folder Structure Audit (`FOLDER_STRUCTURE_AUDIT.md`)

**Generated Date:** August 5, 2026  
**Source of Truth:** Physical directory traversal of `c:\Program Files\EduTech`.

---

## 1. Directory Structure Map

```
EduTech/
├── .github/
│   └── workflows/          (CI/CD GitHub Actions quality gates)
├── apps/
│   ├── backend/            (@edutrack/api Express REST API)
│   ├── database/           (Stage-1 PostgreSQL DDL Schemas)
│   ├── mobile_app/         (@edutrack/mobile Expo React Native)
│   └── web_app/            (@edutrack/web React Vite SPA)
├── assets/                 (Shared branding & static media assets)
├── docker/                 (Docker orchestration documentation & Compose)
├── docs/                   (Enterprise documentation portal & inventories)
│   ├── adr/                (Architecture Decision Records 0001-0006)
│   ├── architecture/       (System architecture & topology)
│   ├── backend/            (Backend architecture & env vars)
│   ├── database/           (Database architecture & inventory)
│   ├── devops/             (DevOps & Docker orchestration)
│   ├── frontend/           (Frontend architecture & env vars)
│   ├── git/                (Git flow & branch conventions)
│   ├── mobile/             (Mobile architecture & env vars)
│   ├── security/           (Security baseline & architecture)
│   └── standards/          (Coding & engineering standards)
├── examples/               (Reference code implementation templates)
├── infrastructure/         (Infrastructure scripts)
├── packages/               (Shared monorepo workspace packages)
│   ├── config/             (@edutrack/config shared ESLint/Prettier/TS)
│   ├── types/              (@edutrack/types shared TS domain types)
│   ├── ui/                 (@edutrack/ui shared React UI primitives)
│   └── validation/         (@edutrack/validation shared Zod schemas)
├── postman/                (Postman API testing collections)
├── scripts/                (Build and migration runner scripts)
├── tools/                  (Workspace developer utility tools)
└── Workflows/              (Workflow definition subdirectories)
```

---

## 2. Naming Convention Verification

- **Root Directories:** Standard lowercase single words or kebab-case (`apps`, `packages`, `docs`, `infrastructure`, `.github`).
- **Source Files:** Backend source files follow `kebab-case.ts`. Frontend & Mobile component views follow `PascalCase.tsx`.
- **Workspace Packages:** Scoped under `@edutrack/` namespace in `package.json` manifests.
