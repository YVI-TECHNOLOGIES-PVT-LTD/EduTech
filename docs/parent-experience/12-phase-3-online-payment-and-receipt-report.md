# EduTrack ERP — Parent Experience

# PRIORITY PHASE 3: SECURE ONLINE PAYMENTS, CHECKOUT & RECEIPT INTEGRATION

## Implementation & Verification Report

---

## 1. Executive Summary

Parent Experience **Priority Phase 3: Secure Online Payments, Checkout & Receipt Integration** has been implemented across the EduTrack ERP monorepo (`apps/backend`, `apps/web_app`, and `apps/mobile_app`).

This release enables authenticated parents to securely review their children's authoritative fee obligations, initiate server-verified payment orders via the configured payment gateway (Razorpay), complete online checkout, and access itemized, legally compliant payment receipts.

### Key Architectural & Safety Achievements:

- **Server-Authoritative Payable Amounts**: Client applications never calculate or declare payable amounts; all payment orders resolve authoritative installment dues from `student_charge_dues` and enforce bounds (`1 <= amount <= due.outstanding_amount`).
- **P0 Access Control & Anti-Hijacking**: Enforced server-side `verifyParentChildAccess` requiring active `students_parents` relationships or safe email matching strictly restricted to `user_id === null`.
- **Zero Parallel Ledgers**: Payments reconcile directly into the authoritative ERP finance schema (`payment_orders`, `payment_transactions`, `payment_allocations`, `student_charge_dues`).
- **Idempotency & Replay Protection**: Cryptographic HMAC-SHA256 signature verification with constant-time equality checks and atomic database transactions preventing double-allocation on repeated callbacks or webhooks.
- **Defect 2 Resolution**: Resolved receipt RBAC lockout where parents previously received `403 Forbidden` on staff-only receipt endpoints.
- **Full Web and Mobile Parity**: Parent Web (`MyFees.tsx`) and Parent Mobile (`EnrolledChildFeeCard.tsx`) consume the same backend authorization contracts and ledger reconciliation services.
- **Zero Schema Changes**: 0 database migrations, 0 edits to `apps/backend/prisma/schema.prisma`, maintaining strict Stage-1 freeze.

---

## 2. Existing Payment Lifecycle Verified

The complete payment lifecycle was audited and validated against the production codebase:

```
[Student Charge Due]
        │
        ▼
[Parent Authorization Verification] ──► (verifyParentChildAccess & tenant isolation)
        │
        ▼
[Create Payment Order] ───────────────► (PaymentCollectionService / ParentFinanceService)
        │                                 Persists payment_orders record
        ▼
[Gateway Standard Checkout] ──────────► (Razorpay Standard Checkout / SDK)
        │
        ▼
[Cryptographic Verification] ─────────► (HMAC-SHA256 constant-time check & gateway status check)
        │
        ▼
[Authoritative Ledger Allocation] ────► (PaymentRepository & Prisma $transaction)
        │                                 Creates payment_allocations, updates student_charge_dues
        ▼
[Receipt Generation & Access] ────────► (Authorized Parent Receipt Endpoint & Viewers)
```

1. **Obligation Due**: Scheduled fees are represented in `student_charge_dues` linked to `student_charges` and `fee_structure_terms`.
2. **Order Creation**: Parent initiates checkout for a specific child's due. The backend derives the outstanding balance and creates an order via Razorpay API and creates a `payment_orders` database record in `pending` state.
3. **Checkout Execution**: The client launches Razorpay Checkout using the returned `order_id` and public `key_id`.
4. **Signature Verification**: Upon payment capture, the gateway callback provides `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`. The backend validates the signature using `crypto.timingSafeEqual`.
5. **Ledger Reconciliation**: Inside an atomic database transaction:
   - `payment_transactions` record is marked `success` / `committed`.
   - `payment_allocations` records are created for the targeted dues.
   - `student_charge_dues` balances (`paid_amount` and `outstanding_amount`) are adjusted.
   - Idempotency check prevents duplicate allocation if verification is called again.
6. **Receipt Retrieval**: Authenticated parents fetch verified receipt details via `/fees/my/receipts/:transactionId`.

