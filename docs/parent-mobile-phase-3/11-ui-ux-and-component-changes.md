# EduTrack ERP — Parent Mobile App

# Phase 3 — UI/UX Design System & Component Library Report

## 1. Design System Philosophy

The Parent Mobile App UI/UX follows a clean, mobile-first design system built on React Native and NativeWind (Tailwind CSS for React Native):

- **Predictable Color Tokens**: Slate neutrals (`slate-50` to `slate-950`), Indigo primary accents (`indigo-600`), Emerald success states (`emerald-500` / `emerald-600`), Amber warning states (`amber-500`), and Rose error states (`rose-500` / `rose-600`).
- **Dark Mode Support**: Full dark theme adaptation utilizing semantic `dark:` utility variants across backgrounds, borders, typography, and tab bar chromes.
- **Accessibility**: Minimum touch targets (>= 44x44pt), high contrast ratios, explicit `accessibilityRole` and `accessibilityLabel` attributes on all touchable elements.

---

## 2. Reusable Component Inventory

### A. Atom Components (`apps/mobile_app/src/components/ui/atoms/`)

- `Badge`: Semantic status badge supporting `primary`, `success`, `warning`, `error`, and `neutral` variants.
- `Avatar`: Initials-based or image-backed circular avatar with size variants (`sm`, `md`, `lg`).
- `StatPill`: Compact quantitative metric pill with icon, label, primary value, and contextual subtext.
- `Button`: Primary, secondary, outline, and destructive action buttons with loading spinner support.

### B. Child & Context Components (`apps/mobile_app/src/components/child/`)

- `SelectedChildCard`: High-visibility student context card displayed at the top of every main tab, featuring the child's name, grade/section or application stage, status badge, and child switcher trigger.
- `ChildSwitcherSheet`: Modal bottom sheet displaying all authorized enrolled and applicant children with radio selection indicators and a direct shortcut to submit new admission applications.

### C. Dashboard & Module Widgets (`apps/mobile_app/src/components/dashboard/`)

- `DailyAttendancePill`: Displays today's roll-call status with quick navigation to Academics.
- `TodayScheduleGlance`: Displays active period, timing, classroom, instructor, and weekend detection.
- `QuickActionGrid`: 6-tile grid routing to Attendance, Timetable, Homework, Fees, Report Cards, and Helpdesk.
- `AcademicPriorityCard`: Highlights upcoming exams and tasks due within 48 hours.
- `FinanceSummaryWidget`: Highlights outstanding tuition dues or "All Dues Settled" green banner.
- `AnnouncementCarousel`: Interactive card carousel of campus announcements.
- `ApplicantDashboardView`: 5-step milestone stepper and admission funnel progress bar for prospective students.
- `UnlinkedOnboardingView`: Welcome and onboarding state for newly registered parents with no linked children.

---

## 3. Responsive & Device Compatibility

- Tested with Expo Safe Area Context (`SafeAreaView`) to prevent clipping under notches, dynamic islands, and home indicator bars.
- Scrollable view containers with `showsVerticalScrollIndicator={false}` and `RefreshControl` pull-to-refresh on all major hubs.
- Keyboard-avoiding modal layouts for ticket creation and payment checkout.
