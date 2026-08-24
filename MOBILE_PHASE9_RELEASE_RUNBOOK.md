# EduTrack ERP Mobile V1 — Phase 9 Release Runbook & Rollback Plan

**Date:** August 22, 2026  
**Target Release:** Version 1.0.0 (Build 1)

---

## 1. Pre-Release Stage

### A. Pre-Flight Quality Gate Checklist

- [x] Run full automated test suite: `npx jest` (All 13+ test suites passing).
- [x] Run Mobile TypeScript check: `npx tsc --noEmit` (0 errors).
- [x] Run Backend TypeScript check: `npx tsc --noEmit` (0 errors).
- [x] Run Web TypeScript check: `npx tsc --noEmit` (0 errors).
- [x] Verify database freeze (zero new migrations or schema edits).
- [x] Verify legacy endpoint scan (zero deprecated endpoint calls).

### B. Production Build Generation

```bash
# 1. Navigate to mobile directory
cd apps/mobile_app

# 2. Build production Android App Bundle (AAB)
npx eas-cli build --platform android --profile production

# 3. Build production iOS Archive (IPA)
npx eas-cli build --platform ios --profile production
```

### C. Staging Smoke Test Protocol

1. **Auth Smoke Test:** Register new parent $\rightarrow$ enter OTP $\rightarrow$ log in $\rightarrow$ verify session persists on relaunch $\rightarrow$ log out.
2. **Admission Wizard Smoke Test:** Complete 8-step wizard $\rightarrow$ verify draft auto-save $\rightarrow$ attach documents $\rightarrow$ submit.
3. **Document Smoke Test:** View uploaded documents $\rightarrow$ open signed URL viewer $\rightarrow$ verify verification badges.
4. **Payment Smoke Test:** View fee statement $\rightarrow$ choose payment method $\rightarrow$ record payment $\rightarrow$ view digital receipt.
5. **Real-Time Notification Smoke Test:** Trigger backend status update $\rightarrow$ verify WebSocket delivery without app restart $\rightarrow$ tap notification to deep-link to target view.

---

## 2. Release & Store Submission Stage

### A. Google Play Console Submission

1. Upload generated production `.aab` file to **Internal Testing** track.
2. Verify automated Google Play pre-launch report (crashes, ANRs, display issues).
3. Promote to **Production** track with staged rollout percentage:
   - Day 1: 10%
   - Day 2: 25%
   - Day 3: 50%
   - Day 4: 100%

### B. Apple App Store Connect Submission

1. Upload production build via Transporter / EAS submit.
2. Complete TestFlight internal team testing.
3. Submit build for App Store Review.
4. Enable **Phased Release for Automatic Updates** (7-day gradual rollout).

---

## 3. Post-Release Monitoring Stage

Monitor production metrics over the first 72 hours:

| Telemetry / Metric          | Normal Threshold | Critical Alert Threshold | Action                                                 |
| :-------------------------- | :--------------- | :----------------------- | :----------------------------------------------------- |
| **Crash-Free Sessions**     | $\ge 99.5\%$     | $< 99.0\%$               | Trigger immediate triage; prepare hotfix.              |
| **HTTP 5xx Error Rate**     | $< 0.1\%$        | $\ge 1.0\%$              | Check backend gateway and database pool.               |
| **WebSocket Connectivity**  | $\ge 98.0\%$     | $< 95.0\%$               | Inspect socket server load and reverse proxy timeouts. |
| **Payment Mutation Errors** | $< 0.05\%$       | $\ge 0.5\%$              | Check fee ledger endpoints and duplicate locks.        |

---

## 4. Rollback & Disaster Recovery Protocol

If a critical blocker, data corruption bug, or widespread crash is detected post-launch:

1. **Halt Staged Rollout:**
   - In **Google Play Console**, navigate to _Release Dashboard_ $\rightarrow$ Click **Halt rollout**.
   - In **App Store Connect**, pause the Phased Release.
2. **Assess Severity & Scope:**
   - If backend-related: Apply backend hotfix or roll back backend service (database schema is frozen and stable).
   - If client-side native crash: Revert to previous verified build tag in Git.
3. **Execute Emergency Hotfix:**
   ```bash
   git checkout -b hotfix/v1.0.1
   # Apply fix and add regression test in tests/unit/
   npm test
   npx tsc --noEmit
   npx eas-cli build --platform all --profile production
   ```
4. **Deploy Hotfix to 100% of Users** and resume standard monitoring.
