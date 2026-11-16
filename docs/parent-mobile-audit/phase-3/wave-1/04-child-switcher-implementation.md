# EduTrack ERP — Parent Mobile App

# Phase 3 — Wave 1: Child Switcher Implementation

## 1. Overview & Component Architecture

The Universal Child Switcher provides parents with an intuitive, unified interface to switch context between multiple children—whether they are active enrolled students in the school or prospective applicants in the admission pipeline.

The feature consists of two main components:

1. **`SelectedChildCard`**: An active child header banner displaying current student/applicant context.
2. **`ChildSwitcherSheet`**: An interactive modal bottom sheet presenting grouped lists of children with immediate selection capability.

---

## 2. `SelectedChildCard` Specification

Located at [`apps/mobile_app/src/components/child/SelectedChildCard.tsx`](file:///c:/Users/user/Documents/GitHub/EduTech/apps/mobile_app/src/components/child/SelectedChildCard.tsx).

### Visual Layout & Data Binding

- **Avatar**: Displays the student's photo (or initials avatar fallback if photo is unavailable).
- **Identity & Grade**:
  - For `EnrolledChild`: Displays `fullName` (e.g., "Aarav Sharma") and subtitle `Grade {grade} • Sec {section}` (or Roll No if section is empty).
  - For `ApplicantChild`: Displays `fullName` and subtitle `App #{applicationNumber} • Applying for Grade {targetGrade}`.
- **Context Badge**:
  - `Enrolled`: Green or primary status badge (`ACTIVE` / `ENROLLED`).
  - `Applicant`: Semantic badge corresponding to `applicationStatus` (e.g., `UNDER_REVIEW`, `SUBMITTED`, `FEE_PENDING`).
- **Interactive Switcher Trigger**:
  - Displays a chevron-down or "Switch" pill icon (`Ionicons 'chevron-down'`).
  - Tapping anywhere on the card invokes `onOpenSwitcher()`.

---

## 3. `ChildSwitcherSheet` Specification

Located at [`apps/mobile_app/src/components/child/ChildSwitcherSheet.tsx`](file:///c:/Users/user/Documents/GitHub/EduTech/apps/mobile_app/src/components/child/ChildSwitcherSheet.tsx).

### Modal Layout & Sections

1. **Header**:
   - Title: "Select Child".
   - Subtitle: "Switch active child to view academic or admission details".
   - Close Button: `Ionicons 'close'`.
2. **Enrolled Students Section**:
   - Section header: "Enrolled Students (SIS)" with student count.
   - Child Card:
     - Avatar with student initials/photo.
     - Full Name.
     - Grade & Section badge.
     - Radio selection checkmark (`Ionicons 'checkmark-circle'`) indicating active state.
3. **Admission Applicants Section**:
   - Section header: "Admission Applicants" with applicant count.
   - Child Card:
     - Avatar with applicant initials.
     - Full Name & Application Number.
     - Application status pill (e.g., "Under Review", "Fee Pending").
     - Selection checkmark indicating active state.
4. **Action Footer**:
   - "Apply for Another Child" button leading directly to `/(parent)/applications/wizard` (`ROUTES.PARENT.APPLICATIONS_WIZARD`).
5. **Zero Children Empty State**:
   - Clean empty state with icon `school-outline`, friendly message, and prominent "Submit New Application" button.

---

## 4. Interaction Patterns & Error Prevention

- **Instant State Sync**: Tapping an unselected child immediately calls `useChildStore.getState().selectChild(child.id)`, updates local storage asynchronously, and closes the bottom sheet.
- **Client-Side Authorization**: If an invalid ID is passed, the store safely ignores the change without corrupting app state.
- **Accessibility**: Includes accessible labels (`accessibilityRole="button"`, `accessibilityLabel="Switch active child"`, `accessibilityState={{ selected: isSelected }}`).
