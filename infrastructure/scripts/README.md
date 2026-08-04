# EduTrack Enterprise Infrastructure & Migration Framework

Enterprise-grade database migration execution tool built for the **EduTrack Platform**.

---

## 🌟 Key Features

- **Advisory Locking**: Prevents concurrent migration execution instances using PostgreSQL advisory locks (`pg_advisory_lock`).
- **Target Architecture Guard**: Built-in AST checker ensures **Foundation**, **Core Shared Platform (Academic & Assessment)**, and **Standalone Admission** objects are **NEVER** modified or dropped.
- **Dry-Run Inspection (`--dry-run`)**: Simulates execution plan, validates SQL syntax/safety, and estimates duration without altering database state.
- **Atomic Transactions (`BEGIN ... COMMIT / ROLLBACK`)**: Every migration executes within a dedicated PostgreSQL transaction. Automatic rollback on failure.
- **Pre-Execution Automated Backups**: Creates binary database dumps in `backups/` using `pg_dump` prior to applying migrations.
- **Migration History (`migration_history`)**: Tracks execution timestamps, sha256 checksums, status, execution duration, and failure logs.
- **Markdown Reporting (`reports/migration-report.md`)**: Automatically generates formatted post-execution reports.

---

## 🚀 CLI Usage & Examples

### 1. View Migration Status
```bash
npm --prefix apps/api run migrate:status
```

### 2. Dry-Run Simulation (Safe Inspection Mode)
```bash
npm --prefix apps/api run migrate:dry-run
```

### 3. Execute Migrations
```bash
npm --prefix apps/api run migrate
```
