# STAGE 3 PHASE 4.1 — ACTIVITY WRITE VERIFICATION (TESTS 1–4 & 10)

**Status:** **BLOCKED — DBA APPROVAL REQUIRED**
Live `INSERT`/`UPDATE` writes against `public.learning_activities` remain blocked by the undeployed defect in `public.s32_validate_activity()` (`42703: column s.org_id does not exist`).

---

## 1. Observed Live Verification Results

| Scenario (Section 7)                                                                    | Scope Covered                                                                                                                                                                                         | Observed Live Result                                                                                                                                                | Status                               |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| **Test 1 — Activity Creation** (`POST /v1/learning-activities/teacher/activities`)      | Valid payload reaches PostgreSQL `INSERT`, fires `trg_s32_validate_activity`, hits PG `42703` (`column s.org_id does not exist`), translated to HTTP `503 DATABASE_TRIGGER_DEFECT`                    | **Blocked (`503 !== 201`)** in `learning-activities.spec.ts` Step 2 & verified as `503 DATABASE_TRIGGER_DEFECT` in `learning-activities-security-and-reads.spec.ts` | **BLOCKED (DBA)**                    |
| **Test 2 — Activity Update** (`PATCH /activities/:activityId`, `POST /extend-late`)     | Zod & service validation verified; PostgreSQL `UPDATE` requires persisted row & fixed trigger                                                                                                         | Zod invalid payloads rejected (`400`); live DB `UPDATE` **Not Reached**                                                                                             | **BLOCKED (DBA)**                    |
| **Test 3 — Activity Publication** (`POST /activities/:activityId/publish`)              | Route/service/WS event implemented; live `UPDATE` requires persisted draft & fixed trigger                                                                                                            | **Not Reached**                                                                                                                                                     | **BLOCKED (DBA)**                    |
| **Test 4 — Activity Closure** (`POST /activities/:activityId/close`, `POST /close-due`) | Admin bulk `POST /v1/learning-activities/admin/activities/close-due` executed cleanly (`200`, `0` closed with `0` rows); explicit activity close requires persisted published activity                | Admin `close-due`: **PASSED (`200`)**; Single-activity close: **BLOCKED (DBA)**                                                                                     | **PARTIAL / BLOCKED**                |
| **Test 10 — Trigger Constraints Preservation**                                          | Audited all 11 `public.s32_*` functions & triggers (`trg_s32_validate_activity`, `trg_s32_audit_activity`, `trg_s32_activity_updated_at`, etc.): all remain enabled (`tgenabled = 'O'`) and untouched | Enabled state verified in `pg_trigger`; live invalid-data constraint triggers on `learning_activities` **BLOCKED (DBA)** on `s32_validate_activity()`               | **VERIFIED ENABLED / WRITE-BLOCKED** |

---

## 2. Unweakened Test Commitment

[learning-activities.spec.ts](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/learning-activities/tests/learning-activities.spec.ts) retains strict HTTP `201`/`200` write assertions without mocks, skipped steps, or trigger bypasses. Once an authorized DBA deploys [001_fix_s32_validate_activity.sql](file:///Users/sathish/Documents/GitHub/EduTech/docs/stage-3/phase-4-1/sql/001_fix_s32_validate_activity.sql), Step 2 onward can execute directly against live PostgreSQL.
