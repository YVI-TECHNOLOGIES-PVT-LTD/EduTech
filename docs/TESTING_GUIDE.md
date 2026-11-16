# EduTrack ERP — Automated Testing Guide

## 1. Unit & Integration Testing Commands

```bash
# Run NestJS / Web App Typechecks
pnpm --filter @edutrack/api typecheck
pnpm --filter @edutrack/web typecheck

# Run ESLint validation
pnpm run lint
```

## 2. API Contract Verification via Newman / Postman

```bash
# Run Stage-1 Postman API Automated Collection
newman run postman/collections/EduTrack_Stage1.postman_collection.json \
  -e postman/environments/development.postman_environment.template.json \
  --reporters cli,htmlextra
```
