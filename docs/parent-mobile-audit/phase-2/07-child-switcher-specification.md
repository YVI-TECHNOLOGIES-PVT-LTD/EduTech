# Phase 2 Blueprint: Universal Child Switcher Architecture & Specification

**Document Reference:** `docs/parent-mobile-audit/phase-2/07-child-switcher-specification.md`  
**Phase:** Phase 2 — Complete UI/UX Architecture & Redesign Blueprint  
**Status:** ARCHITECTURAL SPECIFICATION & BLUEPRINT (READ-ONLY DESIGN)

---

## 1. Executive Summary & Problem Resolution

Phase 1.1 identified that the current child switcher (`apps/mobile_app/src/components/admission/ChildSwitcher.tsx`) operates exclusively on `AdmissionApplication[]` arrays. As a result:

- Enrolled students are completely omitted from the interface.
- Parents with both applicants and enrolled students cannot switch to their enrolled children.
- Parents with only enrolled students are shown a blocking empty state indicating they have no children (`app/(parent)/index.tsx#L169`).

This specification re-architects the child switcher into a **Universal Family Child Selector** capable of orchestrating both **Enrolled Students** and **Admission Applicants** across the entire application shell.

---

## 2. The Universal Child Domain Model Contract

We define a composite TypeScript model representing any child linked to the parent account:

```typescript
export type ChildRelationship = 'father' | 'mother' | 'guardian';

export interface BaseChild {
  id: string; // Unique identifier (studentId or applicationId)
  fullName: string;
  firstName: string;
  lastName: string;
  gender?: 'male' | 'female' | 'other';
  avatarUrl?: string | null;
  relationship: ChildRelationship;
  isPrimaryContact: boolean;
  academicYear: string; // e.g. "2026-2027"
}

export interface EnrolledChild extends BaseChild {
  kind: 'enrolled';
  studentId: string;
  admissionNumber: string;
  gradeLevel: string; // e.g. "Grade 4"
  section: string; // e.g. "B"
  rollNumber?: string;
  campusName?: string;
  status: 'active' | 'graduated' | 'suspended' | 'transferred';
  attendanceToday?: {
    status: 'present' | 'absent' | 'late' | 'holiday' | 'unmarked';
    timestamp?: string;
  };
  hasPendingFees: boolean;
  pendingFeeAmount?: number;
}

export interface ApplicantChild extends BaseChild {
  kind: 'applicant';
  applicationId: string;
  applicationNumber: string; // e.g. "APP-2026-089"
  applyingGrade: string; // e.g. "Kindergarten"
  stage:
    | 'draft'
    | 'submitted'
    | 'documents_pending'
    | 'under_review'
    | 'assessment_scheduled'
    | 'fee_pending'
    | 'decision_ready'
    | 'offer_accepted'
    | 'rejected';
  progressPercentage: number; // 0 - 100
  actionRequiredNotice?: string; // e.g. "Upload Birth Certificate"
}

export type UnifiedChild = EnrolledChild | ApplicantChild;
```

---

## 3. Global State Management Architecture

### 3.1 Zustand Store Specification: `useChildStore`

The active child selection must persist globally across all tabs, queries, and background sync routines.

```typescript
interface ChildStoreState {
  children: UnifiedChild[];
  selectedChildId: string | null;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;

  // Actions
  setChildren: (children: UnifiedChild[]) => void;
  selectChild: (id: string) => void;
  getSelectedChild: () => UnifiedChild | null;
  syncChildrenFromBackend: () => Promise<void>;
  reset: () => void;
}
```

### 3.2 State Persistence & Auto-Selection Rules

1. **Persistence:** The `selectedChildId` is persisted in `AsyncStorage` under key `edutrack_active_child_id`.
2. **Auto-Selection on Cold Start:**
   - If the stored `selectedChildId` exists in the fresh list of children, select it.
   - If not, default to the first **Enrolled Student** (priority).
   - If no enrolled students exist, default to the first active **Admission Applicant**.
   - If no children exist, set `selectedChildId = null` (triggers Unlinked Account Onboarding).
3. **Query Invalidation on Switch:**
   When `selectChild(id)` is called:
   - React Query keys tied to child data (`QUERY_KEYS.academics.*`, `QUERY_KEYS.finance.*`, `QUERY_KEYS.attendance.*`) are invalidated and refetched.

---

## 4. UI/UX Specification: The Child Switcher Bottom Sheet

