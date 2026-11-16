# Phase 2 Blueprint: Admission Applicant vs. Enrolled Student Journeys

**Document Reference:** `docs/parent-mobile-audit/phase-2/04-admission-vs-enrolled-student-journeys.md`  
**Phase:** Phase 2 — Complete UI/UX Architecture & Redesign Blueprint  
**Status:** ARCHITECTURAL SPECIFICATION & BLUEPRINT (READ-ONLY DESIGN)

---

## 1. Executive Summary

A critical conclusion from Phase 1.1 is that prospective applicants and enrolled students represent two fundamentally different data entities and user journeys:

- **Admission Applicants (`admission_applications`):** Prospective students traversing a conversion funnel (form submission, verification, test/interview, fee payment, enrollment agreement).
- **Enrolled Students (`students` via `student_parents`):** Active matriculated students attending school daily (attendance, timetable, assignments, exams, term tuition, bus tracking).

Treating one as a proxy for the other breaks the application mental model. This document defines the distinct state machines, user journeys, and transition mechanisms between them.

---

## 2. Journey A: The Admission Applicant Experience

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     ADMISSION FUNNEL STATE MACHINE                      │
└─────────────────────────────────────────────────────────────────────────┘
        │
        ▼
   [ 1. DRAFT ] ──► Parent filling 4-step wizard (cached in AsyncStorage)
        │
        ▼
   [ 2. SUBMITTED ] ──► Form submitted to POST /v1/admissions/applications
        │
        ▼
   [ 3. DOCUMENTS PENDING ] ──► Upload birth cert, immunization, previous marks
        │
        ▼
   [ 4. UNDER REVIEW ] ──► School admissions committee verifying records
        │
        ▼
   [ 5. ASSESSMENT SCHEDULED ] ──► Entrance test / interview slot booked
        │
        ▼
   [ 6. APPLICATION FEE PENDING ] ──► Pay application fee via Razorpay
        │
        ▼
   [ 7. DECISION READY ] ──► Offer Letter issued or application waitlisted
        │
        ▼
   [ 8. OFFER ACCEPTED ] ──► Parent signs enrollment agreement online
        │
        ▼
   [ 9. MATRICULATED ] ──► School staff promotes record into model `students`
```

### 2.1 Screen Progression & User Objectives:

1. **Application Wizard (`wizard.tsx`):**
   - Step 1: Student biographical details (Name, DOB, gender, applying grade).
   - Step 2: Parent/Guardian contact details (Phone, email, address, occupation).
   - Step 3: Prior academic history (Previous school, transfer certificate number).
   - Step 4: Medical declarations & emergency contacts.
   - _Resilience:_ Auto-saves draft locally in `AsyncStorage` on every keystroke.
2. **Application Hub (`[id]/index.tsx`):**
   - Renders visual progress stepper matching the 9 funnel states.
   - Dynamic action banner indicates the exact next step required from the parent (e.g. _"Upload Birth Certificate to proceed"_).
3. **Document Submission (`[id]/documents.tsx`):**
   - Categorized upload slots for mandatory and optional documents.
   - Status indicators: `Pending`, `Uploaded`, `Verified`, or `Rejected` (with school reviewer comments).
4. **Assessment Booking (`[id]/assessment.tsx`):**
   - Interactive calendar slot picker for student entrance evaluation or parent interview.
   - Push notification reminder 24 hours prior to scheduled slot.
5. **Fee Payment & Receipt (`[id]/fees.tsx` & `receipt.tsx`):**
   - Displays authoritative application processing fee from server.
   - Seamless checkout via Razorpay with immediate downloadable PDF receipt.
6. **Decision & Offer Acceptance (`[id]/decision.tsx`):**
   - Displays digital Offer Letter with tuition fee breakdown and terms of admission.
   - Digital acceptance toggle generating timestamped acceptance audit log.

---

## 3. Journey B: The Enrolled Student Experience

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     ENROLLED STUDENT DAILY LIFE CYCLE                   │
└─────────────────────────────────────────────────────────────────────────┘
        │
  ┌─────┴─────────────────────────┬─────────────────────────┐
  ▼                               ▼                         ▼
[ MORNING: 07:00 - 08:30 ]  [ MID-DAY: 12:00 - 15:00 ]  [ EVENING: 18:00 - 21:00 ]
• Bus live tracking         • Daily attendance confirmed• Homework checklist
• Today's class schedule    • School lunch / diet note  • Upcoming exam syllabus
• Uniform / sports reminder • Instant broadcast circular• Term fee balance & pay
```

