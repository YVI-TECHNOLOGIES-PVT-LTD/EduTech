# Phase 2 Blueprint: Finance & Payment Workflow UI Specification

**Document Reference:** `docs/parent-mobile-audit/phase-2/09-finance-payment-ui-specification.md`  
**Phase:** Phase 2 — Complete UI/UX Architecture & Redesign Blueprint  
**Status:** ARCHITECTURAL SPECIFICATION & BLUEPRINT (READ-ONLY DESIGN)

---

## 1. Executive Summary & Audit Context

The Phase 1.1 audit established two critical finance defects:

1. **`ISSUE-FIN-01` (CRITICAL):** Admission fee payment relies on a client timestamp reference (`MOB-${Date.now()}`) and an explicit backend simulation (`// Parent MVP Simulation` in `admission.payment.service.ts#L241`), recording fees as paid without real monetary exchange.
2. **`ISSUE-FIN-02` (HIGH):** The mobile application features zero screens, hooks, or queries for enrolled student tuition fees, despite the backend possessing a 939-line production Razorpay gateway (`apps/backend/src/routes/razorpay.routes.ts`).

This specification establishes the **production-grade financial architecture** for EduTrack Mobile. It covers the complete payment lifecycle, double-submit protection, cryptographic signature verification, Razorpay integration handoff, and verifiable PDF receipts.

---

## 2. Distinction: Admission Processing Fees vs. Enrolled Student Tuition Fees

The architecture strictly segregates the two payment streams:

| Dimension             | Admission Application Fee (Journey A)                   | Enrolled Student Tuition Fee (Journey B)                |
| --------------------- | ------------------------------------------------------- | ------------------------------------------------------- |
| **Payer Entity**      | Prospective Parent / Applicant                          | Enrolled Student Parent / Guardian                      |
| **Backend Target**    | `apps/backend/src/modules/admission-management`         | `apps/backend/src/modules/fees` & `razorpay.routes.ts`  |
| **Prisma Model**      | `model admission_payments`                              | `model fee_invoices`, `fee_payments`, `fee_allocations` |
| **Payment Frequency** | One-time processing fee                                 | Recurring term installments (Terms 1, 2, 3 + Bus + Lab) |
| **Order Creation**    | `POST /v1/admissions/applications/:id/create-fee-order` | `POST /api/create-order`                                |
| **Verification**      | `POST /v1/admissions/applications/:id/verify-fee-order` | `POST /api/verify-payment`                              |
| **Receipt Output**    | Admission Fee Receipt (Application proof)               | Official School Tuition Fee Tax Receipt                 |

---

## 3. End-to-End Payment State Machine

```
  [ 1. FEE REVIEW ] ──► Parent selects installment lines (Tuition, Bus)
          │
          ▼
  [ 2. CREATE ORDER ] ──► Mobile requests server: POST /api/create-order
          │               Server generates authoritative Razorpay order_id & lock
          ▼
  [ 3. GATEWAY HANDOFF ] ──► Launch native Razorpay Checkout SDK
          │
     ┌────┴───────────────────────────┬───────────────────────────┐
     ▼                                ▼                           ▼
[ 4A. USER CANCELLED ]     [ 4B. BANK FAILED ]        [ 4C. PAYMENT SUCCESS ]
• Revert button state       • Gateway error code       • SDK returns:
• Order remains pending     • Prompt retry or mode       - razorpay_payment_id
• Release transient lock      change                     - razorpay_order_id
                                                         - razorpay_signature
                                                                  │
                                                                  ▼
                                                      [ 5. SERVER VERIFY ]
                                                      POST /api/verify-payment
                                                      Server calculates HMAC-SHA256
                                                                  │
                                                ┌─────────────────┴─────────────────┐
                                                ▼                                   ▼
                                      [ 6A. SIGNATURE MATCH ]              [ 6B. SIGNATURE MISMATCH ]
                                      • Update ledger to 'PAID'            • Mark order 'FLAGGED'
                                      • Generate official receipt #        • Alert security audit
                                      • Invalidate fee queries             • Block receipt generation
                                      • Transition to SUCCESS              • Transition to FAILURE
```

