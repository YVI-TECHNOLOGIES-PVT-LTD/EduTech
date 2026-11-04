# Phase 2 Blueprint: Design System Tokens & Theming Specification

**Document Reference:** `docs/parent-mobile-audit/phase-2/12-design-system-specification.md`  
**Phase:** Phase 2 — Complete UI/UX Architecture & Redesign Blueprint  
**Status:** ARCHITECTURAL SPECIFICATION & BLUEPRINT (READ-ONLY DESIGN)

---

## 1. Design System Architecture

The EduTrack Parent Design System is an institutional-grade, mobile-first design token library built on NativeWind (Tailwind CSS v3 for React Native). It enforces WCAG 2.1 AA accessibility standards, consistent 4px rhythm spacing, and complete light and dark theme symmetry.

---

## 2. Color Token Architecture

### 2.1 Theme Palette: Light vs. Dark Modes

| Token Name       | Light Theme Hex         | Dark Theme Hex          | Semantic Usage                               |
| ---------------- | ----------------------- | ----------------------- | -------------------------------------------- |
| `canvas.base`    | `#f8fafc` (Slate 50)    | `#020617` (Slate 950)   | Root background behind cards                 |
| `canvas.subtle`  | `#f1f5f9` (Slate 100)   | `#0f172a` (Slate 900)   | Secondary backgrounds, dividers              |
| `surface.card`   | `#ffffff` (White)       | `#0f172a` (Slate 900)   | Elevated content cards, modals               |
| `surface.inset`  | `#f1f5f9` (Slate 100)   | `#1e293b` (Slate 800)   | Form inputs, search fields, pills            |
| `border.default` | `#e2e8f0` (Slate 200)   | `#334155` (Slate 700)   | Standard 1px card/divider borders            |
| `border.subtle`  | `#f1f5f9` (Slate 100)   | `#1e293b` (Slate 800)   | Secondary dividers, inset borders            |
| `brand.primary`  | `#1e1b4b` (Indigo 950)  | `#818cf8` (Indigo 400)  | Main brand headers, active tabs              |
| `brand.accent`   | `#4338ca` (Indigo 700)  | `#6366f1` (Indigo 500)  | Primary CTA buttons, interactive links       |
| `brand.muted`    | `#e0e7ff` (Indigo 100)  | `#1e1b4b` (Indigo 950)  | Accent card backgrounds, tag pills           |
| `text.primary`   | `#0f172a` (Slate 900)   | `#f8fafc` (Slate 50)    | High-contrast body, titles ($\ge 7:1$)       |
| `text.secondary` | `#475569` (Slate 600)   | `#94a3b8` (Slate 400)   | Secondary labels, descriptions ($\ge 4.5:1$) |
| `text.muted`     | `#94a3b8` (Slate 400)   | `#64748b` (Slate 500)   | Placeholders, timestamps, disabled           |
| `status.success` | `#059669` (Emerald 600) | `#34d399` (Emerald 400) | Attendance present, paid fees, approved      |
| `status.warning` | `#d97706` (Amber 600)   | `#fbbf24` (Amber 400)   | Due soon, late arrival, review pending       |
| `status.error`   | `#dc2626` (Red 600)     | `#f87171` (Red 400)     | Absent, payment failed, rejected             |
| `status.info`    | `#0284c7` (Sky 600)     | `#38bdf8` (Sky 400)     | General announcements, bus tracking          |

---

## 3. Typography Scale & Hierarchy

The application employs the system font family (`System` / `-apple-system` on iOS, `Roboto` on Android) to minimize bundle overhead and ensure native text rendering.

```
Token           Size      Line Height    Weight          Tracking    Usage
─────────────────────────────────────────────────────────────────────────────────────────────
Display         32 px     38 px          Black (900)     -0.5 px     Big metrics, balances
Heading 1       24 px     30 px          Bold (700)      -0.3 px     Screen titles, headers
Heading 2       20 px     26 px          Bold (700)      -0.2 px     Section headers, cards
Heading 3       16 px     22 px          SemiBold (600)   0 px       Card headlines, items
Body Large      15 px     22 px          Regular (400)    0 px       Main content, notices
Body Default    14 px     20 px          Regular (400)    0 px       Standard readable text
Caption         12 px     16 px          Medium (500)    +0.2 px     Timestamps, badges, pills
Micro (2xs)     10 px     14 px          Bold (700)      +0.5 px     Category chips, counters
Button Text     15 px     20 px          Bold (700)       0 px       Touch target CTA text
```

---

## 4. Spacing Scale (4px Grid)

All layout paddings, margins, and gaps must adhere strictly to the 4px geometric scale:

```
Token    Pixels     Tailwind Class    Usage
─────────────────────────────────────────────────────────────────────────────
space-1   4 px      p-1, m-1, gap-1   Micro spacing between icon and badge text
space-2   8 px      p-2, m-2, gap-2   Spacing within chips, tag padding
space-3  12 px      p-3, m-3, gap-3   Compact card internal padding
space-4  16 px      p-4, m-4, gap-4   Standard card padding, screen horizontal edge
space-5  20 px      p-5, m-5, gap-5   Large card padding, section gaps
space-6  24 px      p-6, m-6, gap-6   Major container padding, sheet margins
space-8  32 px      p-8, m-8, gap-8   Top header clearances, empty state spacing
space-12 48 px      p-12, m-12        Hero illustrations, major vertical separation
```

---

## 5. Corner Radius Scale

Rounded corners convey friendliness, approachability, and modern ergonomics:

| Token         | Radius Value | Tailwind Class | Applied Components                                |
| ------------- | ------------ | -------------- | ------------------------------------------------- |
| `radius.sm`   | 6 px         | `rounded-md`   | Badges, tags, micro chips                         |
| `radius.md`   | 10 px        | `rounded-xl`   | Buttons, text inputs, search bars                 |
| `radius.lg`   | 16 px        | `rounded-2xl`  | Standard cards, feed cards, timetable items       |
| `radius.xl`   | 24 px        | `rounded-3xl`  | Hero cards, prominent banners, modal sheets       |
| `radius.full` | 9999 px      | `rounded-full` | Avatars, icon containers, floating action buttons |

---

## 6. Elevation & Shadow Scale

Shadows are restrained to avoid muddy visual clutter on lower-end OLED/LCD panels:

```
Token          iOS Shadow Properties                             Android Elevation
──────────────────────────────────────────────────────────────────────────────────────
elevation.sm   shadowColor: #000, opacity: 0.04, radius: 3, y: 1       elevation: 1
elevation.md   shadowColor: #000, opacity: 0.06, radius: 8, y: 3       elevation: 3
elevation.lg   shadowColor: #000, opacity: 0.10, radius: 16, y: 6      elevation: 6
elevation.modal shadowColor: #000, opacity: 0.18, radius: 24, y: 12    elevation: 12
```

---

## 7. Interaction Feedback & Motion Principles

1. **Touch Feedback:** Every interactive element must provide instant visual feedback upon touch start. Buttons use `activeOpacity={0.75}`.
2. **Haptic Feedback:**
   - Tap CTA / Select Tab: Light impact (`Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`).
   - Form Submit / Payment Success: Success notification (`Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)`).
   - Validation Error / Rejection: Warning impact (`Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)`).
3. **Spring Transitions:** Modal sheets and drawers animate using spring damping (`damping: 20, stiffness: 200`) rather than linear easing, matching native iOS and Android gesture physics.
4. **Minimum Touch Targets:** All interactive areas are enforced at $\ge 48 \times 48\text{ dp}$ via `hitSlop` expansion when visual icons are smaller.
