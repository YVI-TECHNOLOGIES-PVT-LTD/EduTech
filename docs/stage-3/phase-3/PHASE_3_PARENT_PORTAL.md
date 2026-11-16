# EduTrack ERP — Stage 3 Phase 3: Parent Portal Implementation

> **Parent Route:** `/app/parent/classroom` ([`ParentClassroomPage.tsx`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/classroom/pages/ParentClassroomPage.tsx))  
> **Child Selector State:** [`useParentSelectedChild`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/parent/hooks/useParentSelectedChild.ts), [`ParentChildSelectorBar`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/parent/components/ParentChildSelectorBar.tsx)

---

## 1. Strict Read-Only & Multi-Child Security Design

1. **Navigation & Role Guard:**
   - Mounted in [`route_registry.tsx`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/config/route_registry.tsx) under `/app/parent/classroom` with `allowedRoles: ['PARENT', 'ENROLLED_PARENT']`.
   - Added to `POST_ADMISSION_PARENT_NAVIGATION` in [`navigation.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/config/navigation.ts).
2. **Backend Parent Ownership Enforcement (`ParentPortalPolicy` + `verifyParentChildOwnership`):**
   - Every `/api/v1/classroom/parent/children/:childId/*` request passes `ParentPortalPolicy.requireParentRole()` and verifies an active `student_parents` link between the authenticated `user_id`/`email` and `childId` within the verified `org_id` (`403 FORBIDDEN` on any unlinked child IDOR attempt).
3. **Zero Meeting Link Leakage & Zero Join Mutation Capability:**
   - Backend calls `listStudentOrParentSessions(..., exposeMeetingUrlWhenJoinable: false)` and strips `meeting_url` to `null` and `can_join` to `false` across all parent responses — even when a child's online/hybrid session is actively `in_progress`.
   - Calling student `/join` or teacher write endpoints with a parent JWT returns `403 FORBIDDEN`.

---

## 2. Parent Classroom Visibility Capabilities

- Reuses [`ParentChildSelectorBar`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/parent/components/ParentChildSelectorBar.tsx), `ParentLoadingSkeleton`, `ParentErrorState`, and `ParentNoChildrenState` so multi-child switching behaves identically to Stage 2 parent pages.
- **Child Overview & Attendance KPIs:** Displays server-computed attendance percentage, total/conducted/marked session counts, present/late/absent/excused breakdown via [`AttendanceSummaryCards`](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/classroom/components/ClassroomBadges.tsx).
- **Sessions & Attendance History Tabs:** Read-only schedule visibility (subject, teacher, physical room, delivery mode, flipped/traditional badge, topics covered, `not_conducted_reason`) and per-session attendance log with participation mode (`physical` vs `online`).
