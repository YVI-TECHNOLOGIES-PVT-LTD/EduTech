# EduTrack ERP — Parent Mobile App

# Phase 3 Verification Report: 02 — Child Management & Security Verification

## 1. Domain Model: UnifiedChild Discriminated Union

The discriminated union `UnifiedChild` is implemented in `apps/mobile_app/src/types/child.types.ts`:

```typescript
export type UnifiedChild = EnrolledChild | ApplicantChild;
```

### Verification Findings:

1. **Discrimination Property**: Uses `kind: 'enrolled'` vs `kind: 'applicant'`.
2. **ID Separation**:
   - `EnrolledChild` has `id: string` (mapped to `studentId`), `admissionNumber: string`, `gradeLevel: string`, `section: string`, `rollNumber?: string`.
   - `ApplicantChild` has `id: string` (mapped to `applicationId`), `applicationNumber: string`, `applyingGrade: string`, `stage: string`, `progressPercentage: number`.
3. **Type Safety**: Enforces complete separation between enrolled students and applicants in all downstream components and widgets.

---

## 2. Child Store State & Lifecycle (`child.store.ts`)

| State / Action                    | Implementation Verified                                  | Security / Architectural Evaluation             |
| --------------------------------- | -------------------------------------------------------- | ----------------------------------------------- |
| `children: UnifiedChild[]`        | Initialized to `[]`                                      | Clean initial state                             |
| `selectedChildId: string \| null` | Initialized to `null`                                    | No hardcoded pre-selected ID                    |
| `selectChild(id)`                 | Validates `children.some(c => c.id === id)`              | Client-side guard only; rejects local tampering |
| `hydrateStoredSelection()`        | Reads `AsyncStorage.getItem('edutrack_active_child_id')` | Validates against `children` before activating  |
| `reset()`                         | Clears `children`, selection, and `AsyncStorage`         | Properly purges stored ID on logout             |
| `AuthService.logout()`            | Invokes `useChildStore.getState().reset()`               | Verified called during session termination      |

---

## 3. Backend Authorization & IDOR Security Audit

### A. Vulnerability in `ParentStudentController.getStudents`

Location: `apps/backend/src/modules/parent-management/controllers/parent-student.controller.ts` (lines 53–69):

```typescript
let targetParentId = id;
if (isParentOnly && user?.id) {
  const parentRecord = await prisma.parents.findFirst({
    where: {
      OR: [{ parent_id: id }, { user_id: user.id }, ...(user.email ? [{ email: user.email }] : [])],
    },
  });
  if (!parentRecord) {
    return res
      .status(403)
      .json({ error: 'FORBIDDEN', message: 'Unauthorized parent record access' });
  }
  targetParentId = parentRecord.parent_id;
}
```

### Security Defect Analysis:

- **Flawed Query Structure**: The `where` clause uses `OR: [ { parent_id: id }, { user_id: user.id }, ... ]`.
- **Exploitation Scenario**:
  1. Attacker (Parent A) logs in with valid JWT token (`user.id = "user_A"`).
  2. Attacker sends `GET /v1/parents/<victim_parent_id>/students`.
  3. Prisma executes SQL with `WHERE parent_id = '<victim_parent_id>' OR user_id = 'user_A'`.
  4. If the database engine returns the record matching `parent_id = '<victim_parent_id>'`, `parentRecord` is resolved to the **victim parent**.
  5. `targetParentId = parentRecord.parent_id` becomes `<victim_parent_id>`.
  6. The controller then executes `ParentStudentService.getStudentsByParent(victim_parent_id)` and returns all students linked to the victim!
- **Severity**: **HIGH (Insecure Direct Object Reference / IDOR)**.
- **Required Remediation**: The query must strictly resolve the parent record belonging to the authenticated user (`where: { user_id: user.id }`), and then verify that `id` equals `parentRecord.parent_id` (or simply ignore `req.params.id` for parent users and use their own `parent_id`).

### B. Client-Side ID Validation vs Server Authorization

`apps/mobile_app/src/stores/child.store.ts` provides `selectChild(id)` which checks:

```typescript
if (!targetChild) return false;
```

This check is purely a **client-side UX safeguard**. It prevents the mobile UI from displaying an unlisted child if modified in memory, but it does **NOT** provide backend authorization. Any direct HTTP request to `/v1/parents/:id/students` bypasses client-side checks completely.

---

## 4. Tri-Source Child Discovery Audit

In `child.store.ts` lines 92–180, child discovery merges three sources:

1. `GET /v1/parents/:parentId/students` (Parent-Student links)
2. `GET /v1/fees/my` (`ParentFinanceService.getMyChildrenFees`)
3. `GET /v1/applications?mine=true` (`applicationsApi.listMine`)

### Architectural Defect: Discovery of Identity via Billing Endpoint

Lines 135–170 of `child.store.ts`:

```typescript
const feeChildren = await financeApi.getMyChildrenFees();
feeChildren.forEach((fc) => {
  const existingIndex = unifiedList.findIndex(...);
  if (existingIndex >= 0) {
    // Enrich existing enrolled student with fees
  } else {
    // BUG: Instantiates NEW EnrolledChild from fee data!
    unifiedList.push(enrolledChild);
  }
});
```

### Evaluation:

- **Incorrect Domain Responsibility**: `GET /v1/fees/my` is an accounting/dues ledger endpoint. Using it to discover or instantiate student identity conflates billing records with legal parent-student guardianship.
- **Data Integrity Risk**: A parent who is registered as a third-party fee sponsor (e.g., an employer, relative, or corporate sponsor) may appear in fee assignments without having parental or academic access rights to the student.
- **Proper Pattern**: Student identity must be established **solely** via SIS relationship records (`/v1/parents/:id/students`) and admissions records (`/v1/applications`). The fee endpoint should strictly enrich existing verified students, never instantiate new child identities.

---

## 5. Summary Verdict

| Capability                 | Verdict                           | Notes                                                     |
| -------------------------- | --------------------------------- | --------------------------------------------------------- |
| Discriminated Union Model  | VERIFIED — FRONTEND FUNCTIONALITY | Strict TypeScript domain modeling                         |
| Child Switcher & Store     | VERIFIED — FRONTEND FUNCTIONALITY | Working Zustand state with logout reset                   |
| Backend Parent IDOR Guard  | **FAILED**                        | `OR` clause in `parent-student.controller.ts` allows IDOR |
| Tri-Source Discovery Logic | **PARTIALLY INTEGRATED**          | Billing endpoint improperly instantiates student identity |
