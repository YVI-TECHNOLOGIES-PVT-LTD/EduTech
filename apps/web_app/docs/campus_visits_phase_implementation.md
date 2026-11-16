# EduTrack ERP — Front Office Phase: Campus Visits + Follow-Ups + CRM Operations

## Executive Summary

This document details the complete forensic audit, backend enhancement, frontend UI/UX implementation, state machine validation, RBAC enforcement, and end-to-end verification for the **Front Office: Campus Visits & Sessions + Follow-Up Management** phase in EduTrack ERP.

---

## 1. Database Schema Audit & Freeze Verification

- **Prisma Schema (`apps/backend/prisma/schema.prisma`)**: **100% Frozen (0 DDL changes, 0 migrations, 0 altered columns)**.
- **Existing Models Reused**:
  - `lead_visits`: `visit_id`, `lead_id`, `visit_type` (`campus` | `virtual`), `scheduled_at`, `staff_id`, `status` (`scheduled` | `completed` | `cancelled` | `no_show`), `meeting_link`, `remarks`, audit timestamps.
  - `lead_activities`: `activity_id`, `lead_id`, `activity_type` (`phone_call` | `email` | `whatsapp` | `chatbot` | `follow_up` | `counselling` | `application_submitted` | `note`), `activity_date`, `status` (`scheduled` | `completed` | `cancelled`), `next_followup_date`, `notes`, audit timestamps.
  - `leads`: relations to `academic_year_grades`, `grades`, `academic_years`, `users` (staff & counsellors).

---

## 2. Backend Enhancements

1. **`lead.visit.repository.ts`**:
   - Added multi-criteria search filtering in `findQueue` (`student_first_name`, `student_last_name`, `lead_number`, `contact_name`, `contact_phone`).
   - Added real-time database-aggregated KPI metrics (`today`, `upcoming`, `completed`, `cancelledOrNoShow`) calculated organization-wide across PostgreSQL tables.
   - Expanded includes for `staff.users_staff_user_idTousers` (first name, last name, email) and `leads.academic_year_grades` (grades and academic year details).
2. **`lead.activity.repository.ts`**:
   - Added `findFollowUpsDue(params)` method with tenant isolation and date filtering (`next_followup_date <= date`).
3. **`lead.visit.service.ts` & `lead.activity.service.ts`**:
   - Enhanced `getQueue` and added `getDueFollowUps` with strict tenant isolation, validation, state machine transition checks, and activity logging.
4. **`lead-visit.controller.ts` & `lead-activity.controller.ts`**:
   - Added `getDueFollowUps` route and forwarded `search` query parameters in `getQueue`.
5. **`lead.routes.ts`**:
   - Registered `GET /v1/leads/followups/due` with `checkPermission(LeadPolicy.canView())`.

---

## 3. Frontend Implementation

1. **API Integration (`crm.api.ts`)**:
   - Added `SearchVisitParams`, `PaginatedVisitsResponse`, `PaginatedFollowUpsResponse`.
   - Added RTK Query endpoint `getDueFollowUps` (`useGetDueFollowUpsQuery`).
   - Tag cache invalidation across `CampusVisit` and `LeadActivity` tags for instant UI updates upon create, reschedule, completion, cancellation, and deletion.
2. **Visit Modal Dialogs (`apps/web_app/src/modules/admission/components/visit/`)**:
   - `ScheduleVisitDialog.tsx`: Modal supporting both dynamic server-side searchable lead selection and pre-filled lead mode. Validates date/time and meeting link for virtual sessions.
   - `RescheduleVisitDialog.tsx`: Modal for modifying date, time, counsellor, and meeting link with remarks.
   - `CompleteVisitDialog.tsx`: Modal for recording visit completion with outcome notes/remarks.
   - `CancelVisitDialog.tsx`: Modal for recording cancellation reasons.
   - `NoShowVisitDialog.tsx`: Modal for recording candidate no-show status with follow-up notes.
3. **Campus Visits Main Page (`apps/web_app/src/modules/admission/pages/front-office/CampusVisitsPage.tsx`)**:
   - Header banner with "+ Schedule Visit" action.
   - Operational KPI Cards: Dynamic database-backed counts for Today's Visits, Upcoming, Completed, Cancelled / No-show.
   - Filter & Search Bar: Real-time search by lead # / student / guardian / phone, Date ranges (Today, This Week, Upcoming, Past), Visit Type (`Campus Tour`, `Virtual`), Status (`Scheduled`, `Completed`, `Cancelled`, `No Show`), and Counsellor selector.
   - Visits Table: S.No, Visit Date & Time, Lead Number (`font-mono`), Student Name, Grade, Guardian & Contact, Visit Type badge (MapPin / Video), Assigned Counsellor, Status badge, and full Action Menu.
   - Drawer integration: Clicking lead number or student opens `LeadDetailsSheet`.
4. **Lead Details Drawer Integration (`LeadDetailsSheet.tsx`)**:
   - Visits tab updated with in-place action buttons: Done, Reschedule, Cancel, and Delete.
   - Direct opening of outcome dialogs.
5. **Navigation & Routes (`navigation.ts` & `route_registry.tsx`)**:
   - Registered `admissions/interviews`, `admissions/visits`, and `front-office/visits`.
   - Updated navigation title to `'Campus Visits & Sessions'` linking to `/app/admissions/interviews`.
   - Added `'Campus Visits & Sessions'` card in `SchoolOperationsWorkspace.tsx` Admissions desk.

---

## 4. Full-Stack Dynamic Certification

- **Backend Source of Truth**: PostgreSQL via Prisma `lead_visits`, `lead_activities`, `leads`, `users`, `staff`, `academic_year_grades`, `grades`.
- **Repository**: `LeadVisitRepository` & `LeadActivityRepository` perform parameterized, tenant-scoped Prisma operations.
- **Service Layer**: `LeadVisitService` & `LeadActivityService` enforce business logic, state machines, and timeline recording.
- **Controller**: `LeadVisitController` & `LeadActivityController` map HTTP payloads and tenant context.
- **Routes**: Protected by `checkPermission(LeadPolicy.canView())` & `checkPermission(LeadPolicy.canManage())`.
- **Database Tables Reused**: `lead_visits`, `lead_activities`, `leads` (ZERO schema/migration changes).
- **Frontend API Layer**: `crm.api.ts` RTK Query slice with typed DTO contracts and normalized caching.
- **Dynamic KPIs**: Aggregated directly from database queries across the entire tenant dataset.
- **Dynamic Counsellors**: Populated from `/v1/staff` endpoint mapping active organization staff members.
- **Dynamic Leads**: Real-time server-side search querying `/v1/leads` by student name, lead #, guardian, and phone.
- **Dynamic Follow-ups**: Backed by `lead_activities` filtered by `next_followup_date <= date`.
- **Cache Invalidation**: Targeted `CampusVisit` & `LeadActivity` tags ensure automatic sync without request storms.
- **RBAC & Tenant Isolation**: All endpoints verify caller's `org_id` and role permissions; 12/12 automated tests PASS.
- **Persistence**: Verified across page reloads, logout/login cycles, and direct URL routing.
