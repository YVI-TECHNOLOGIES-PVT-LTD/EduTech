# EduTrack ERP Mobile V1 — Phase 8 Pre-Flight Audit

**Date:** August 22, 2026  
**Status:** COMPLETE

---

## 1. Architecture Overview

- **Monorepo Structure:** `pnpm` workspace (`apps/mobile_app`, `apps/backend`, `apps/web_app`, `packages/types`, `packages/validation`, `packages/config`).
- **Mobile Stack:**
  - **Framework:** Expo SDK `~51.0.28` (Managed Workflow with native plugins)
  - **Runtime:** React Native `0.74.5` / React `18.2.0`
  - **Navigation & Routing:** `expo-router` `~3.5.24` (File-based, Typed Routes enabled)
  - **State Management:** Zustand `^4.5.2` (Session & Auth Store)
  - **Data Fetching & Cache:** TanStack React Query `^5.28.9` (GC time: 15m, Stale time: 2m)
  - **HTTP Client:** Axios `^1.6.8` with Request/Response interceptors & correlation IDs
  - **Real-Time Client:** Native WebSocket singleton (`NotificationSocketManager`) on `/ws/notifications`
  - **Security Storage:** `expo-secure-store` `~13.0.2` for JWT access/refresh tokens
  - **Draft Storage:** `@react-native-async-storage/async-storage` `1.23.1` (Isolated non-sensitive form data)
  - **Form Validation:** React Hook Form `^7.51.2` + Zod `^3.22.4`

---

## 2. Environment & URL Strategies

### Environment Modes

1. **Development (`EXPO_PUBLIC_ENV="development"`):**
   - API Base URL: `http://10.0.2.2:3000/api` (Android Emulator) / `http://localhost:3000/api` (iOS / Web)
   - WebSocket URL: `ws://10.0.2.2:3000/ws/notifications` / `ws://localhost:3000/ws/notifications`
   - Logging: Enabled (`ENABLE_LOGGING=true`)
   - Analytics: Disabled

2. **Staging (`EXPO_PUBLIC_ENV="staging"`):**
   - API Base URL: `https://staging-api.edutrack.com/api`
   - WebSocket URL: `wss://staging-api.edutrack.com/ws/notifications`
   - Logging: Enabled (Sanitized)
   - Analytics: Enabled

3. **Production (`EXPO_PUBLIC_ENV="production"`):**
   - API Base URL: `https://api.edutrack.com/api`
   - WebSocket URL: `wss://api.edutrack.com/ws/notifications`
   - Logging: Disabled by default (Strictly sanitized if forced)
   - Analytics: Enabled

---

## 3. Build & Distribution Profiles (`eas.json`)

- **CLI Version:** `>= 10.0.0`
- **Development Profile:**
  - `developmentClient: true`, `distribution: "internal"`
  - Android: `buildType: "apk"`
  - iOS: `simulator: true`
- **Preview Profile:**
  - `distribution: "internal"`
  - Android: `buildType: "apk"`
- **Production Profile:**
  - `distribution: "store"`
  - Android: `buildType: "app-bundle"` (AAB for Google Play Store)
  - iOS: Archive for Apple App Store Connect

---

## 4. App Store Metadata & Permissions (`app.json`)

- **Name:** `EduTrack ERP`
- **Slug:** `edutrack-mobile`
- **Package (Android):** `com.edutrack.mobile` (versionCode: 1)
- **Bundle Identifier (iOS):** `com.edutrack.mobile` (buildNumber: "1")
- **Scheme:** `edutrack://`
- **Android Permissions:** `INTERNET`, `ACCESS_NETWORK_STATE`
- **iOS Capabilities:** Background fetch, remote notifications
- **Plugins:** `expo-router`, `expo-secure-store`, `expo-notifications`, `expo-document-picker`

---

## 5. Security & Isolation Matrix

- **Credentials Storage:** Access and refresh tokens in `Expo.SecureStore` only.
- **Draft Storage:** Form fields in `AsyncStorage` scoped by user ID and application draft ID.
- **Signed URLs:** Ephemeral signed document download URLs are fetched on-demand and never persisted to local storage.
- **Deep-Link Allowlist:** `resolveNotificationRoute` enforces a strict allowlist of parent application screens.
- **Zero Sensitive Logs:** Logger automatically masks `Bearer` tokens, passwords, OTPs, and authorization headers.
