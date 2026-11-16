# EduTrack Stage 1 Design Reference

**Visual Design Language, Interaction Architecture & ERP Component System**
_Authoritative Baseline for the Finance Module_

---

## Executive Summary & Source of Truth

This document establishes the **EduTrack Stage 1 (Admission Module) Design Reference**. It serves as the immutable visual and interaction contract for building the upcoming **Finance Module**.

In accordance with core repository directives:

1. **Single Source of Truth**: The existing Stage 1 Admission UI/UX defines all visual tokens, typographic rules, layout grids, components, and workflow patterns.
2. **Zero Visual Reinvention**: The Finance module must look and behave as if it were designed and coded by the exact same product team, using the exact same components and tokens, immediately following Stage 1.
3. **Monochrome High-Contrast Baseline with Brand Teal Accents**: The signature EduTrack ERP aesthetic pairs a pure light/dark base surface with an authoritative black-and-white high-contrast active state and a rich editorial teal primary accent (`hsl(181 83% 13.7%)` / `#063F40`).

---

## A. Application Shell

The application shell provides the foundational chrome and frame for all authenticated ERP operations.

### 1. Root Layout Hierarchy

```text
SidebarProvider (min-h-screen bg-background font-sans text-foreground w-full flex)
  ├── AppSidebar (w-64 collapsible="icon" border-r border-sidebar-border)
  └── SidebarInset (flex-1 flex flex-col min-w-0 bg-background)
        ├── AppNavbar (h-16 sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b)
        └── Main Page Container (<main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 animate-page-entrance">)
              └── Viewport Constraint (<div className="max-w-7xl mx-auto w-full">)
                    └── Page Outlet (<Outlet />)
```

### 2. Top Navigation Bar (`AppNavbar.tsx`)

- **Dimensions**: `height: 4rem` (`h-16`), sticky position (`top-0 z-30`), border bottom (`border-b border-border/80`).
- **Surface**: `bg-card/80 backdrop-blur-md`.
- **Left / Start Zone**:
  - `SidebarTrigger`: `p-2 border border-border/80 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground`.
  - Global Command Search Trigger: Full-width button with leading search icon, placeholder text _"Search applications, documents, fees..."_, and a trailing keyboard shortcut tag `<kbd className="px-2 py-0.5 text-[10px] font-bold text-muted-foreground bg-card rounded-lg border border-border/80 font-mono">Ctrl K</kbd>`.
- **Right / End Zone**:
  - `LanguageSwitcher` (`variant="compact"`).
  - `ThemeSwitcher` (`variant="toggle"`: Accessible one-click single button toggling Light ☀️ and Dark 🌙 modes).
  - `NotificationPopover`: Bell icon button with unread count indicator.
  - Vertical Divider: `h-6 w-[1px] bg-border/80`.
  - `ProfileMenu`: User avatar, display name, role label, and dropdown menu (Profile, Organization, Settings, Logout).

### 3. Breadcrumb Navigation (`Breadcrumb.tsx`)

- **Position**: Mounted below the top navigation or within page headers for deep routes (hidden on top-level root pages).
- **Surface**: `bg-gray-50/50 dark:bg-card/30 border-b border-border/60 px-4 sm:px-6 py-2 text-xs font-medium text-muted-foreground`.
- **Separator**: `ChevronRight className="w-3 h-3 text-muted-foreground/60"`.
- **Active / Leaf Item**: `text-foreground font-bold`.

### 4. Page Title Hierarchy & Containers (`PageLayout.tsx`)

- **`PageContainer`**:
  - `default`: `max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8`.
  - `narrow`: `max-w-4xl mx-auto` (used for single-column multi-step wizards and submission forms).
  - `full`: `w-full` (used for ultra-dense data grids and full-width spreadsheets).
