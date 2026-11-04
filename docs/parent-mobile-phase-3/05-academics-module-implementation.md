# EduTrack ERP — Parent Mobile App

# Phase 3 — Academics Module Implementation Report

## 1. Overview & Capabilities

The Academics module (`apps/mobile_app/app/(main)/academics/index.tsx`) provides a comprehensive SIS interface for enrolled students, covering Attendance, Weekly Timetable, Homework assignments, and Examinations/Report cards.

When viewed for an applicant child, the screen gracefully renders an educational notice informing the parent that academic records activate upon classroom enrollment.

---

## 2. Academics Sub-Modules

### Module A: Attendance Tracking

- **Term Metrics Card**:
  - Displays overall attendance percentage (e.g., 94.5%).
  - Status Badge: `Satisfactory` (>= 75%) or `Action Required` (< 75%).
  - Breakdown counters: Present days, Absent days, Late arrivals, Total working days.
- **Daily Timeline**:
  - Itemized day-by-day attendance roll-call log.
  - Status indicators: Present (Emerald check), Late (Amber clock), Absent (Red cross), Holiday (Neutral).
  - Teacher roll-call remarks.
  - Empty state with informative message if records are yet to be marked.

### Module B: Weekly Timetable

- **Day Selector**:
  - Horizontal pill selector: `Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`.
  - Default selection resolves automatically to the current wall-clock day of the week.
- **Period Cards**:
  - Period number badge (e.g., Period 1).
  - Time interval (e.g., 08:30 AM - 09:15 AM).
  - Subject title (Mathematics, Science, English, etc.).
  - Instructor name (e.g., Dr. Rao).
  - Classroom identifier badge (e.g., Room 101).
  - Break/Recess styling for lunch or morning intervals.

### Module C: Homework & Assignments

- **Filter Segment**:
  - Filters: `All`, `Pending`, `Submitted`.
- **Homework Cards**:
  - Subject category badge.
  - Title and detailed assignment description.
  - Due date countdown indicator.
  - Interactive "Mark Done" action button: updates local and store state, setting completion date and shifting status to `Submitted`.

### Module D: Examinations & Term Results

- **Upcoming Examination Schedule**:
  - Exam cards with subject, exam title, date, time slot, hall/room, maximum marks, and syllabus guidelines.
- **Academic Report Card**:
  - Term identifier (e.g., Term 1 Evaluation, 2026-2027).
  - Overall Grade badge (e.g., A+) and Term GPA (e.g., 3.9 / 4.0).
  - Itemized subject performance table: Subject, Marks Obtained, Total Marks, Grade Pill.
  - Class Teacher remarks quotation card.

---

## 3. Academics Store Architecture (`apps/mobile_app/src/stores/academics.store.ts`)

- State:
  - `activeTab`: `'attendance' | 'timetable' | 'homework' | 'exams'`
  - `selectedDay`: Day of week string
  - `homeworkFilter`: `'all' | 'pending' | 'submitted'`
  - `attendance`: `AttendanceSummary | null`
  - `timetable`: `TimetableDay[]`
  - `homework`: `HomeworkItem[]`
  - `exams`: `ExamItem[]`
  - `reportCard`: `ReportCard | null`
  - `isLoading`: boolean
  - `isError`: boolean
- Actions:
  - `setActiveTab(tab)`
  - `setSelectedDay(day)`
  - `setHomeworkFilter(filter)`
  - `fetchStudentAcademics(studentId)`
  - `markHomeworkSubmitted(homeworkId)`
  - `clear()`
