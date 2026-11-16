# EduTrack ERP — Parent Mobile App

# Phase 3 Verification Report: 06 — Communication & Helpdesk Verification

## 1. Executive Summary

This report evaluates the communication channels and parent helpdesk ticketing system across `apps/mobile_app/app/(main)/communication/index.tsx`, `apps/mobile_app/app/(main)/helpdesk/index.tsx`, and backend services.

---

## 2. Communication Hub Verification

### A. Circulars & Official Notices

- **Data Source**: Backed by `notificationsApi.list()` (`GET /v1/notifications`).
- **Read / Unread State**:
  - Unread count derived from `notifications.filter((n) => !n.is_read).length`.
  - Single notice tap invokes `notificationsApi.markRead(notification_id)` (`PATCH /v1/notifications/:id/read`).
  - "Mark All as Read" button invokes `notificationsApi.markAllRead()` (`POST /v1/notifications/mark-all-read`).
- **Category Filtering**: Filter chips (`All`, `Academics`, `Administrative`, `Events`, `Urgent`) filter based purely on `n.category`. Communication posts are displayed independently without unrelated finance or ticket-based filters.
- **Verdict**: **VERIFIED — REAL BACKEND INTEGRATION**.

### B. School Community Feed

- **Data Source Audit**: Lines 69–95 of `apps/mobile_app/app/(main)/communication/index.tsx`:
  ```typescript
  const communityPosts = [
    {
      id: 'feed-1',
      author: "Principal's Desk",
      role: 'Administration',
      date: 'Today at 09:30 AM',
      title: 'Annual Science & Innovation Exhibition 2026',
      content: 'We warmly invite all parents...',
      tag: 'Campus Event',
    },
    ...
  ];
  ```
- **Finding**: **HARDCODED STATIC DATA**. The feed items are statically declared inside the screen component.
- **Engagement Actions Audit**: Lines 289–295 contain "Appreciate" (heart icon) and "Share" buttons. These elements are non-functional UI placeholders with no `onPress` callback and no backend engagement API.
- **Verdict**: **UI ONLY (STATIC SAMPLE DATA)**.

---

## 3. Parent Helpdesk Verification

### A. Endpoint & Backend Audit

In `apps/mobile_app/src/api/helpdesk.api.ts`:

- `GET /v1/helpdesk/tickets`
- `GET /v1/helpdesk/tickets/:id`
- `POST /v1/helpdesk/tickets`
- `GET /v1/helpdesk/tickets/:id/replies`
- `POST /v1/helpdesk/tickets/:id/replies`

An exhaustive search across `apps/backend/src/` confirms:

1. **No Backend Routes**: There is no `helpdesk.routes.ts` or route registration in `routes.ts`.
2. **No Backend Controller**: There is no Helpdesk controller or service in `apps/backend/src/`.
3. **No Database Table**: `apps/backend/prisma/schema.prisma` contains no `helpdesk_tickets` or `helpdesk_replies` model.

### B. Client Resiliency vs Persistence

In `apps/mobile_app/src/stores/helpdesk.store.ts`:

- All network calls are wrapped in `try / catch` blocks.
- When `fetchTickets()` fails due to backend 404, it sets `tickets: []`, rendering the empty state ("No Support Tickets Found").
- When a user submits a ticket in the modal, `createTicket` calls `POST /v1/helpdesk/tickets`. In production, this fails and catches the error. In local tests with mocked API, it updates local store state.

### C. Verdict

**UI ONLY (FRONTEND FUNCTIONALITY ONLY)**. The helpdesk UI, modals, forms, priority selectors, and conversation thread views are fully constructed on the frontend, but completely lack backend services and persistence.

---

## 4. Summary Verdict

| Feature                   | Verdict                                 | Notes                                                            |
| ------------------------- | --------------------------------------- | ---------------------------------------------------------------- |
| Circulars & Notices       | **VERIFIED — REAL BACKEND INTEGRATION** | Backed by `GET /v1/notifications` with working read tracking     |
| School Community Feed     | **UI ONLY**                             | Hardcoded static sample posts; non-functional engagement buttons |
| Helpdesk Ticket Creation  | **UI ONLY**                             | Working modal and form validation; no backend endpoint           |
| Helpdesk Thread & Replies | **UI ONLY**                             | Complete UI layout; no backend service or database model         |
