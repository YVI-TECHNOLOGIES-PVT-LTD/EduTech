# EduTrack Enterprise Monorepo Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

---

## [2.10.0] - 2026-07-29

### Added
- **Release Engineering & Automation (Phase 2.10)**:
  - Automated release workflow in `.github/workflows/release.yml`.
  - Semantic Versioning 2.0.0 governance (`docs/semantic-versioning.md`).
  - SHA-256 artifact checksum verification (`release-checksums.sha256`).
  - `ADR-012-release-engineering.md`.

- **Observability & Operational Excellence (Phase 2.9)**:
  - Structured JSON logger (`LoggerService`) with sensitive key redaction.
  - Operational metrics telemetry (`MetricsService`) capturing latency, error rates, and queue depths.
  - Alert severity levels P1-P4 in `docs/alerting.md` and SLO targets in `docs/slo.md`.
  - `ADR-011-observability-platform.md`.

- **Background Processing & Event-Driven Platform (Phase 2.8)**:
  - Centralized `JobService` abstraction and `QueueAdapter` with exponential backoff & Dead-Letter Queue handling.
  - Worker (`WorkerService`) and Scheduler (`SchedulerService`) runtimes.
  - Versioned Domain Event Bus (`EventBusService`) supporting `AdmissionCreated.v1`, `StudentEnrolled.v1`, `FeePaid.v1`.
  - Standardized `JobEnvelope<T>` payload structure.
  - `ADR-010-background-processing.md`.

- **Caching & Distributed State Platform (Phase 2.7)**:
  - Portable `CacheService` abstraction layer and `CacheKeyFactory` with versioned keys (`v1:cache:...`).
  - Standardized `CacheTTL` constants and `CacheMetrics` interface.
  - `docs/caching.md` and `ADR-009-caching-platform.md`.

- **Mobile Architecture & Offline Platform (Phase 2.6)**:
  - Hardware-backed token encryption via `expo-secure-store`.
  - Request correlation (`X-Request-Id`) and `NetworkProvider` offline banner UI.
  - `docs/mobile-*.md` and `ADR-008-mobile-architecture.md`.

- **Frontend Architecture & Performance (Phase 2.5)**:
  - Standardized provider ordering and multi-tiered React Error Boundaries (`Global`, `Layout`, `Feature`).
  - `QUERY_KEYS` factory and route-level code splitting via `React.lazy()` & `<Suspense>`.
  - `docs/frontend-*.md` and `ADR-007-frontend-architecture.md`.

- **Backend Platform Hardening (Phase 2.4)**:
  - Request correlation (`X-Request-Id`), `helmet` security headers, and three-tier rate limiting.
  - Fail-fast environment configuration validation using Zod in `apps/api/src/config/env.ts`.
  - `docs/backend-operations-runbook.md`, `docs/configuration.md`, and `ADR-006`.

- **API Quality Platform (Phase 2.3)**:
  - Postman collections (`auth`, `admission`, `common`), secret-safe environment templates, and Newman CLI runner.
  - API documentation guides in `docs/api/` and `ADR-005`.

- **Shared Packages & Monorepo Foundation (Phase 2.1 & 2.2)**:
  - `@edutrack/config`, `@edutrack/types`, `@edutrack/validation`, `@edutrack/ui`.
  - `pnpm-workspace.yaml`, `turbo.json`, Husky pre-commit hooks, Commitlint.
  - `ADR-001`, `ADR-002`, `ADR-003`, `ADR-004`.
