# STAGE 3 PHASE 4.1 — ROLLBACK GUIDE

**Rollback Artifact:** [002_rollback_s32_validate_activity.sql](file:///Users/sathish/Documents/GitHub/EduTech/docs/stage-3/phase-4-1/sql/002_rollback_s32_validate_activity.sql)

---

## 1. Rollback Provenance

- The rollback script was constructed directly from the verbatim live `pg_get_functiondef(39803)` output captured from PostgreSQL `17.6` (`public.s32_validate_activity()`) prior to any change attempt on `2026-11-12`.
- No logic was reconstructed from memory. It preserves the original owner (`postgres`) and exact `EXECUTE` grants (`PUBLIC`, `postgres WITH GRANT OPTION`, `anon`, `authenticated`, `service_role`) inside a transactional `BEGIN; ... COMMIT;` block.

---

## 2. When to Execute Rollback

Execute **only** if an authorized DBA deployed `001_fix_s32_validate_activity.sql` and post-deployment verification indicates an unexpected regression requiring restoration of the exact pre-change function definition:

```bash
psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -f docs/stage-3/phase-4-1/sql/002_rollback_s32_validate_activity.sql
```

- **Do NOT** run rollback during standard forward verification.
- Because `001_fix_s32_validate_activity.sql` has **not** been executed against live PostgreSQL (`BLOCKED — DBA APPROVAL REQUIRED`), no rollback action is currently needed.