- **`PageHeader` Card**:
  - Elevation card: `bg-white dark:bg-card p-6 rounded-3xl border border-border/80 shadow-xs`.
  - Top mini-badge: `text-[10px] font-black uppercase tracking-wider text-primary border-primary/20`.
  - Title (`h1`): `text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-tight`.
  - Description: `text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed mt-1`.
  - Right Action Cluster: Flex row `gap-2.5 shrink-0` (e.g., Refresh, Export, Create CTA).
- **`SectionHeader`**:
  - `h2`: `text-lg sm:text-xl font-extrabold text-foreground tracking-tight`.
  - Description: `text-xs font-medium text-muted-foreground mt-0.5`.

---

## B. Navigation Structure & Sidebar Behavior

The global sidebar (`AppSidebar.tsx`) manages role-aware ERP workspaces.

### 1. Visual Presentation & Dimensions

- **Expanded Width**: `16rem` (`w-64`).
- **Collapsed Width**: `3rem` (`w-12`).
- **Header**: EduTrack Logo (`w-10 h-10`), "EduTrack" text (`text-sm font-black tracking-tight`), uppercase workspace context label (`text-[10px] font-extrabold uppercase text-muted-foreground`).

### 2. State & Expansion Engine

- Multi-level collapsible tree with persistence (`localStorage` key: `edutrack.sidebar.expanded`).
- Automated ancestor auto-expansion: matches deep nested routes (e.g. `/app/front-office/fees?status=pending`) and expands the parent category automatically.

### 3. Active & Inactive Visual Tokens

| State                   | Light Mode Visual Token                                                            | Dark Mode Visual Token                                                             |
| :---------------------- | :--------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------- |
| **Direct Active Item**  | `bg-black text-white shadow-xs font-extrabold`                                     | `bg-white text-black shadow-xs font-extrabold`                                     |
| **Active Submenu Tree** | `bg-sidebar-accent/50 text-sidebar-foreground font-bold`                           | `bg-sidebar-accent/50 text-sidebar-foreground font-bold`                           |
| **Inactive Item**       | `text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground` | `text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground` |
| **Submenu Indentation** | `ms-3 ps-2 border-s border-sidebar-border/60 space-y-0.5 my-1`                     | `ms-3 ps-2 border-s border-sidebar-border/60 space-y-0.5 my-1`                     |
| **Corner Radius**       | `rounded-xl`                                                                       | `rounded-xl`                                                                       |

---

## C. Typography System

The typography system is engineered for maximum readability in high-density data environments.

### 1. Font Families

- **Primary Interface Font**: `Plus Jakarta Sans`, falling back to `Noto Sans` (Arabic, Devanagari, Telugu, Tamil, Malayalam), `system-ui`, `-apple-system`, `sans-serif`.
- **Technical & Numeric Font**: `JetBrains Mono`, `ui-monospace`, `Consolas`, `monospace`.
  - Used for: Application IDs, Student Admission Numbers, Invoice Numbers, Transaction References, Monetary Figures, Timestamps, Dates.

### 2. Typographic Scale

| Role / Element              | Tailwind Classes                      | Size / Line-Height | Weight           | Tracking / Casing  |
| :-------------------------- | :------------------------------------ | :----------------- | :--------------- | :----------------- |
| **Hero / Dashboard Metric** | `text-4xl font-black`                 | 36px / 40px        | 900 (Black)      | `tracking-tighter` |
| **Page Title (`h1`)**       | `text-2xl sm:text-3xl font-extrabold` | 24px - 30px / 36px | 800 (Extra Bold) | `tracking-tight`   |
| **Section Title (`h2`)**    | `text-lg sm:text-xl font-extrabold`   | 18px - 20px / 28px | 800 (Extra Bold) | `tracking-tight`   |
| **Card Title (`h3`)**       | `text-xl font-bold`                   | 20px / 28px        | 700 (Bold)       | `tracking-tight`   |
| **Section Subheader**       | `text-xs font-bold uppercase`         | 12px / 16px        | 700 (Bold)       | `tracking-widest`  |
| **Table Column Head**       | `text-[10px] font-black uppercase`    | 10px / 14px        | 900 (Black)      | `tracking-wider`   |
| **Table Body Cell**         | `text-xs font-semibold`               | 12px / 16px        | 600 (Semi Bold)  | Normal             |
| **Control Label**           | `text-xs font-bold uppercase`         | 12px / 16px        | 700 (Bold)       | `tracking-wider`   |
| **Metadata / Helper Text**  | `text-xs font-medium`                 | 12px / 16px        | 500 (Medium)     | Normal             |
| **Pills & Badges**          | `text-[10px] font-black uppercase`    | 10px / 14px        | 900 (Black)      | `tracking-widest`  |
| **Technical Code / ID**     | `font-mono text-[11px] font-bold`     | 11px / 16px        | 700 (Bold)       | `tracking-tight`   |