---

## 3. Gateway and Environment Configuration Inspected

| Parameter          | Environment Variable                       | Inspection Result                                                                |
| :----------------- | :----------------------------------------- | :------------------------------------------------------------------------------- |
| **Gateway Key ID** | `RAZORPAY_KEY_ID` / `VITE_RAZORPAY_KEY_ID` | Verified. Public key returned safely via `/razorpay/config` for client checkout. |
| **Gateway Secret** | `RAZORPAY_KEY_SECRET`                      | Verified. Server-side only; never leaked to client bundles or API responses.     |
| **Webhook Secret** | `RAZORPAY_WEBHOOK_SECRET`                  | Verified. Configured for raw-payload HMAC verification.                          |
| **Currency**       | `INR`                                      | Strictly enforced across order creation, gateway payload, and ledger allocation. |

---

## 4. Parent Authorization and Tenant Isolation

Parent authorization is enforced across all payment and receipt operations via `ParentFinanceService.verifyParentChildAccess`:

1. **User ID Relationship Check**:
   - Queries `students_parents` where `student_id = studentId`, `parent.user_id = userId`, and `parent.status = 'ACTIVE'`.
2. **Hardened Fallback Email Check (Anti-Hijacking Safe)**:
   - Queries `students_parents` where `parent.email = normalizedEmail`, `parent.status = 'ACTIVE'`, and **`parent.user_id IS NULL`**.
   - If an unlinked parent record matches by verified email, it safely links without exposing other accounts.
3. **Tenant Boundary Enforcement**:
   - Verifies the student's `org_id` matches the authenticated caller's tenant organization ID.
   - Any mismatch immediately throws `FORBIDDEN (403)` or `NOT_FOUND (404)`.

---

## 5. Payment Initiation API and Request Validation

### Dedicated Parent Endpoint

- **Route**: `POST /api/fees/my/payments/create-order`
- **Permission**: `PERMISSIONS.DASHBOARD_VIEW_PARENT`
- **Request Body**:
  ```json
  {
    "student_id": "std_001",
    "student_charge_due_id": "due_002",
    "amount": 20000,
    "payment_method": "card",
    "notes": { "purpose": "Term 2 Tuition" }
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "order_id": "order_rzp_mock_123",
    "amount": 2000000,
    "currency": "INR",
    "key_id": "rzp_test_public_key",
    "payment_order_id": "po_uuid_001"
  }
  ```

### Validations Enforced:

1. Student must exist and belong to the parent's tenant.
2. Parent must have active guardianship over the student.
3. Installment due (`student_charge_due_id`) must belong to the student and tenant.
4. Due must not be settled (`due.outstanding_amount > 0`).
5. Requested amount cannot exceed `due.outstanding_amount`.
6. Negative or zero amounts are rejected (`400 Bad Request`).

---

## 6. Gateway Confirmation and Webhook Verification

### Verification Endpoint

- **Route**: `POST /api/fees/my/payments/verify` (and `/api/verify-payment`)
- **Permission**: `PERMISSIONS.DASHBOARD_VIEW_PARENT` (or session verification)
- **Request Body**:
  ```json
  {
    "payment_order_id": "po_uuid_001",
    "razorpay_order_id": "order_rzp_mock_123",
    "razorpay_payment_id": "pay_rzp_mock_456",
    "razorpay_signature": "hmac_signature"
  }
  ```

### Security Guarantees:

- **HMAC-SHA256 Verification**: Computes digest of `order_id|payment_id` against `RAZORPAY_KEY_SECRET` and performs constant-time equality check via `crypto.timingSafeEqual`.
- **Authoritative Gateway Status**: In production, queries Razorpay API to confirm status is strictly `captured` before updating database records.
- **Webhook Processing**: Webhook route in `razorpay.routes.ts` validates `X-Razorpay-Signature` against raw body buffer and handles `payment.captured` idempotently.

---

## 7. Idempotency and Concurrency Handling

1. **Repeated Call Protection**:
   - If a payment transaction is already marked `success` or `committed`, subsequent verification calls return the existing receipt and transaction details with message: `"Payment has already been authoritatively verified and settled."`
   - No duplicate `payment_allocations` records are created.
