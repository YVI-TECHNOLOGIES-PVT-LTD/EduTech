# EduTrack — Fee Payment UI Refactor Report

## Reference-Based UI Upgrade + Existing MVP Contract Preservation

**Execution Date:** 18 August 2026  
**Status:** **100% COMPLETE & VERIFIED**  
**Compliance:** Strict Safe Mode • 100% Frozen Database Schema • Backend Authoritative • No Sensitive Credential Collection

---

## 1. Executive Summary

The **Fee Payment Step** ([ParentFeePaymentStep.tsx](file:///c:/Users/DELL/Desktop/EduTech/apps/web_app/src/modules/admission/pages/parent/ParentFeePaymentStep.tsx)) in the EduTrack Admission Application has been refactored into a modern, institutional educational-ERP financial experience inspired by the visual concepts of [payment_methods_ui.html](file:///c:/Users/DELL/Downloads/payment_methods_ui.html).

The upgrade strictly respects the **Frozen PostgreSQL Database** and existing **Fee Management MVP Architecture**:

1. **Dynamic Backend Authority**: All fee numbers (`application_fee`, `processing_fee`, `total_fee`) are computed exclusively by backend services against `admission_configurations`.
2. **Single Payment Model**: Preserves the `UNIQUE(application_id)` constraint on `admission_fee_payments`.
3. **Transparent MVP Scope**: Clearly presents payments as **MVP Simulation Mode** without inventing fake gateway SDKs, fake accounts, fake QR codes, or collecting sensitive card numbers / CVVs.
4. **Institutional Cash Invariant**: Parents selecting **Cash Counter** cannot mark the fee as self-paid; they receive an official counter reference code and step-by-step instructions for front-desk staff confirmation.

---

## 2. Reference UI Elements Adopted

| Reference Concept in `payment_methods_ui.html` | EduTrack Implementation                                                                                                       | Benefit                                                                                            |
| :--------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------- |
| **Amount Hierarchy & Header**                  | Large bold INR display (`₹X,XXX.XX`) with itemized breakdown (`application_fee` + `processing_fee`).                          | Clear financial transparency for parents before choosing a payment method.                         |
| **4-Column Method Selector Grid**              | 4-tab responsive button selector (`UPI`, `Card`, `Bank Transfer`, `Cash`) with active border, ring highlight, and sub-labels. | Intuitive, 1-click method switching with keyboard navigation support.                              |
| **UPI App Selection Grid**                     | PhonePe (`P`), Google Pay (`G`), Paytm (`P`), and Other VPA brand badges with VPA preview input.                              | Modern Indian payment UX familiarity without claiming fake instant bank debits.                    |
| **Card Network Indicators**                    | Visual badges for `VISA`, `Mastercard`, `RuPay`, and `AMEX`.                                                                  | Clear institutional communication of supported card networks without collecting card numbers/CVVs. |
| **Counter Reference & Copy Action**            | Prominent reference badge with 1-click clipboard copy (`navigator.clipboard.writeText`).                                      | Smooth parent handoff at the school cashier desk.                                                  |
| **Detailed Status Progression**                | Dedicated views for `PAID` (with verified receipt card), `WAIVED`, `FAILED`, `REFUNDED`, and `PENDING`.                       | Survives page refresh and back/forward browser navigation without stale states.                    |

---

## 3. EduTrack-Specific Improvements

1. **Candidate & Application Context Strip**:
   - Displays Candidate Full Name, Formatted Application Reference (`APP-XXXXXXXX`), Grade Applied For, and Currency (`INR (₹)`).
2. **Cash Settlement Safety**:
   - Prohibits parent self-marking of cash payments; instead offers "Select Cash & Continue to Review" which saves the draft mode and moves to the review step while keeping payment status `pending` until staff reconciliation.
3. **Optional Bank UTR Tracking**:
   - If the parent remitted funds via manual NEFT/RTGS, allows optional entry of their UTR code into `transaction_reference` for backend audit.
4. **Double-Submit & Concurrency Protection**:
   - Dynamic button disablement, `Loader2` spinning indicators, and idempotent retry safety.

---

## 4. Files Changed

| File                                                                                                                                       | Type     | Change Description                                                                                       | Verification                                    |
| :----------------------------------------------------------------------------------------------------------------------------------------- | :------- | :------------------------------------------------------------------------------------------------------- | :---------------------------------------------- |
| [ParentFeePaymentStep.tsx](file:///c:/Users/DELL/Desktop/EduTech/apps/web_app/src/modules/admission/pages/parent/ParentFeePaymentStep.tsx) | `MODIFY` | Refactored UI into 4-method selector, method-specific panels, candidate summary strip, and status views. | TypeScript compilation clean, browser verified. |
| [ApplicationWizardPage.tsx](file:///c:/Users/DELL/Desktop/EduTech/apps/web_app/src/modules/admission/pages/ApplicationWizardPage.tsx)      | `MODIFY` | Passed live candidate context (`orgId`, `academicYearId`, `formData`) into Step 6.                       | Step navigation verified.                       |

---

## 5. API Contracts Used

```text
GET /v1/applications/:id/fee
  └── Response: { application_fee: Decimal, processing_fee: Decimal, total_fee: Decimal, currency: "INR", payment_status: "pending" | "paid" | ... }

GET /v1/applications/fee-config?org_id=:orgId&academic_year_id=:academicYearId
  └── Response: { application_fee: Decimal, processing_fee: Decimal, total_fee: Decimal, currency: "INR" }

POST /v1/applications/:id/payment
  └── Request Body: { payment_mode: "upi" | "card" | "bank_transfer" | "cash", payment_status?: "paid", transaction_reference?: string }
  └── Response: { payment_id: UUID, payment_status: "paid", amount: Decimal, transaction_reference: string, payment_mode: string, payment_date: ISOString }

GET /v1/applications/:id/payment
  └── Response: { payment_id: UUID, application_id: UUID, amount: Decimal, payment_status: string, ... }
```

---

## 6. Payment MVP Behavior

```
                             [ Parent UI Step 6 ]
                                      │
                   ┌──────────────────┴──────────────────┐
                   ▼                                     ▼
        [ Digital Simulation ]                   [ Cash Counter ]
      (UPI / Card / Bank Transfer)                       │
                   │                             Shows Counter Code &
          Clicks "Simulate..."                   Front Desk Instructions
                   │                                     │
                   ▼                             "Select Cash & Proceed"
      POST /v1/applications/:id/payment                  │
                   │                           Saves mode='cash' in draft
         Server Authoritative Calculation                │
                   │                          Status stays PENDING until
                   ▼                            Staff Front-Desk Settlement
      Payment Recorded as PAID
                   │
                   ▼
     Renders Confirmed Settlement Card
      (Amount, TXN Ref, Mode, Date)
```

---

## 7. Security & Tamper-Resistance Validation

1. **No Client-Side Price Calculations**:
   - The frontend never submits or calculates the payable amount. Backend calculates `application_fee + processing_fee` from `admission_configurations`.
2. **No Sensitive Financial Credentials**:
   - No card numbers, CVVs, expiry dates, bank passwords, or UPI PINs are ever requested or stored.
3. **Cross-Tenant & Cross-Parent Isolation**:
   - Backend enforces `parents.user_id = auth_user.user_id` and `application.org_id`. Unauthorized access returns `404 Not Found`.

---

## 8. Test Matrix Execution Results

### 1. Fee Management E2E Test Suite (12/12 Passed)

```text
================================================================
FINAL MATRIX RESULTS SUMMARY
================================================================
TOTAL TESTS: 12 | PASSED: 12 | FAILED: 0
================================================================
✅ [TEST 1] Authoritative Fee Calculation for Own Application: PASS
✅ [TEST 2] Pre-Application Fee Configuration Retrieval: PASS
✅ [TEST 3] Cross-Parent Fee Access Rejection (404): PASS
✅ [TEST 4] Cross-Organization Fee Isolation (404): PASS
✅ [TEST 5] Parent MVP Payment Simulation & Settlement: PASS
✅ [TEST 6] Amount Tampering Prevention (Client Amount Overridden): PASS
✅ [TEST 7] Status Tampering Prevention (Parent Cannot Waive Own Fee): PASS
✅ [TEST 8] Idempotent Repeat Payment (Single Row, No Downgrade): PASS
✅ [TEST 9] Staff Offline Payment Recording (Cash & Remarks): PASS
✅ [TEST 10] Concurrency Safety (Parallel Requests -> 1 Row): PASS
✅ [TEST 11] Database Persistence & Field Integrity: PASS
✅ [TEST 12] Cascade Deletion Integrity (ON DELETE CASCADE): PASS
```

### 2. Organization-Scoped Document Isolation Suite (10/10 Passed)

```text
========================================================================
   ORGANIZATION ISOLATION SUMMARY: 10 PASSED, 0 FAILED (TOTAL: 10)
========================================================================
```

---

## 9. Database Freeze Verification

- **Prisma Schema Diff**: Verified `git diff -- apps/backend/prisma/schema.prisma` contains zero unauthorized schema edits.
- **SQL / Migrations**: No new migration files or destructive SQL scripts created.
- **PostgreSQL Invariant**: `UNIQUE(application_id)` on `admission_fee_payments` verified intact.

---

## 10. Future Payment Gateway Integration Boundary

When real payment gateway integration (e.g. Razorpay / Stripe) is scheduled:

1. **Frontend**: Replace `handleSimulateSettlement()` with the Razorpay/Stripe Checkout SDK handler.
2. **Backend**: In `AdmissionPaymentService.recordPayment()`, verify the gateway webhook signature / payment order ID before persisting `admission_fee_payments`.
3. **Zero Database Changes Needed**: The existing `admission_fee_payments` model with `amount`, `payment_mode`, `transaction_reference`, `card_name`, `card_last_four`, and `remarks` already accommodates full gateway settlement payloads.

---

## 11. Final Verdict

The **Fee Payment UI Refactor** is **100% COMPLETE, VERIFIED, AND PRODUCTION-READY FOR MVP TESTING**.
