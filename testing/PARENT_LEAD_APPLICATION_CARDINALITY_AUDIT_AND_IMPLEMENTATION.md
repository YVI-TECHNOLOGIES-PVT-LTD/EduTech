# Forensic Audit & Implementation Report: Parent → Lead → Application Cardinality & Name Mapping

**Target Business Model**:

```text
User (1:1) -> Parent (1:N) -> Lead (1:N) -> Application (1:0..1) -> Student
```

**Required Hierarchy Behavior**:

```text
Parent P001 (Hari Kumar)
├── Lead L001 (Unassigned at Reg: 'Applicant' -> Updated on App: 'Rahul Kumar')
│   ├── Application A001
│   └── Application A002
│
└── Lead L002 (Child Priya Kumar)
    └── Application A003
```

---

## 1. Root Cause Analysis: Parent Registration Name Mapping

### The Defect

In `apps/backend/src/auth/auth.service.ts` (`resolveOrClaimLeadForParent`):
When a parent registered (e.g. `full_name: 'Hari Kumar'`), `firstName: 'Hari'` and `lastName: 'Kumar'` were split from the parent's name and erroneously written into:

```typescript
student_first_name: firstName || 'Applicant',
student_last_name: lastName || undefined,
```

This caused:

1. `contact_name = 'Hari Kumar'`
2. `student_first_name = 'Hari'` (Incorrect: Parent's first name as Child's name)
3. `student_last_name = 'Kumar'`

When the parent later applied for their actual child **Rahul Kumar**, the downstream application service compared `'Rahul'` against `c.student_first_name ('Hari')`, failed to match, and created a duplicate lead or failed to reuse the registration lead.

Additionally, in `EnquiryService.ts` and `EnquiryRepository.ts`, a fallback `${parent_name}'s Ward` split the parent's first name into `student_first_name` when no child name was given on enquiry.

---

## 2. Corrected Semantic Mapping

```text
Registration full_name (Hari Kumar)
        ↓
User.first_name ('Hari') / User.last_name ('Kumar')
        ↓
Parent.first_name ('Hari') / Parent.last_name ('Kumar')
        ↓
Lead.contact_name ('Hari Kumar')
```

and NEVER:

```text
Registration full_name
        ↓
Lead.student_first_name ❌
Lead.student_last_name  ❌
```

At registration (when child identity is not yet known):

- `Lead.parent_id = parentId`
- `Lead.contact_name = fullName`
- `Lead.contact_phone = cleanPhone`
- `Lead.contact_email = cleanEmail`
- `Lead.student_first_name = 'Applicant'` (Standard neutral placeholder constant)
- `Lead.student_last_name = null`

---

## 3. Files Modified

