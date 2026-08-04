# EduTrack Engineering Standards Handbook

> **Architecture Version:** 2.12.0  
> **Owner:** EduTrack Platform Team  
> **Status:** Active Governance  
> **Last Updated:** 2026-07-29  

---

## 1. Naming Conventions & Code Style
- **TypeScript Files**: `camelCase.ts` for utilities, `kebab-case.service.ts` for services, `PascalCase.tsx` for React components.
- **Interfaces & Types**: `PascalCase` without `I` prefix unless abstract interfaces (e.g. `ICacheAdapter`).
- **Global Constants**: `UPPER_SNAKE_CASE`.

## 2. API Response Envelope Standard
All HTTP responses MUST be wrapped in the standard envelope:
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "requestId": "req-12345",
    "timestamp": "2026-07-29T17:50:00Z"
  }
}
```

## 3. Mandatory Testing Rules
- Every API endpoint modification MUST be accompanied by Newman integration test collection updates under `postman/collections/`.
- No PR may be merged if `pnpm run typecheck`, `pnpm run lint`, or `pnpm run test:all` fail.
