# Phase 1.1 Verification Report: Admission Applicants vs. Enrolled SIS Students

**Audit Document Reference:** `docs/parent-mobile-audit/phase-1.1/06-admission-vs-enrolled-sis-verification.md`  
**Parent Report:** `docs/parent-mobile-audit/phase-1/04-module-audit-summary.md`  
**Status:** COMPLETE & VERIFIED  
**Commit:** `a9c3486`

---

## 1. Executive Summary

This independent verification investigates the architectural and functional divide between **Admission Applicants** (prospective students undergoing the enrollment funnel) and **Enrolled Students** (active students matriculated in the school SIS) within the EduTrack Parent Mobile App (`apps/mobile_app`) and Express backend (`apps/backend`).

The verification answers all 8 mandated architectural questions with verified repository evidence, Prisma schema models, and frontend component traces.

---

## 2. Answers to Mandatory Verification Questions

### Question 1: Is the current parent mobile app an admission applicant tracking tool, an enrolled student SIS portal, or both?

- **Finding:** **It is exclusively an Admission Applicant Tracking Tool with a superficial SIS shell.**
- **Evidence:**
  - 100% of working transactional workflows in the mobile app interact with `/v1/admissions/applications/*` endpoints.
  - All tabs labeled "Dashboard", "Calendar", and "Account" render either admission application cards, static non-interactive mock lists, or dead navigation loops.
  - Enrolled student domains (daily attendance, timetable periods, grade cards, report cards, school fees, and bus tracking) have zero backend data fetching in the mobile client.

### Question 2: Which screens are admission-specific?

- **Finding:** Exactly **10 screens** are admission-specific:
  1. `app/(parent)/index.tsx`: Parent Admission Applications Home & Status overview.
  2. `app/(parent)/applications/index.tsx`: List of active and archived admission applications.
  3. `app/(parent)/applications/wizard.tsx`: 4-step new admission application submission form.
  4. `app/(parent)/applications/[id]/index.tsx`: Admission Application Hub & Status Stepper.
  5. `app/(parent)/applications/[id]/documents.tsx`: Admission Document upload & verification status.
  6. `app/(parent)/applications/[id]/fees.tsx`: Admission application processing fee payment.
  7. `app/(parent)/applications/[id]/receipt.tsx`: Admission fee transaction receipt.
  8. `app/(parent)/applications/[id]/assessment.tsx`: Admission interview & assessment scheduling.
  9. `app/(parent)/applications/[id]/decision.tsx`: Offer letter acceptance & admission decision.
  10. `app/(parent)/applications/[id]/timeline.tsx`: Complete audit timeline of admission application events.

### Question 3: Which screens are enrolled-student-specific?

- **Finding:** **Zero screens** are genuinely connected to enrolled SIS student data.
- **Evidence:**
  - `app/(tabs)/calendar.tsx`: Displays a generic calendar widget with static hardcoded event markers; no student-specific class timetable or exam schedule.
  - `app/(tabs)/profile.tsx`: Displays parent user details from auth store; has no enrolled student profile cards.
  - `app/(tabs)/dashboard.tsx`: Contains 4 action buttons ("Pay Fees", "Attendance", "Report Card", "Messages") that all loop back to `ROUTES.TABS.DASHBOARD` via empty/broken handlers (`apps/mobile_app/app/(tabs)/dashboard.tsx#L30-L57`).

### Question 4: How does the child switcher work today?

- **Finding:**
  - Component: `apps/mobile_app/src/components/admission/ChildSwitcher.tsx`.
  - Implementation:
    ```typescript
    export interface ChildSwitcherProps {
      applications: AdmissionApplication[];
      selectedId: string;
      onSelect: (id: string) => void;
    }
    ```
  - It receives an array of `AdmissionApplication` objects (`applications: AdmissionApplication[]`).
  - It renders horizontal pill buttons labeled with the applicant's name extracted from `app.student_name` or `app.lead.student_first_name`.
  - When pressed, it calls `setSelectedAppId(id)`, switching which admission application card is rendered on `app/(parent)/index.tsx`.

### Question 5: Does child switching switch between admission applicants or enrolled students?

- **Finding:** **It switches strictly between Admission Applicants.**
- **Evidence:** The component's internal header explicitly reads:
  ```typescript
  <Text className="...">Select Child / Application ({applications.length})</Text>
  ```
  It has no knowledge of enrolled student IDs (`student_id`), grade sections, or enrollment statuses.

### Question 6: What happens if a parent has one applicant and one enrolled student?