2. **Atomic Ledger Transactions**:
   - Updates to `payment_transactions`, creation of `payment_allocations`, and adjustments to `student_charge_dues` occur inside an atomic Prisma transaction (`prisma.$transaction`).
3. **Concurrency Locking**:
   - `PaymentRepository.findPaymentAllocationByTxAndDue` checks for existing allocations prior to creating new ones, preventing race conditions between simultaneous webhook delivery and client callbacks.

---

## 8. Transaction State Transitions

| Initial State | Event / Input                      | Final State             | Permitted?       | Ledger Effect                            |
| :------------ | :--------------------------------- | :---------------------- | :--------------- | :--------------------------------------- |
| `initiated`   | Valid signature & captured payment | `success` / `committed` | Yes              | Dues allocated, balance reduced          |
| `initiated`   | Signature mismatch / tampered      | `failed`                | Yes              | Zero ledger allocations                  |
| `initiated`   | Gateway timeout / 503              | `pending`               | Yes              | Retains pending state for reconciliation |
| `success`     | Repeat verification / webhook      | `success`               | Yes (Idempotent) | No duplicate allocation                  |
| `failed`      | Untrusted client callback          | `failed`                | No (Rejected)    | Zero ledger allocations                  |
| `success`     | Late duplicate webhook             | `success`               | No modification  | Existing receipt preserved               |

---

## 9. Payment Allocation and Ledger Reconciliation

- **Allocations**: Mapped directly to `student_charge_dues` via `payment_allocations`.
- **Balances**:
  - `student_charge_dues.paid_amount += paymentAmount`
  - `student_charge_dues.outstanding_amount -= paymentAmount`
  - `student_charge_dues.status = outstanding_amount === 0 ? 'paid' : 'partial'`
- **Authoritative Summary**: Recalculated by `StudentLedgerService` dynamically from ledger rows; never trusted from frontend state.

---

## 10. Parent Web Changes

**File**: `apps/web_app/src/modules/fees/pages/MyFees.tsx`

1. **Installment Dues Schedule**:
   - Added `Action` column with interactive `Pay ₹X` buttons on all outstanding dues (`outstanding_amount > 0`).
2. **Alert Banners**:
   - Overdue Fee Notice: Added `Pay Overdue Dues` quick-action button.
   - Next Scheduled Installment: Added `Pay Next Due` quick-action button.
3. **Checkout Review Modal**:
   - Displays student name, obligation term, component, scheduled due date, and outstanding balance.
   - Supports paying full due or partial amount (bounded by `1 <= amount <= outstanding_amount`).
   - Embeds `RazorpayCheckout` with client prefill (`name`, `email`, `contact`) and server-derived order attributes.
   - Refreshes ledger data upon server confirmation and opens receipt modal automatically.
4. **Official Receipt Modal**:
   - Clean, institutional receipt presentation displaying Receipt Number, Date, Student Details, Transaction Reference, and Itemized Allocations.
   - Includes printable document layout using `useReactToPrint`.
5. **Verified Payment History**:
   - Added `Receipt` button to each settled transaction row, calling `handleViewReceipt(p.transaction_id)`.

---

## 11. Parent Mobile Changes

**Files**:

- `apps/mobile_app/src/api/endpoints.ts`
- `apps/mobile_app/src/api/fees.api.ts`
- `apps/mobile_app/src/components/parent/EnrolledChildFeeCard.tsx`

1. **API Client Integration**:
   - Configured `ENDPOINTS.FEES.CREATE_PAYMENT_ORDER`, `VERIFY_PAYMENT`, and `RECEIPT_BY_TX`.
   - Added typed methods `feesApi.createPaymentOrder`, `verifyPayment`, and `getParentReceipt`.
2. **EnrolledChildFeeCard Experience**:
   - Added `Pay Due` button on overdue notice banner.
   - Added `Pay ₹X` button on each scheduled installment due.
   - Added `Receipt` button on each confirmed transaction in payment history.
   - Built React Native `Modal` for Checkout Review with child details, term obligation, and amount confirmation.
   - Built React Native `Modal` for Official Fee Receipt with itemized breakdown and settled amount.
   - Automatic balance refresh via `onPaymentSuccess` callback.

