# Phase 2 Blueprint: Accessibility & Responsive Device Specification

**Document Reference:** `docs/parent-mobile-audit/phase-2/16-accessibility-and-responsive-design.md`  
**Phase:** Phase 2 — Complete UI/UX Architecture & Redesign Blueprint  
**Status:** ARCHITECTURAL SPECIFICATION & BLUEPRINT (READ-ONLY DESIGN)

---

## 1. Executive Summary & Compliance Mandate

The EduTrack Parent Mobile App must be accessible and usable for all parents, regardless of age, visual impairment, motor limitations, or device form factor.

### Compliance Target:

- **WCAG 2.1 Level AA Compliance** across all interactive elements.
- **Support for All Standard Android & iOS Form Factors** from compact smartphones (320px width) to modern foldables and tablets (840px+ width).

---

## 2. Accessibility Specifications (WCAG 2.1 AA)

### 2.1 Dynamic Font Scaling & Text Wrapping

- **Rule:** The app must support operating system Dynamic Type / Font Scaling up to **200%** without clipping text, overflowing containers, or truncating crucial information.
- **Implementation:**
  - Avoid hardcoded fixed heights (`h-12`) on containers that hold multi-line text; use `min-h-[48px]` with flexible vertical padding.
  - Set `numberOfLines` only on explicitly truncatable preview snippets (e.g. feed snippets with "Read more" buttons).
  - Metrics cards (e.g. Fee balance, attendance percentage) wrap gracefully into vertical stacks when font scaling exceeds 150%.

### 2.2 Color Contrast Ratios

All color pairs in both Light and Dark themes must satisfy contrast ratios:

- **Normal Text ($< 18\text{pt}$):** $\ge 4.5 : 1$ contrast ratio against its background.
  - Light mode: `#0f172a` on `#ffffff` provides **15.8 : 1** (Exceeds AAA).
  - Secondary: `#475569` on `#ffffff` provides **7.1 : 1** (Exceeds AA).
  - Dark mode: `#f8fafc` on `#0f172a` provides **15.1 : 1** (Exceeds AAA).
- **Large Text ($\ge 18\text{pt}$) & Icons:** $\ge 3.0 : 1$.
- **Non-Color Exclusivity:** Never communicate status by color alone:
  - Present: Green + Checkmark icon + Label "Present".
  - Absent: Red + Alert circle icon + Label "Absent".
  - Overdue: Amber + Clock icon + Label "Overdue".

### 2.3 Screen Reader Accessibility (VoiceOver & TalkBack)

Every touchable element must declare standard accessibility attributes:

```typescript
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="Pay term 2 tuition fee"
  accessibilityHint="Opens the secure Razorpay payment checkout for 25,000 rupees"
  accessibilityState={{ disabled: isPending, busy: isPending }}
  onPress={handlePayment}
>
  ...
</TouchableOpacity>
```

- **Image Accessibility:** Institutional crests and icons carry `accessibilityRole="image"` with meaningful descriptions, while purely decorative shapes set `accessible={false}`.

### 2.4 Minimum Touch Target Sizing

- All interactive elements (buttons, filter chips, checkboxes, tab bar items) must satisfy a minimum touch boundary of **$48 \times 48\text{ dp}$**.
- For compact icons (e.g., $20 \times 20\text{ px}$ back arrow or search clear icon), enforce the target size via hit slop:
  ```typescript
  hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
  ```

### 2.5 Reduced Motion Preferences

- Honors device `prefers-reduced-motion` settings (`AccessibilityInfo.isReduceMotionEnabled()`):
  - Replaces spring animations with instant cut transitions.
  - Disables celebratory confetti animations on payment or admission submission.
  - Freezes pulsating borders on the active class period card.

---

## 3. Keyboard & Input Handling

Forms (Admission wizard, login, password reset, helpdesk tickets) must guarantee zero obscured inputs:

1. **`KeyboardAvoidingView`:** Wrapped around all scrollable form containers with `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}`.
2. **`keyboardShouldPersistTaps="handled"`:** Configured on every `ScrollView` to allow 1-tap submission without requiring a prior tap to dismiss the keyboard.
3. **Return Key Routing:**
   - Email Input: `returnKeyType="next"` $\rightarrow$ Auto-focuses Password input.
   - Password Input: `returnKeyType="done"` $\rightarrow$ Submits form directly.
4. **Auto-Fill & Password Managers:**
   - Username inputs declare `textContentType="emailAddress"` and `autoComplete="email"`.
   - Password inputs declare `textContentType="password"` or `textContentType="newPassword"` to support Apple Keychain, Google Autofill, and 1Password.

---

## 4. Platform Navigation Conventions

### 4.1 iOS Specific Conventions:

- **Interactive Swipe Back Gesture:** Stack navigators preserve native iOS edge swipe gestures (`gestureEnabled: true`).
- **Modal Presentations:** Auxiliary sheets (Child Switcher, Daily Attendance Detail) present as native card page sheets with rubber-band pull-down dismissal.
- **Haptic Feedback:** Native Taptic Engine integration via `expo-haptics`.

### 4.2 Android Specific Conventions:

- **Hardware Back Button Handling:**
  - Back press on sub-screens pops the current route.
  - Back press on open modal sheets dismisses the sheet.
  - Back press on the root Home tab checks: If pressed twice within 2 seconds, exits app; otherwise shows a brief toast: _"Press back again to exit"_.
- **Android Ripple Effect:** Buttons and cards feature native borderless or bounded ripple feedback (`android_ripple={{ color: 'rgba(99, 102, 241, 0.12)' }}`).

---

## 5. Responsive Form Factors & Screen Size Adaptation

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DEVICE BREAKPOINT STRATEGY                      │
├────────────────────────────────────────────────────────────────────────┤
│ Compact Phones (< 375px)  │ iPhone SE, Galaxy A03    │ 1-col cards     │
│ Standard Phones (375-430) │ iPhone 15, Pixel 8       │ Standard design │
│ Foldables / Small Tablets │ Galaxy Fold, iPad Mini   │ 2-col grids     │
│ Large Tablets (768px+)    │ iPad Pro, Galaxy Tab S9  │ Centered max-w  │
└────────────────────────────────────────────────────────────────────────┘
```

### 5.1 Compact Devices (Width $< 375\text{ px}$)

- Header padding reduces from `px-5` to `px-3.5`.
- Quick action grid shifts from 3 columns to 2 columns to prevent icon and label clipping.
- Metric display numbers drop from `32px` to `26px`.

### 5.2 Tablets & Large Screens (Width $\ge 768\text{ px}$)

- **Max Content Container:** The application shell centers content horizontally within a constrained layout:
  ```css
  max-w-2xl mx-auto w-full
  ```
  Prevents extreme line lengths and awkward stretched cards on iPad or Samsung tablet screens.
- **Split View Modals:** The Child Switcher presents as a centered floating dialog with darkened overlay rather than a full-width bottom sheet.
