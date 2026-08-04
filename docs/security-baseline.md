# EduTrack Operational Security Baseline

> **Architecture Version:** 2.12.0  
> **Owner:** EduTrack Security & Platform Team  
> **Status:** Active Governance  
> **Last Updated:** 2026-07-29  

---

## 1. Secrets & Environment Governance
- **Zero Secrets in Code**: Hardcoding API keys, DB passwords, JWT secrets, or tokens in source code is strictly PROHIBITED.
- **Fail-Fast Environment Validation**: All environment variables MUST be validated on application startup via Zod schemas in `apps/api/src/config/env.ts`.

## 2. Container Security
- Backend containers MUST execute under non-privileged users (`USER node`).
- Base images MUST use minimal Alpine distributions (`node:20-alpine`, `nginx:1.25-alpine`).

## 3. Credential Storage Governance
- Web App: JWT stored in HTTP-only `SameSite=Lax` cookies.
- Mobile App: Credentials encrypted in hardware security modules via `expo-secure-store`.
