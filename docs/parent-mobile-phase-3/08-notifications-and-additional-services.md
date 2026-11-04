# EduTrack ERP — Parent Mobile App

# Phase 3 — Notifications & Additional Services Report

## 1. Notifications Center Integration

Notifications are integrated across the application using both REST endpoints and real-time WebSocket capabilities:

### A. Real-Time & Polling Architecture

- Hook: `useUnreadNotificationCount()` queries `GET /v1/notifications/unread-count`.
- Real-time updates: `useNotificationRealtime()` subscribes to live notification events.
- Tab bar badge: `(main)/_layout.tsx` dynamically shows unread notification badges over the "Updates" tab.
- Dashboard indicator: Home screen header displays an unread notification dot.

### B. Common Notifications Screen (`app/(common)/notifications.tsx`)

- Full paginated notification archive.
- Category filtering and mark-all-read action.

---

## 2. Campus Transport Service (`apps/mobile_app/app/(main)/transport/index.tsx`)

Designed to give parents clear visibility into their ward's daily commute:

### A. Route Information

- Route identifier and name (e.g., `Route 12 - South Campus Express`).
- Vehicle registration number (e.g., `KA-01-EQ-9876`).
- Morning pick-up stop and scheduled arrival time (e.g., `07:35 AM`).
- Evening drop-off stop and scheduled arrival time (e.g., `03:45 PM`).

### B. Driver & Operator Verification

- Driver name and verified badge.
- One-tap phone call intent (`Linking.openURL('tel:...')`) for rapid communication.

### C. Graceful Fallbacks

- Shows informative notice if child is an applicant.
- Shows dignified empty state if student has not opted for school transportation services.

---

## 3. Campus Library Service (`apps/mobile_app/app/(main)/library/index.tsx`)

Connects students and parents to campus reading resources:

### A. Library Card Status

- Student library card number (e.g., `LIB-ADM-2026-0045`).
- Active borrowing counter vs allowed maximum (e.g., 2 / 3 books).
- Outstanding library fine balance (`₹0.00`).

### B. Issued Books Tracker

- Book title and author name.
- Issue date and return due date.
- Status badge: `Issued` (Emerald) or `Overdue` (Red).
- Overdue fine calculation indicator.

---

## 4. Family Profile & Preferences (`apps/mobile_app/app/(main)/profile/index.tsx`)

Combines parent account identity with student SIS records and device settings:

### A. Parent Profile Card

- Full name, verified role badge (`Parent`), email address, phone number.

### B. SIS Student Record Section

- Live enrolled student context: Admission number, Grade level, Section, Roll number, Academic year.
- Prospective applicant context: Application number, Grade applying for, Current stage.

### C. Campus Services Directory

- Direct navigation links to Transport, Library, Helpdesk, Admission Tracker, and Notification Inbox.

### D. Preferences & Security

- **Push Notifications**: Interactive switch toggle.
- **Biometric Login**: Interactive switch toggle for Face ID / Fingerprint authentication.
- **Dark Mode**: Interactive switch toggle wired to global `useTheme()`.
- **Sign Out**: Confirmation alert that purges auth tokens and resets all domain stores before redirecting to login.
