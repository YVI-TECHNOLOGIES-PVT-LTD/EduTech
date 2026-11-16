# EduTrack ERP — Database Forensic Audit

# Report 08: Application-to-Database Contract Audit

**Audit Date:** November 10, 2026  
**Auditor:** Senior ERP Software Architect & TypeScript/Prisma Specialist  
**Audit Scope:** Data Access Patterns, Repositories, Services, DTOs, Concurrency Control, Transaction Boundaries, and Prisma Client Customizations  
**Source Baseline:** `apps/backend/src/lib/prismaClient.ts`, `apps/backend/src/modules/`, `apps/backend/prisma/schema.prisma`

---

## 1. Executive Summary

This forensic audit evaluates the contract between the backend application and the underlying PostgreSQL database.

The audit uncovered a **critical architectural anomaly**: `apps/backend/src/lib/prismaClient.ts` wraps the standard PrismaClient instance in a JavaScript `Proxy` that **silently intercepts unmapped models and redirects reads and writes to an in-memory `Map` in Node.js RAM**.

Additionally:

- **558 `as any` casts** bypass TypeScript type-safety across controllers, services, and repositories.
- **Business identifiers (`admission_no`, `lead_number`) are generated with severe concurrency race conditions**, relying on `count(*) + 1` or unseeded `Math.random()`.
- **Multi-entity creation workflows frequently lack atomic `$transaction` boundaries**, allowing partially persisted states during failures.

---

## 2. The Prisma Proxy: Silent In-Memory Mock Fallback

### A. Architectural Flaw in `apps/backend/src/lib/prismaClient.ts`