---

## 4. Screen-by-Screen UI Specification

### 4.1 Screen 1: Fee Dashboard (`/(main)/finance`)

- **Total Outstanding Card:**
  - Large display font: `₹ 32,500` (Outstanding Balance).
  - Due date badge: `Due in 12 days • Nov 15, 2026`.
  - Academic Year chip: `Academic Year 2026-2027`.
  - Primary Action Button: `"Pay Outstanding Dues"` (`bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl`).
- **Installment Cards Accordion:**
  - **Term 1 (April - July):** `₹ 25,000` • Status: 🟢 `PAID` (Paid on Apr 10, Receipt #REC-2026-104).
  - **Term 2 (August - November):** `₹ 25,000` • Status: 🟡 `DUE` (Due Nov 15).
  - **Term 3 (December - March):** `₹ 25,000` • Status: ⚪ `UPCOMING` (Due Feb 15, 2027).
  - **Transport Fee (Q3):** `₹ 7,500` • Status: 🟡 `DUE` (Due Nov 15).
- **Recent Receipts Section:**
  - Horizontal list of the last 3 receipts with "View Receipt" CTA.

---

### 4.2 Screen 2: Annual Fee Structure (`/(main)/finance/structure`)

- **Header:** Breakdown of all fee heads assigned to the student's grade:
  - Tuition Fee: `₹ 75,000`
  - Computer / Laboratory Fee: `₹ 8,000`
  - Sports & Activity Fee: `₹ 5,000`
  - Library & Development Fund: `₹ 4,000`
  - Concessions / Scholarships: `- ₹ 10,000` (Sibling Discount)
  - **Total Annual Net Payable:** `₹ 82,000`
- **Installment Schedule Table:** Due dates, amounts, and late fee policies.

---

### 4.3 Screen 3: Payment Checkout Review (`/(main)/finance/checkout/review`)

- **Item Selection:** Checkboxes allowing parent to select which pending installment lines to settle.
- **Order Calculation Panel:**
  - Selected Subtotal: `₹ 32,500`
  - Gateway Convenience Fee (Razorpay): `₹ 0` (Absorbed by school or displayed transparently)
  - Applicable Late Fee / Penalties: `₹ 0`
  - **Total Authoritative Payable:** `₹ 32,500`
- **Payment Method Selector:**
  - `[ UPI (Google Pay, PhonePe, Paytm) ]`
  - `[ Debit / Credit Card (Visa, MasterCard, RuPay) ]`
  - `[ Net Banking (All Indian Banks) ]`
- **Security Trust Badge:** 🔒 _"256-bit Encrypted Payment via Razorpay Bank Gateway"_.
- **CTA Button:** `"Proceed to Pay ₹ 32,500"`.

---

### 4.4 Screen 4: Gateway Processing & SDK Handoff

- **Double-Submit Prevention:**
  - Once the user taps "Proceed to Pay", the button immediately enters loading state (`isPending = true`).
  - Double taps are rejected; hardware back button is temporarily disabled.
- **Backend Order Creation:** Client dispatches `POST /api/create-order` with `{ studentId, invoiceIds: ['INV-01', 'INV-02'] }`.
- **Razorpay SDK Launch:**
  ```typescript
  const options = {
    description: 'School Term Tuition Fee',
    image: 'https://edutrack.edu/assets/logo.png',
    currency: 'INR',
    key: razorpayConfig.key_id,
    amount: serverOrder.amount, // in paise
    name: 'EduTrack International School',
    order_id: serverOrder.order_id,
    prefill: {
      email: parentUser.email,
      contact: parentUser.phone,
      name: parentUser.fullName,
    },
    theme: { color: '#4338ca' },
  };
  RazorpayCheckout.open(options);
  ```

---

### 4.5 Screen 5: Post-Payment Outcome Screens (`/(main)/finance/checkout/status`)

#### Scenario A: Payment Verified (Success)

- **Visual Design:** Full-bleed celebratory surface with emerald animated checkmark.
- **Details:**
  - Headline: _"Payment Successful!"_
  - Subhead: _"Your transaction has been securely processed and recorded in the school ledger."_
  - Amount Paid: `₹ 32,500`
  - Receipt Number: `#REC-2026-9042`
  - Transaction ID: `pay_P19082Xz`
  - Date & Time: `02 Nov 2026, 03:15 PM`
- **Actions:**
  - Primary: `"View Official Receipt"` $\rightarrow$ `/(main)/finance/receipts/[id]`
  - Secondary: `"Back to Home"` $\rightarrow$ `/(main)/home`

#### Scenario B: Payment Failed

- **Visual Design:** Amber/Rose alert surface with failure illustration.
- **Details:**
  - Headline: _"Payment Could Not Be Completed"_
  - Reason: Reason code passed by gateway (e.g. _"Card declined by issuing bank"_ or _"UPI transaction timed out"_).
  - Clarification: _"No amount was debited from your account. If debited, it will be refunded within 3-5 business days."_
- **Actions:**
  - Primary: `"Try Again"` (Reopens checkout review)
  - Secondary: `"Choose Different Payment Method"`
  - Tertiary: `"Contact School Finance Helpdesk"`

#### Scenario C: Payment Pending / Bank Settlement Delayed

- **Visual Design:** Sky blue info card with pulsing hourglass.
- **Details:**
  - Headline: _"Payment Processing Underway"_
  - Subhead: _"We have received authorization from your bank. Confirmation will be posted once webhook settlement confirms within 15 minutes."_
- **Actions:**
  - Primary: `"Check Payment Status"` (Polls `GET /api/orders/:id/status`)
  - Secondary: `"Return to Dashboard"`

---

### 4.6 Screen 6: Official PDF Fee Receipt (`/(main)/finance/receipts/[id]`)

- **Header:** School legal name, affiliation #, tax ID, campus address.
- **Receipt Metadata:** Receipt No, Date of Issue, Academic Year, Term.
- **Student Details:** Student Full Name, Admission No, Grade & Section.
- **Itemized Fee Table:**
  ```
  FEE HEAD                 ORIGINAL DUE    PAID AMOUNT    BALANCE
  Term 2 Tuition Fee       ₹ 25,000        ₹ 25,000       ₹ 0
  Transport Fee Q3         ₹ 7,500         ₹ 7,500        ₹ 0
  ───────────────────────────────────────────────────────────────
  TOTAL SETTLED:                           ₹ 32,500
  Mode: UPI (pay_P19082Xz) • Bank Ref: 981203912
  ```
- **Digital Signatures:** Authorized Finance Officer signature image and institutional QR code for instant offline verification.
- **Actions:**
  - Button 1: `"Download PDF"` (Saves to device downloads).
  - Button 2: `"Share Receipt"` (Invokes native OS share sheet for WhatsApp/Email).

---

## 5. Security & Double-Payment Mitigation Rules

1. **Idempotency Header:** Every payment creation request sends an `Idempotency-Key: ${studentId}-${invoiceId}-${timestamp}` header.
2. **Authoritative Server Pricing:** The client **never** passes the payment amount to the gateway. The server looks up the invoice lines directly from PostgreSQL and constructs the Razorpay order with server-calculated amounts.
3. **Cryptographic Signature Verification:** No payment is marked `paid` until `crypto.createHmac('sha256', key_secret)` matches `razorpay_signature` in backend `POST /api/verify-payment`.
4. **Asynchronous Webhook Redundancy:** If the parent's mobile app crashes or loses internet during the transaction, the backend Razorpay Webhook (`POST /api/webhook/razorpay`) independently receives the `payment.captured` event and updates the database, guaranteeing no lost payments.