### 3.1 Primary SIS Workflows:

1. **Attendance Tracking (`academics/attendance.tsx`):**
   - Visual monthly calendar with color-coded day markers (Green: Present, Red: Absent, Yellow: Late, Blue: Holiday).
   - Aggregate statistics: Academic year attendance percentage (e.g., `94.2%`), total present days, leave requests.
   - Submit leave request action (Date range, reason, medical attachment).
2. **Class Timetable (`academics/timetable.tsx`):**
   - Weekly horizontal day switcher (Monday through Saturday).
   - Time-blocked cards: Period number, Subject, Teacher Name, Room Number.
   - "Current Period" live pulse indicator during school hours.
3. **Homework & Assignments (`academics/homework/index.tsx`):**
   - Filterable tabs: `Due Soon`, `Completed`, `Past Due`.
   - Card details: Subject badge, task description, due date chip, teacher reference files.
4. **Examinations & Report Cards (`academics/results/index.tsx`):**
   - Exam date sheet with syllabus breakdown per subject.
   - Term grade books: Subject-wise marks, class average comparison, teacher remarks, downloadable signed PDF Report Card.
5. **Tuition Fee Management (`finance/index.tsx`):**
   - Outstanding balance summary with due date countdown.
   - Term installments (Term 1, Term 2, Term 3, Bus Fee, Annual Fee).
   - 1-tap Razorpay payment handoff, transaction ledger, and official school receipts.
6. **School Circulars & Feed (`communication/index.tsx`):**
   - Chronological social-style announcements with downloadable circular PDFs.

---

## 4. Journey C: Multi-Child Hybrid Families

A significant proportion of parents have multiple children spanning both journeys simultaneously (e.g., one child in 5th Grade, one child applying for Pre-K).

### 4.1 The Unified Child Concept

In the redesigned app, the global child state stores a list of `UnifiedChild` items:

```typescript
export type UnifiedChild =
  | {
      type: 'enrolled';
      studentId: string;
      admissionNo: string;
      fullName: string;
      gradeLevel: string;
      section: string;
      avatarUrl?: string;
      attendanceStatusToday?: 'present' | 'absent' | 'late' | 'unmarked';
      hasPendingFees: boolean;
    }
  | {
      type: 'applicant';
      applicationId: string;
      applicationNumber: string;
      fullName: string;
      applyingGrade: string;
      avatarUrl?: string;
      funnelStatus:
        'draft' | 'submitted' | 'documents_pending' | 'review' | 'assessment' | 'decision';
      hasActionRequired: boolean;
    };
```

### 4.2 UI Context Morphing Rules

When a parent taps the Global Child Switcher:

1. **If selecting an Enrolled Student:**
   - The Home tab renders: Today's attendance pill, today's schedule, pending homework count, and tuition fee alert.
   - The bottom tab bar displays: `[Home] [Academics] [Communication] [Finance] [Profile]`.
2. **If selecting an Admission Applicant:**
   - The Home tab smoothly transforms: Replaces attendance and schedule with the **Application Status Stepper**, pending document checklist, and interview booking countdown.
   - The Academics tab displays a placeholder: _"Academic records will activate once your child is matriculated into a class."_
   - The Finance tab surfaces the **Admission Processing Fee** instead of tuition installments.

---

## 5. The Transition: From Applicant to Enrolled Student

When an applicant is admitted by school administration:

1. School administrative staff approves admission in the backend ERP and creates the official `students` record linked via `application_id`.
2. The backend generates a `student_parents` junction relationship.
3. Upon next mobile app launch (or WebSocket event `student.matriculated`), the child switcher updates:
   - The child's avatar badge shifts from amber (`Applicant`) to indigo (`Enrolled - Class 1A`).
   - A celebration banner appears: _"Congratulations! Oliver has officially enrolled in Grade 1A for the 2026-2027 Academic Year."_
   - Full SIS modules (Attendance, Timetable, Tuition Fees) activate immediately.
