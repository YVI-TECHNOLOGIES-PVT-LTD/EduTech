# EduTrack ERP — Parent Mobile App

# Phase 3 — Authentication & Child Management Report

## 1. Authentication Architecture

Authentication is managed via `AuthService` and `useAuthStore` backed by `expo-secure-store` for cryptographic token storage and session token refresh:

- `SecureStorage.setItem('access_token', token)`
- `SecureStorage.setItem('refresh_token', token)`
- Automatic token injection in `apiClient` via Axios interceptors.
- On 401 Unauthorized: attempts silent token refresh; upon failure, clears stored tokens and transitions session to unauthenticated.

---

## 2. Universal Child Discriminated Union

To unify enrolled students (Journey B) and prospective applicants (Journey A), `UnifiedChild` is implemented as a discriminated union:

```typescript
export type UnifiedChild = EnrolledChild | ApplicantChild;

export interface BaseChild {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  gender?: 'male' | 'female' | 'other';
  avatarUrl?: string | null;
  relationship?: ChildRelationship | string;
  isPrimaryContact?: boolean;
  academicYear: string;
}

export interface EnrolledChild extends BaseChild {
  kind: 'enrolled';
  studentId: string;
  admissionNumber: string;
  gradeLevel: string;
  section: string;
  rollNumber?: string;
  campusName?: string;
  status: string;
  attendanceToday?: {
    status: 'present' | 'absent' | 'late' | 'holiday' | 'unmarked';
    timestamp?: string;
  };
  hasPendingFees?: boolean;
  pendingFeeAmount?: number;
}

export interface ApplicantChild extends BaseChild {
  kind: 'applicant';
  applicationId: string;
  applicationNumber: string;
  applyingGrade: string;
  stage: string;
  progressPercentage: number;
  actionRequiredNotice?: string;
}
```

---

## 3. Child Store (`apps/mobile_app/src/stores/child.store.ts`)

The store provides synchronization and switching:

### A. Tri-Source Child Discovery

1. **Parent-Student Relationships**: Calls `GET /v1/parents/:parentId/students` (enabled for parent self-service).
2. **Financial Ledger Dues**: Calls `GET /v1/fees/my` through `ParentFinanceService.getMyChildrenFees`. Enriches enrolled students with real `outstanding_balance`, `admission_no`, and classroom assignments.
3. **Admission Applications**: Calls `GET /v1/applications?mine=true` to retrieve applicant wards.

### B. Priority-Based Auto-Selection

1. **Priority 1**: Preserves existing selection if present in the refreshed child list.
2. **Priority 2**: Automatically selects the first **Enrolled Student** (`kind === 'enrolled'`).
3. **Priority 3**: Selects the first **Applicant Child** (`kind === 'applicant'`).
4. **Priority 4**: Falls back to `null` (renders `UnlinkedOnboardingView`).

### C. Client-Side IDOR Defense

`selectChild(id)` strictly verifies that the selected `id` exists in the authenticated parent's authorized list:

```typescript
selectChild: (id: string): boolean => {
  const { children } = get();
  const targetChild = children.find((c) => c.id === id);
  if (!targetChild) {
    return false; // Unauthorized ID rejection
  }
  set({ selectedChildId: id });
  AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {});
  return true;
};
```

### D. Logout State Purge

`reset()` destroys:

- Active memory state: `children: []`, `selectedChildId: null`.
- Persistent selection: `AsyncStorage.removeItem('edutrack_active_child_id')`.
- Coupled stores: `useFinanceStore.getState().clear()`, `useAcademicsStore.getState().clear()`, `useHelpdeskStore.getState().clear()`.

---

## 4. Universal Child Switcher Modal (`ChildSwitcherSheet.tsx`)

Rendered globally across Home, Academics, Finance, and Profile:

- Segmented badges: "Enrolled" (Emerald) vs "Applicant" (Indigo).
- Instant switching with visual radio indicators.
- Direct quick-link: "Submit New Admission Application" (`router.push(ROUTES.PARENT.WIZARD)`).
- Accessible close button and backdrop dismissal.
