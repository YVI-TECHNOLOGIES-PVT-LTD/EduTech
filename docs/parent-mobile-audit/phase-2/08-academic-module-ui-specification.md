# Phase 2 Blueprint: Academic Module UI & Data Flow Specification

**Document Reference:** `docs/parent-mobile-audit/phase-2/08-academic-module-ui-specification.md`  
**Phase:** Phase 2 — Complete UI/UX Architecture & Redesign Blueprint  
**Status:** ARCHITECTURAL SPECIFICATION & BLUEPRINT (READ-ONLY DESIGN)

---

## 1. Executive Summary

The Academic Module is the core operational engine of the Enrolled Student experience (Journey B). In the Phase 1 audit, all academic features were found to be either completely unintegrated or mock-driven.

This document specifies the complete UI architecture, component hierarchy, interaction patterns, and data flow for:

1. **Attendance Tracking & Leave Management**
2. **Weekly Class Timetable**
3. **Homework & Assignments**
4. **Examinations & Hall Tickets**
5. **Academic Results & Term Report Cards**

---

## 2. Sub-Module 1: Attendance Tracking & Leave Application

### 2.1 Screen Architecture (`/(main)/academics/attendance`)

- **Header:** Academic year selector (`2026-2027`) and child quick snapshot.
- **Top Metric Cards (Aggregate Annual):**
  - Card 1: **Overall Attendance %** (`94.5%` with circular progress ring; green if $\ge 85\%$, amber if $75-84\%$, red if $<75\%$).
  - Card 2: **Present Days** (`142 / 150 Days`).
  - Card 3: **Leaves / Absent** (`6 Days Leave • 2 Days Medical`).
- **Interactive Monthly Calendar Grid:**
  - Month navigation bar (`< November 2026 >`).
  - Day tiles with high-contrast color badges:
    - 🟢 Solid Emerald: Present
    - 🔴 Solid Rose: Absent (unexcused)
    - 🟡 Solid Amber: Tardy / Late Arrival
    - 🔵 Solid Sky: Approved Leave / Excused
    - ⚪ Light Slate: School Holiday / Weekend
- **Daily Attendance Details Bottom Sheet:**
  - Tapping any date opens details: Time in (`08:14 AM`), Time out (`03:30 PM`), Marking Teacher, Room #, Transport status (`Bus 14 Morning & Evening`).
- **"Apply for Leave" Floating Action Button (FAB):**
  - Opens modal: Start Date, End Date, Reason category (`Medical`, `Family Emergency`, `Bereavement`, `Other`), Notes textarea, Medical Certificate attachment upload.
  - Submits to `POST /v1/attendance/leave-requests`.

---

## 3. Sub-Module 2: Weekly Class Timetable

### 3.1 Screen Architecture (`/(main)/academics/timetable`)

- **Day Selector Bar:** Horizontal segmented pill tabs:
  `[ Mon ] [ Tue ] [ Wed* ] [ Thu ] [ Fri ] [ Sat ]` (Active day auto-selects current weekday).
- **Period List Presentation:** Vertical timeline cards sorted by period order:
  ```
  08:30 - 09:15   PERIOD 1: MATHEMATICS                    ROOM 204
                  Teacher: Mr. Vikram Sharma • Algebra Ch 4
  ──────────────────────────────────────────────────────────────────
  09:20 - 10:05   PERIOD 2: ENGLISH LITERATURE             ROOM 204
                  Teacher: Ms. Rachel Green • Shakespeare Play
  ──────────────────────────────────────────────────────────────────
  10:05 - 10:25   RECESS / MORNING BREAK
  ──────────────────────────────────────────────────────────────────
  10:25 - 11:10   PERIOD 3: GENERAL SCIENCE [ACTIVE NOW]   LAB 2
                  Teacher: Dr. A. P. Rao • Physics Optics
  ```
- **Live Active Period Pulse:**
  - The currently active class period features a gentle pulsating indigo border and "In Progress" chip based on device wall-clock time.
- **Bell Schedule Drawer:** Tapping "Bell Schedule" displays official school period timings and assembly hours.

---

## 4. Sub-Module 3: Homework & Assignments

### 4.1 Screen Architecture (`/(main)/academics/homework/index`)

- **Status Filter Segmented Control:**
  - `[ Due Soon (3) ] [ Completed (18) ] [ Past Due (0) ]`
