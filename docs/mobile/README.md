# EduTrack Enterprise Platform — Mobile Architecture (`apps/mobile_app`)

## 1. Expo & React Native Architecture

The `@edutrack/mobile` application is built on Expo SDK 51, React Native 0.74, and Expo Router 3.

```text
apps/mobile_app/
├── app/                     # Expo Router file-based file navigation
│   ├── (auth)/              # Login and authentication screens
│   ├── (tabs)/              # Main tab bar navigation (Dashboard, Attendance, Fees, Profile)
│   ├── _layout.tsx          # Root navigation container & React Query Provider
│   └── index.tsx            # Initial entry redirect route
├── components/              # Native UI components & primitives
├── hooks/                   # Custom React Native hooks
├── scripts/                 # Asset generation scripts (generate-assets.js)
└── package.json             # Mobile workspace manifest
```

---

## 2. Key Mobile Features & Performance

- **File-Based Routing:** Expo Router 3 manages typed screen navigation.
- **Native Tailwind Styling:** NativeWind v2 maps Tailwind utility classes directly to React Native StyleSheet objects.
- **Secure Persistence:** Expo Secure Store manages encrypted JWT storage on iOS (Keychain) and Android (Keystore).
