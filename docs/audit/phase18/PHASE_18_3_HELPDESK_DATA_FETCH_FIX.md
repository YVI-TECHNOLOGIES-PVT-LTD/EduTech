# EduTrack ERP — Phase 18.3 Audit & Repair Report

## Route: `/app/communication/helpdesk` Runtime API Integration & Data Fetch Repair

**Date:** 2026-10-30  
**Target Organization:** Greenwood School, Delhi (`624efc1b-4144-43a4-90b8-552d945cbef7`)  
**Tested Browser Persona:** Siddharth Iyer (`syn.parent.siddharth.iyer.77@synthetic.edutrack.internal`, `user_id`: `b48569fb-b4e3-53d3-8d89-28ba05131ab6`), parent of Riya Iyer (`student_id`: `6b7f176c-ebca-52fe-befa-752822194578`)  
**Status:** FULLY REPAIRED & VERIFIED (42/42 Tests Passing)

---

## 1. Root Cause Analysis

A thorough end-to-end trace from the React frontend (`FinanceCommunicationHelpdesk.tsx`), through the API gateway (`apps/backend/src/routes.ts`), down to `HelpdeskService.ts` and the PostgreSQL schema identified four distinct root causes that caused the Helpdesk route to render "No tickets found" and an empty ticket conversation panel:

1. **Conversation Panel Contract & Payload Structure Mismatch:**
   - In `HelpdeskService.getTicketById`, the backend returned an object shaped as `{ ticket: {...}, messages: [...], history: [...] }`.
   - The frontend component `FinanceCommunicationHelpdesk.tsx` evaluated `ticketDetails?.helpdesk_messages` to render conversation messages and expected `ticketDetails.ticket_number`, `ticketDetails.title`, and `ticketDetails.status`.
   - Because `helpdesk_messages` was `undefined`, JavaScript evaluation of `undefined?.length === 0` resulted in `false`, and `ticketDetails?.helpdesk_messages?.map(...)` returned `undefined`. As a result, the entire conversation panel was blank ("No messages in ticket" / blank thread).
   - Similarly, `ticketDetails.ticket_number` and `ticketDetails.title` were `undefined`, causing the detail view header to be empty.

2. **Missing Virtual Ticket Number and Title Mapping in `listTickets`:**
   - The PostgreSQL table `helpdesk_tickets` stores metadata (`ticket_id`, `category_id`, `requester_user_id`, `student_id`, `priority`, `status`, `created_at`), while the initial subject and description are stored in `helpdesk_messages` (`message_type: 'initial_description'`).
   - `HelpdeskService.listTickets` did not include initial messages in the Prisma query and returned raw ticket records directly without computing virtual attributes `ticket_number` (formatted as `TICK-${id.slice(0, 8)}`) or extracting `title`.
   - Consequently, the ticket list cards displayed a generic badge ("TICKET") and an empty title.

3. **Missing Child Linkage Endpoint (`/parent/students`):**
   - On component mount, `FinanceCommunicationHelpdesk.tsx` called `apiClient.get('/parent/students')` to populate the "Select Child" dropdown for parents creating tickets.
   - No route handler for `/parent/students` existed in the backend API router, returning HTTP 404.
   - Consequently, `parentChildren` remained an empty array (`[]`), preventing parents from selecting a child. When creating a ticket, `student_id` was sent as `null`, leaving tickets detached from student enrollment records.

4. **Rigid Parent Link Lookup by `user_id` vs Email Matching:**
   - Parent accounts in `parents` can link to user sessions either through direct `user_id` foreign keys or via verified email matching (e.g., pre-enrollment admissions records).
   - In `listTickets`, `getTicketById`, and `addMessage`, parent-child authorization only looked up `parents` by `{ user_id }` without an email fallback, preventing resolution of linked children when `user_id` was not directly mapped.
   - Furthermore, when a parent had no linked students, Prisma queries with `{ student_id: { in: [] } }` inside `OR` conditions caused empty result sets.

---

## 2. Changes Made

### A. Backend Service Layer (`apps/backend/src/modules/communication/services/HelpdeskService.ts`)

