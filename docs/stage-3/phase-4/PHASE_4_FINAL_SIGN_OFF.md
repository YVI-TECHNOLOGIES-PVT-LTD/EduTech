# STAGE 3 PHASE 4 — FINAL SIGN-OFF REPORT

**Decision:** **CONDITIONAL IMPLEMENTATION SIGN-OFF — LIVE DB WRITES BLOCKED BY EXTERNAL FROZEN-DB TRIGGER DEFECT (`P0`)**
**Governing Database Contract:** `apps/backend/prisma/schema.prisma` (SHA-256 `73d98492b3a7f2cbfd9348de94a0373ef530be966d6d00c3a4008bc0974d6c39`) — 100% Frozen (zero schema edits, zero migrations, zero PG DDL/function/trigger changes).

---

## 1. Delivered Scope & Verification Summary

1. **Backend (`apps/backend/src/modules/learning-activities/` + `apps/backend/src/routes.ts`):**
   - Implemented complete REST module mounted at `/api/v1/learning-activities` and `/api/learning-activities` with strict role sub-routers (`teacher`, `student`, `parent`, `admin`).
   - SQL-injection-safe `Prisma.sql` repository layer (`learning-activities.repository.ts`), Zod request/param/query schemas (`learning-activities.validation.ts`), role/org policy middleware (`learning-activities.policy.ts`), transactional service layer (`learning-activities.service.ts`), multipart upload validation + Supabase Storage + signed URL downloads, and 6 domain notification/WebSocket event types integrated into `notification.realtime.ts`.
   - Passed `learning-activities-security-and-reads.spec.ts` (`Exit 0`: `401`, `403`, `404`, Zod `400`, live PG Teacher/Student/Parent/Admin `200` GETs, Parent IDOR `403`, Admin `close-due` `200`, and honest `503 DATABASE_TRIGGER_DEFECT` handling).

2. **Web Application (`apps/web_app/src/`):**
   - Added RTK Query API (`shared/api/learningActivities.api.ts`), endpoint map (`ENDPOINTS.LEARNING_ACTIVITIES`), API tags (`LearningActivity`, `LearningSubmission`, `LearningOverview`), realtime cache invalidation (`useNotificationRealtime.ts`), shared status badges (`LearningActivityBadges.tsx`), 4 role-scoped pages (`TeacherLearningActivitiesPage.tsx`, `StudentLearningActivitiesPage.tsx`, `ParentLearningActivitiesPage.tsx` read-only with `ParentChildSelectorBar`, `AdminLearningActivitiesPage.tsx`), and guarded navigation/routes (`route_registry.tsx`, `navigation.ts`).
   - Passed `pnpm --filter @edutrack/web test` (`Exit 0`: `LandingResolver 6/6`, `Academic 13/13`, `Hybrid Classroom 5/5`, `Learning Activities 4/4`) and `tsc --noEmit` across `@edutrack/api`, `@edutrack/web`, and `@edutrack/mobile` (`Exit 0`).

3. **Regressions & Database Cleanliness:**
   - Verified `parent-portal.spec.ts` (`Exit 0`, `14 passed, 0 failed`), `notification.service.spec.ts` (`Exit 0`), `e2e-realtime.spec.ts` (`Exit 0`), and `public.learning_activities` row count = `0`.
   - _External Precondition Note:_ `parent-idor-authorization.spec.ts` exited `1` due to a pre-existing seeded data dependency (`No academic year found in Org A for testing`).

---

## 2. Mandatory External DBA Action Item (P0 Blocker)

**Root Cause Observed in PostgreSQL:**
The frozen database trigger function `public.s32_validate_activity()` (`BEFORE INSERT OR UPDATE ON public.learning_activities`) queries `s.org_id` from `public.sections s`. In the frozen schema, `public.sections` does not have an `org_id` column (`sections` resolves organization membership via `academic_year_grades -> academic_years.org_id`). Consequently, PostgreSQL raises error `42703: column s.org_id does not exist` on every `INSERT` or `UPDATE` to `public.learning_activities`, blocking activity creation/publishing/closing and blocking live E2E execution of student submissions and teacher evaluations (`learning-activities.spec.ts` Step 2 fails strict `201` check with `503 DATABASE_TRIGGER_DEFECT`).

**Recommended External DBA Remediation (Outside Frozen App Scope):**
Update `public.s32_validate_activity()` to derive section organization scope via `academic_year_grades` joined to `academic_years`:

```sql
-- Illustrative DBA remediation pattern inside public.s32_validate_activity():
SELECT ay.org_id
INTO v_section_org_id
FROM public.sections s
JOIN public.academic_year_grades ayg
  ON ayg.academic_year_grade_id = s.academic_year_grade_id
JOIN public.academic_years ay
  ON ay.academic_year_id = ayg.academic_year_id
WHERE s.section_id = NEW.section_id;
```

Once applied and verified in PostgreSQL, re-run the unweakened E2E suite to complete full write-path sign-off:

```bash
pnpm --filter @edutrack/api exec node --env-file=.env -r ts-node/register src/modules/learning-activities/tests/learning-activities.spec.ts
```

---

## 3. Recommended Post-Freeze Schema & Product Enhancements (Documented Only — Not Applied)

1. Allow configurable teacher-authored attachment files directly on `learning_activities` if curriculum handouts separate from `lesson_plans` / uploaded resources are desired.
2. Add rubric criterion breakdown storage for project evaluations if analytical rubric scoring per activity is required beyond aggregate `obtained_marks` + `feedback`.
3. Align `@edutrack/mobile` (`apps/mobile_app/src/api/endpoints.ts` `HOMEWORK`) with `/v1/learning-activities/student/*` and `/v1/learning-activities/parent/children/:childId/*` after DBA trigger remediation.