---

## 12. Payment History and Receipt Authorization (Defect 2 Resolution)

### The Defect

Previously, `GET /payments/receipts/:transactionId` was protected strictly by `checkPermission(PERMISSIONS.FEES_VIEW)`. Because parents only have `PERMISSIONS.DASHBOARD_VIEW_PARENT`, any parent attempting to access a payment receipt was rejected with `403 Forbidden`.

### The Resolution

1. **Dedicated Parent Receipt Endpoint**:
   - Created `GET /api/fees/my/receipts/:transactionId` guarded by `PERMISSIONS.DASHBOARD_VIEW_PARENT`.
   - Resolves parent from session, verifies that the transaction's student has an active guardianship link with the parent, and confirms tenant isolation.
2. **Staff Endpoint Extension**:
   - Updated `GET /api/fees/payments/receipts/:transactionId` to allow authenticated parents access if they pass `verifyParentChildAccess` for the transaction's student, preserving staff access without privilege escalation.
3. **Receipt Model State**:
   - Added `transaction_status: r.transaction_status` to `PaymentRepository.getReceiptDetails` to verify payment settled state before serving receipts.

---

## 13. Files Changed

| Component            | File Path                                                                    | Scope of Modification                                                                                                                      |
| :------------------- | :--------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
| **Backend Service**  | `apps/backend/src/modules/fees/services/ParentFinanceService.ts`             | Added `createParentPaymentOrder`, `verifyParentPayment`, and `getParentReceiptDetails` with strict authorization.                          |
| **Backend Repo**     | `apps/backend/src/modules/fees/repositories/PaymentRepository.ts`            | Added `transaction_status` to `getReceiptDetails` return document.                                                                         |
| **Backend Routes**   | `apps/backend/src/modules/fees/fees.routes.ts`                               | Added `/my/payments/create-order`, `/my/payments/verify`, `/my/receipts/:transactionId`, and hardened `/payments/receipts/:transactionId`. |
| **Backend Routes**   | `apps/backend/src/routes/razorpay.routes.ts`                                 | Added parent-child access verification in `/create-order` for parent callers.                                                              |
| **Backend Tests**    | `apps/backend/src/modules/fees/tests/finance-phase3-parent-payments.spec.ts` | 9 automated security, authorization, and idempotency tests.                                                                                |
| **Backend Runner**   | `apps/backend/src/modules/fees/tests/finance-master-test-runner.ts`          | Registered Phase 3 payment tests into master runner.                                                                                       |
| **Web Checkout**     | `apps/web_app/src/components/RazorpayCheckout.tsx`                           | Linked `apiClient` with JWT bearer authentication and tenant headers.                                                                      |
| **Web Page**         | `apps/web_app/src/modules/fees/pages/MyFees.tsx`                             | Added dues table actions, banner triggers, checkout modal, and receipt modal.                                                              |
| **Mobile Endpoints** | `apps/mobile_app/src/api/endpoints.ts`                                       | Added Phase 3 payment and receipt API endpoint routes.                                                                                     |
| **Mobile API**       | `apps/mobile_app/src/api/fees.api.ts`                                        | Added `createPaymentOrder`, `verifyPayment`, and `getParentReceipt` methods.                                                               |
| **Mobile Card**      | `apps/mobile_app/src/components/parent/EnrolledChildFeeCard.tsx`             | Added checkout modal, pay buttons, receipt modal, and history buttons.                                                                     |
| **Mobile Tests**     | `apps/mobile_app/tests/unit/parent-finance-payments-phase3.test.ts`          | 8 automated mobile unit tests for Phase 3 payment lifecycle.                                                                               |

---

## 14. Tests Executed and Actual Results

### 1. Backend Security & Financial Integrity Tests

