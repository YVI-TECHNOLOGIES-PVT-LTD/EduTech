# EduTrack ERP — Parent Mobile App

# Phase 3 — Finance & Payment Implementation Report

## 1. Overview & Real Backend Integration

The Finance module (`apps/mobile_app/app/(main)/finance/index.tsx`) connects the mobile application to EduTrack's real backend fee services (`ParentFinanceService` in `apps/backend/src/modules/fees/`).

It delivers fee breakdowns, installment tracking, and an integrated Razorpay checkout workflow without any hardcoded financial figures.

---

## 2. Real Backend Endpoint Contract

| Endpoint                          | Method | Backend Service & Controller              | Description                                                                    |
| --------------------------------- | ------ | ----------------------------------------- | ------------------------------------------------------------------------------ |
| `/v1/fees/my`                     | `GET`  | `ParentFinanceService.getMyChildrenFees`  | Returns fee summaries for all wards of the authenticated parent.               |
| `/v1/fees/my/children/:studentId` | `GET`  | `ParentFinanceService.getChildFeeDetails` | Returns detailed components, dues, and payment history for a specific student. |
| `/razorpay/config`                | `GET`  | `razorpayRouter`                          | Retrieves public Razorpay `key_id` without exposing server secrets.            |
| `/create-order`                   | `POST` | `razorpayRouter.post('/create-order')`    | Initiates server-authoritative Razorpay payment order.                         |
| `/verify-payment`                 | `POST` | `razorpayRouter.post('/verify-payment')`  | Constant-time HMAC-SHA256 signature verification & ledger posting.             |
| `/v1/fees/receipts/:id`           | `GET`  | `FinanceController.getReceipt`            | Fetches digital transaction receipts.                                          |

---

## 3. Financial Dashboard Features

### A. Annual Fee Summary Card

- **Total Outstanding**: Prominently displayed in Indian Rupees (`₹`).
- **Status Badge**:
  - `Fully Cleared` (Green) when outstanding balance is 0.
  - `Overdue` (Red) when `overdue_amount > 0`.
  - `Dues Pending` (Amber) when dues are scheduled but not yet past due.
- **Ledger Counters**: Total Assessed, Total Paid, and Overdue Amount.

### B. Term Installments & Dues List

- Itemized installment cards per term (Term 1, Term 2, etc.).
- Outstanding installment amount and exact due date.
- Status badges: `Paid` (Emerald), `Due Soon` (Amber), `Overdue` (Rose).
- "Pay Now" action button that initiates the Razorpay checkout workflow.

### C. Annual Fee Breakdown

- Itemized category components: Tuition Fee, Laboratory Fee, Library Head, Sports & Activities.
- Individual component amounts and descriptive notes.

### D. Payment Transaction Ledger

- Historical payment log with transaction references, timestamps, payment methods (UPI, Card, Net Banking), and confirmation status.

---

## 4. Razorpay Checkout Flow

```
┌─────────────────────────────────┐
│ User Taps "Pay Installment"     │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ POST /create-order              │
│ Returns order_id & key_id       │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ Razorpay Checkout Modal Appears │
│ (Select UPI / Card / NetBank)   │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ POST /verify-payment            │
│ Server validates HMAC Signature │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ Ledger Updated, Receipt Emitted │
│ UI Refreshes & Shows Success    │
└─────────────────────────────────┘
```

The flow provides:

1. **Double-submit protection**: Disables action button and displays loading spinner during checkout.
2. **Server-authoritative payable amount**: Prevents client-side price tampering.
3. **Instant feedback**: Emits success toast and refreshes the student's fee ledger.
