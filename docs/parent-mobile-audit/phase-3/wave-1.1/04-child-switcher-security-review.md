# EduTrack ERP — Parent Mobile App

# Phase 3 — Wave 1.1: Child Switcher Security Review

## 1. Security Architecture & Threat Model

The Universal Child Switcher provides client-side context switching across a parent's children. In mobile application security, client-side state must be treated as a **UX safeguard**, while the backend remains the **authoritative security boundary**.

```text
  [ Mobile Client: useChildStore ]
         │
         ├── 1. Client Authorization Guard: Reject selection if ID not in parent's authorized list
         ├── 2. AsyncStorage Persistence: Persists active ID (cleared on logout)
         └── 3. API Dispatch: Passes active child ID with User JWT Bearer Token
                     │
                     ▼
  [ Backend Security Boundary: RBAC & Tenant Guard ]
         │
         ├── 4. Token Authenticity: Verifies JWT signature and claims
         ├── 5. Parent Ownership Validation: Ensures child/app belongs to requesting parent
         └── 6. Multi-Tenant Scoping: Ensures org_id / school_id isolation
```

---

## 2. Component-by-Component Security Audit

### 2.1. `src/types/child.types.ts`

- **Discriminated Union Structure**:
  ```typescript
  export type UnifiedChild = EnrolledChild | ApplicantChild;
  ```
- **Type Safety**:
  - `EnrolledChild` is explicitly branded with `kind: 'enrolled'`, containing `studentId`, `admissionNumber`, `gradeLevel`, and `section`.
  - `ApplicantChild` is explicitly branded with `kind: 'applicant'`, containing `applicationId`, `applicationNumber`, `applyingGrade`, and `stage`.
  - The two variants share `BaseChild` for common UI fields (`id`, `fullName`, `firstName`, `lastName`, `avatarUrl`), but their business keys (`studentId` vs `applicationId`) are disjoint.

### 2.2. `src/stores/child.store.ts`

- **Strict Selection Guard**:
  ```typescript
  selectChild: (id: string): boolean => {
    const { children } = get();
    const targetChild = children.find((c) => c.id === id);
    if (!targetChild) {
      return false; // Rejects unlisted or injected IDs
    }
    set({ selectedChildId: id });
    AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {});
    return true;
  };
  ```
- **Stale Selection Handling**:
  - In `setChildren()`, if a previously selected or stored child ID is no longer returned by the server (e.g. child transferred, application archived), the store automatically discards it and falls back to:
    1. First active enrolled student (`firstEnrolled.id`).
    2. First active applicant (`children[0].id`).
    3. `null` if the parent has zero children.
- **Persistence Safety**:
  - The store only writes the child ID string to `@react-native-async-storage/async-storage` under key `edutrack_active_child_id`. No PII, medical records, or grades are cached in unencrypted storage.

### 2.3. Cross-Account Isolation & Logout Cleanup

- Located in [`apps/mobile_app/src/core/auth/auth.service.ts`](file:///c:/Users/user/Documents/GitHub/EduTech/apps/mobile_app/src/core/auth/auth.service.ts):
  ```typescript
  static async logout(): Promise<void> {
    await SecureStorage.clearSession();
    useChildStore.getState().reset();
    useAuthStore.getState().logout();
  }
  ```
- **Behavior**:
  - `useChildStore.getState().reset()` invokes `AsyncStorage.removeItem('edutrack_active_child_id')` and clears the in-memory `children` array and `selectedChildId`.
  - A subsequent login by a different parent starts from a blank state and cannot access children from the previous session.

### 2.4. `ChildSwitcherSheet.tsx` & `SelectedChildCard.tsx`

- **Visual Separation**:
  - The bottom sheet clearly partitions children into two distinct groups: **"Enrolled Students (SIS)"** and **"Admission Applicants"**.
  - Enrolled students display grade, section, and status badge.
  - Applicants display application number and application pipeline stage.
- **Controlled Interaction**:
  - Tapping a child card in the sheet executes `selectChild(child.id)`. Because the list is sourced directly from `useChildStore.children`, external IDs cannot be injected via the sheet UI.

---

## 3. Backend Authorization Enforcement

The client-side selection does not bypass backend authorization:

- For admission routes (`/v1/applications/:id/*`), `AdmissionController` validates `parentUserId` and restricts queries where `created_by = userId`.
- When SIS APIs are connected in Wave 2, each student endpoint must validate that `student_parents` contains `parent_id = req.context.user.id` and `student_id = :id`.
