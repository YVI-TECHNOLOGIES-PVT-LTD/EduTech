# STAGE 3 PHASE 4.1 — DATABASE VERIFICATION REPORT

**Verification Script:** [003_verify_s32_validate_activity.sql](file:///Users/sathish/Documents/GitHub/EduTech/docs/stage-3/phase-4-1/sql/003_verify_s32_validate_activity.sql)
**Execution Mode:** Read-Only Baseline Inspection Against Live PostgreSQL `17.6` (`postgres`)

---

## 1. Frozen Prisma Schema Verification

- File: [schema.prisma](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/prisma/schema.prisma)
- Observed SHA-256: `73d98492b3a7f2cbfd9348de94a0373ef530be966d6d00c3a4008bc0974d6c39` (matches expected)
- Observed Byte Size: `445174` (matches expected)
- Migrations Directory: Zero migrations created (`apps/backend/prisma/` contains only `schema.prisma`).

---

## 2. Observed Live PostgreSQL Metadata (Pre-Deployment State)

| Check                                    | Observed Live Result                                                                                                      | Status                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Schema / Function Name                   | `public.s32_validate_activity()` (`oid = 39803`, `language = plpgsql`)                                                    | Observed                        |
| Owner / Security Mode / Volatility       | `owner_role = postgres`, `is_security_definer = false`, `volatility = v`                                                  | Observed                        |
| Grants (`proacl` / `routine_privileges`) | `{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}`                      | Observed                        |
| `contains_invalid_s_org_id`              | `true` (defect still live in PostgreSQL)                                                                                  | **DEFECT PRESENT (UNDEPLOYED)** |
| `contains_valid_org_join`                | `false`                                                                                                                   | **DEFECT PRESENT (UNDEPLOYED)** |
| `trg_s32_validate_activity`              | `BEFORE INSERT OR UPDATE ON learning_activities FOR EACH ROW EXECUTE FUNCTION s32_validate_activity()`, `tgenabled = 'O'` | Enabled                         |
| `trg_s32_audit_activity`                 | `AFTER INSERT OR UPDATE ON learning_activities FOR EACH ROW EXECUTE FUNCTION s32_audit_activity()`, `tgenabled = 'O'`     | Enabled                         |
| `trg_s32_activity_updated_at`            | `BEFORE UPDATE ON learning_activities FOR EACH ROW EXECUTE FUNCTION s32_touch_updated_at()`, `tgenabled = 'O'`            | Enabled                         |

---

## 3. Clean Table Counts Verification

Live read-only count query across all 5 `S3.2` physical tables:

- `public.learning_activities`: `0`
- `public.learning_activity_audit_history`: `0`
- `public.learning_activity_submissions`: `0`
- `public.learning_activity_submission_files`: `0`
- `public.learning_activity_submission_reviews`: `0`

Post-deployment verification of `contains_invalid_s_org_id = false` and `contains_valid_org_join = true` remains **NOT EXECUTED (BLOCKED — DBA APPROVAL REQUIRED)**.
