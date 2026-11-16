# Phase 2 Blueprint: School Communication Feed & Interaction Specification

**Document Reference:** `docs/parent-mobile-audit/phase-2/10-communication-feed-specification.md`  
**Phase:** Phase 2 — Complete UI/UX Architecture & Redesign Blueprint  
**Status:** ARCHITECTURAL SPECIFICATION & BLUEPRINT (READ-ONLY DESIGN)

---

## 1. Executive Summary & Philosophy

School communication is a primary touchpoint for parents. The Phase 2 Communication Feed (`/(main)/communication`) adopts the **effortless readability of a modern social content feed** (clean visual cards, media previews, unread indicators) while strictly maintaining the **institutional decorum and controlled broadcast structure** of an educational ERP.

### Core Architectural Guardrails:

1. **Curated Institutional Broadcast:** Only authorized school staff (Principals, Class Teachers, Administrative Officers) publish to the feed.
2. **Zero Unrestricted Parent-to-Parent Social Chatter:** To prevent school-wide spam, cyberbullying, or uncontrolled debates, the feed does NOT support public commenting or parent-to-parent message boards.
3. **Targeted Audience Filtering:** Posts are strictly targeted by campus, grade level, section, or specific student groups (e.g., "All Grade 4 Parents" or "Bus Route 14 Parents").

---

## 2. Feed Taxonomy & Content Categories

Feed items are classified into four distinct operational streams:

| Category              | Visual Badge & Color        | Typical Content                                                       | Actions Available                     |
| --------------------- | --------------------------- | --------------------------------------------------------------------- | ------------------------------------- |
| **1. Circulars**      | 🔵 `CIRCULAR` (Indigo)      | Official administrative directives, fee notices, holiday declarations | Download PDF, Acknowledge Receipt     |
| **2. Announcements**  | 🟢 `ANNOUNCEMENT` (Emerald) | Daily campus news, science fair results, cafeteria updates            | Read details, Expand images           |
| **3. Events**         | 🟣 `EVENT` (Purple)         | Sports day, Annual concert, Parent-Teacher Conferences                | RSVP Attending, Add to Phone Calendar |
| **4. Urgent Notices** | 🔴 `URGENT` (Rose)          | Weather emergency, bus breakdown, sudden school closure               | Push alert trigger, Acknowledge alert |

---

## 3. Feed Item Card Component Specification

```
┌────────────────────────────────────────────────────────────────────────┐
│  (Crest)  Principal's Office • EduTrack Main Campus                    │
│           Today at 10:30 AM • For: All Grade 4 Parents       [🔴 URGENT]│
├────────────────────────────────────────────────────────────────────────┤
│  Annual Sports Day & March Past Schedule Announcement                  │
│                                                                        │
│  Dear Parents, we are thrilled to announce that the Annual Inter-House │
│  Sports Day will take place on Saturday, November 28, 2026. Students   │
│  are requested to arrive in their respective house jerseys by 07:45 AM. │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     [ Image Banner Preview ]                     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  📎 Attachments (2):                                                   │
│  [ 📄 Sports_Day_Schedule_2026.pdf (1.2 MB) ]                          │
│  [ 📄 Route_Map_Parking.pdf (450 KB) ]                                 │
├────────────────────────────────────────────────────────────────────────┤
│  👁️ Read by you at 11:05 AM                 [ Download PDF ] [ Share ] │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Item Attributes & Layout Tokens:

- **Card Container:** `bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 mb-4 shadow-sm`.
- **Author Identity Header:**
  - Author Avatar / Crest: `w-10 h-10 rounded-full`.
  - Author Name & Title: `font-bold text-sm text-slate-900 dark:text-slate-100`.
  - Timestamp & Target Audience: `text-xs text-slate-500` (e.g. _"2 hours ago • Grade 4B"_).
  - Priority Badge: Top right. If `isUrgent === true`, displays pulsing red badge (`bg-rose-100 text-rose-700 font-black text-2xs px-2.5 py-0.5 rounded-full`).
- **Card Body:**
  - Headline: `text-base font-black text-slate-900 dark:text-slate-100 mb-2 leading-snug`.
  - Text Content: Formatted text truncated to 3 lines on feed, with _"Read more"_ expansion toggle.
- **Media Previews:**
  - Images: Aspect ratio `16:9` with rounded-2xl corners. Tapping opens full-screen image lightbox with pinch-to-zoom.
- **Attachment Chips:**
  - Pill containers (`bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 flex-row items-center mb-2`).
  - Includes PDF icon, file name, file size, and download button.
- **Footer Metadata & Actions:**
  - Left: Read status indicator (e.g. _"Unread"_ blue dot or _"Read by you"_ checkmark).
  - Right: Quick action buttons (`Download Attachment`, `RSVP`, or `Share via WhatsApp`).

---

## 4. Feed Filtering, Search & Discovery

### 4.1 Filter Bar

- A persistent horizontal scrollable filter strip located immediately below the search bar:
  `[ All Updates ] [ Circulars (12) ] [ Announcements (8) ] [ Events (3) ] [ Unread Only ]`
- Tapping a filter chip instantly filters the local list without full page reloading.

### 4.2 Search Experience

- Clean search input with clear button (`placeholder="Search notices, sports, circulars..."`).
- Debounced by 300ms, filtering across post titles, bodies, and attachment filenames.

### 4.3 Infinite Scroll & Pagination

- Virtualized list using `FlashList` for high-performance 60fps scrolling on lower-end devices.
- Cursor-based pagination (`limit: 20`, `nextCursor: string`).
- Pull-to-Refresh with native platform spinner refetching latest notices.

---

## 5. Feed States & Edge Cases

### 5.1 Loading State

- Renders 4 animated card skeletons with pulsating title, text lines, and media placeholder boxes.

### 5.2 Empty State

- When no announcements exist for the selected filter:
  ```
  [ Illustration: Megaphone with peaceful clouds ]
  "All Caught Up!"
  "There are no unread school circulars or announcements for your child's class at this time."
  [ Button: View All Past Notices ]
  ```

### 5.3 Offline / Intermittent Connection State

- Previously fetched feed posts remain fully readable from local cache.
- Top subtle banner: _"Offline Mode: Showing announcements cached on Nov 2 at 10:00 AM"_.

---

## 6. Official Teacher-Parent Messaging & Helpdesk

In addition to the public school feed, the Communication Tab hosts two specialized two-way communication channels:

### 6.1 Moderated Teacher Messages (`/(main)/communication/messages`)

- 1-to-1 official communication channel strictly between the **Parent** and the **Assigned Class Teacher / Subject Teachers**.
- **Communication Hours Guard:** If parent attempts to message outside official school hours (e.g., after 06:00 PM or on Sunday), an informational note is shown:
  _"Teachers respond to inquiries during school hours (08:00 AM - 04:00 PM, Mon-Fri). Your message will be queued."_
- **Attachment Support:** Parents can attach doctor notes, leave forms, or assignment queries (PDF, JPEG, PNG, max 10MB).

### 6.2 Parent Support Helpdesk (`/(main)/communication/helpdesk`)

- Formal ticketing system for administrative inquiries:
  - **Transport Issues:** Bus delays, stop changes, driver complaints.
  - **Accounts & Finance:** Fee receipt queries, scholarship applications.
  - **Academics & Records:** Transfer certificate requests, bonafide certificates.
- Each ticket features a unique Ticket ID (e.g. `#TKT-2026-881`), status badge (`Open`, `In Progress`, `Resolved`, `Closed`), and complete staff conversation thread.