---

## D. Color System

EduTrack ERP Stage 1 enforces a strict dual-theme color architecture with high-contrast surfaces and calibrated semantic indicators.

### 1. Base Surfaces & Text Tokens

| Token                | Light Mode (Pure White)   | Dark Mode (Pure Black)  | Purpose                               |
| :------------------- | :------------------------ | :---------------------- | :------------------------------------ |
| `--background`       | `0 0% 100%` (`#FFFFFF`)   | `0 0% 0%` (`#000000`)   | Main application canvas background    |
| `--foreground`       | `0 0% 0%` (`#000000`)     | `0 0% 100%` (`#FFFFFF`) | Primary headings and text             |
| `--card`             | `0 0% 100%` (`#FFFFFF`)   | `0 0% 0%` (`#000000`)   | Cards, tables, drawers, dialogs       |
| `--card-foreground`  | `0 0% 0%` (`#000000`)     | `0 0% 100%` (`#FFFFFF`) | Text inside cards                     |
| `--popover`          | `0 0% 100%` (`#FFFFFF`)   | `0 0% 0%` (`#000000`)   | Dropdowns, tooltips, popovers         |
| `--border`           | `220 13% 91%` (`#E2E8F0`) | `0 0% 18%` (`#2E2E2E`)  | Dividers, card borders, table lines   |
| `--input`            | `220 13% 91%` (`#E2E8F0`) | `0 0% 18%` (`#2E2E2E`)  | Form input borders                    |
| `--muted`            | `220 14% 96%` (`#F1F5F9`) | `0 0% 12%` (`#1F1F1F`)  | Secondary backgrounds, inactive pills |
| `--muted-foreground` | `215 16% 45%` (`#64748B`) | `0 0% 65%` (`#A6A6A6`)  | Secondary labels, descriptions        |

### 2. Core Brand & Accent Tokens

- **Brand Teal (`--primary`)**:
  - Light Mode: `hsl(181 83% 13.7%)` (`#063F40`) — Authoritative Deep Teal.
  - Dark Mode: `hsl(173 80% 36%)` — Accessible Bright Teal.
  - Text on Primary: `hsl(0 0% 100%)` (White in Light mode, Black in Dark mode).
- **Brand Gold (`--gold`)**: `hsl(38 72% 66%)` (`#E7B76A`) — Editorial accents and premium highlights.
- **Brand Navy (`--navy`)**: `hsl(190 70% 12%)` — Deep editorial headers and dark mode accents.

### 3. Semantic Status Indicators

| Status                   | Background Token (Light / Dark)            | Text Token (Light / Dark)                    | Border Token         | Usage in ERP                               |
| :----------------------- | :----------------------------------------- | :------------------------------------------- | :------------------- | :----------------------------------------- |
| **Success**              | `bg-emerald-50` / `dark:bg-emerald-950/40` | `text-emerald-700` / `dark:text-emerald-300` | `border-emerald-200` | Approved, Paid, Enrolled, Cleared          |
| **Warning**              | `bg-amber-50` / `dark:bg-amber-950/40`     | `text-amber-700` / `dark:text-amber-300`     | `border-amber-200`   | Pending Review, Payment Due, Waitlisted    |
| **Danger / Breached**    | `bg-red-50` / `dark:bg-rose-950/40`        | `text-red-700` / `dark:text-rose-300`        | `border-red-200`     | Rejected, Overdue, SLA Breached, Cancelled |
| **Information / Action** | `bg-blue-50` / `dark:bg-blue-950/40`       | `text-blue-700` / `dark:text-blue-300`       | `border-blue-200`    | Submitted, Assigned, Under Review          |
| **Process / Evaluation** | `bg-purple-50` / `dark:bg-purple-950/40`   | `text-purple-700` / `dark:text-purple-300`   | `border-purple-200`  | Recommended, Merit Generated, Exam         |

