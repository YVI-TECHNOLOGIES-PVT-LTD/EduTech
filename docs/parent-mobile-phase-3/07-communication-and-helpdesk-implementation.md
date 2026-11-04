# EduTrack ERP — Parent Mobile App

# Phase 3 — Communication & Helpdesk Implementation Report

## 1. Overview & Multi-Channel Support

The Communication & Helpdesk ecosystem connects parents with school administration, teachers, and campus updates across two primary interfaces:

1. **Communication Hub** (`apps/mobile_app/app/(main)/communication/index.tsx`): Official notices, category filters, and campus community feed.
2. **Parent Helpdesk** (`apps/mobile_app/app/(main)/helpdesk/index.tsx`): Ticketing system with priority routing and threaded conversation replies.

---

## 2. Communication Hub Capabilities

### A. Segmented Views

- **Circulars & Notices Tab**: Official administrative broadcasts.
- **School Feed Tab**: Campus event highlights, athletic achievements, and curricular updates.

### B. Category Filters & Urgency Badges

- Filter pills: `All`, `Academics`, `Administrative`, `Events`, `Urgent`.
- Unread count badge integrated into tab header and screen overview.
- Single-tap "Mark All as Read" action.
- Individual notice tap triggers `notificationsApi.markRead(id)` and updates read status.

---

## 3. Parent Helpdesk Capabilities

### A. Ticket Management & Filters

- Status filters: `All`, `Open`, `In Progress`, `Resolved`.
- Ticket preview cards displaying:
  - Category badge: `Fees`, `Transport`, `Academics`, `General`.
  - System ticket number: e.g., `#TKT-2026-001`.
  - Priority indicator: `Low`, `Medium`, `High`.
  - Status badge: `Open`, `In Progress`, `Resolved`.
  - Subject and description excerpt.
  - Timestamp.

### B. "Raise Support Ticket" Modal

- Category picker with multi-selection chips.
- Priority selector (`Low`, `Medium`, `High`).
- Subject and detailed description input fields with validation.
- Submits via `helpdeskApi.createTicket(payload)` and prepends the new ticket to the live list.

### C. Threaded Conversation & Reply Composer

- Tapping any ticket opens the full conversation thread.
- Displays original inquiry plus replies separated by role (`parent` vs `support`/`admin`).
- Reply input composer allowing parents to post follow-up questions directly.

---

## 4. API & Store Contracts

- `helpdeskApi`:
  - `getTickets(): Promise<HelpdeskTicket[]>`
  - `getTicketById(id): Promise<HelpdeskTicket | null>`
  - `createTicket(payload): Promise<HelpdeskTicket>`
  - `getTicketReplies(id): Promise<TicketReply[]>`
  - `addReply(id, message): Promise<TicketReply>`
- `useHelpdeskStore`:
  - Centralized Zustand store managing ticket list, active conversation, submission states, and filter selections.
