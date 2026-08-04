# ADR-005: Adopt Postman + Newman Enterprise API Quality Platform

## Status
Accepted

## Context
The EduTrack platform lacked automated API collection runners, negative testing matrices, and secret-safe environment templates for API validation in CI pipelines.

## Decision
We adopt **Postman Collections + Newman CLI** as the enterprise API quality platform:
1. Audit-driven Postman collections in `postman/collections/` (`auth`, `admission`, `common`).
2. Secret-safe environment templates in `postman/environments/` (never committing live secrets).
3. JWT token extraction automation in Postman test scripts.
4. Newman CLI test runner integrated into root `package.json` (`pnpm run test:all`) and GitHub Actions CI.

## Consequences
### Positive
- Repeatable API test automation across development, staging, and production environments.
- Comprehensive coverage of success and negative/failure HTTP scenarios.
- HTML, JSON, and JUnit test reports generated automatically in CI.

### Negative
- Postman collections must be kept synchronized as API endpoints evolve.

## Rollback Strategy
Remove Newman execution step from `.github/workflows/ci.yml` and root test scripts.