---

## E. Spacing, Elevation & Layout System

### 1. Corner Radius Hierarchy

- **Extra Large Containers (`rounded-3xl` / 24px)**: Outer Page Header cards, Form banner cards, Modals, Slide-over drawers, Floating batch action bars.
- **Standard Containers (`rounded-2xl` / 16px)**: Data tables, KPI cards, form step panels, section cards, confirmation prompts.
- **Interactive Controls (`rounded-xl` / 12px)**: Buttons, text inputs, dropdown selects, search fields, date pickers, sidebar menu items.
- **Mini Elements (`rounded-lg` / 8px & `rounded-full`)**: Checkboxes, KBD badges, status badges, avatar badges, timeline nodes.

### 2. Spacing Scale & Rhythm

- **Page Layout**: `p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8`.
- **Card Padding**: Standard `p-6 sm:p-8`; compact KPI card `p-4 sm:p-5`.
- **Grid Layouts**:
  - KPI Metrics Deck: `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4`.
  - Two-Column Form: `grid grid-cols-1 md:grid-cols-2 gap-6`.
  - Detail Page Asymmetry: `grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start`.

### 3. Shadows & Elevations

- **Elevation 0 (Flat)**: Standard cards in light mode with explicit borders (`border border-border/80 shadow-xs`).
- **Elevation 1 (Hover / Floating Controls)**: `shadow-sm` and `hover:scale-[1.01] hover:shadow-md transition-all`.
- **Elevation 2 (Modals / Drawers / Sticky Bars)**: `shadow-2xl shadow-indigo-900/10` with `backdrop-blur-md`.

---

## F. Component Inventory

### 1. Buttons (`Button.tsx`)

- **Default / Primary**: `bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-xl font-semibold`.
- **High-Impact CTA**: `bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 uppercase tracking-widest text-xs`.
- **Outline**: `border-border bg-background hover:bg-muted text-foreground rounded-xl`.
- **Ghost**: `hover:bg-muted text-foreground rounded-xl`.
- **Destructive**: `bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl`.
- **Standard Heights**: `h-8` (`size="sm"`), `h-10` (`size="default"`), `h-11` (`size="lg"`).

### 2. Form Inputs (`Input.tsx`, `select.tsx`, `textarea.tsx`, `phone-input.tsx`)

- **Container**: `h-10 w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm text-foreground transition-all duration-200 outline-none`.
- **Focus Ring**: `focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40`.
- **Invalid State**: `aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20`.
- **Disabled State**: `disabled:pointer-events-none disabled:bg-muted disabled:opacity-50`.

### 3. Badges & Status Indicators (`Badge.tsx`)

- **Pill Construction**: `inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider`.
- **Variants**: `default`, `secondary`, `destructive`, `outline`, `success`, `warning`, `info`.

### 4. Tabs (`Tabs.tsx`)

- **Container Bar**: `inline-flex h-10 items-center justify-center rounded-xl bg-card border border-border/80 p-1 text-muted-foreground`.
- **Trigger Button**: `rounded-lg px-3.5 py-1.5 text-xs font-semibold text-foreground/80 hover:text-foreground data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black data-[state=active]:shadow-sm data-[state=active]:font-bold`.

### 5. Data Tables (`Table.tsx`)

