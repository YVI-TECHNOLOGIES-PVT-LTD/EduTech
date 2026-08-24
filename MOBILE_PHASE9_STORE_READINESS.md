# EduTrack ERP Mobile V1 — Phase 9 Store Readiness Audit

**Date:** August 22, 2026  
**Status:** READY FOR STORE SUBMISSION

---

## 1. Android Google Play Store Readiness

- **Application ID / Package Name:** `com.edutrack.mobile`
- **Version Name:** `1.0.0`
- **Version Code:** `1`
- **Build Artifact:** Android App Bundle (`.aab`) via EAS build profile `production` (`"buildType": "app-bundle"`).
- **Target SDK:** Android 14 (API Level 34) / Minimum SDK: Android 7.0 (API Level 24).
- **Permissions Declared in `app.json`:**
  - `INTERNET`: Required for API & WebSocket communication.
  - `ACCESS_NETWORK_STATE`: Required for offline/online network detection.
- **Adaptive App Icons & Splash:**
  - Foreground Image: `./src/assets/images/adaptive-icon.png`
  - Background Color: `#0f172a` (EduTrack Deep Navy)
  - Splash Screen: `./src/assets/images/splash.png` (`resizeMode: contain`, `#0f172a`)
- **Google Play Data Safety Disclosures:**
  - Data Collected: Name, Email, Phone Number, Child Academic & Demographic Info, Identity & Birth Verification Documents.
  - Purpose: Educational institution admission management and parent communications.
  - Security Practices: Data encrypted in transit (TLS/HTTPS, WSS); user authentication via JWT tokens in native SecureStore.

---

## 2. Apple App Store Readiness

- **Bundle Identifier:** `com.edutrack.mobile`
- **Version String:** `1.0.0`
- **Build Number:** `1`
- **Device Support:** iPhone, iPad (`supportsTablet: true`).
- **Required Capabilities:** `UIBackgroundModes: ["fetch", "remote-notification"]`.
- **URL Scheme:** `edutrack://`
- **Privacy Manifest (NSPrivacyAccessedAPITypes):**
  - Standard user defaults and secure keychain access for user session tokens.
- **Export Compliance:**
  - Uses standard system HTTPS/WSS encryption (exempt from formal encryption export registration).

---

## 3. Expo Application Services (EAS) Configuration (`eas.json`)

```json
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_ENV": "development",
        "EXPO_PUBLIC_API_URL": "http://10.0.2.2:3000/api",
        "EXPO_PUBLIC_WS_URL": "ws://10.0.2.2:3000/ws/notifications"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_ENV": "staging",
        "EXPO_PUBLIC_API_URL": "https://staging-api.edutrack.com/api",
        "EXPO_PUBLIC_WS_URL": "wss://staging-api.edutrack.com/ws/notifications"
      }
    },
    "production": {
      "distribution": "store",
      "env": {
        "EXPO_PUBLIC_ENV": "production",
        "EXPO_PUBLIC_API_URL": "https://api.edutrack.com/api",
        "EXPO_PUBLIC_WS_URL": "wss://api.edutrack.com/ws/notifications",
        "EXPO_PUBLIC_ENABLE_LOGGING": "false",
        "EXPO_PUBLIC_ENABLE_ANALYTICS": "true"
      },
      "android": { "buildType": "app-bundle" }
    }
  }
}
```

---

## 4. Release Checklist & Deployment Prerequisite

- [x] Application metadata and assets aligned in `app.json`.
- [x] Production build profiles verified in `eas.json`.
- [x] Clean unit test and typecheck verification.
- [ ] **Deployment Action (CI/CD / Release Engineer):** Configure EAS Cloud credentials (`EXPO_TOKEN` / Google Play Service Account JSON / Apple Developer Provisioning Profile) in your CI/CD runner to trigger `eas build --platform all --profile production`.