1. **[`apps/backend/src/auth/auth.service.ts`](file:///C:/Users/DELL/Desktop/EduTech/apps/backend/src/auth/auth.service.ts)**:
   - Added `normalizePhoneNumber` helper for robust phone matching across `+91 98765 43210` vs `9876543210`.
   - Updated `resolveOrClaimLeadForParent`:
     - Phone comparison utilizes normalized digits.
     - Claiming an existing unlinked enquiry lead preserves its `student_first_name` and `student_last_name` untouched.
     - Fallback registration lead creation sets `student_first_name: 'Applicant'`, `student_last_name: undefined`, and `contact_name: fullName`. Parent name is never mapped to child fields.

2. **[`apps/backend/src/modules/admission-management/services/admission.service.ts`](file:///C:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission-management/services/admission.service.ts)**:
   - Updated `createApplication`:
     - **Deterministic Child Match**: Searches parent's leads for `student_first_name: sFirst`.
     - **Unassigned Registration Lead Identification**: If no child match is found, searches parent's leads for an unassigned/placeholder lead (`'Applicant'`, `'Student'`, or `'s Ward`) with zero active applications.
     - **In-Place Update**: Updates unassigned registration lead with actual child information (`Rahul Kumar`), preserving `lead_id` and avoiding duplicate leads.
     - **Multi-Child Support**: When a second child (`Priya`) is submitted and all existing leads are already assigned to other children, a new distinct Lead `L002` is created under the same `parent_id`.

3. **[`apps/backend/src/modules/admission/services/application/ApplicationService.ts`](file:///C:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission/services/application/ApplicationService.ts)**:
   - Added explicit `org_id: targetOrgId` tenant scoping to candidate queries.
   - Added deterministic child matching + unassigned registration lead resolution.

4. **[`apps/backend/src/modules/admission/services/application/PublicApplicationService.ts`](file:///C:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission/services/application/PublicApplicationService.ts)**:
   - Ensures `parents` entity is resolved/created and `lead.parent_id = parentRecord.parent_id` is linked.
   - Sets placeholder fallback to `'Applicant'`.

5. **[`apps/backend/src/modules/admission/services/crm/EnquiryService.ts`](file:///C:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission/services/crm/EnquiryService.ts)** & **[`apps/backend/src/modules/admission/repositories/crm/EnquiryRepository.ts`](file:///C:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission/repositories/crm/EnquiryRepository.ts)**:
   - Removed `${parent_name}'s Ward` fallback in favor of `'Applicant'` so parent names never split into child names.

6. **[`apps/backend/src/modules/admission-management/tests/parent-lead-application-cardinality.spec.ts`](file:///C:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission-management/tests/parent-lead-application-cardinality.spec.ts)**:
   - Real PostgreSQL test suite covering registration name mapping, first child lead reuse, second child separate lead creation, and enquiry claiming.

---

## 4. Tests Executed & Live PostgreSQL Verification

Executed [`apps/backend/src/modules/admission-management/tests/parent-lead-application-cardinality.spec.ts`](file:///C:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission-management/tests/parent-lead-application-cardinality.spec.ts):

| Test Scenario | Verification Target                                                                                                                                                                                                                                            |  Result  |
| :------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------: |
| **TEST 1**    | **Parent Registration Name Semantics**: Parent Hari Kumar creates User (`Hari`, `Kumar`), Parent (`Hari`, `Kumar`), Lead (`contact_name = 'Hari Kumar'`, `parent_id = P001`, `student_first_name = 'Applicant'`, `student_first_name !== 'Hari'`).             | **PASS** |
| **TEST 2**    | **First Child (Rahul) Reuses Registration Lead**: Application A001 gets `lead_id = L001`. Lead L001 is updated to `student_first_name = 'Rahul'`, `student_last_name = 'Kumar'`. Total leads for Hari = 1.                                                     | **PASS** |
| **TEST 3**    | **Second Child (Priya) Creates Separate Lead**: Application A002 creates `L002` (`student_first_name = 'Priya'`). `L001.lead_id !== L002.lead_id`. Both leads have `parent_id = P001`. Total leads for Hari = 2.                                               | **PASS** |
| **TEST 4**    | **Enquiry Claiming & Phone Normalization**: Existing enquiry `L_ENQ` (`student_first_name = 'Sanjay'`, phone `+91 98888 ...`) is claimed when Manoj Gupta registers with phone `98888...`. `student_first_name` remains `'Sanjay'`. Total leads for Manoj = 1. | **PASS** |
| **TEST 5**    | **Existing Child Lead Reuse**: Second application for Rahul reuses `L001`. Total leads for Hari remains 2.                                                                                                                                                     | **PASS** |
| **TEST 6**    | **Parent Name Separation**: `Lead.contact_name = 'Hari Kumar'`, `Lead.student_first_name = 'Rahul'`, `Lead.student_first_name !== 'Hari'`.                                                                                                                     | **PASS** |
| **TEST 7**    | **Enrollment Cardinality Preservation**: Converting A001 to Student preserves `L001` link without mutating sibling leads.                                                                                                                                      | **PASS** |

---

## 5. Verification Matrix Summary

| Verification Suite                            | Target                                       |           Result           |
| :-------------------------------------------- | :------------------------------------------- | :------------------------: |
| `parent-lead-application-cardinality.spec.ts` | Real DB Cardinality & Name Mapping (7 tests) |       **PASS (7/7)**       |
| `admission.service.spec.ts`                   | Admission Unit Tests (14 tests)              |      **PASS (14/14)**      |
| `pnpm run typecheck`                          | Monorepo TypeScript (7 packages)             |    **PASS (0 errors)**     |
| `pnpm --filter @edutrack/api exec tsc`        | Backend TypeScript Compiler                  |    **PASS (0 errors)**     |
| `pnpm --filter @edutrack/web run build`       | Web Frontend Production Build                | **PASS (built in 30.11s)** |

---

## 6. Final Verdict

**VERIFIED**

- [x] Parent registration `name` strictly maps to `User`, `Parent`, and `Lead.contact_name`.
- [x] `Lead.student_first_name` and `Lead.student_last_name` are never populated with the parent's registration name.
- [x] Lead is created immediately upon parent registration if no existing enquiry lead is claimed.
- [x] First child application reuses and updates the registration-created lead.
- [x] Second child application creates a separate lead under the same parent.
- [x] Pre-existing enquiry leads are claimed upon registration without overwriting child details.
- [x] Phone normalization handles formatted phone numbers seamlessly.
- [x] Zero Prisma schema or database DDL changes introduced.