- **Table Card Wrapper**: `bg-card rounded-2xl border border-border/80 shadow-sm overflow-hidden`.
- **Table Head (`<th>`)**: `h-10 px-4 text-left text-[10px] font-black uppercase tracking-wider text-muted-foreground bg-muted/50 border-b border-border/60`.
- **Table Cell (`<td>`)**: `p-4 align-middle text-xs font-semibold text-foreground border-b border-border/60`.
- **Table Row Hover**: `hover:bg-muted/30 transition-colors group data-[state=selected]:bg-black data-[state=selected]:text-white dark:data-[state=selected]:bg-white dark:data-[state=selected]:text-black`.

### 6. Modals & Dialogs (`Dialog.tsx`)

- **Backdrop**: `bg-gray-900/60 backdrop-blur-md`.
- **Card**: `max-w-md p-6 sm:p-8 rounded-3xl border border-border bg-card shadow-2xl overflow-hidden`.
- **Header Icon Circle**: `w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4` (Green for success, Red for error, Amber for warning).

### 7. Slide-over Drawer

- **Dimensions**: `fixed inset-y-0 right-0 z-50 w-full md:w-[45%] bg-card shadow-2xl transition-transform`.
- **Sticky Header**: Shows title, record ID, SLA aging tag, and close button `X`.
- **Body**: Scrollable full detail view allowing officers to triage without leaving the queue.

### 8. Feedback & Empty States (`EmptyState.tsx`, `PageErrorState`)

- **Empty State**: Centered container with dashed border (`border border-dashed border-border/80 rounded-2xl p-8 sm:p-12`), centered icon in indigo/teal circle (`w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600`), bold title, muted description, and action button.
- **Error State**: Alert card (`bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-3xl p-6 text-red-800 dark:text-red-300`) with title, description, and "Retry" outline button.

---

## G. Form UX Patterns

Forms in Stage 1 handle complex institutional applications and verification records.

1. **Numbered Section Architecture**:
   - Each major logical segment begins with an icon badge and numbered heading:
   ```html
   <div className="flex items-center gap-3 pb-3 border-b-2 border-primary/20">
     <div
       className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold"
     >
       1
     </div>
     <h2 className="text-xl font-bold text-foreground">Section Title</h2>
   </div>
   ```
2. **Field Labeling & Required Treatments**:
   - Label: `text-xs font-bold text-foreground/80 uppercase tracking-wider block mb-1.5`.
   - Mandatory fields explicitly append red asterisk: `<span className="text-destructive">*</span>`.
3. **Form Grid Alignment**:
   - Standard inputs align in 2 columns: `grid grid-cols-1 md:grid-cols-2 gap-6`.
   - Textareas, address blocks, declarations, and upload zones span full width: `md:col-span-2`.
4. **Validation UX**:
   - Inline field errors display below the input: `<p className="text-xs font-semibold text-destructive mt-1 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Error message</p>`.
   - On submit with missing fields: `ApplicationFeedbackModal` displays a summary pill (e.g. _"3 Required Fields Need Attention"_) and smoothly scrolls the user to the first invalid field.
5. **Persistence & Save Draft Pattern**:
   - LocalStorage auto-save periodically syncs dirty forms under key `edutrack_app_draft_${userId}`.
   - Primary submit CTA resides in sticky bottom toolbar or card footer.

---

## H. Table Patterns & Data-Dense ERP Grids

Stage 1 is renowned for high data density without visual clutter.

1. **KPI Summary Deck (Above Tables)**:
   - 3 to 5 summary cards summarize the list (Total Records, Pending Action, Approved/Cleared, Breached/Overdue, Conversion/Rate).
2. **Filter & Search Toolbar**:
   - Single-line responsive flex bar directly above the table.
   - Left: Search input with magnifying glass (`pl-9 text-xs h-9 sm:w-80`).
   - Right: Horizontal segmented filter buttons (`All`, `Pending`, `Approved`, `Rejected`) styled as rounded pills (`px-3 py-1 rounded-xl text-xs font-bold`).