- **Finding:**
  - The enrolled student is completely invisible in the mobile app.
  - The switcher displays only the single admission applicant.
  - Because `applications.length === 1`, line 16 of `ChildSwitcher.tsx` triggers:
    ```typescript
    if (!applications || applications.length <= 1) {
      return null;
    }
    ```
    The switcher completely hides itself, and the parent can only view the applicant. The parent has zero access to the enrolled student's academics, attendance, or fees.

### Question 7: What happens if a parent has only enrolled students and no applicants?

- **Finding:** **The parent is shown a blocking empty state indicating they have no children.**
- **Evidence:** In `apps/mobile_app/app/(parent)/index.tsx` lines 163–182:
  ```typescript
  {!isLoading && !isError && applications.length === 0 && (
    <View className="...">
      <Text className="text-lg font-black text-slate-900">No Admission Applications Yet</Text>
      <Text className="text-xs text-slate-500">
        Start your child's enrollment process by completing an online admission application.
      </Text>
      <Button
        title="Start Admission Application"
        onPress={() => router.push('/(parent)/applications/wizard')}
      />
    </View>
  )}
  ```
  A parent with 2 currently enrolled high school students sees: _"No Admission Applications Yet — Start your child's enrollment process by completing an online admission application."_ The mobile app is completely unusable for them.

### Question 8: What backend APIs and database schemas support enrolled students vs admission applicants?

- **Database Schema (`apps/backend/prisma/schema.prisma`):**
  - **Enrolled Students:**
    - `model students` (lines 733–790): Contains `student_id`, `admission_no`, `current_grade_level`, `status`, `enrollment_date`.
    - `model parents` (lines 596–624): Contains `parent_id`, `user_id`, `first_name`, `phone`.
    - `model student_parents` (lines 713–730): Junction table with `student_id`, `parent_id`, `relationship`, `is_primary_contact`.
  - **Admission Applicants:**
    - `model admission_applications` (lines 450–520): Contains `application_id`, `lead_id`, `status`, `submission_date`.
- **Backend API Endpoints (`apps/backend`):**
  - **Enrolled Students Backend Support:**
    - `GET /v1/parents/:id/students`: Implemented in `ParentStudentController.getStudents` (`apps/backend/src/modules/parent-management/routes/parent.routes.ts#L45-L49`).
    - `GET /v1/parents/dashboard`: Implemented in `ParentAnalyticsController.getDashboard`.
    - `GET /v1/attendance/student/:id`: Implemented in attendance module.
    - `GET /v1/fees/student/:id`: Implemented in fee collection module.
    - `POST /razorpay/create-order`: Implemented in `razorpay.routes.ts`.
  - **Mobile App Consumption:** The mobile app calls NONE of these enrolled student endpoints. It consumes only `/v1/admissions/applications/*`.

---

## 3. Structural Comparison Matrix

| Capability                   | Admission Applicants                                      | Enrolled SIS Students                                               |
| ---------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------- |
| **Primary Domain Model**     | `admission_applications`                                  | `students` joined via `student_parents`                             |
| **Mobile API Client**        | `apps/mobile_app/src/api/admission.api.ts` (14 endpoints) | None (`apps/mobile_app/src/api/` has no student API)                |
| **Mobile Feature Directory** | `apps/mobile_app/src/features/admission/` (Complete)      | `apps/mobile_app/src/features/students/` (Non-existent)             |
| **Child Switcher Target**    | `AdmissionApplication[]`                                  | Not implemented                                                     |
| **Status Tracking**          | Applied → Submitted → Verified → Approved                 | Enrolled → Active → Graduated (Not in mobile)                       |
| **Fee Collection**           | Application processing fee (Simulated)                    | Term tuition, bus, lab fees (Razorpay on backend, absent on mobile) |
| **Academic Records**         | Entrance assessment scores                                | Grade cards, report cards, exams (Absent on mobile)                 |

---

## 4. Phase 2 Architectural Mandate

To transition from an Admission Application Tracker to a true **EduTrack Parent Mobile App**, Phase 2 must introduce:

1. **Unified Child Model:** A composite entity capable of representing both prospective applicants (`status: 'applicant'`) and matriculated students (`status: 'enrolled'`).
2. **Global Child Switcher:** A top-level context provider in `_layout.tsx` storing the actively selected child across all tabs.
3. **Dual-Mode Dashboard:**
   - When an applicant child is selected: Display admission stepper, document checklist, and application fee status.
   - When an enrolled child is selected: Display daily attendance summary, current period timetable, upcoming assignments, and term tuition balance.
