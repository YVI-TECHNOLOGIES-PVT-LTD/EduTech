# EduTrack Enterprise Migration Framework

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

## 🚀 Installation & Prerequisites

Ensure dependencies are installed in `backend/`:

```bash
cd backend
npm install
```

Environment variable configuration (`.env`):
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/edutrack
```

---

## 📖 CLI Usage & Examples

### 1. View Migration Status
```bash
npx ts-node scripts/migration-runner.ts --status
```

### 2. Dry-Run Simulation (Safe Inspection Mode)
```bash
npx ts-node scripts/migration-runner.ts --dry-run
```

### 3. Execute Decommissioning Migrations (131 to 140)
```bash
npx ts-node scripts/migration-runner.ts --from=131 --to=140
```

### 4. Execute Single Targeted Migration
```bash
npx ts-node scripts/migration-runner.ts --only=131
```

### 5. Rollback Last Executed Migration
```bash
npx ts-node scripts/migration-runner.ts --rollback
```

---

## 📊 File Architecture

```
backend/scripts/
├── migration-runner.ts      # Main CLI orchestrator & execution flow
├── migration-validator.ts   # Pre-execution SQL syntax & safety parser
├── dependency-checker.ts    # Target Architecture Guard (Foundation/Admission protection)
├── migration-history.ts    # Database migration_history table manager
├── migration-backup.ts     # Pre-execution pg_dump automated backup creator
├── migration-report.ts     # Markdown report generator (reports/migration-report.md)
├── rollback-runner.ts      # Transaction-wrapped rollback runner
├── database-lock.ts        # Advisory lock manager (pg_advisory_lock)
├── migration-config.ts      # CLI argument parser & environment config
├── logger.ts               # Color-coded console logger & append-only file logger
└── README.md               # Documentation
```

---

## 🛡️ Target Architecture Preservation Guarantee

The framework enforces hard safety locks for protected tables:
- **Foundation**: `users`, `roles`, `permissions`, `schools`, `workflows`
- **Core Shared Platform**: `academic_years`, `classes`, `sections`, `subjects`, `faculty_profiles`, `assessment_*`
- **Standalone Admission**: `admission_applications`, `admission_documents`, `admission_fee_snapshots`, `crm_leads`

If any migration script attempts a `DROP TABLE` or destructive `ALTER` on these entities, execution is **immediately aborted**.
