# Monorepo Troubleshooting Guide

## 1. Node & pnpm Workspace Issues

### Symptom: `ERR_PNPM_NO_MATCHING_VERSION` or broken workspace symlinks

**Resolution:**

```powershell
pnpm install --force
```

---

## 2. Turborepo & Build Cache Issues

### Symptom: Changes to shared packages (`@edutrack/types` or `@edutrack/config`) not reflecting

**Resolution:**
Clear Turbo cache and force re-evaluating build tasks:

```powershell
pnpm run clean
pnpm verify
```

---

## 3. Prisma & Database Issues

### Symptom: Cannot find module `@prisma/client`

**Resolution:**
Regenerate Prisma client bindings:

```powershell
pnpm --filter @edutrack/api run prisma:generate
```
