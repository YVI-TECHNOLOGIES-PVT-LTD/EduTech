# EduTrack ERP — Mobile Architecture (`MOBILE_ARCHITECTURE.md`)

**Generated Date:** August 5, 2026  
**Source of Truth:** Physical code audit of [`apps/mobile_app/`](file:///c:/Program%20Files/EduTech/apps/mobile_app).

---

## 1. Expo Router Layout Topology

```
                         +-----------------------+
                         |  Expo Router Entry    |
                         |  (expo-router/entry)  |
                         +-----------+-----------+
                                     |
                                     v
                         +-----------------------+
                         |      _layout.tsx      |
                         +-----------+-----------+
                                     |
    +---------------+----------------+----------------+---------------+
    |               |                |                |               |
+---v----+      +---v----+       +---v----+       +---v----+      +---v----+
|(auth)  |      |(tabs)  |       |(student)|      |(parent)|      |(teacher)|
+--------+      +--------+       +--------+       +--------+      +--------+
```

---

## 2. Platform Component Stack

- **Mobile Runtime:** Expo SDK 51 (`expo~51.0.28`) + React Native 0.74 (`react-native@0.74.5`).
- **File-Based Routing:** Expo Router v3 (`expo-router~3.5.24`).
- **Styling Engine:** NativeWind (`nativewind^2.0.11`) + Tailwind CSS.
- **State & Data Fetching:** TanStack React Query (`@tanstack/react-query^5.28.9`) + Zustand (`zustand^4.5.2`).
- **Secure Token Storage:** `expo-secure-store~13.0.2` for OAuth tokens & AsyncStorage for local state.
