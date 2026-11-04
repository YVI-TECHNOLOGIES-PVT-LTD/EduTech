# Phase 2 Blueprint: Phase 3 Implementation Readiness & Governance Gate

**Document Reference:** `docs/parent-mobile-audit/phase-2/18-phase-3-implementation-readiness.md`  
**Phase:** Phase 2 — Complete UI/UX Architecture & Redesign Blueprint  
**Status:** ARCHITECTURAL SPECIFICATION & BLUEPRINT (READ-ONLY DESIGN)

---

## 1. Executive Summary & Quality Gate Status

The completion of the Phase 2 UI/UX Architecture & Redesign Blueprint marks the transition from **Analysis & Design** to **Controlled Engineering Implementation (Phase 3)**.

### Definitive Readiness Verdict:

## **READY FOR PHASE 3 WITH CONDITIONS**

The project has established a comprehensive, 20-document design specification that answers all architectural questions, separates the admission and enrolled journeys, defines a 5-wave roadmap, and specifies a unified design system.

However, Phase 3 implementation cannot proceed blindly. It must be gated by **6 Binding Technical Preconditions** to avoid regressions in existing, verified admission workflows.

---

## 2. Binding Preconditions for Phase 3 Implementation

Before writing the first line of Phase 3 implementation code, the engineering team must satisfy the following preconditions:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   6 BINDING PHASE 3 PRECONDITIONS                      │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Canonical Navigation Shell Approved (Single Tab Navigator)          │
│ 2. Payment Gateway Architecture Decided (Native Razorpay SDK)          │
│ 3. Universal Child Model Contract Frozen (Composite Enrolled/App)      │
│ 4. Backend Provisioning of Missing Auth Endpoints (Forgot Password)    │
│ 5. Strict Regression Guard on Existing Working Admission Screens       │
│ 6. Baseline Git Checkpoint & Atomic Branching Strategy Established    │
└────────────────────────────────────────────────────────────────────────┘
```

### Precondition 1: Canonical Navigation Shell Approval

- The legacy dual-tab conflict (`(parent)` vs `(tabs)`) must be retired in favor of the single 5-tab `(main)` layout (`03-navigation-architecture.md`).
- Routing constants in `src/constants/routes.ts` must be updated atomically to prevent broken links during Wave 1.

### Precondition 2: Payment Gateway Integration Mandate

- The simulated payment defect (`ISSUE-FIN-01` in `admission.payment.service.ts` and `fees.tsx`) must be formally replaced with true gateway handoff.
- The team must configure Razorpay Sandbox API credentials (`RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`) in `.env` and verify server-side HMAC-SHA256 signature checking.

### Precondition 3: Universal Child Store Data Contract Frozen

- The composite model `UnifiedChild` (`07-child-switcher-specification.md`) must be adopted as the sole authoritative child state.
- Components must consume `useChildStore.getState().getSelectedChild()` rather than querying admission arrays locally.

### Precondition 4: Backend Support for Missing Authentication Routes

- The backend team must implement `POST /v1/auth/forgot-password` and `POST /v1/auth/reset-password` (`ISSUE-FUNC-01` remediation) so the mobile account recovery screens can complete an authentic transaction.

### Precondition 5: Regression Shield on Existing Working Modules

- 8 existing, functional admission screens (Wizard, Document Upload, Decision, Timeline, etc.) must remain untouched during early waves. They must be re-anchored into the new navigation structure without breaking existing Jest unit tests (179 passing tests baseline).

### Precondition 6: Atomic Git Branching & Staging Strategy

- Implement wave-by-wave in dedicated feature branches (`feature/wave-1-navigation`, `feature/wave-2-academics`, etc.).
- Never commit directly to `main` or merge without running `pnpm test`, `npx tsc --noEmit`, and `pnpm lint`.

---

## 3. Phase 3 Architecture Governance Rules

During Phase 3 execution, the following engineering rules must be enforced:

1. **Source of Truth Rule:** `apps/backend/prisma/schema.prisma` remains the absolute source of truth for all database models and field names. Zero unauthorized DDL or schema alterations are permitted during frontend implementation.
2. **Design Token Adherence:** No inline raw hex colors (e.g. `color: '#4f46e5'`) or arbitrary magic paddings. All styling must consume NativeWind semantic tokens defined in `12-design-system-specification.md`.
3. **Strict Data Honesty:** No component may render fabricated mockup numbers or test strings in production builds. If backend data is pending, use the designated skeleton loaders or informative empty states (`15-loading-empty-error-success-states.md`).
4. **Offline & Error Resilience:** All network queries must declare appropriate `staleTime`, `retry` limits, and error recovery banners.

---

## 4. Phase 3 Risk Mitigation Strategy

| Risk Scenario                          | Probability | Impact | Mitigation Strategy in Phase 3                                                                                          |
| -------------------------------------- | ----------- | ------ | ----------------------------------------------------------------------------------------------------------------------- |
| **Tab Bar Refactoring Breakage**       | High        | High   | Execute Wave 1 navigation refactoring in an isolated branch; maintain route alias redirects during transition.          |
| **Razorpay SDK Native Linking Issues** | Medium      | High   | Use Expo Config Plugins (`react-native-razorpay` plugin) to ensure seamless prebuilds on iOS and Android.               |
| **Backend SIS Endpoint Performance**   | Medium      | Medium | Implement aggressive React Query caching (`staleTime: 5 mins`) for attendance and timetables to minimize database load. |
| **Silent Refresh Race Conditions**     | Low         | High   | Use an Axios request queue that buffers concurrent 401 calls while the single refresh request is executing.             |

---

## 5. Summary & Sign-off

With the completion and archiving of the 20 Phase 2 documents in `docs/parent-mobile-audit/phase-2/`, the UI/UX architecture and redesign blueprint is formally established, validated, and ready for Phase 3 implementation.
