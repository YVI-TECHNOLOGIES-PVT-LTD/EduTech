# EduTrack ERP — Stage 3 Phase 2: Persistence Hardening Report (WS2)

> **Workstream:** WS2 — Remove Silent In-Memory Prisma Fallback (`prismaClient.ts`)  
> **Primary Artifact:** [`apps/backend/src/lib/prismaClient.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/lib/prismaClient.ts)  
> **Verification Status:** **PASSED** (`stage3-phase2-hardening.spec.ts` WS1/WS2 checks, `verify_persistence.ts`, plus aligned legacy `PersistenceError` tests in Finance & Academic suites)

---

## 1. Vulnerability Eliminated

Stage 3 Phase 1 identified a critical persistence hazard in [`prismaClient.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/lib/prismaClient.ts):

- `fallbackStores` (`Map`) silently stored CRUD records in process RAM whenever an unmapped model delegate was accessed.
- `createSafeModelDelegate()` synthesized fake `findMany`/`create`/`update`/`delete` handlers against `fallbackStores`.
- `createStrictFinancialDelegate()` and `FINANCIAL_PERSISTENCE_MODELS` intercepted financial models with custom proxy routing.
- `wrapWithFallbackProxy()` masked missing DMMF models by returning volatile in-memory state instead of failing fast.

---

## 2. Hardened Implementation ([`prismaClient.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/lib/prismaClient.ts))

All silent RAM fallback constructs (`fallbackStores`, `createSafeModelDelegate`, `createStrictFinancialDelegate`, `FINANCIAL_PERSISTENCE_MODELS`, and `wrapWithFallbackProxy`) were completely removed and replaced with strict PostgreSQL persistence enforcement:

1. **Typed Fail-Fast Error (`PersistenceError`, [`L13–L32`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/lib/prismaClient.ts#L13-L32)):**
   - Sets `code = 'PRISMA_DELEGATE_UNAVAILABLE'`, `statusCode = 500`, `model`, and optional `operation`.
   - Emits an explicit diagnostic message explaining that the delegate is absent from generated `@prisma/client` DMMF and silent in-memory fallback is disabled.
2. **Unavailable Delegate Proxy (`createUnavailableDelegateProxy`, [`L85–L103`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/lib/prismaClient.ts#L85-L103)):**
   - Any method invocation on an unmapped delegate (e.g., `prisma.unmapped_stage3_table.findMany()`) rejects immediately with `PersistenceError`.
   - Safely ignores Promise/JSON inspection probes (`then`, `catch`, `finally`, `toJSON`, symbols) so JavaScript runtime introspection never falsely triggers `PersistenceError`.
3. **Real Delegate Proxy (`wrapModelDelegate`, [`L105–L118`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/lib/prismaClient.ts#L105-L118)):**
   - Wraps only read-only methods (`findUnique`, `findUniqueOrThrow`, `findFirst`, `findFirstOrThrow`, `findMany`, `count`, `aggregate`, `groupBy`) in `withTransientRetry()` (up to 2 retries on transient PG codes `P1001`, `P1008`, `P1017`, `ECONNRESET`, `ETIMEDOUT`, `EPIPE`).
   - All write/mutation methods (`create`, `update`, `delete`, `upsert`, `createMany`, `updateMany`, `deleteMany`, etc.) execute directly on the native Prisma delegate without blind retry duplication.
4. **Transaction Client Propagation (`wrapPrismaWithStrictPersistence`, [`L122–L186`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/lib/prismaClient.ts#L122-L186)):**
   - Inside interactive `prisma.$transaction(async (tx) => ...)`, `tx` is also wrapped via `wrapPrismaWithStrictPersistence(tx)` so transactional code obeys the same fail-fast rule and never falls back to memory.

---

## 3. Regression & Test Alignment

Pre-existing unit/module tests that previously mocked absent delegates or asserted legacy fallback errors were updated to assert the hardened fail-fast contract (`PersistenceError` / PostgreSQL execution):

- [`apps/backend/src/tests/stage3-phase2-hardening.spec.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/tests/stage3-phase2-hardening.spec.ts): verifies unmapped Stage 3 delegates throw `PersistenceError` (`code === 'PRISMA_DELEGATE_UNAVAILABLE'`), while generated financial and academic models (`fee_structures`, `academic_years`, etc.) hit PostgreSQL directly.
- [`apps/backend/src/modules/academic-management/tests/verify_persistence.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/academic-management/tests/verify_persistence.ts): verified record persistence across isolated `PrismaClient` re-instantiation (`=== DURABLE PERSISTENCE TEST: PASSED ===`).
- Updated legacy assertions in `academic-phase5.spec.ts`, `academic-phase6.spec.ts`, `academic-phase7.spec.ts`, `finance-gateway.spec.ts`, and `finance-scholarships.spec.ts` to match strict fail-fast persistence behavior.
