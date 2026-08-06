# EduTrack ERP — Dependency Audit Report (`DEPENDENCY_AUDIT.md`)

**Generated Date:** August 5, 2026  
**Source of Truth:** Workspace audit of root and workspace `package.json` manifests and `pnpm-lock.yaml`.

---

## 1. Monorepo Package Audit Metrics

| Workspace App / Package              | Direct Dependencies | Dev Dependencies | Peer / Workspace Protocol                                      | Issues / Warnings                        |
| :----------------------------------- | :-----------------: | :--------------: | :------------------------------------------------------------- | :--------------------------------------- |
| **Root (`edutrack-monorepo`)**       |          0          |        13        | `pnpm@9.15.4`, `turbo^2.3.4`                                   | Clean                                    |
| **Backend (`@edutrack/api`)**        |         22          |        19        | Workspace dependencies (`types`, `validation`, `config`)       | `ts-node` & `ts-node-dev` dual devDeps   |
| **Web (`@edutrack/web`)**            |         63          |        11        | Workspace dependencies (`types`, `ui`, `validation`, `config`) | Multiple Radix primitive packages        |
| **Mobile (`@edutrack/mobile`)**      |         35          |        14        | Workspace dependencies (`types`, `validation`, `config`)       | React Native 0.74 / React 18 version pin |
| **Package (`@edutrack/config`)**     |          0          |        0         | Internal config package                                        | Clean                                    |
| **Package (`@edutrack/types`)**      |          0          |        1         | Shared Types package                                           | Clean                                    |
| **Package (`@edutrack/ui`)**         |          0          |        1         | Shared UI Components                                           | Clean                                    |
| **Package (`@edutrack/validation`)** |          0          |        1         | Shared Validation Schemas                                      | Clean                                    |

---

## 2. Audit Findings & Recommendations

- **Duplicate Utilities:** `axios` and `zod` are installed across backend, web, and mobile. This is standard for monorepo application boundaries.
- **Workspace Links:** All workspace internal links use the strict `workspace:*` protocol in `package.json` files.
- **Security & Health:** Zero critical peer dependency mismatch errors found across pnpm lockfile.
