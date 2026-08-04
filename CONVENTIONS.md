# Monorepo Development Conventions

## 1. REST API Naming Conventions

- Endpoint paths must use plural nouns and `kebab-case` (`/admin/student-section/assign`).
- HTTP verbs follow strict REST semantics (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).

## 2. Shared Types vs Shared Schemas

- Types belong in `packages/types`.
- Zod validation schemas belong in `packages/validation`.
- Component primitives belong in `packages/ui`.
- Shared ESLint & TSConfig belong in `packages/config`.