- **Subject Filter Chips (Horizontal Scroll):**
  - `[ All Subjects ] [ Mathematics ] [ Science ] [ Social Studies ] [ Languages ]`
- **Homework Card Elements:**
  - **Subject Pill & Icon:** e.g., Purple book icon for Literature.
  - **Assignment Title:** e.g., _"Chapter 5 Exercises — Quadratic Equations"_.
  - **Due Date Chip:**
    - Due today: Red urgent badge (`"Due Today by 11:59 PM"`).
    - Due tomorrow: Amber badge (`"Due Tomorrow"`).
    - Future: Slate badge (`"Due Nov 12"`).
  - **Teacher Name:** e.g., _"Assigned by Mrs. Gupta"_.
  - **Attachment Indicator:** Paperclip icon showing count of reference PDFs.
  - **Parent Acknowledgement Checkbox:** _"I acknowledge my child has completed this homework"_.

### 4.2 Homework Detail Screen (`/(main)/academics/homework/[id]`)

- Displays full rich text assignment instructions.
- File attachment list with built-in viewer and "Download PDF" button.
- Submission status notes (e.g., _"Submitted in class on Nov 2"_).

---

## 5. Sub-Module 4: Examination Schedules & Hall Tickets

### 5.1 Screen Architecture (`/(main)/academics/examinations`)

- **Exam Term Dropdown:** e.g., `Term 1 Half-Yearly Examinations 2026`.
- **Examination Date Sheet Table/Cards:**
  ```
  DATE             SUBJECT             TIME            VENUE & SYLLABUS
  Mon, Nov 10      Mathematics         09:00 - 12:00   Hall A • Chapters 1 to 6
  Wed, Nov 12      General Science     09:00 - 12:00   Hall A • Physics & Chem
  Fri, Nov 14      English Language    09:00 - 11:30   Room 102 • Grammar & Essay
  ```
- **Hall Ticket / Admit Card Action:**
  - Prominent "Download Hall Ticket (PDF)" button.
  - Generates verifiable PDF with student photo, barcode, exam roll number, and instructions.

---

## 6. Sub-Module 5: Results & Official Term Report Cards

### 6.1 Screen Architecture (`/(main)/academics/results`)

- **Term Selector:** `[ Term 1 Finals ] [ Mid-Term Evaluation ] [ Unit Tests ]`
- **Performance Overview Card:**
  - Overall GPA / Percentage: `89.4% (Grade A1)`.
  - Class Average Comparison: `+8.2% above grade average`.
  - Total Score: `536 / 600`.
- **Subject Breakdown Table:**
  ```
  SUBJECT              MARKS    GRADE   CLASS AVG    REMARKS
  Mathematics          94/100   A1      78/100       Excellent analytical skills
  Physics              88/100   A2      72/100       Consistent lab participation
  Chemistry            86/100   A2      70/100       Good theoretical grasp
  English              91/100   A1      81/100       Superb creative writing
  Computer Science     98/100   A1      84/100       Outstanding coding project
  ```
- **Teacher Remarks & Behavioral Metrics:**
  - Class Teacher Remarks: _"Aarav is an inquisitive, highly disciplined student who demonstrates strong leadership."_
  - Extracurricular & Attendance evaluation.
- **Download Official Report Card CTA:**
  - Fixed bottom bar button: `"Download Signed Report Card (PDF)"`.
  - Fetches server-generated, digitally signed PDF report card ready for saving to phone or printing.

---

## 7. Data Flow & React Query Key Architecture

```typescript
export const ACADEMIC_QUERY_KEYS = {
  all: ['academics'] as const,
  attendance: (studentId: string, month: string) =>
    ['academics', 'attendance', studentId, month] as const,
  timetable: (studentId: string, dayOfWeek?: number) =>
    ['academics', 'timetable', studentId, dayOfWeek] as const,
  homework: (studentId: string, filter: 'due' | 'completed' | 'all') =>
    ['academics', 'homework', studentId, filter] as const,
  examinations: (studentId: string) => ['academics', 'examinations', studentId] as const,
  results: (studentId: string, termId?: string) =>
    ['academics', 'results', studentId, termId] as const,
};
```

- **Cache Invalidation:** WebSocket event `academics.updated` invalidates `ACADEMIC_QUERY_KEYS.all`.
- **Offline Fallback:** Results and timetables cached indefinitely in React Query persistence (`staleTime: 24 * 60 * 60 * 1000`) so parents can view schedules while offline.
