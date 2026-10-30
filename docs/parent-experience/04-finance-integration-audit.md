# EduTrack ERP — Parent Experience Integration

# Document 04: Finance Module Integration Audit (Phases 1–16)

**Document Version:** 1.0.0  
**Phase:** Phase 0 — Complete Repository Audit, System Discovery & Integration Blueprint  
**Date:** October 16, 2026  
**Governing Standard:** Schema Freeze & Prisma-First Domain Architecture ([AGENTS.md](file:///Users/sathish/Documents/GitHub/EduTech/.agents/AGENTS.md))  
**Auditor:** Antigravity AI Pair Programmer

---

## 1. Executive Summary

This audit evaluates the **ERP Finance Module** ([apps/backend/src/modules/fees](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/fees)) across its reported 16 phases. It establishes which capabilities are production-ready, which operate in simulation, how financial formulas are computed, and how parents access these workflows.

### Crucial Findings:

1. **Core Accounting Engine is Operational:**
   - 19 test files exist in `src/modules/fees/tests/`, managed by [finance-master-test-runner.ts](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/fees/tests/finance-master-test-runner.ts).
   - Strict transactional integrity enforced via Prisma `$transaction` and row-level locks (`SELECT ... FOR UPDATE`).
   - Decimal rounding adheres to standard 2-decimal financial math (`roundMoney`).
2. **Dedicated Parent Service Exists:**
   - [ParentFinanceService.ts](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/fees/services/ParentFinanceService.ts) aggregates multi-child fee summaries, installment dues schedules, component breakdowns, and transaction histories.
   - Mounted at `GET /fees/my` and `GET /fees/my/children/:studentId`.
3. **Receipt Authorization & Duplicate Route Defect:**
   - Official receipt download endpoint `GET /fees/payments/receipts/:transactionId` is guarded by `checkPermission(PERMISSIONS.FEES_VIEW)`, which rejects the `PARENT` role with **HTTP 403 Forbidden**.
   - `fees.routes.ts` contains duplicate `/my` route declarations (Line 1803 vs Line 2094).

---

## 2. Phase-by-Phase Audit Matrix (Phases 1–16)

| Phase        | Functional Title                | Backend Service & Repo                                            | Authoritative Prisma Models                                                   | Frontend Screen                                          | Test Specification                    | Parent Usability Status                           |
| :----------- | :------------------------------ | :---------------------------------------------------------------- | :---------------------------------------------------------------------------- | :------------------------------------------------------- | :------------------------------------ | :------------------------------------------------ |
| **Phase 1**  | Configuration & Fee Masters     | `SettingsService.ts`<br>`FeeStructureRepository.ts`               | `organizations`<br>`fee_components`                                           | `FeeStructureManagement.tsx`                             | `finance-configuration.spec.ts`       | **Internal Admin Only**                           |
| **Phase 2**  | Fee Structure Management        | `FeeStructureManagerService.ts`                                   | `fee_structures`<br>`fee_components`<br>`academic_year_grades`                | `FeeStructureManagement.tsx`                             | `finance-structures.spec.ts`          | **Indirect** (structures assigned to children)    |
| **Phase 3**  | Installment Plans & Terms       | `FeeStructureManagerService.ts`<br>`InstallmentPlanRepository.ts` | `installment_plans`<br>`installment_plan_terms`                               | `FeeStructureManagement.tsx`                             | `finance-structures.spec.ts`          | **Indirect** (defines child term schedule)        |
| **Phase 4**  | Student Fee Assignment          | `StudentLedgerService.ts`<br>`FeeAssignmentService.ts`            | `student_fee_assignments`<br>`student_charges`<br>`student_charge_dues`       | `StudentFeeAssignment.tsx`<br>`DemandManagement.tsx`     | `finance-parent-assignment.spec.ts`   | **Direct** (determines active fees)               |
| **Phase 5**  | Student Ledger Engine           | `StudentLedgerService.ts`                                         | `student_charges`<br>`student_charge_dues`<br>`payment_allocations`           | `AdminFeeLedger.tsx`                                     | `finance-ledger.spec.ts`              | **Direct via Parent Service**                     |
| **Phase 6**  | Scholarships & Concessions      | `ScholarshipConcessionService.ts`<br>`ScholarshipRepository.ts`   | `scholarship_concessions`<br>`approval_history`                               | `ScholarshipsConcessions.tsx`                            | `finance-scholarships.spec.ts`        | **Direct** (net deductions reflect in dues)       |
| **Phase 7**  | Payment Order & Gateway         | `RazorpayGatewayService.ts`                                       | `payment_orders`<br>`student_charge_dues`                                     | `RazorpayCheckoutDemo.tsx`<br>`ParentFeePaymentPage.tsx` | `finance-gateway.spec.ts`             | **Direct** (sandbox/simulation mode active)       |
| **Phase 8**  | Payment Collection & Allocation | `PaymentCollectionService.ts`<br>`PaymentRepository.ts`           | `payment_transactions`<br>`payment_allocations`<br>`student_charge_dues`      | `PaymentEntry.tsx`                                       | `finance-payments.spec.ts`            | **Direct** (records online settlements)           |
| **Phase 9**  | Webhooks & Idempotency          | `razorpay.routes.ts`<br>`PaymentRepository.ts`                    | `payment_webhook_events`<br>`payment_transactions`                            | N/A (Server-to-Server)                                   | `finance-gateway.spec.ts`             | **Automated** (protects against double charge)    |
| **Phase 10** | Receipt Generation              | `PaymentRepository.ts`<br>`ReceiptService.ts`                     | Derived from `payment_transactions`, `orders`, `students`                     | `ReceiptCenter.tsx`                                      | `finance-payments.spec.ts`            | **Blocked for Parents** (RBAC 403 on `/receipts`) |
| **Phase 11** | Parent Multi-Child Finance      | `ParentFinanceService.ts`                                         | `parents`<br>`student_parents`<br>`students`<br>`student_charges`             | `MyFees.tsx` (Web)<br>`index.tsx` (Mobile)               | `finance-parent-assignment.spec.ts`   | **Operational** (multi-child dues & summary)      |
| **Phase 12** | Receivables & Aging Buckets     | `ReceivablesService.ts`<br>`ReceivablesRepository.ts`             | `student_charge_dues` (SQL CTE)                                               | `ReceivablesCollections.tsx`                             | `finance-receivables.spec.ts`         | **Internal Staff Only**                           |
| **Phase 13** | Audit Trails & Adjustments      | `PaymentCollectionService.ts`<br>`PaymentRepository.ts`           | `payment_refunds`<br>`payment_adjustments`                                    | `FinanceAudit.tsx`                                       | `finance-audit.spec.ts`               | **Internal Staff Only**                           |
| **Phase 14** | Bank & Settlement Reconcile     | `ReconciliationService.ts`<br>`ReconciliationRepository.ts`       | `gateway_settlements`<br>`bank_statement_entries`<br>`reconciliation_matches` | `FinanceReconciliation.tsx`                              | `finance-reconciliation.spec.ts`      | **Internal Staff Only**                           |
| **Phase 15** | Accounting & Double-Entry       | `AccountingService.ts`                                            | In-memory preview & export (Tally XML, Zoho CSV)                              | `FinanceAccounting.tsx`                                  | `finance-accounting.spec.ts`          | **Internal Staff Only**                           |
| **Phase 16** | Operational Reliability         | Master Test Suite Runner                                          | Full Finance Domain                                                           | `FinanceOperations.tsx`                                  | `finance-phase16-reliability.spec.ts` | **Internal Health Suite**                         |

---

## 3. Authoritative Financial Calculations

All parent-facing metrics in [ParentFinanceService.ts](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/fees/services/ParentFinanceService.ts#L312-L370) derive strictly from relational joins in [schema.prisma](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/prisma/schema.prisma):

### 1. Total Assessed Fees

$$\text{Total Assessed} = \sum \text{student\_charges.amount} \quad \text{WHERE status = 'active'}$$

- Represents the gross fee obligation assigned to the student for the academic year.

### 2. Applied Concessions & Scholarships

- Concessions approved via `scholarship_concessions` (`status = 'approved'`) net-reduce the `amount_due` on scheduled installment dues:
  $$\text{Effective Due} = \text{Gross Term Due} - \text{Approved Concession}$$

### 3. Total Paid Amount Against Dues

$$\text{Total Paid} = \sum \text{payment\_allocations.allocated\_amount}$$
$$\text{WHERE payment\_transactions.status = 'success' AND student\_charge\_dues.status } \neq \text{'cancelled'}$$

- Allocations from failed, pending, or refunded transactions are strictly excluded.

### 4. Current Outstanding Balance

$$\text{Outstanding Balance} = \max(0, \text{Total Assessed} - \text{Total Paid})$$

### 5. Overdue Balance

$$\text{Overdue Balance} = \sum \text{due.outstanding\_amount}$$
$$\text{WHERE due.due\_date} < \text{CURRENT\_DATE AND due.status } \notin \{\text{'paid', 'waived', 'cancelled'}\}$$

### 6. Overall Financial Status Lifecycle

- `no_fees_assigned`: Student has no fee assignments or active charges.
- `fully_paid`: `outstanding_balance` $\le 0$ and `total_assessed` $> 0$.
- `overdue`: Student has one or more dues past their due date with outstanding balance.
- `partially_paid`: `total_paid` $> 0$ and `outstanding_balance` $> 0$.
- `pending`: Dues are scheduled in the future and unpaid.

---

## 4. Payment Propagation & Integrity Verification

### 4.1 State Distinctions in Backend:

1. **Successful Gateway Transactions:** Payment verified cryptographically with HMAC-SHA256 signature and gateway state check. Allocated inside a Prisma `$transaction` with row-level locks (`SELECT ... FOR UPDATE`) on `student_charge_dues`.
2. **Captured but Unallocated Payments:** If a payment is captured at the gateway but the corresponding due was cancelled/waived in the ERP, the transaction is marked `status: 'pending'`, flagged with `failureCode: 'DUE_INELIGIBLE'`, and routed for manual finance reconciliation without modifying student dues.
3. **Failed / Cancelled Payments:** Logged in `payment_transactions` with `status: 'failed'` and gateway error message. **Dues are never modified or reduced**.
4. **Refunds & Reversals:** Implemented via [payment_refunds](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/fees/services/PaymentCollectionService.ts#L450). Reverses `student_charge_dues.amount_paid` and resets due status to `partially_paid` or `pending`.

---

## 5. Identified Gaps & Defect Audit

### Defect 1: Duplicate `/my` Routes in `fees.routes.ts`

- **Line 1803:** `feesRouter.get('/my', async (req, res) => ...)` ➔ Uses `ParentFinanceService.getMyChildrenFees()` (Prisma-first, correct).
- **Line 2094:** `feesRouter.get('/my', checkPermission(PERMISSIONS.DASHBOARD_VIEW_PARENT), async (req, res) => ...)` ➔ Uses legacy Supabase client querying `student_parents.parent_user_id` (broken).
- **Impact:** Express matches the first route (Line 1803), but duplicate route declarations create maintenance hazards.

### Defect 2: Receipt Access RBAC Lockout for Parents

- **Endpoint:** `GET /fees/payments/receipts/:transactionId` ([fees.routes.ts:L1178](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/fees/fees.routes.ts#L1178)).
- **Constraint:** Guarded by `checkPermission(PERMISSIONS.FEES_VIEW)`.
- **Finding:** In [rbac.middleware.ts](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/rbac/rbac.middleware.ts#L126), `FEES_VIEW` is restricted to `ADMIN`, `FINANCE_OFFICER`, and `ACCOUNTANT`. Parents attempting to download receipts receive HTTP 403 Forbidden.

### Defect 3: Web & Mobile Checkout Absence for Enrolled Dues

- Web [MyFees.tsx](file:///Users/sathish/Documents/GitHub/EduTech/apps/web_app/src/modules/fees/pages/MyFees.tsx) and mobile [EnrolledChildFeeCard.tsx](file:///Users/sathish/Documents/GitHub/EduTech/apps/mobile_app/src/components/parent/EnrolledChildFeeCard.tsx) render outstanding dues but have no online checkout button connecting to `/create-order`.
