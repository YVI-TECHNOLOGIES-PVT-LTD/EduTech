# EduTrack ERP — Parent Experience Integration

# Document 02: Parent Mobile App Architecture & Screen Audit

**Document Version:** 1.0.0  
**Phase:** Phase 0 — Complete Repository Audit, System Discovery & Integration Blueprint  
**Date:** October 16, 2026  
**Governing Standard:** Schema Freeze & Prisma-First Domain Architecture ([AGENTS.md](file:///Users/sathish/Documents/GitHub/EduTech/.agents/AGENTS.md))  
**Auditor:** Antigravity AI Pair Programmer

---

## 1. Executive Summary

This audit inspects the **EduTrack Parent Mobile Application** ([apps/mobile_app](file:///Users/sathish/Documents/GitHub/EduTech/apps/mobile_app)), built with **React Native 0.74.5**, **Expo SDK ~51.0.28**, and **Expo Router ~3.5.24**. It establishes the mobile application lifecycle, security mechanisms, server query layers, screen navigation hierarchy, and functional parity against the web platform.

### Core Verified Findings:

1. **Production-Grade Native Foundation:**
   - The mobile application is clean, modular, and fully typed.
   - Comprehensive test coverage: **14 test suites, 181 unit tests passing (100%)** via Jest.
   - Zero compilation errors (`tsc --noEmit` exits with Code 0).
2. **Unified Pre-Admission & Enrolled Dashboard:**
   - [apps/mobile_app/app/(parent)/index.tsx](file:///Users/sathish/Documents/GitHub/EduTech/apps/mobile_app/app/%28parent%29/index.tsx) unifies both **Enrolled Student Fees** and **Active Admission Applications** into a single native dashboard with independent horizontal child switchers.
3. **Key Integration Gaps:**
   - **Enrolled Fee Drill-down Missing:** Clicking [EnrolledChildFeeCard.tsx](file:///Users/sathish/Documents/GitHub/EduTech/apps/mobile_app/src/components/parent/EnrolledChildFeeCard.tsx) does not open a detailed installment dues screen.
   - **Enrolled Fee Online Checkout Missing:** While admission fees can be paid in `applications/[id]/fees.tsx`, there is no checkout screen for enrolled academic term dues.
   - **Enrolled Fee Receipts Missing:** Receipts can only be inspected for pre-admission applications (`applications/[id]/receipt.tsx`).

---

## 2. Technical Stack & Architecture

| Layer              | Technology                        | File Reference                                                                                                                        | Verified Functionality                                 |
| :----------------- | :-------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------ | :----------------------------------------------------- |
| **Framework**      | Expo SDK `~51.0.28`               | [package.json](file:///Users/sathish/Documents/GitHub/EduTech/apps/mobile_app/package.json#L32)                                       | Managed workflow with custom native plugins.           |
| **Runtime**        | React Native `0.74.5`             | [package.json](file:///Users/sathish/Documents/GitHub/EduTech/apps/mobile_app/package.json#L49)                                       | Hermes JS engine enabled.                              |
| **Navigation**     | `expo-router` `~3.5.24`           | [apps/mobile_app/app/_layout.tsx](file:///Users/sathish/Documents/GitHub/EduTech/apps/mobile_app/app/_layout.tsx)                     | File-based typed native stack routing.                 |
| **Styling**        | NativeWind `^2.0.11` + Tailwind   | [tailwind.config.js](file:///Users/sathish/Documents/GitHub/EduTech/apps/mobile_app/tailwind.config.js)                               | Utility-first styling adapted for React Native styles. |
| **Query Engine**   | `@tanstack/react-query` `^5.28.9` | [useMyChildrenFees.ts](file:///Users/sathish/Documents/GitHub/EduTech/apps/mobile_app/src/features/parent/hooks/useMyChildrenFees.ts) | Query caching with 2-minute default stale time.        |
| **Auth Storage**   | `expo-secure-store` `~13.0.2`     | [secure-store.ts](file:///Users/sathish/Documents/GitHub/EduTech/apps/mobile_app/src/storage/secure-store.ts)                         | Encrypted storage for access and refresh JWT tokens.   |
| **State Store**    | `zustand` `^4.5.2`                | [auth.store.ts](file:///Users/sathish/Documents/GitHub/EduTech/apps/mobile_app/src/stores/auth.store.ts)                              | Session and user profile state management.             |
| **Network Client** | Axios `^1.6.8`                    | [client.ts](file:///Users/sathish/Documents/GitHub/EduTech/apps/mobile_app/src/api/client.ts)                                         | Auto token injection and refresh interceptor.          |

---

## 3. Mobile Route Structure & Screen Inventory

Configured in `apps/mobile_app/app/(parent)/`:

```
apps/mobile_app/app/(parent)/
├── _layout.tsx                     # Native Stack Layout (headerHidden: true)
├── index.tsx                       # Master Parent Dashboard (Fees + Admissions)
├── notifications.tsx               # In-App Notification Center
├── profile.tsx                     # Parent Profile & Session Settings
└── applications/
    ├── index.tsx                   # My Applications List
    ├── wizard.tsx                  # New Admission Application Multi-Step Form
    └── [id]/
        ├── index.tsx               # Application Overview & Milestone Progress
        ├── fees.tsx                # Admission Application Fee Payment
        ├── receipt.tsx             # Admission Payment Receipt
        ├── documents.tsx           # Document Upload & Status Tracker
        ├── assessment.tsx          # Entrance Assessment Scheduling & Scores
        ├── decision.tsx            # Offer Letter & Acceptance Workflow
        └── timeline.tsx            # Historical Application Event Log
```

### Detailed Screen Audit:

| Mobile Screen               | Path / Route                          | API Hook / Service                                                                                                                        | Classification         | Audit Observations                                                                                                                                                                                         |
| :-------------------------- | :------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------- | :--------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Parent Dashboard**        | `/(parent)`                           | `useMyChildrenFees`<br>`applicationsApi.listMine`<br>`notificationsApi.getUnreadCount`                                                    | **EXISTS AND WORKING** | Highly polished. Displays Active Session greeting banner, enrolled children fee summary cards with status pills, application status cards, unread notification counter badge, and unified pull-to-refresh. |
| **Enrolled Child Fee Card** | Embedded in `/(parent)`               | [EnrolledChildFeeCard.tsx](file:///Users/sathish/Documents/GitHub/EduTech/apps/mobile_app/src/components/parent/EnrolledChildFeeCard.tsx) | **EXISTS AND WORKING** | Shows initials avatar, student name, admission number, grade/section, status badge (`Fully Paid`, `Partially Paid`, `Overdue`, `Pending`), outstanding balance, paid, assessed, next due term & date.      |
| **Admission Applications**  | `/(parent)/applications`              | `applicationsApi.listMine`                                                                                                                | **EXISTS AND WORKING** | Searchable list of all submitted and draft applications for the parent.                                                                                                                                    |
| **Application Detail**      | `/(parent)/applications/[id]`         | `applicationsApi.getById`                                                                                                                 | **EXISTS AND WORKING** | Step-by-step progress cards linking to documents, assessments, and offer letters.                                                                                                                          |
| **Admission Fee Payment**   | `/(parent)/applications/[id]/fees`    | `feesApi.getFeeSummary`<br>`feesApi.recordPayment`                                                                                        | **EXISTS AND WORKING** | Payment screen for application/processing fees with simulated or Razorpay integration.                                                                                                                     |
| **Admission Fee Receipt**   | `/(parent)/applications/[id]/receipt` | `feesApi.getReceipt`                                                                                                                      | **EXISTS AND WORKING** | Itemized digital receipt for admission payments.                                                                                                                                                           |
| **Notification Center**     | `/(parent)/notifications`             | `notificationsApi.list`<br>`notificationsApi.markRead`                                                                                    | **EXISTS AND WORKING** | List of school notifications with unread indicators and timestamps.                                                                                                                                        |
| **Parent Profile**          | `/(parent)/profile`                   | `useAuthStore`                                                                                                                            | **EXISTS AND WORKING** | Parent name, email, phone, and secure sign-out action.                                                                                                                                                     |
| **Enrolled Fee Breakdown**  | N/A                                   | None                                                                                                                                      | **MISSING**            | No drill-down screen showing full installment terms, due dates, and individual fee components for enrolled students.                                                                                       |
| **Enrolled Dues Checkout**  | N/A                                   | None                                                                                                                                      | **MISSING**            | Online checkout for enrolled student academic term dues is missing.                                                                                                                                        |
| **Enrolled ERP Receipts**   | N/A                                   | None                                                                                                                                      | **MISSING**            | Screen or PDF viewer for enrolled student academic fee receipts is missing.                                                                                                                                |

---

## 4. Network Client, Token Refresh & Resilience

Implemented in [apps/mobile_app/src/api/client.ts](file:///Users/sathish/Documents/GitHub/EduTech/apps/mobile_app/src/api/client.ts):

1. **Base URL Resolution:** Configured via `EXPO_PUBLIC_API_URL` with automatic fallback to local backend (`http://localhost:3000/api` or Android loopback `http://10.0.2.2:3000/api`).
2. **Authorization Interceptor:**
   - Intercepts outgoing requests and attaches `Authorization: Bearer <accessToken>` retrieved from `SecureStorage`.
   - Injects `x-tenant-id` from active workspace settings.
3. **Automated Token Refresh (401 Interceptor):**
   - If an API returns `401 Unauthorized`, client pauses queued requests.
   - Dispatches `POST /v1/auth/refresh` with `SecureStorage.getRefreshToken()`.
   - Re-authenticates, saves the new access token to `SecureStore`, and transparently replays the failed request.
   - If refresh fails, triggers `SecureStorage.clearSession()` and redirects to `/(auth)/login`.
4. **Pull-to-Refresh & Caching:**
   - Both application queries and enrolled fee queries share `handleRefreshAll()`, allowing parents to perform a single pull-to-refresh gesture to synchronize all data.

---

## 5. Mobile Verification & Test Results

Executed via terminal command `pnpm --filter @edutrack/mobile run test`:

```
Test Suites: 14 passed, 14 total
Tests:       181 passed, 181 total
Snapshots:   0 total
Time:        1.937 s
Ran all test suites.
```

- Verified test suites include:
  - `tests/unit/api-client.test.ts`
  - `tests/unit/api-services.test.ts`
  - `tests/unit/auth-store.test.ts`
  - `tests/unit/secure-store.test.ts`
  - `tests/unit/dashboard-phase3.test.ts`
  - `tests/unit/admission-phase4.test.ts`
  - `tests/unit/admission-phase5.test.ts`
  - `tests/unit/notifications-phase6.test.ts`
  - `tests/unit/production-hardening-phase7.test.ts`
  - `tests/unit/release-phase8.test.ts`
  - `tests/unit/production-release-phase9.test.ts`
