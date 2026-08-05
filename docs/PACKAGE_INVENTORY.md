# EduTrack ERP — Monorepo Package Inventory Ledger

**Generated Date:** August 5, 2026  
**Source of Truth:** Physical workspace inspection of `packages/` and `pnpm-workspace.yaml`.

---

## 1. Monorepo Shared Package Dependency Tree

```
                      +-------------------+
                      | edutrack-monorepo |
                      +---------+---------+
                                |
         +----------------------+----------------------+
         |                      |                      |
  +------v------+        +------v------+        +------v------+
  | apps/backend|        | apps/web_app|        |apps/mobile  |
  |@edutrack/api|        |@edutrack/web|        |@edutrack/mb |
  +------+------+        +------+------+        +------+------+
         |                      |                      |
         +----------+-----------+-----------+----------+
                    |                       |
            +-------v-------+       +-------v-------+
            |@edutrack/types|       |@edutrack/valid|
            +---------------+       +---------------+
                    |                       |
            +-------v-------+       +-------v-------+
            |  @edutrack/ui |       |@edutrack/cnfg |
            +---------------+       +---------------+
```

---

## 2. Package Specifications & Consumer Mapping

| Package Name           | Physical Location                                                               | Primary Barrel Export                                                                 | Exports / Contents                                            | Workspace Consumers                                  |
| :--------------------- | :------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------ | :------------------------------------------------------------ | :--------------------------------------------------- |
| `@edutrack/config`     | [`packages/config`](file:///c:/Program%20Files/EduTech/packages/config)         | ESLint, Prettier & TS configs                                                         | Shared linting, formatting, and TypeScript base presets       | `@edutrack/api`, `@edutrack/web`, `@edutrack/mobile` |
| `@edutrack/types`      | [`packages/types`](file:///c:/Program%20Files/EduTech/packages/types)           | [`src/index.ts`](file:///c:/Program%20Files/EduTech/packages/types/src/index.ts)      | Admission, Auth, and Common domain TypeScript interfaces      | `@edutrack/api`, `@edutrack/web`, `@edutrack/mobile` |
| `@edutrack/ui`         | [`packages/ui`](file:///c:/Program%20Files/EduTech/packages/ui)                 | [`src/index.ts`](file:///c:/Program%20Files/EduTech/packages/ui/src/index.ts)         | React primitives (`Button`, `Card`, `Badge`)                  | `@edutrack/web`                                      |
| `@edutrack/validation` | [`packages/validation`](file:///c:/Program%20Files/EduTech/packages/validation) | [`src/index.ts`](file:///c:/Program%20Files/EduTech/packages/validation/src/index.ts) | Zod validation schemas (`auth.schema.ts`, `common.schema.ts`) | `@edutrack/api`, `@edutrack/web`, `@edutrack/mobile` |
