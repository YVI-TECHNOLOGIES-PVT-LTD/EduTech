# STAGE 3 PHASE 4.1 — DBA DEPLOYMENT GUIDE

**Deployment Authorization Status:** **UNAVAILABLE — DO NOT AUTO-EXECUTE**
Configured `.env` connection targets hosted Supabase (`aws-0-ap-northeast-1.pooler.supabase.com`, database `postgres`, role `postgres.blvseyhzsehfwdmevtyp`). Per Stage 3 Phase 4.1 Execution Approval Gate, database credentials alone do not constitute DBA deployment authorization, so `CREATE OR REPLACE FUNCTION` was NOT executed.

---

## 1. Change Package Files

1. **Forward Script:** [001_fix_s32_validate_activity.sql](file:///Users/sathish/Documents/GitHub/EduTech/docs/stage-3/phase-4-1/sql/001_fix_s32_validate_activity.sql)
2. **Rollback Script:** [002_rollback_s32_validate_activity.sql](file:///Users/sathish/Documents/GitHub/EduTech/docs/stage-3/phase-4-1/sql/002_rollback_s32_validate_activity.sql)
3. **Verification Script (Read-Only):** [003_verify_s32_validate_activity.sql](file:///Users/sathish/Documents/GitHub/EduTech/docs/stage-3/phase-4-1/sql/003_verify_s32_validate_activity.sql)

---

## 2. Authorized DBA Deployment Procedure

1. **Obtain Explicit Change Ticket / Maintenance Approval** for the target environment (`postgres` on `aws-0-ap-northeast-1.pooler.supabase.com`).
2. **Capture Pre-Change Snapshot** (already verified and stored in `002_rollback_s32_validate_activity.sql`): run [003_verify_s32_validate_activity.sql](file:///Users/sathish/Documents/GitHub/EduTech/docs/stage-3/phase-4-1/sql/003_verify_s32_validate_activity.sql).
3. **Execute Forward Script** over direct connection (port `5432`, not `pgbouncer` pooler if session-level DBA locks are preferred):
   ```bash
   psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -f docs/stage-3/phase-4-1/sql/001_fix_s32_validate_activity.sql
   ```
   The script runs inside `BEGIN; ... COMMIT;`, verifies `public.s32_validate_activity()` and `trg_s32_validate_activity` exist beforehand, applies `CREATE OR REPLACE FUNCTION`, restores owner/grants, and asserts inside the transaction that `s.org_id` is absent and `academic_year_grades` / `academic_years` / `ay.org_id` are present.
4. **Verify Post-Deployment Metadata**:
   ```bash
   psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -f docs/stage-3/phase-4-1/sql/003_verify_s32_validate_activity.sql
   ```
   Confirm `contains_invalid_s_org_id = false`, `contains_valid_org_join = true`, and `trigger_enabled_code = O`.
5. **Run Strict Live Write E2E Suite**:
   ```bash
   pnpm --filter @edutrack/api exec node --env-file=.env -r ts-node/register src/modules/learning-activities/tests/learning-activities.spec.ts
   ```
6. **Verify Frozen Schema Untouched**:
   ```bash
   shasum -a 256 apps/backend/prisma/schema.prisma
   wc -c apps/backend/prisma/schema.prisma
   ```
