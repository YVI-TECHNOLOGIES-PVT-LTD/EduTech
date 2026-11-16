# EduTrack ERP — Parent Mobile App

# Phase 3 — Wave 1: Design System Implementation

## 1. Design Token Architecture & Palette Alignment

In accordance with Phase 2 specification `docs/parent-mobile-audit/phase-2/12-design-system-specification.md`, Wave 1 implements the foundational design tokens across UI atoms and molecules. The color palette adheres to the EduTrack semantic standards:

### Semantic Color Tokens

| Token Name                 | Hex Code  | Purpose & Usage                                               |
| :------------------------- | :-------- | :------------------------------------------------------------ |
| **Primary (Brand Indigo)** | `#4F46E5` | Active tab highlights, primary action buttons, selected cards |
| **Primary Light**          | `#EEF2FF` | Background tint for active badges, active child pills         |
| **Primary Dark**           | `#4338CA` | Pressed states, high-contrast borders                         |
| **Success (Emerald)**      | `#059669` | Paid status, present attendance, approved applications        |
| **Success Light**          | `#ECFDF5` | Green status badge backgrounds                                |
| **Warning (Amber)**        | `#D97706` | Pending fees, late attendance, in-review applications         |
| **Warning Light**          | `#FFFBEB` | Amber status badge backgrounds                                |
| **Danger (Rose)**          | `#DC2626` | Overdue fees, absent attendance, rejected applications        |
| **Danger Light**           | `#FEF2F2` | Red status badge backgrounds                                  |
| **Neutral / Slate**        | `#475569` | Secondary text, draft states, inactive tabs                   |
| **Neutral Light**          | `#F1F5F9` | Card surfaces, neutral badge backgrounds                      |
| **Surface Light**          | `#FFFFFF` | Primary screen surface (light theme)                          |
| **Background Light**       | `#F8FAFC` | Screen canvas background (light theme)                        |
| **Surface Dark**           | `#1E293B` | Card surfaces (dark theme)                                    |
| **Background Dark**        | `#0F172A` | Screen canvas background (dark theme)                         |

---

## 2. Implemented UI Atoms

### 2.1. `StatPill` Component

Located at [`apps/mobile_app/src/components/ui/atoms/StatPill.tsx`](file:///c:/Users/user/Documents/GitHub/EduTech/apps/mobile_app/src/components/ui/atoms/StatPill.tsx).

- **Purpose**: Compact numeric and metric badge used across dashboards and cards to highlight key statistics (e.g., Attendance percentage, pending assignments, fee amount).
- **Props**:
  - `label`: string — Descriptive label (e.g., "Present", "Attendance").
  - `value`: string | number — Metric value (e.g., "94.5%", "2 Pending").
  - `variant`: `'primary' | 'success' | 'warning' | 'danger' | 'neutral'` — Semantic color style.
  - `icon` (optional): Feather icon name to display beside the value.
  - `size` (optional): `'sm' | 'md'`.
- **Implementation Highlights**:
  - Encapsulated styling using semantic color tokens.
  - Full support for both light and dark backgrounds via tailwind/dynamic styles.
  - Exported through [`src/components/ui/index.ts`](file:///c:/Users/user/Documents/GitHub/EduTech/apps/mobile_app/src/components/ui/index.ts).

### 2.2. Enhanced `Badge` Component

Located at [`apps/mobile_app/src/components/ui/atoms/Badge.tsx`](file:///c:/Users/user/Documents/GitHub/EduTech/apps/mobile_app/src/components/ui/atoms/Badge.tsx).

- **Modifications**:
  - Added `'neutral'` variant to `BadgeProps` (`variant?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'`).
  - Added slate background (`#F1F5F9` / `bg-slate-100`) and text color (`#475569` / `text-slate-700`) for `'neutral'`.
  - Enables truthful rendering of draft and under-review admission tags without misusing primary or error variants.

### 2.3. Enhanced `Avatar` Component

Located at [`apps/mobile_app/src/components/ui/atoms/Avatar.tsx`](file:///c:/Users/user/Documents/GitHub/EduTech/apps/mobile_app/src/components/ui/atoms/Avatar.tsx).

- **Modifications**:
  - Added `uri?: string | null` property to `AvatarProps` as an alias for `source={{ uri }}` to seamlessly accept backend image URLs from `EnrolledChild.photoUrl` and `ApplicantChild.photoUrl`.
  - Fallback avatar generation dynamically derives initials from student names (e.g., "Aarav Sharma" -> "AS") using primary/indigo background gradients when no photo URI is available.

---

## 3. Dark Theme & Token Consistency

- Components adhere to dynamic theming:
  - Text colors default to `#1E293B` on light backgrounds and `#F8FAFC` on dark surfaces.
  - Card borders utilize subtle slate borders (`#E2E8F0` on light, `#334155` on dark).
  - High-contrast states are maintained for accessibility (contrast ratio > 4.5:1 for body text and 3:1 for large graphical elements).
