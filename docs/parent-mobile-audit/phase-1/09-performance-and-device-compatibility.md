# 09 — Performance, Stability & Device Compatibility Audit

**Project:** EduTrack ERP — Parent Mobile Application  
**Audit Phase:** Phase 1 — Complete Mobile Application Audit & Baseline Validation  
**Date of Audit:** November 2, 2026  
**Status:** Complete & Validated  
**Inspection Scope:** Runtime Stability, Bundle Metrics, Memory Lifecycles, and Multi-Device Ergonomics

---

## 1. Performance Architecture & Code-Level Observations

_(Note: In accordance with Phase 1 read-only constraints, these findings are derived from physical source code inspection, dependency profiling, and bundle analysis without intrusive runtime APM agents.)_

### A. List Virtualization vs Unbounded ScrollViews

- **Critical Performance Hazard:**
  - In `app/(parent)/applications.tsx` line 63:
    ```typescript
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} ...>
      {applications.map((app) => (
        <ApplicationStatusCard key={...} application={app} ... />
      ))}
    </ScrollView>
    ```
  - Similarly, in `app/(parent)/notifications.tsx` line 140, the entire notification list is rendered inside a plain `ScrollView`.
- **Performance Impact:**
  - `ScrollView` renders every child component simultaneously in native memory, regardless of whether it is visible on screen.
  - For parents with multiple application records or dozens of notification alerts, this causes noticeable frame drops, increased RAM consumption, and UI jank during scrolling.
- **Recommended Remedy:** Migrate all list containers to `FlatList` with `windowSize={5}`, `initialNumToRender={8}`, and `removeClippedSubviews={Platform.OS === 'android'}`.

### B. Image Optimization & Asset Delivery

- **Inspection Findings:**
  - The project imports `expo-image (~1.13.0)` in `package.json`.
  - However, several screens still use standard React Native `<Image>` components with direct local asset requires.
  - Static fee artwork and logos in `src/assets/images/fee_images/` are uncompressed PNGs ranging up to 1.5MB in size.
- **Recommended Remedy:** Convert all image renders to `<Image from="expo-image">` with hardware disk and memory caching, and optimize asset binaries using WebP.

### C. State Re-rendering & Query Caching

- **TanStack React Query Cache Configuration:**
  - `QueryClient` is initialized with standard default options in `src/providers/AppProvider.tsx`.
  - Stale time for `notifications.unreadCount` is appropriately configured to 30 seconds (`staleTime: 1000 * 30`).
  - Application listing queries (`['applications', 'mine']`) have no explicit `staleTime`, defaulting to 0ms (instant refetch on window focus or component re-mount).
- **Zustand Selector Performance:**
  - Screens properly use granular state selectors (e.g. `const user = useAuthStore((state) => state.user)`), preventing entire screens from re-rendering when unrelated store properties change.

---

## 2. Memory Leak & Lifecycle Analysis

### 1. WebSocket Reconnection & Heartbeat Timers

- **Audit Target:** `NotificationSocketManager` (`src/features/notifications/services/notification-socket.ts`)
- **Inspection Findings:**
  - `heartbeatTimer` and `reconnectTimer` are tracked as class fields.
  - The manager provides a `cleanupSocket()` method:
    ```typescript
    private cleanupSocket(): void {
      if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
      if (this.heartbeatTimer) { clearInterval(this.heartbeatTimer); this.heartbeatTimer = null; }
      if (this.ws) { this.ws.onopen = null; this.ws.onclose = null; this.ws.onerror = null; this.ws.onmessage = null; this.ws.close(); this.ws = null; }
    }
    ```
  - **Verdict: Clean Lifecycle**. Timers and event listeners are properly detached when cleaning up or disconnecting, preventing socket retention memory leaks.

### 2. OTP Countdown Interval

- **Audit Target:** `app/(auth)/otp.tsx` lines 38–45
- **Inspection Findings:**
  ```typescript
  useEffect(() => {
    if (timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerSeconds]);
  ```
  - **Verdict: Clean**. Proper cleanup function `clearInterval(interval)` is returned in `useEffect`.

---

## 3. Device Compatibility & Screen Ergonomics

### A. Small Screen Adaptation (Compact Displays <= 375dp width, e.g. iPhone SE / Android 360dp)

- **Observations:**
  - In `app/(parent)/applications/wizard.tsx`, the `WizardProgressBar` contains 8 numbered circular pills in a single horizontal row. On screens with widths < 380dp, the 8 pills compress and can overflow horizontally off-screen.
  - On `app/(auth)/login.tsx` and `register.tsx`, when the Android soft keyboard appears, the submit button is frequently pushed below the fold, requiring the parent to scroll manually to hit "Sign In".
- **Remediation:** Implement a 4-step collapsed progress bar with step title text ("Step 2 of 4: Student Details") rather than 8 separate numbered icons.

### B. Safe Area Inset & Notch Handling

- **Observations:**
  - `SafeAreaView` from `react-native` is used in all top-level parent screens (`(parent)/index.tsx`, `(parent)/applications.tsx`, `(parent)/notifications.tsx`, `(parent)/profile.tsx`).
  - Bottom tab bar height in `app/(parent)/_layout.tsx` is fixed at `height: 62`, with `paddingTop: 6`.
  - **Hazard on Modern iPhones:** iPhones with Dynamic Island or gesture home indicators require extra bottom padding (typically 24–34dp). A fixed height of 62dp without reading `useSafeAreaInsets().bottom` results in tab bar labels colliding with the iOS home indicator bar.
- **Remediation:** Import `useSafeAreaInsets` from `react-native-safe-area-context` and add `paddingBottom: insets.bottom` dynamically to `tabBarStyle`.

### C. Orientation Handling

- **Configuration:** `app.json` line 6:
  ```json
  "orientation": "portrait"
  ```
- **Finding:** The application is explicitly locked to portrait orientation across Android and iOS, which is appropriate for enterprise form entry and parent workflow ergonomics.

### D. Accessibility & Dynamic Font Scaling

- **Observations:**
  - Several typography components lack `maxFontSizeMultiplier` limits.
  - When a user enables extreme accessibility text size in iOS / Android system settings, text inside card badges (`text-[10px]`) and tab bar labels (`fontSize: 11`) can wrap awkwardly or clip outside container boundaries.
- **Remediation:** Apply `maxFontSizeMultiplier={1.3}` to prevent layout clipping while preserving accessibility readability.

---

## 4. Error Boundaries & Crash Recovery

### ErrorBoundary Implementation (`src/core/errors/error-boundary.tsx`)

- The application contains a React `ErrorBoundary` class component wrapping the root application tree in `AppProvider.tsx`.
- **Fallback Screen:** When an unhandled React rendering exception occurs, the error boundary renders `app/(common)/unexpected-error.tsx`.
- **Discovered Defect:** The fallback screen provides a "Return to Dashboard" button which calls `router.replace(ROUTES.TABS.DASHBOARD)` instead of `ROUTES.PARENT.DASHBOARD`. This traps parents on the mock staff admin dashboard during crash recovery.
- **Remediation:** Update `unexpected-error.tsx` line 24 to redirect to `ROUTES.PARENT.DASHBOARD`.
