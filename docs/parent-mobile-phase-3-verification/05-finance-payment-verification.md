# EduTrack ERP — Parent Mobile App

# Phase 3 Verification Report: 05 — Finance & Razorpay Payment Verification

## 1. Executive Summary

This report provides an engineering audit of the Finance and Payment workflows across `apps/mobile_app` and `apps/backend`. It evaluates `ParentFinanceService`, `fees.routes.ts`, `razorpay.routes.ts`, and the mobile checkout implementation in `apps/mobile_app/app/(main)/finance/index.tsx`.

---

## 2. Backend Financial Integration Verification

| Endpoint                          | Method | Backend Service & Controller                                  | Status                                  | Verification Findings                                                                                                               |
| --------------------------------- | ------ | ------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/v1/fees/my`                     | `GET`  | `fees.routes.ts` -> `ParentFinanceService.getMyChildrenFees`  | **VERIFIED — REAL BACKEND INTEGRATION** | Returns fee summary for all wards of the authenticated parent from `student_parents`, `students`, and `student_charge_dues`.        |
| `/v1/fees/my/children/:studentId` | `GET`  | `fees.routes.ts` -> `ParentFinanceService.getChildFeeDetails` | **VERIFIED — REAL BACKEND INTEGRATION** | Protected by `ParentFinanceService.verifyParentChildAccess`. Returns components, installment dues, and payment transaction history. |
| `/razorpay/config`                | `GET`  | `razorpay.routes.ts`                                          | **VERIFIED — REAL BACKEND INTEGRATION** | Safely exposes `key_id` without exposing `keySecret`.                                                                               |
| `/create-order`                   | `POST` | `razorpay.routes.ts`                                          | **VERIFIED — REAL BACKEND INTEGRATION** | Server creates authoritative order via Razorpay SDK with currency, amount, and ledger tracking.                                     |
| `/verify-payment`                 | `POST` | `razorpay.routes.ts`                                          | **VERIFIED — REAL BACKEND INTEGRATION** | Server executes constant-time HMAC-SHA256 signature verification (`crypto.timingSafeEqual`) against `keySecret`.                    |
| `/v1/fees/receipts/:id`           | `GET`  | `fees.routes.ts` -> `FinanceController.getReceipt`            | **VERIFIED — REAL BACKEND INTEGRATION** | Emits receipt details from `payment_transactions`.                                                                                  |

---

## 3. Server-Side Security & Gateway Guarantees

Inspection of `apps/backend/src/routes/razorpay.routes.ts` confirms:

1. **Server-Authoritative Payable Amounts**: `POST /create-order` queries `student_charge_dues` directly using `targetDueId`. The server resolves the exact amount due from the database rather than trusting client-provided amounts.
2. **Cryptographic HMAC-SHA256 Verification**: `POST /verify-payment` calculates `crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex')` and validates using `crypto.timingSafeEqual`.
3. **Idempotency & Replay Protection**: `PaymentRepository` checks existing transaction statuses before updating, preventing double-crediting on duplicate webhook/client callbacks.
4. **Signature Mismatch Logging**: If verification fails, the transaction is marked as `'failed'` with failure code `'SIGNATURE_MISMATCH'`.

---

## 4. Mobile Client Checkout Audit & Discrepancies

### Critical Finding: Simulated Payment Callbacks in Mobile App

Location: `apps/mobile_app/app/(main)/finance/index.tsx` (lines 59–84):

```typescript
const handlePayNow = async () => {
  if (!selectedDue || !enrolledStudentId) return;

  // 1. Create order
  const order = await initiatePayment(
    enrolledStudentId,
    selectedDue.due_id,
    selectedDue.outstanding_amount,
  );

  if (order) {
    // 2. Complete payment with verification
    const success = await confirmPayment({
      razorpay_order_id: order.order_id || `order_${Date.now()}`,
      razorpay_payment_id: `pay_${Date.now()}`, // <--- FAKE CLIENT ID
      razorpay_signature: `sig_${Date.now()}`, // <--- FAKE CLIENT SIGNATURE
      studentChargeDueId: selectedDue.due_id,
      dueId: selectedDue.due_id,
    });

    if (success) {
      setCheckoutModalVisible(false);
      setSelectedDue(null);
    }
  }
};
```

### Audit Findings:

1. **Absence of Native Razorpay SDK**: `react-native-razorpay` is **not installed** in `apps/mobile_app/package.json`.
2. **Fabricated Signature**: When the user taps "Pay Securely" in the mobile modal, the app does not launch a real Razorpay payment sheet. Instead, it generates a synthetic payment ID (`pay_${Date.now()}`) and synthetic signature (`sig_${Date.now()}`) and sends them to `/verify-payment`.
3. **Production Consequence**: In an environment with real Razorpay credentials configured, this synthetic payload will **always fail** server verification with `SIGNATURE_MISMATCH` (HTTP 400/500).
4. **UI Modal as Simulation**: The "Razorpay Checkout" modal in `finance/index.tsx` is an in-app simulation form rather than an authentic payment gateway presentation.

---

## 5. Summary Verdict

| Finance Capability                                 | Verdict                                 | Notes                                                                            |
| -------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------- |
| Parent Dues Summary (`/v1/fees/my`)                | **VERIFIED — REAL BACKEND INTEGRATION** | Authoritative multi-child summary via `ParentFinanceService`                     |
| Student Fee Statement (`/v1/fees/my/children/:id`) | **VERIFIED — REAL BACKEND INTEGRATION** | Relationship-checked dues, components, and ledger history                        |
| Server Order Creation (`/create-order`)            | **VERIFIED — REAL BACKEND INTEGRATION** | Server-authoritative payable amounts via Razorpay SDK                            |
| Server Signature Verification (`/verify-payment`)  | **VERIFIED — REAL BACKEND INTEGRATION** | Constant-time HMAC-SHA256 verification implemented on backend                    |
| Mobile Checkout Flow                               | **PARTIALLY INTEGRATED**                | Real order creation, but client payment completion is simulated                  |
| Mobile Native Gateway SDK                          | **BLOCKED**                             | `react-native-razorpay` not installed; requires native library or webview bridge |