- **Dual Identifier Parent Scoping:**
  - Updated `listTickets`, `createTicket`, `getTicketById`, and `addMessage` to resolve parent records using `OR: [{ user_id: userId }, ...(user?.email ? [{ email: { equals: user.email.trim(), mode: 'insensitive' } }] : [])]`.
  - Conditioned `student_id` filtering so that `{ student_id: { in: Array.from(studentIds) } }` is only added to `where.OR` when `studentIds.size > 0`.
- **Enriched `listTickets` Query & Projection:**
  - Included `helpdesk_messages: { orderBy: { created_at: 'asc' }, take: 1, select: { content: true, created_at: true } }`.
  - Mapped results to populate virtual `ticket_number` (`TICK-${t.ticket_id.slice(0, 8).toUpperCase()}`), `title` (first line of initial message), and `description`.
- **Harmonized `getTicketById` Response:**
  - Maintained backward compatibility by returning both nested `{ ticket, messages, history }` and flattened properties: `ticket_number`, `title`, `helpdesk_messages` (with serialized attachments), `helpdesk_attachments` (flattened from all messages), and `history` formatted with `from_status`, `to_status`, `notes`, and `changed_at`.
- **Auto-Association on Ticket Creation:**
  - If a parent has exactly 1 linked child and omits `student_id`, `createTicket` automatically maps `student_id` to the parent's verified child.
- **Added `getParentChildren` Method:**
  - Returns verified linked children (`student_id`, `id`, `first_name`, `last_name`, `admission_no`, `status`) for any authenticated parent.

### B. Backend Controller & Routing (`apps/backend/src/modules/communication/controllers/communication.controller.ts`, `communication.routes.ts`, `routes.ts`)

- Added `CommunicationController.getChildrenForParent` method.
- Mounted `/communication/helpdesk/children` and `/communication/parent/students` in `communication.routes.ts`.
- Added global route aliases `/parent/students` and `/v1/parent/students` in `apps/backend/src/routes.ts` protected by `authenticate` and `resolveTenantMiddleware`.

### C. Frontend Component Layer (`apps/web_app/src/modules/fees/pages/FinanceCommunicationHelpdesk.tsx`)

- Updated child fetching to request `/communication/helpdesk/children` with fallback to `/parent/students`.
- Replaced rigid property accesses with resilient fallbacks:
  - Ticket title: `t.title || t.description || 'Support Request'`.
  - Ticket number: `ticketDetails?.ticket_number || ticketDetails?.ticketNumber || selectedTicket.ticket_number || ('TICK-' + selectedTicket.ticket_id.slice(0, 8).toUpperCase())`.
  - Conversation messages: `ticketDetails?.helpdesk_messages || ticketDetails?.messages || ticketDetails?.ticket?.helpdesk_messages || []`.
  - Attachments: `ticketDetails?.helpdesk_attachments || ticketDetails?.attachments || []`.
  - Audit history: `ticketDetails?.history || ticketDetails?.ticket?.history || []`.
- Fixed Lucide icon `title` prop warning in `SocialFeedRightSidebar.tsx`.

---

## 3. Verification & Live Output

### A. TypeScript Typecheck Verification

- **Backend:** `cd apps/backend && ./node_modules/.bin/tsc --noEmit` &rarr; **0 Errors**.
- **Web App:** `cd apps/web_app && npx tsc --noEmit` &rarr; **0 Errors**.

### B. Comprehensive Unit & Integration Test Suite

Command: `cd apps/backend && ./node_modules/.bin/ts-node src/modules/communication/tests/communication.service.spec.ts`

