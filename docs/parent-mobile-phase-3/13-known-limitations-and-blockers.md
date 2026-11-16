# EduTrack ERP — Parent Mobile App

# Phase 3 — Known Limitations, Upstream Blockers & Roadmap

## 1. Context & Architectural Boundaries

During Phase 3, the mobile application was fully developed, integrated, and verified against all available backend APIs and Prisma models while strictly adhering to the workspace database freeze.

This document details external dependencies, upstream blockers, and recommended next steps for future phases.

---

## 2. Identified Limitations & Blockers

### A. Stage-1 Database Freeze & Unmodeled SIS Entities

- **Description**: Prisma models for Attendance roll-call, Class Timetables, Homework assignments, Examinations/Report Cards, Transport fleets, and Library books do not yet exist in `apps/backend/prisma/schema.prisma` (only Stage-1 admissions, core ERP, users, and fees tables exist).
- **Impact**: While the mobile app contains fully developed, responsive, interactive screens for these features with local state transitions and honest empty states, server persistence for these specific entities requires Stage-2 Prisma models.
- **Remediation**: Recommended Prisma models have been fully authored in `10-database-and-prisma-changes.md` ready for database migration once the freeze is lifted.

### B. Windows Expo Router Backslash Artifact

- **Description**: On Windows environments, Expo Router type generator intermittently writes unescaped backslashes into `.expo/types/router.d.ts` (e.g., `\(main\)\helpdesk`) when creating new route files.
- **Impact**: Causes TypeScript compilation syntax errors if not normalized.
- **Resolution**: Normalized with forward slashes (`/`), documented in the build troubleshooting notes.

### C. Razorpay Production Keys Configuration

- **Description**: Production payment collection requires valid `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in the backend environment.
- **Impact**: Without configured environment variables, `POST /create-order` correctly responds with `GATEWAY_AUTH_ERROR`.
- **Resolution**: Backend provides Sandbox Demo simulation mode, and mobile client cleanly surfaces descriptive feedback to parents.

---

## 3. Recommended Roadmap for Phase 4 (Hardening & Release)

1. **End-to-End Device Smoke Testing**: Run automated Maestro / Detox flows on physical iOS and Android devices across varying network conditions (3G, 4G, offline).
2. **Push Notification Gateway Configuration**: Bind Expo Push Notification tokens to FCM / APNS production credentials in the backend.
3. **Biometric Storage Hardware Integration**: Complete Keychain / Keystore biometric prompt bindings for Face ID / Fingerprint fast login.
4. **App Store & Play Store Asset Generation**: Build signed Android AAB and iOS IPA bundles via EAS Build (`eas build --platform all`).