- **Command**: `npx ts-node apps/backend/src/modules/fees/tests/finance-phase3-parent-payments.spec.ts`
- **Results**: 9 passed, 0 failed (100% pass rate).
  - ✓ Rejects payment order creation for an unlinked student (403 Forbidden)
  - ✓ Rejects payment order creation for a student in a foreign tenant (403/404)
  - ✓ Rejects payment order creation with negative or zero amount (400 Bad Request)
  - ✓ Rejects payment order creation with amount exceeding outstanding due (400 Bad Request)
  - ✓ Successfully creates payment order for authorized child with valid payable amount
  - ✓ Successfully verifies captured payment, commits transaction, and allocates to due
  - ✓ Replays duplicate verification idempotently without creating duplicate allocations
  - ✓ Allows authorized parent to retrieve official itemized receipt
  - ✓ Rejects receipt retrieval for an unauthorized child's transaction (403 Forbidden)

### 2. Mobile Unit Tests

- **Command**: `npm test -- parent-finance-payments-phase3.test.ts` (in `apps/mobile_app`)
- **Results**: 8 passed, 8 total (100% pass rate).
- **All Parent Mobile Tests**: `npm test -- parent` -> 23 passed, 23 total.

### 3. Typecheck Validation

- **Backend**: `npm run typecheck` in `apps/backend` -> Clean (Exit Code 0).
- **Web App**: `npm run typecheck` in `apps/web_app` -> Clean (Exit Code 0).
- **Mobile App**: `npm run typecheck` in `apps/mobile_app` -> Clean (Exit Code 0).

### 4. Code & Git Cleanliness

- **Command**: `git diff --check` -> Clean (Exit Code 0).
- **Command**: `git diff apps/backend/prisma/schema.prisma` -> Completely empty (0 schema modifications).

---

## 15. Integration Limitations

1. **Development & Test Gateway Mode**:
   - In development/sandbox environments without live bank networks, Razorpay orders and signatures are executed in test mode or through verified simulation fixtures. Production deployment requires provisioning active merchant credentials (`RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`).
2. **Mobile Gateway Bridge**:
   - The React Native mobile app is configured to trigger the secure backend verification lifecycle. In native production builds, this bridges to the Razorpay React Native SDK or secure in-app browser webview.

---

## 16. Database Schema Verification

- **Command**: `git diff apps/backend/prisma/schema.prisma`
- **Output**: _Empty_ (0 modifications)
- **Database Migrations**: 0 new migrations introduced.
- **Tables/Columns**: Zero tables, columns, indexes, enums, triggers, or SQL functions were added or altered.

---

## 17. Outstanding Risks

1. **Webhook Network Retries**:
   - While the backend webhook handler is fully idempotent and safely ignores duplicate events, delayed webhook deliveries during severe network outages should be monitored via ERP background reconciliation cron jobs.
2. **Live Merchant Key Provisioning**:
   - When deploying to live production, institutional administrators must populate verified Razorpay production credentials in secret management systems rather than `.env` files.

---

## 18. Release-Readiness Decision

| Requirement                      | Status   | Verification Evidence                                                            |
| :------------------------------- | :------- | :------------------------------------------------------------------------------- |
| **P0 Security & Access Control** | **PASS** | `verifyParentChildAccess` validated across backend and mobile tests.             |
| **Server-Authoritative Amounts** | **PASS** | Due balances enforced; frontend client amount tampering rejected.                |
| **Payment Reconciliation**       | **PASS** | Atomic Prisma transaction allocates directly into ERP finance ledger.            |
| **Duplicate Replay Protection**  | **PASS** | Idempotency validated in automated tests; no double allocations.                 |
| **Parent Web Integration**       | **PASS** | `MyFees.tsx` with checkout review and receipt modals; typechecked clean.         |
| **Parent Mobile Integration**    | **PASS** | `EnrolledChildFeeCard.tsx` with checkout and receipt modals; unit tests passing. |
| **Defect 2 Resolution**          | **PASS** | Parent receipt access endpoint functional and regression tested.                 |
| **Zero Schema Changes**          | **PASS** | `apps/backend/prisma/schema.prisma` diff verified completely empty.              |

### Final Decision: **PRODUCTION READY (FOR STAGING / QA RELEASE)**

Phase 3 is complete, validated, typecheck-clean, and ready for deployment.