```
=====================================================
   COMMUNICATION & HELPDESK TEST SUITE
=====================================================

  ✓ 1. Escalation Rule precedence: Category + Priority is highest tier
  ✓ 2. Escalation Rule precedence: Category-only beats Priority-only
  ✓ 3. Escalation Rule precedence: Priority-only beats Org default
  ✓ 4. Escalation Rule precedence: Inactive specific rule blocks broader rule
  ✓ 5. Helpdesk Security: Parents/students cannot create internal_note
  ✓ 6. Router Mounting: Communication router contains all subroutes
  ✓ 7. Router Mounting: Fees router mounts /communication
  ✓ 8. Schema Alignment: communication models match schema.prisma
  ✓ 9. Role Mapping: Management personas correctly identified
  ✓ 10. Role Mapping: Teacher persona correctly identified
  ✓ 11. Role Mapping: Finance persona correctly identified
  ✓ 12. Role Mapping: Front Office persona correctly identified
  ✓ 13. Role Mapping: Parent persona correctly isolated from staff privileges
  ✓ 14. Role Scoping: Greenwood School ticket list for Management, Staff, and Parent
  ✓ 15. Role-based Feed Visibility scoping on Greenwood School Org
  ✓ 16. Announcement Creation: Draft creation with valid payload & targets
  ✓ 17. Announcement Creation: Parents/students cannot create announcements
  ✓ 18. Announcement Creation: Blank content is rejected
  ✓ 19. Announcement Creation: Cross-organization target is rejected
  ✓ 20. Announcement Creation: Teacher targeting out-of-scope section is rejected
  ✓ 21. Announcement Creation: Teacher targeting assigned section succeeds
  ✓ 22. Draft Updates: Updating draft title, content, and target replacement
  ✓ 23. Publication Guard: Selected academic groups post requires at least one target
  ✓ 24. Publication: Publishing draft post sets status=published and publishedAt
  ✓ 25. Lifecycle Integrity: Published post cannot return to draft
  ✓ 26. Audience Visibility: Parent sees all_parents and child grade, but NOT staff_only
  ✓ 27. Comments: Adding comment to published post succeeds
  ✓ 28. Comments: Adding comment to post with comments_enabled=false throws error
  ✓ 29. Comments: Author and staff moderator can delete comments (soft delete)
  ✓ 30. Reactions: Adding reaction and changing reaction updates the same row
  ✓ 31. Reaction Summary: Aggregates counts and identifies currentUserReaction
  ✓ 32. Removal: Soft remove updates status=removed, preserves records, rejects modifications
  ✓ 33. Tenant Security: Operations across tenant boundaries are rejected
  ✓ 34. Student & Parent Feeds: selected_students targeted announcement visibility and isolation
  ✓ 35. Student & Parent Feeds: Comments and reactions on targeted announcement
  ✓ 36. Helpdesk: Parent ticket creation with verified child succeeds
  ✓ 37. Helpdesk: Parent ticket creation with unrelated child is rejected (403)
  ✓ 38. Helpdesk: Student creates support ticket with automatic student mapping
  ✓ 39. Helpdesk: Ticket access isolation for Parent and Student
  ✓ 40. Helpdesk: Message reply, status history visibility, and attachment serialization
  ✓ 41. Helpdesk: Non-staff cannot post internal notes
  ✓ 42. Helpdesk: Ticket list isolation for Parent and Student

Results: 42 passed, 0 failed
```

### C. Live HTTP Verification against Active Server (Port 3000)

Authenticated as parent Siddharth Iyer (`b48569fb-b4e3-53d3-8d89-28ba05131ab6`):

1. **`GET /api/communication/helpdesk/categories`**
   - Status: `200 OK`
   - Result: 11 active school support categories returned.

2. **`GET /api/communication/helpdesk/children` & `/api/parent/students`**
   - Status: `200 OK`
   - Result:
     ```json
     {
       "success": true,
       "data": [
         {
           "student_id": "6b7f176c-ebca-52fe-befa-752822194578",
           "id": "6b7f176c-ebca-52fe-befa-752822194578",
           "first_name": "Riya",
           "last_name": "Iyer",
           "admission_no": "ADM-2026-SYN-00089",
           "status": "active"
         }
       ]
     }
     ```

3. **`GET /api/communication/helpdesk/tickets`**
   - Status: `200 OK`
   - Result:
     ```json
     {
       "ticket_id": "867f79c4-30c4-4a53-af43-7fb500874a2c",
       "ticket_number": "TICK-867F79C4",
       "title": "mbfa sdhgjf qshvuasdfhvu",
       "status": "open",
       "priority": "high",
       "category": "Academics",
       "student": {
         "student_id": "6b7f176c-ebca-52fe-befa-752822194578",
         "first_name": "Riya",
         "last_name": "Iyer",
         "admission_no": "ADM-2026-SYN-00089"
       }
     }
     ```

4. **`GET /api/communication/helpdesk/tickets/867f79c4-30c4-4a53-af43-7fb500874a2c`**
   - Status: `200 OK`
   - Messages returned: 2 (initial description + verified reply)
   - History entries returned: 1 status change record.

