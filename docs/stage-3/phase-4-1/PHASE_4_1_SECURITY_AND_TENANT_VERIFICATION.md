# STAGE 3 PHASE 4.1 — SECURITY & TENANT ISOLATION VERIFICATION (TEST 8)

**Status:** **AUTH / RBAC / READ / IDOR CHECKS PASSED; WRITE-SIDE ISOLATION BLOCKED BY DBA TRIGGER DEFECT**

---

## 1. Directly Observed Live Verification (`learning-activities-security-and-reads.spec.ts` — Exit `0`)

Verified live against PostgreSQL and Express HTTP server:

1. **Unauthenticated Fail-Closed (`401`)**:
   - `GET /api/v1/learning-activities/teacher/overview` -> `401`
   - `GET /api/v1/learning-activities/student/overview` -> `401`
   - `GET /api/v1/learning-activities/parent/children/:childId/overview` -> `401`
   - `GET /api/v1/learning-activities/admin/overview` -> `401`
2. **Role Segregation (`403`)**:
   - Non-role tokens calling Teacher (`403`), Student (`403`), and Admin (`403`) routes are rejected cleanly by `LearningActivitiesPolicy` (`extractLearningActivityAuthContext` + `ParentPortalPolicy.requireParentRole()`).
3. **Linked vs Unlinked Parent IDOR Isolation (`200` vs `403`)**:
   - Linked parent reading linked child overview/activities: `200`
   - Unlinked parent querying the same `childId`: **`403`**
4. **Input & Resource Validation (`400` / `404`)**:
   - Unknown activity UUID (`GET /admin/activities/:id`) -> `404`
   - Invalid creation payload (`POST /teacher/activities`) -> `400`
   - Non-UUID path param (`GET /teacher/activities/not-a-uuid`) -> `400`
5. **Frontend Route Guard Isolation (`pnpm --filter @edutrack/web test` — Exit `0`)**:
   - `LandingResolver` (`6 passed, 0 failed`), `Learning Activities` (`4/4` test groups passed validating `ROUTE_REGISTRY`, sidebar visibility, cross-role isolation, and SSR).

---

## 2. Blocked Write-Side Security Tests (Pending DBA Trigger Deployment)

- Cross-tenant activity mutation/read of persisted rows, unassigned teacher modification rejection (`403`), student cross-student submission/download denial (`403`), and parent write-block against persisted activities (`learning-activities.spec.ts` Steps 3–6) remain **NOT REACHED / BLOCKED (`503 DATABASE_TRIGGER_DEFECT`)** until `001_fix_s32_validate_activity.sql` is approved and deployed.
- Pre-existing unrelated admission test [parent-idor-authorization.spec.ts](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/admission-management/tests/parent-idor-authorization.spec.ts) continues to exit `1` due to an environment fixture precondition at line 62 (`Error: No academic year found in Org A for testing` — Org A `'00000000-0000-0000-0000-000000000001'` lacks a seeded academic year).