The switcher is invoked by tapping the **Selected Child Card** on the Home Dashboard header or via `/(main)/home/child-switcher`.

```
┌───────────────────────────────────────────────────────────────┐
│                      [ Drag Handle ]                          │
│                                                               │
│  Select Child or Application                                ✕ │
│  Switch between your enrolled students and active admissions  │
│                                                               │
│  ENROLLED STUDENTS (2)                                        │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ (Photo)  Aarav Sharma                          [ACTIVE] │  │
│  │          Grade 4 - Section B • Roll #14                 │  │
│  │          Status: Present Today (08:15 AM)               │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ (Photo)  Riya Sharma                                    │  │
│  │          Grade 8 - Section A • Roll #03                 │  │
│  │          Status: Present Today (08:10 AM) • 1 Fee Due   │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ADMISSION APPLICANTS (1)                                     │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ (Avatar) Kabir Sharma                                   │  │
│  │          Applying for Grade 1 • App #APP-2026-102       │  │
│  │          Stage 3/9: Documents Pending                   │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  [ + Apply for Another Child / New Admission ]                │
│  [ 🔗 Link an Enrolled Student by Admission Number ]           │
└───────────────────────────────────────────────────────────────┘
```

### 4.1 Visual Design Tokens for Switcher Cards:

- **Card Container:** `bg-white dark:bg-slate-900 border rounded-2xl p-4 mb-3`.
- **Active Selection Styling:** When `child.id === selectedChildId`:
  - Border: `border-2 border-indigo-600 dark:border-indigo-500`.
  - Surface: `bg-indigo-50/40 dark:bg-indigo-950/30`.
  - Badge: Top-right `Selected` pill with checkmark (`bg-indigo-600 text-white text-xs px-2.5 py-0.5 rounded-full font-bold`).
- **Inactive Selection Styling:**
  - Border: `border-slate-200 dark:border-slate-800`.
  - Feedback: Ripple / opacity transition on press.

---

## 5. Switcher States & Edge-Case Handling

### 5.1 Loading State

- While fetching `GET /v1/parents/:id/students` and `GET /v1/admissions/applications`:
- Renders 3 animated skeleton cards with pulse shimmer.

### 5.2 Single Child State

- If the parent has only 1 child across both categories:
- The Home selector bar hides the "Switch" action button and renders a subtle lock or verified student badge: `"Grade 4B"`.
- Prevents unnecessary modal popping when no alternate selection is possible.

### 5.3 Error State

- If network failure prevents fetching child relationships:
- Renders an inline retry error card:
  ```
  "Unable to retrieve family profiles. Displaying cached records."
  [ Retry Sync Button ]
  ```
- Falls back to last-known cached children in `AsyncStorage`.

### 5.4 No Authorized Children State (Unlinked Account)

- When a newly registered parent logs in without any linked student or applicant:
- Modal renders an informative empty state:
  ```
  [ Icon: School Family Illustration ]
  "No Children Linked Yet"
  "Your account is registered, but no student profiles or applications are associated with this phone/email."

  Action 1: [ Start Admission Application ] (Navigates to wizard)
  Action 2: [ Link Existing Student ] (Enters Admission # & Date of Birth verification)
  ```

---

## 6. Backend API Integration Strategy

To populate the Universal Child Store, the client executes a concurrent multi-source fetch:

```typescript
async function fetchUnifiedChildren(parentId: string): Promise<UnifiedChild[]> {
  const [enrolledRes, applicantRes] = await Promise.allSettled([
    apiClient.get(`/v1/parents/${parentId}/students`),
    apiClient.get('/v1/admissions/applications'),
  ]);

  const enrolledChildren: EnrolledChild[] =
    enrolledRes.status === 'fulfilled'
      ? enrolledRes.value.data.map(mapBackendStudentToEnrolledChild)
      : [];

  const applicantChildren: ApplicantChild[] =
    applicantRes.status === 'fulfilled'
      ? applicantRes.value.data.map(mapBackendAppToApplicantChild)
      : [];

  return [...enrolledChildren, ...applicantChildren];
}
```

_Backend Verification Note:_

- `GET /v1/parents/:id/students` is already implemented in `ParentStudentController` (`apps/backend/src/modules/parent-management/routes/parent.routes.ts#L45-L49`).
- `GET /v1/admissions/applications` is already implemented in `admission.routes.ts`.
- The mobile app simply needs to combine these two existing backend endpoints into the single unified store.
