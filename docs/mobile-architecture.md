# EduTrack Mobile Architecture Guide

## Overview
The `@edutrack/mobile` application is built on **Expo React Native**, utilizing **Expo Router** file-based navigation, **TanStack Query** for server state caching, **expo-secure-store** for encrypted token storage, and `@edutrack/ui` design tokens.

## Architecture Layers
```text
Expo Router Entry (_layout.tsx)
  └── GlobalErrorBoundary
      └── AppProvider Sequence (Query, Theme, Auth, Tenant, Permission, Network)
          └── Navigation Stacks (auth, tabs, admission, student, teacher, parent)
              └── Shared Packages (@edutrack/ui, @edutrack/types, @edutrack/validation)
```

## Mobile Design System Governance
1. **Design Tokens**: Utilize theme colors, typography scales, and safe area insets via `react-native-safe-area-context`.
2. **Secure Credentials**: Store JWT tokens securely using `expo-secure-store`. Plain `AsyncStorage` is forbidden for credentials.
3. **Correlation Headers**: Outgoing API calls automatically propagate `X-Request-Id` headers.
