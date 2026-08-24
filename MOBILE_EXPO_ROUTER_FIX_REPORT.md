# EduTrack ERP Mobile V1 — Expo Router Startup Fix Report

**Date:** August 22, 2026  
**Status:** STARTUP FIXED

---

## 1. Original Failure

When starting the mobile application via `npx expo start` and launching on the Android emulator (`Pixel_9`), Metro bundler threw an HTTP 404 error:

```text
The development server returned response error code: 404
Unable to resolve module ../../../node_modules/.pnpm/expo-router@3.5.24_gprcudkimyrxemfbgkf65af77m/node_modules/expo-router/entry from C:\Users\DELL\Desktop\EduTech\apps\mobile_app/:
```

---

## 2. Evidence & Verification

1. **Dependency Listing (`pnpm list expo-router --depth 0`):**
   ```text
   @edutrack/mobile@1.0.0 C:\Users\DELL\Desktop\EduTech\apps\mobile_app (PRIVATE)
   dependencies:
   expo-router 3.5.24
   ```
2. **Package Resolution (`require.resolve('expo-router/package.json')`):**
   `C:\Users\DELL\Desktop\EduTech\node_modules\.pnpm\expo-router@3.5.24_gprcudkimyrxemfbgkf65af77m\node_modules\expo-router\package.json`
3. **Entry Resolution (`require.resolve('expo-router/entry')`):**
   `C:\Users\DELL\Desktop\EduTech\node_modules\.pnpm\expo-router@3.5.24_gprcudkimyrxemfbgkf65af77m\node_modules\expo-router\entry.js`
4. **ADB Device State:**
   - Device: `emulator-5554 device`
   - Port forwarding: `tcp:8081` (Metro), `tcp:3000` (Backend API & WebSocket)

---

## 3. Root Cause

**Metro Monorepo Resolution Restriction:**
In this pnpm monorepo layout, hoisted dependencies and the `.pnpm` virtual store reside in the repository root (`C:\Users\DELL\Desktop\EduTech\node_modules\.pnpm`). Previously, `apps/mobile_app/metro.config.js` only initialized `getDefaultConfig(__dirname)` without specifying `watchFolders` or `nodeModulesPaths`. When Metro followed the pnpm symlink to the root virtual store, Metro rejected serving files from outside `apps/mobile_app`, returning HTTP 404.

---

## 4. Fix Applied

1. **Updated `apps/mobile_app/metro.config.js`:**
   Configured `watchFolders = [monorepoRoot]` and `resolver.nodeModulesPaths = [projectRoot/node_modules, monorepoRoot/node_modules]`.
2. **Updated `apps/mobile_app/package.json`:**
   Upgraded `expo-image-picker` from `~15.0.7` to `~15.1.0` to match the exact requirement of Expo SDK `51.0.39`.
3. **Re-linked via `pnpm install`:**
   Successfully reconstructed virtual store links across all workspaces.

---

## 5. Security & Architecture Integrity

- [x] SecureStore token storage unchanged.
- [x] Authentication & parent role guards unchanged.
- [x] Backend canonical API contracts unchanged.
- [x] Database schema, migrations, and PostgreSQL tables strictly frozen and untouched.
- [x] Zero temporary shims or fake files added to `node_modules`.

---

## 6. Files Changed

1. [`apps/mobile_app/metro.config.js`](file:///c:/Users/DELL/Desktop/EduTech/apps/mobile_app/metro.config.js) (Added monorepo `watchFolders` and `nodeModulesPaths`)
2. [`apps/mobile_app/package.json`](file:///c:/Users/DELL/Desktop/EduTech/apps/mobile_app/package.json) (Updated `expo-image-picker` to `~15.1.0`)
3. [`pnpm-lock.yaml`](file:///c:/Users/DELL/Desktop/EduTech/pnpm-lock.yaml) (Updated dependency resolution for image-picker)

---

## 7. Final Verdict

# `STARTUP FIXED`