In [`apps/backend/src/lib/prismaClient.ts:85-245`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/lib/prismaClient.ts#L85-L245), the application configures a custom singleton wrapper using JavaScript `Proxy`:

```typescript
const fallbackStores = new Map<string, Map<string, any>>();

function createSafeModelDelegate(modelName: string) {
  const store = getFallbackStore(modelName);
  return {
    findMany: async (args?: any) => {
      /* reads from memory Map */
    },
    create: async (args: any) => {
      const id = args?.data?.id || crypto.randomUUID();
      const rec = { id, ...args?.data };
      store.set(id, rec);
      return rec;
    },
    // update, delete, upsert all operate on Map in RAM!
  };
}
```

When any application service accesses a model that Prisma does not natively recognize on the generated client:

```typescript
if (!unmappedDelegates.has(prop)) {
  if (FINANCIAL_PERSISTENCE_MODELS.has(prop)) {
    unmappedDelegates.set(prop, createStrictFinancialDelegate(prop));
  } else {
    unmappedDelegates.set(prop, createSafeModelDelegate(prop));
  }
}
return unmappedDelegates.get(prop);
```

### B. Severe Risks & Impact:

1. **Silent Data Loss on Server Reboot:**
   - Any model not explicitly generated into `@prisma/client` will appear to persist data successfully during HTTP requests.
   - However, the data is stored in Node.js heap memory (`fallbackStores`). Upon pod restart, container deployment, or application crash, **all records stored in that model are permanently wiped**.
2. **Strict Financial Models Partial Safety:**
   - The authors recognized this risk for 8 financial models (`payment_orders`, `payment_transactions`, etc.) and created `createStrictFinancialDelegate` to throw an error on writes.
   - However, for all other non-financial models, silent RAM persistence remains active.

---

## 3. Business Identifier Concurrency & Race Conditions

ERP systems require unique, human-readable, sequentially predictable identifiers for legal and operational audits. The audit evaluated how these identifiers are generated across the codebase.

### A. Student Admission Number (`admission_no`)

- **Location:** [`apps/backend/src/modules/student-management/repositories/student.repository.ts:48`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/student-management/repositories/student.repository.ts#L48)
- **Implementation:**
  ```typescript
  const count = await prisma.students.count({ where: { org_id: dto.org_id } });
  const admission_no = dto.admission_no || `ADM-${year}-${String(count + 1).padStart(5, '0')}`;
  ```
- **Concurrency Defect:** This is a classic read-modify-write anti-pattern. If two admission officers enroll students simultaneously, both transactions execute `count(*)`, obtain the same count `N`, and attempt to insert `ADM-2026-000(N+1)`. One transaction succeeds while the other fails with a unique constraint error.
- **Root Cause:** The database lacks a native PostgreSQL sequence (`CREATE SEQUENCE`) for admission numbers.

### B. Lead Enquiry Number (`lead_number`)

- **Location:** [`apps/backend/src/modules/admission/repositories/crm/EnquiryRepository.ts:176-177`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/admission/repositories/crm/EnquiryRepository.ts#L176-L177)
- **Implementation:**
  ```typescript
  const shortId = Math.random().toString(36).substring(2, 8).toUpperCase();
  const leadNumber = `ENQ-2026-${shortId}`;
  ```
- **Defect:** Utilizes standard unseeded pseudo-random generation (`Math.random()`). It is neither sequential nor collision-proof under high enquiry volume.

### C. Application Number (`application_number`)

- **Location:** [`apps/backend/src/utils/application-number.util.ts:13-18`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/utils/application-number.util.ts#L13-L18)
- **Implementation:**
  ```typescript
  const uuid = crypto.randomUUID();
  const suffix = uuid.split('-')[0].toUpperCase();
  return `APP-${targetYear}-${suffix}`;
  ```
- **Evaluation:** Uses cryptographic randomness (`crypto.randomUUID()`) and handles Prisma P2002 conflicts via retry logic. While collision-resistant, it does not fulfill the sequential format specified in [`DATABASE_DESIGN.md:106`](file:///Users/sathish/Documents/GitHub/EduTech/apps/database/stage_1/DATABASE_DESIGN.md#L106) (`APP-2026-000031`).

---

## 4. Type Safety Circumvention (558 `as any` Casts)

A scan of `apps/backend/src/modules/` revealed **558 occurrences of `as any`**, heavily concentrated in data-access boundaries:

- `fees.routes.ts`: **167 occurrences**
- `communication.controller.ts`: **23 occurrences**
- `lead.controller.ts`: **22 occurrences**
- `admission-document.controller.ts`: **20 occurrences**
- `staff.controller.ts`: **19 occurrences**
- `admission.controller.ts`: **18 occurrences**
- `EnquiryRepository.ts`: **15 occurrences**

### Root Causes:

1. **Schema Mismatches:** Developers cast payloads to `any` to write fields that existed in PostgreSQL but were temporarily missing from the committed Prisma schema (such as `nationality`, `previous_school_name`).
2. **Enum Value Divergence:** Casting `priority: 'medium' as any` because TypeScript definitions had `'warm'` while the database was altered to `'medium'`.
3. **Complex Joins & DTO Transformations:** Bypassing strict Prisma return types when mapping relational graphs.

---

## 5. Transaction Boundary Analysis

| Workflow                     | Operations                                                        |                           Uses `$transaction`?                           | Failure Consequence                                                                    |
| :--------------------------- | :---------------------------------------------------------------- | :----------------------------------------------------------------------: | :------------------------------------------------------------------------------------- |
| **Public Lead Submission**   | Create Lead + Create Query Type Mapping                           |                 **NO** (`EnquiryRepository.ts:246-323`)                  | Lead row created; if mapping fails, error is caught and lead is left without category. |
| **Parent Self-Registration** | Create User + Create Parent Profile + Claim Lead                  |                     **Partial** (`auth.service.ts`)                      | User created; if profile fails, orphaned user exists without parent profile.           |
| **Application Submission**   | Create Application + Update Lead Stage                            |                    **YES** (`ApplicationService.ts`)                     | Atomic. Application rolls back if lead status update fails.                            |
| **Student Enrollment**       | Create Student + Create Enrollment + Assign Roll Number           |                      **YES** (`student.service.ts`)                      | Atomic.                                                                                |
| **Payment Gateway Webhook**  | Verify Signature + Lock Dues + Record Transaction + Allocate Dues | **YES** with `pg_advisory_xact_lock` (`PaymentCollectionService.ts:807`) | **EXEMPLARY**: Robust concurrency lock prevents double-allocation.                     |

---

## 6. Application Contract Findings

### FIND-APP-01: Silent In-Memory Mock Fallback in Production Prisma Client

- **Severity:** CRITICAL
- **Location:** [`apps/backend/src/lib/prismaClient.ts:85-245`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/lib/prismaClient.ts#L85-L245)
- **Evidence:** Proxy intercepts any unmapped model access and routes operations to `fallbackStores` in RAM.
- **Expected Behavior:** An unmapped Prisma delegate must throw a hard runtime exception to prevent data corruption.
- **Actual Behavior:** Records are silently stored in Node.js RAM and permanently lost on pod restart.
- **Business Impact:** High probability of silent data loss.
- **Recommendation:** Refactor proxy to fail closed (`throw new Error(...)`) for ALL models, not just financial ones.

### FIND-APP-02: Concurrency Race Condition in `admission_no` Generation

- **Severity:** MEDIUM
- **Location:** [`apps/backend/src/modules/student-management/repositories/student.repository.ts:48`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/student-management/repositories/student.repository.ts#L48)
- **Evidence:** `count(*) + 1` pattern without transaction lock or database sequence.
- **Expected Behavior:** Atomic sequence-backed identifier generation.
- **Actual Behavior:** Concurrent student creations collide on duplicate `admission_no`.
- **Recommendation:** Implement PostgreSQL sequence or advisory lock during enrollment.
