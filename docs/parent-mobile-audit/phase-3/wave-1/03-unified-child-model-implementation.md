# EduTrack ERP — Parent Mobile App

# Phase 3 — Wave 1: Unified Child Model Implementation

## 1. Discriminated Union Type Architecture

To bridge the architectural gap between prospective applicants and active enrolled students identified in Phase 1.1, Wave 1 introduces a strictly typed domain model in [`apps/mobile_app/src/types/child.types.ts`](file:///c:/Users/user/Documents/GitHub/EduTech/apps/mobile_app/src/types/child.types.ts).

### Model Definitions

```typescript
export type ChildKind = 'enrolled' | 'applicant';

export interface BaseChild {
  id: string;
  kind: ChildKind;
  firstName: string;
  lastName: string;
  fullName: string;
  photoUrl?: string | null;
}

export interface EnrolledChild extends BaseChild {
  kind: 'enrolled';
  studentId: string;
  admissionNumber: string;
  rollNumber?: string | null;
  grade: string;
  section: string;
  academicYearId?: string;
  campusId?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ALUMNI' | 'SUSPENDED';
}

export interface ApplicantChild extends BaseChild {
  kind: 'applicant';
  applicationId: string;
  applicationNumber: string;
  targetGrade: string;
  academicYear: string;
  applicationStatus:
    | 'DRAFT'
    | 'SUBMITTED'
    | 'UNDER_REVIEW'
    | 'ASSESSMENT_SCHEDULED'
    | 'SHORTLISTED'
    | 'ADMITTED'
    | 'REJECTED'
    | 'WAITLISTED'
    | 'FEE_PENDING';
  submittedAt?: string;
}

export type UnifiedChild = EnrolledChild | ApplicantChild;
```

### Type Guard Functions

```typescript
export function isEnrolledChild(child: UnifiedChild | null): child is EnrolledChild {
  return child !== null && child.kind === 'enrolled';
}

export function isApplicantChild(child: UnifiedChild | null): child is ApplicantChild {
  return child !== null && child.kind === 'applicant';
}
```

---

## 2. Zustand State Management Store (`useChildStore`)

Located at [`apps/mobile_app/src/stores/child.store.ts`](file:///c:/Users/user/Documents/GitHub/EduTech/apps/mobile_app/src/stores/child.store.ts).

### Key Responsibilities

1. **Active Child Selection**: Tracks the globally active child across all tabs (Home, Academics, Finance, Profile).
2. **Strict Client-Side Authorization**:
   - `selectChild(childId: string)` executes a verification against the known authorized `children` array.
   - If an unauthorized or invalid `childId` is provided, the store rejects the transition, logs a security warning, and retains the previously validated child.
3. **Priority Auto-Selection**:
   - When loading children for a parent, if a previously persisted child ID exists in AsyncStorage and is in the authorized list, it is selected.
   - Otherwise, the store prioritizes active `enrolled` students first.
   - If no enrolled students exist, it falls back to the most recent `applicant` child.
4. **Local Persistence**:
   - Persists the selected child ID to `@react-native-async-storage/async-storage` under key `edutrack_active_child_id`.
5. **Secure Logout Cleanup**:
   - Integrated into [`apps/mobile_app/src/core/auth/auth.service.ts`](file:///c:/Users/user/Documents/GitHub/EduTech/apps/mobile_app/src/core/auth/auth.service.ts) inside `AuthService.logout()`.
   - On logout, `useChildStore.getState().reset()` is executed, clearing all memory state and removing the persisted child storage key to eliminate cross-session data leaks.

---

## 3. Store API Reference

```typescript
interface ChildState {
  selectedChild: UnifiedChild | null;
  children: UnifiedChild[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setChildren: (children: UnifiedChild[]) => Promise<void>;
  selectChild: (childId: string) => Promise<boolean>;
  refreshChildren: () => Promise<void>;
  reset: () => Promise<void>;
}
```

---

## 4. Verification Tests

Unit tests validating the store logic are located in [`apps/mobile_app/tests/unit/child-store.test.ts`](file:///c:/Users/user/Documents/GitHub/EduTech/apps/mobile_app/tests/unit/child-store.test.ts):

- Verifies initial empty state.
- Verifies priority selection favoring enrolled children.
- Verifies selection fallback when only applicant children exist.
- Verifies valid child switching.
- Verifies rejection of unauthorized child IDs.
- Verifies full reset on logout.
- All 7 store unit tests pass cleanly.