3. **Batch Processing Action Bar**:
   - When one or more rows are selected, a sticky floating banner animates in from the top:
   - `sticky top-4 z-40 bg-indigo-600/95 backdrop-blur text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between`.
   - Contains: selected count indicator, batch action buttons (e.g. _Verify Selected_, _Batch Approve_, _Batch Reject_), and a clear button.
4. **SLA & Aging Indicator**:
   - Dedicated table column indicating time-in-status.
   - Within SLA: `bg-green-50 text-green-600 border-green-100 text-[10px] font-black px-2.5 py-1 rounded-lg border`.
   - Approaching SLA (70%+): `bg-amber-50 text-amber-600 border-amber-100 text-[10px] font-black`.
   - Breached SLA: `bg-red-50 text-red-600 border-red-100 text-[10px] font-black animate-pulse`.
5. **Table Row Action Column**:
   - Right-aligned `Action` column.
   - Primary action: Solid high-contrast button (e.g. _Review_, _Record Decision_, _Collect Fee_).
   - Secondary action: Ghost square icon button (e.g. _Open in Full Page_ `ExternalLink`).
6. **Pagination Footer**:
   - Fixed at table base: Rows-per-page select dropdown (`10`, `25`, `50`), total record counter, and page controls (`Page X of Y` with previous/next chevron buttons).

---

## I. Detail Page UX Patterns

When inspecting an individual application or student, Stage 1 uses a consistent two-column split view.

1. **Header Zone**:
   - Student Name in large bold (`text-3xl font-bold`).
   - Technical reference ID in mono (`font-mono font-extrabold text-primary`).
   - Current Status pill + Login Access status pill.
   - Progress bar showing lifecycle percentage (`Math.round(progressPercent)}% Complete`).
2. **Left Column (Primary Data & Ledger)**:
   - Profile Snapshot (DOB, Gender, Category, Contact info).
   - Itemized Breakdown / Document Checklist / Fee Table.
   - Vertical Audit Trail: Chronological timeline of actions, timestamped with actor name and remarks.
3. **Right Column (Contextual Action Sidebar)**:
   - Visual Lifecycle Stepper (`AdmissionTimeline`): Active and completed milestone steps.
   - "Take Action" Panel: Contextual action buttons conditioned on user roles and current record state.
   - Remarks / Reason Textarea: Mandatory comment input before executing state transitions.
4. **Read-Only Mode for Parents / End-Users**:
   - When viewed by non-officers, all form controls switch to static text labels; no edit buttons or inputs appear.

---

## J. Workflow Patterns

State progressions follow an explicit, reversible, audited cycle:

```text
[Queue / List]
      │
      ▼ (Click Review / Triage)
[Slide-over Drawer OR Detail View]
      │
      ▼ (Review Information & Enter Remarks)
[Trigger Action Button (e.g. Approve, Reject, Clear)]
      │
      ▼ (If Destructive or Final)
[Confirmation Dialog (Dialog / AlertModal)]
      │
      ▼ (Execute API Call with Optimistic State)
[Toast Notification (toast.success)]
      │
      ▼ (Auto-refresh Queue / Next Workflow Stage)
[Queue Hydration & Focus Shift]
```

---

## K. Responsive Rules

EduTrack adapts smoothly across viewport breakpoints without degrading data access:

1. **Desktop (>= 1024px)**:
   - Sidebar visible and expanded (or collapsed to icon mode).
   - Multi-column grids (3–5 metric cards).
   - Full data tables with all columns visible.
   - Side-by-side detail views (Main content + Action sidebar).
2. **Tablet (768px – 1023px)**:
   - Sidebar automatically collapses to icon rail (`w-12`).
   - Metric cards wrap into 2 columns.
   - Tables activate horizontal touch-scrolling (`overflow-x-auto`).
   - Drawers expand to 80% width.
3. **Mobile (< 768px)**:
   - Sidebar moves off-canvas into an accessible slide-out Sheet (`SidebarTrigger`).
   - Metric cards stack in 1 or 2 columns.
   - Table columns prioritize primary identity and status; auxiliary metadata collapses into expandable rows or detail drawer.
   - Form fields stack into a single column (`grid-cols-1`).
   - Modals and drawers expand to full viewport (`w-full inset-0`).

