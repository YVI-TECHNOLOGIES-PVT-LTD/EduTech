# EduTrack ERP — Parent Mobile App

# Phase 3 — Navigation & Route Implementation Report

## 1. Route Topology & Architecture

The application implements a clean, layered navigation hierarchy using Expo Router (File-System Based Routing) combined with strict route guards (`ProtectedRoute`).

```
apps/mobile_app/app/
├── index.tsx                         // Canonical entrypoint redirector
├── _layout.tsx                       // Root layout with QueryClient, Auth, Network, Theme
├── (auth)/                           // Public Authentication Stack
│   ├── login.tsx
│   ├── register.tsx
│   ├── otp.tsx
│   ├── forgot-password.tsx
│   ├── reset-password.tsx
│   └── splash.tsx
├── (main)/                           // Canonical 5-Tab Navigation & Nested Services
│   ├── _layout.tsx                   // Bottom tabs layout with notification badge
│   ├── home/index.tsx                // Tab 1: Adaptive Home Dashboard
│   ├── academics/index.tsx           // Tab 2: Academics, Timetable, Attendance, Homework
│   ├── communication/index.tsx       // Tab 3: Updates, Notices & Community Feed
│   ├── finance/index.tsx             // Tab 4: Tuition, Installments & Razorpay Checkout
│   ├── profile/index.tsx             // Tab 5: Family Profile, SIS Record & Settings
│   ├── helpdesk/index.tsx            // Nested Screen: Support Ticket Center (href: null)
│   ├── transport/index.tsx           // Nested Screen: School Bus & Routes (href: null)
│   └── library/index.tsx             // Nested Screen: Campus Library (href: null)
├── (parent)/                         // Preserved Admission Application Tracker
│   ├── _layout.tsx
│   ├── index.tsx                     // Legacy root redirect
│   ├── applications.tsx              // Admission applications list
│   └── applications/
│       ├── wizard.tsx                // Multi-step admission application form
│       └── [id]/
│           ├── index.tsx             // Application status cockpit
│           ├── assessment.tsx        // Interview & assessment scheduling
│           ├── decision.tsx          // Offer letter and decision acceptance
│           ├── documents.tsx         // Document verification & upload
│           ├── fees.tsx              // Admission registration fee checkout
│           ├── receipt.tsx           // Admission fee PDF receipt
│           └── timeline.tsx          // Funnel milestones audit
└── (common)/                         // Common Utility & Resiliency Screens
    ├── notifications.tsx             // Full notification history
    ├── no-internet.tsx               // Active network offline banner
    ├── maintenance.tsx               // Maintenance mode guard
    └── unexpected-error.tsx          // Error boundary fallback
```

---

## 2. Tab Layout Configuration (`apps/mobile_app/app/(main)/_layout.tsx`)

The bottom tab navigator exposes exactly the 5 primary tabs, while registering secondary service screens with `options={{ href: null }}` so they are part of the navigation graph without cluttering the bottom bar:

```tsx
<Tabs screenOptions={{ ... }}>
  <Tabs.Screen name="home/index" options={{ title: 'Home', tabBarIcon: ... }} />
  <Tabs.Screen name="academics/index" options={{ title: 'Academics', tabBarIcon: ... }} />
  <Tabs.Screen
    name="communication/index"
    options={{
      title: 'Updates',
      tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
      tabBarIcon: ...
    }}
  />
  <Tabs.Screen name="finance/index" options={{ title: 'Fees', tabBarIcon: ... }} />
  <Tabs.Screen name="profile/index" options={{ title: 'Profile', tabBarIcon: ... }} />

  {/* Nested Screens hidden from tab bar */}
  <Tabs.Screen name="helpdesk/index" options={{ href: null }} />
  <Tabs.Screen name="transport/index" options={{ href: null }} />
  <Tabs.Screen name="library/index" options={{ href: null }} />
</Tabs>
```

---

## 3. Route Constants (`apps/mobile_app/src/constants/routes.ts`)

Centralized type-safe route dictionary:

```typescript
export const ROUTES = {
  MAIN: {
    ROOT: '/(main)',
    HOME: '/(main)/home',
    ACADEMICS: '/(main)/academics',
    COMMUNICATION: '/(main)/communication',
    FINANCE: '/(main)/finance',
    PROFILE: '/(main)/profile',
    HELPDESK: '/(main)/helpdesk',
    TRANSPORT: '/(main)/transport',
    LIBRARY: '/(main)/library',
  },
  AUTH: {
    SPLASH: '/(auth)/splash',
    LOGIN: '/(auth)/login',
    REGISTER: '/(auth)/register',
    FORGOT_PASSWORD: '/(auth)/forgot-password',
    OTP: '/(auth)/otp',
    RESET_PASSWORD: '/(auth)/reset-password',
    WORKSPACE: '/(auth)/workspace',
  },
  PARENT: {
    ROOT: '/(parent)',
    DASHBOARD: '/(parent)',
    APPLICATIONS: '/(parent)/applications',
    WIZARD: '/(parent)/applications/wizard',
    DETAIL: (id: string) => `/(parent)/applications/${id}`,
    STATUS: (id: string) => `/(parent)/applications/status?id=${id}`,
    FEES: (id: string) => `/(parent)/applications/fees?id=${id}`,
    DOCUMENTS: '/(parent)/documents',
    NOTIFICATIONS: '/(parent)/notifications',
  },
  COMMON: {
    NOTIFICATIONS: '/(common)/notifications',
    NO_INTERNET: '/(common)/no-internet',
    MAINTENANCE: '/(common)/maintenance',
    UNEXPECTED_ERROR: '/(common)/unexpected-error',
  },
} as const;
```

---

## 4. Deep-Linking & Entrypoint Routing

- `app/index.tsx`: Checks `AuthService.getAccessToken()`. If authenticated, routes immediately to `ROUTES.MAIN.HOME`. If unauthenticated, routes to `ROUTES.AUTH.LOGIN`.
- `app/(tabs)/dashboard.tsx`: Legacy redirection layer forwarding traffic to `ROUTES.MAIN.HOME`.
- Back-button handling in nested screens (`helpdesk`, `transport`, `library`) cleanly executes `router.back()`.