5. **`POST /api/communication/helpdesk/tickets/867f79c4-30c4-4a53-af43-7fb500874a2c/messages`**
   - Status: `201 Created`
   - Verification: Added message `"Following up on laboratory syllabus for Riya."` with `message_type: 'public_reply'`, immediately visible in conversation panel.

---

## 4. Schema Compliance

Strict database freeze was 100% maintained:

- **Zero changes** to `apps/backend/prisma/schema.prisma`.
- **Zero migrations or DDL** executed.
- Utilized only the following existing Prisma models:
  - `helpdesk_tickets`
  - `helpdesk_categories`
  - `helpdesk_messages`
  - `helpdesk_attachments`
  - `helpdesk_escalation_rules`
  - `helpdesk_ticket_history`
  - `parents`
  - `student_parents`
  - `students`
  - `users`

---

## 5. RBAC & Data Isolation Compliance

1. **Parent Boundary:**
   - Parents can only list and view tickets that they submitted (`requester_user_id = auth_user_id`) or tickets linked to their verified children (`student_id IN (parent's linked students)`).
   - Attempts by parents to submit tickets for unrelated students are rejected with HTTP 403 `FORBIDDEN_STUDENT`.
   - Attempts to access another family's ticket return HTTP 403 `FORBIDDEN`.

2. **Student Boundary:**
   - Students can only view tickets they requested or tickets associated with their student ID.
   - Cross-student access is strictly blocked with HTTP 403.

3. **Internal Note Security:**
   - `internal_note` message type is restricted strictly to staff personas.
   - Non-staff attempting to post internal notes are blocked with HTTP 403 `FORBIDDEN`.
   - `getTicketById` omits `internal_note` messages when invoked by parent or student personas.

4. **Institutional Staff Scoping:**
   - Management: Complete tenant-wide visibility across all categories.
   - Teachers: Scoped to assigned class/section students and academic categories.
   - Finance: Authorized across fee and school operational tickets.
   - Front Office: Scoped to general inquiries, admissions, and tickets raised on behalf of parents.

---

## 6. Multi-Child Support

- Parent-to-student relationships are resolved dynamically via `student_parents` join to `students`.
- In `HelpdeskService.getParentChildren`, all linked children of the authenticated parent are aggregated into a list containing `student_id`, `first_name`, `last_name`, and `admission_no`.
- In `FinanceCommunicationHelpdesk.tsx`, when a parent has multiple children, the dropdown allows explicit selection of the relevant student.
- In `listTickets`, all linked student IDs for the parent are included in the `student_id IN (...)` clause, allowing parents to track tickets for all their children from a single unified view.

---

## 7. Attachment Handling

- Attachments are stored in `helpdesk_attachments` linked to specific `helpdesk_messages`.
- To avoid JSON serialization errors with PostgreSQL 64-bit integers, all `file_size_bytes` fields are converted from BigInt to Number at the service boundary.
- `HelpdeskService.getTicketById` returns attachments both nested on individual messages and aggregated in a top-level `helpdesk_attachments` array, enabling the UI to render the dedicated attachments panel cleanly.

---

## 8. Status Transitions & Audit Trail

- Supported statuses: `open`, `in_progress`, `waiting_for_parent`, `escalated`, `resolved`, `closed`.
- Every status change creates a corresponding immutable record in `helpdesk_ticket_history`.
- In `getTicketById`, history entries for parents and students are filtered to status changes, shielding internal escalation snapshots while displaying human-readable audit timestamps.
- When a parent replies to a ticket in `waiting_for_parent` status, the service automatically transitions the ticket status back to `in_progress`.

---

## 9. Next Steps & Recommendations

1. **Frontend File Upload Integration:**
   - Currently, tickets and messages accept attachment metadata arrays. Wire up a signed S3/Supabase storage upload handler if parents require binary document uploads directly from the UI.
2. **Notification Subscriptions:**
   - Helpdesk notifications are already subscribed via `NotificationSubscriber`. Ensure email and push notification delivery templates for `waiting_for_parent` and `resolved` statuses are configured in Greenwood School settings.
3. **Escalation Sweeps:**
   - Escalation rules for overdue tickets can be periodically evaluated via the `/helpdesk/escalation/evaluate` cron worker.
