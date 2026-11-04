# Phase 2 Blueprint: Atomic Component Library Specification

**Document Reference:** `docs/parent-mobile-audit/phase-2/13-component-library-specification.md`  
**Phase:** Phase 2 — Complete UI/UX Architecture & Redesign Blueprint  
**Status:** ARCHITECTURAL SPECIFICATION & BLUEPRINT (READ-ONLY DESIGN)

---

## 1. Component Architecture & Atomic Hierarchy

The EduTrack component library follows atomic design principles to ensure strict code reuse, predictable styling, and seamless dark mode support across `apps/mobile_app`:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ATOMIC COMPONENT HIERARCHY                      │
├────────────────────────────────────────────────────────────────────────┤
│  ATOMS       │ Button, Input, Badge, Avatar, Icon, Skeleton, Divider   │
│  MOLECULES   │ ChildCard, FeedCard, PeriodRow, FeeItem, StatPill       │
│  ORGANISMS   │ ChildSwitcherSheet, CalendarView, PaymentReviewSheet    │
│  TEMPLATES   │ ScreenWrapper, ModuleShell, DashboardLayout             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Atoms (Foundational Elements)

### 2.1 `Button` (`src/components/ui/atoms/Button.tsx`)

- **Props:**
  ```typescript
  interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success';
    size?: 'sm' | 'md' | 'lg';
    icon?: keyof typeof Ionicons.glyphMap;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    accessibilityLabel?: string;
  }
  ```
- **Styling Rules:**
  - `primary`: `bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl`
  - `secondary`: `bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 rounded-xl`
  - `outline`: `border border-slate-300 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-100 rounded-xl`
  - `destructive`: `bg-red-600 text-white font-bold rounded-xl`
  - `success`: `bg-emerald-600 text-white font-bold rounded-xl`
  - `size.sm`: `px-3 py-1.5 text-xs h-9`
  - `size.md`: `px-4 py-2.5 text-sm h-12`
  - `size.lg`: `px-6 py-3.5 text-base h-14`

---

### 2.2 `Input` (`src/components/ui/atoms/Input.tsx`)

- **Props:**
  ```typescript
  interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: keyof typeof Ionicons.glyphMap;
    rightIcon?: keyof typeof Ionicons.glyphMap;
    onRightIconPress?: () => void;
    isPassword?: boolean;
  }
  ```
- **Styling Rules:**
  - Container: `bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 h-12 text-sm text-slate-900 dark:text-slate-100`
  - Focused State: `border-indigo-600 ring-2 ring-indigo-600/20`
  - Error State: `border-red-500 ring-2 ring-red-500/20 text-red-600`

---

### 2.3 `Badge` (`src/components/ui/atoms/Badge.tsx`)

- **Variants:**
  - `success`: `bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800`
  - `warning`: `bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800`
  - `error`: `bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800`
  - `info`: `bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800`
  - `neutral`: `bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700`

---

### 2.4 `Avatar` (`src/components/ui/atoms/Avatar.tsx`)

- **Props:**
  ```typescript
  interface AvatarProps {
    uri?: string | null;
    name: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    statusDot?: 'online' | 'present' | 'absent' | 'none';
  }
  ```
- **Fallback:** If `uri` is missing, renders initials (e.g., "AS" for Aarav Sharma) with a deterministic pastel background.

---

## 3. Molecules (Composite Domain Controls)

### 3.1 `ChildCard` (`src/components/molecules/ChildCard.tsx`)

- Renders an individual child item inside the Global Switcher:
  - If Enrolled: Photo, Full Name, Class & Section pill, Today's attendance status indicator.
  - If Applicant: Photo/Initials, Full Name, Application Number, Stage Stepper preview, Action Required alert.
- Handles active selection highlight border (`border-2 border-indigo-600`).

---

### 3.2 `PeriodRow` (`src/components/molecules/PeriodRow.tsx`)

- Individual class period representation inside weekly timetable:
  - Time range block (`09:15 - 10:00 AM`).
  - Period index badge (`P2`).
  - Subject Name (`Mathematics`).
  - Room number & Teacher Name (`Room 204 • Mr. Sharma`).
  - Conditional "Active Now" pulsating border indicator.

---

### 3.3 `FeeItem` (`src/components/molecules/FeeItem.tsx`)

- Financial item representation inside fee dashboard:
  - Installment Name (`Term 2 Tuition Fee`).
  - Due Date chip (`Due Nov 15, 2026`).
  - Amount display (`₹ 25,000`).
  - Status Badge (`PAID`, `DUE`, `OVERDUE`).
  - Checkbox for multi-invoice payment selection.

---

### 3.4 `FeedCard` (`src/components/molecules/FeedCard.tsx`)

- Social-style communication feed post:
  - Author header (School Crest, Department, Timestamp, Audience tag).
  - Headline and formatted body text.
  - Image preview container with pinch-to-zoom.
  - Downloadable PDF attachment pill.
  - Read receipt checkmark.

---

## 4. Organisms (Complex Functional Units)

### 4.1 `ChildSwitcherSheet` (`src/components/organisms/ChildSwitcherSheet.tsx`)

- Swipeable modal bottom sheet presenting grouped lists of Enrolled Students and Admission Applicants.
- Handles optimistic selection, local persistence in `AsyncStorage`, and smooth sheet dismissal.

---

### 4.2 `CalendarView` (`src/components/organisms/CalendarView.tsx`)

- Full monthly interactive attendance calendar:
  - Supports swipe gestures between months.
  - Renders colored indicator dots on days (Present, Absent, Late, Holiday).
  - Emits `onSelectDate(date: string)` callback to display daily details.

---

### 4.3 `PaymentReviewSheet` (`src/components/organisms/PaymentReviewSheet.tsx`)

- Slide-up bottom sheet reviewing selected fee lines before launching Razorpay SDK:
  - Itemized lines subtotal.
  - Convenience fee / tax line.
  - Authoritative net payable amount.
  - "Launch Gateway" button with double-tap lock.

---

## 5. Templates (Screen Layout Shells)

### 5.1 `ScreenWrapper` (`src/components/ui/templates/ScreenWrapper.tsx`)

- Universal page container providing:
  - `SafeAreaView` top and bottom inset handling.
  - Automatic `KeyboardAvoidingView` for form screens on iOS/Android.
  - `StatusBar` style sync with current dark/light theme.
  - Configurable `scrollable` (ScrollView with pull-to-refresh) vs `fixed` (full-height flex).

---

### 5.2 `ModuleShell` (`src/components/ui/templates/ModuleShell.tsx`)

- Standard sub-module screen header:
  - Back button (`Ionicons name="arrow-back"`).
  - Screen title (`Heading 2`) and optional subtitle.
  - Right action container (e.g., search icon, filter button, calendar toggle).
  - Consistent bottom border and elevation.