---

## L. UX States Reference

Every component and view in EduTrack accounts for all 5 core UI states:

1. **Loading State**:
   - Card/Table level: Skeleton shimmer lines (`Skeleton`) or centered dual-ring spinner with uppercase tracking prompt (_"Hydrating Queue..."_).
   - Button level: In-button spinner `<Loader2 className="w-4 h-4 animate-spin mr-2" />` with `disabled` attribute.
2. **Empty State**:
   - Renders `<EmptyState />` with semantic icon, clear title (_"No Applications Found"_), helpful description, and optional _"Clear Filters"_ action button.
3. **Error State**:
   - Renders `<PageErrorState />` with retry button, or toast notification displaying the backend error message.
4. **Success State**:
   - Ephemeral: `toast.success("Action completed successfully")`.
   - Permanent: Green verified badge, downloaded PDF receipt, or transition to next queue.
5. **Partial / Incomplete State**:
   - Prominent banner warning user of missing documents or pending requirements before allowing progress.

---

## M. Design Principles

1. **Clarity Over Novelty**: ERP users perform repetitive operational tasks. Predictability and consistency take precedence over experimental UI patterns.
2. **High-Contrast Monochrome Command**: Black-and-white pills and tabs provide immediate visual grounding of active states, leaving color strictly for semantic signals (money, approvals, warnings, errors).
3. **Information Density with Breathing Room**: Tight typography (`10px` table headers, `12px` table cells) paired with generous container padding (`p-6 sm:p-8`) prevents visual exhaustion.
4. **Auditability by Default**: Every critical ERP operation must capture and display who performed the action, when, and with what remarks.
5. **Separation of Read & Write**: High-throughput queues and ledgers must remain fast and decoupled from transactional writes.

---

## N. Rules for Extending the System into Finance

The Finance module will be built directly on top of this Stage 1 reference. All future Finance screens must follow these rules without exception:

### Rule 1: Application Shell & Navigation

- Finance screens MUST reside within `AppShell` and utilize `PageContainer`.
- Finance routes must be registered in `FRONT_OFFICE_NAVIGATION` under the existing role matrix (`FINANCE`, `FINANCE_OFFICER`, `ADMIN`).
- Do NOT introduce an alternate layout, a separate header style, or a secondary navbar.

### Rule 2: Color & Semantic Indicators in Finance

- Currency figures must use `font-mono font-bold text-foreground` prefixed with currency symbol (`₹`).
- **Paid / Cleared / Inflow**: Must use the Emerald success tokens (`bg-emerald-50 text-emerald-700 border-emerald-200`).
- **Pending / Due / Partial**: Must use the Amber warning tokens (`bg-amber-50 text-amber-700 border-amber-200`).
- **Overdue / Defaulter / Penalty / Outflow**: Must use the Red/Rose danger tokens (`bg-red-50 text-red-700 border-red-200`).
- Do NOT invent custom shades of green, gold, or red for finance.

### Rule 3: Ledgers, Fee Structures & Transaction Tables

- All fee ledgers, demand lists, and receipt registers must use the canonical `Table` component with `rounded-2xl border border-border/80`.
- Monetary amounts in tables must be right-aligned with monospace numerals.
- Batch operations (e.g. _Batch Invoice Generation_, _Batch Fee Waiver Approval_) must use the floating `Batch Action Bar` pattern established in Stage 1.

### Rule 4: Invoices & Receipts

- Itemized fee invoices must follow `AdmissionPaymentPanel` (`InvoiceRow` layout, grand total in large bold with mono symbol, download receipt button).
- Financial initialization panels must inherit `PaymentPendingPanel` switch controls and category groupings.

### Rule 5: Modals & Confirmations

- Payment recordings, waiver allocations, and refunds must trigger confirmation dialogs using `Dialog` or `ApplicationFeedbackModal` before committing transactional writes.
