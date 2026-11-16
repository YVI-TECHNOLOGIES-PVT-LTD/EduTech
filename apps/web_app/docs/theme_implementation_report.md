# EduTrack ERP — Global Theme System Implementation Report

**Document Version:** 1.1.0  
**Implementation Phase:** Stage-1 Complete UI Theme Migration (Pure Black & Pure White + One-Click Toggle Refinement)  
**Target Application:** `apps/web_app`  
**Compliance Standard:** EduTrack ERP Architectural Blueprint & Visual Guidelines

---

## 1. Executive Summary & Design System Integrity

The EduTrack ERP Global Theme System provides a centralized, robust, accessible, and high-performance theme architecture across all public, authentication, and authenticated portal surfaces.

### Key Objectives Accomplished:

- **Exact Pure Base Surfaces:**
  - **Light Mode:** `--background: #FFFFFF` (`0 0% 100%`), `--card: #FFFFFF`, `--popover: #FFFFFF`, `--foreground: #000000` (`0 0% 0%`).
  - **Dark Mode:** `--background: #000000` (`0 0% 0%`), `--card: #000000`, `--popover: #000000`, `--foreground: #FFFFFF` (`0 0% 100%`).
  - No navy or off-white tints used for primary viewport backgrounds or card bases.
- **One-Click Theme Toggle UX:**
  - Completely eliminated theme dropdowns and popovers from all navbars and headers.
  - Navbar button is a direct, accessible single-click toggle: Sun (☀️) in Light mode → switches to Dark; Moon (🌙) in Dark mode → switches to Light.
  - If configured as `system`, clicking immediately resolves the current OS mode and switches to the explicit opposite.
- **Zero Redesign / Complete Visual Continuity:** Preserved 100% of established EduTrack visual identity, brand teal (`#063F40`), accents (`#E7B76A`), typography hierarchy (Plus Jakarta Sans as UI font, JetBrains Mono as Technical/Identifier font), layout structures, and status indicators.
- **Single Source of Truth:** Centralized in React Context (`ThemeContext.tsx`) and persisted in `localStorage` under canonical key `edutrack-theme` with backwards compatibility.
- **Strict Database Freeze:** 0 backend DDL, Prisma schema modifications, SQL migrations, or API changes.

---

## 2. Flash-Prevention Bootstrap (`index.html`)

To prevent FOIT/FOUC when a user reloads or opens the application in Dark or System preference, a synchronous pre-render execution script in the `<head>` of [index.html](file:///c:/edutech/EduTech/apps/web_app/index.html) evaluates stored or system preferences and sets the `.dark` class and `style.colorScheme` on `document.documentElement` before React mounts.

```html
<script>
  (function () {
    try {
      var STORAGE_KEY = 'edutrack-theme';
      var LEGACY_KEY = 'erp-theme';
      var stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY);
      var isDark = false;
      if (stored === 'dark') {
        isDark = true;
      } else if (stored === 'light') {
        isDark = false;
      } else {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      }
    } catch (e) {}
  })();
</script>
```

---

## 3. CSS Semantic Design Tokens (`globals.css`)

### Exact Token Mapping Table

| Semantic Token         | Light Mode (Pure White)     | Dark Mode (Pure Black)  | Purpose / UI Surface                   |
| :--------------------- | :-------------------------- | :---------------------- | :------------------------------------- |
| `--background`         | `0 0% 100%` (`#FFFFFF`)     | `0 0% 0%` (`#000000`)   | Base viewport background               |
| `--foreground`         | `0 0% 0%` (`#000000`)       | `0 0% 100%` (`#FFFFFF`) | Primary text and headings              |
| `--card`               | `0 0% 100%` (`#FFFFFF`)     | `0 0% 0%` (`#000000`)   | Elevation-1 surfaces, cards, widgets   |
| `--card-foreground`    | `0 0% 0%` (`#000000`)       | `0 0% 100%` (`#FFFFFF`) | Text on card surfaces                  |
| `--popover`            | `0 0% 100%` (`#FFFFFF`)     | `0 0% 0%` (`#000000`)   | Popovers, command palette, menus       |
| `--popover-foreground` | `0 0% 0%` (`#000000`)       | `0 0% 100%` (`#FFFFFF`) | Text on popovers                       |
| `--primary`            | `181 83% 13.7%` (`#063F40`) | `173 80% 36%`           | Primary brand action color             |
| `--primary-foreground` | `0 0% 100%` (`#FFFFFF`)     | `0 0% 0%` (`#000000`)   | High-contrast text on primary buttons  |
| `--muted`              | `220 14% 96%`               | `0 0% 12%` (`#1f1f1f`)  | Secondary surface, chips, badges       |
| `--muted-foreground`   | `215 16% 45%`               | `0 0% 65%` (`#a6a6a6`)  | Subtle labels, timestamps, metadata    |
| `--border`             | `220 13% 91%`               | `0 0% 18%` (`#2e2e2e`)  | Card borders, dividers, inputs         |
| `--input`              | `220 13% 91%`               | `0 0% 18%` (`#2e2e2e`)  | Form control borders                   |
| `--sidebar-background` | `0 0% 100%` (`#FFFFFF`)     | `0 0% 0%` (`#000000`)   | Navigation sidebar surface             |
| `--sidebar-foreground` | `0 0% 0%` (`#000000`)       | `0 0% 100%` (`#FFFFFF`) | Navigation text and icons              |
| `--sidebar-primary`    | `181 83% 13.7%`             | `173 80% 36%`           | Active sidebar item indicator          |
| `--success`            | `142 71% 45%`               | `142 70% 50%`           | Positive statuses, paid fees           |
| `--warning`            | `38 92% 50%`                | `38 92% 55%`            | Pending actions, warnings              |
| `--destructive`        | `0 84% 60%`                 | `0 72% 56%`             | Errors, delete actions, overdue alerts |

---

## 4. Theme Context & Provider Architecture (`ThemeContext.tsx`)

Managed inside [ThemeContext.tsx](file:///c:/edutech/EduTech/apps/web_app/src/context/ThemeContext.tsx):

- State values: `'light' | 'dark' | 'system'`.
- Dynamic `matchMedia('(prefers-color-scheme: dark)')` listener handles real-time OS preference changes.
- Cross-tab synchronization via `window.addEventListener('storage', ...)`.
- Dual-write persistence (`edutrack-theme` and `erp-theme`).
- Updates `document.documentElement.classList.toggle('dark', isDark)` and `document.documentElement.style.colorScheme`.

---

## 5. One-Click `ThemeSwitcher` Component (`ThemeSwitcher.tsx`)

Implemented in [ThemeSwitcher.tsx](file:///c:/edutech/EduTech/apps/web_app/src/components/theme/ThemeSwitcher.tsx):

- **Navbar/Header Default (`variant="toggle"`):**
  - Renders a clean semantic `<Button>` with Sun or Moon icon.
  - Zero dropdown menus or popovers.
  - One click immediately toggles between Light and Dark mode.
  - Full keyboard accessibility: `type="button"`, `aria-label="Switch to dark mode"` / `"Switch to light mode"`, `title`, and visible focus rings.
- **Settings/Preferences Mode (`variant="segmented"`):**
  - Preserved multi-option radiogroup (`Light | Dark | System`) with ARIA attributes for the Settings page.

---

## 6. Layout & Portal Integrations

1. **Top Application Navbar ([AppNavbar.tsx](file:///c:/edutech/EduTech/apps/web_app/src/components/shell/AppNavbar.tsx)):** Single-click icon toggle next to the notification bell.
2. **Settings Appearance Section ([Settings.tsx](file:///c:/edutech/EduTech/apps/web_app/src/pages/Settings.tsx)):** Retains 3-option selector (`Light | Dark | System`) and semantic `bg-card` surfaces.
3. **Public & Landing Navbars ([PublicNavbar.tsx](file:///c:/edutech/EduTech/apps/web_app/src/components/layout/PublicNavbar.tsx) & [Navbar.tsx](file:///c:/edutech/EduTech/apps/web_app/src/features/landing/components/Navbar.tsx)):** Single-click icon toggle embedded while retaining intentional brand colors (`#063F40` and `#042A2B`).
4. **Header Framework ([HeaderFramework.tsx](file:///c:/edutech/EduTech/apps/web_app/src/components/layout/HeaderFramework.tsx)):** One-click toggle with semantic background tokens.
5. **Command Palette ([CommandPalette.tsx](file:///c:/edutech/EduTech/apps/web_app/src/components/search/CommandPalette.tsx)):** Uses `bg-popover text-popover-foreground border-border`.
6. **Parent Portal & Front Office Desks ([ParentDashboardPage.tsx](file:///c:/edutech/EduTech/apps/web_app/src/modules/admission/pages/parent/ParentDashboardPage.tsx) & [SchoolOperationsWorkspace.tsx](file:///c:/edutech/EduTech/apps/web_app/src/pages/SchoolOperationsWorkspace.tsx)):** Full semantic token compliance.

---

## 8. Global Sidebar Pure Black / Pure White Theme Standardization

### Exact Sidebar Color Rules

| Mode      | Surface / Element                 | Applied Color Token                                | Visual Presentation                             |
| :-------- | :-------------------------------- | :------------------------------------------------- | :---------------------------------------------- |
| **LIGHT** | Sidebar Background                | `#FFFFFF` (`0 0% 100%`)                            | Pure White surface                              |
| **LIGHT** | Inactive Item Background          | `transparent` / `#FFFFFF`                          | Blends cleanly with sidebar                     |
| **LIGHT** | Inactive Text & Icons             | `#000000` (`0 0% 0%`)                              | High-contrast Pure Black                        |
| **LIGHT** | **Active Item (Parent & Single)** | **`#000000` Background + `#FFFFFF` Text/Icons**    | High-contrast Pure Black pill with white glyphs |
| **LIGHT** | **Active Submenu Item**           | **`#000000` Background + `#FFFFFF` Text/Icons**    | High-contrast Pure Black pill with white glyphs |
| **LIGHT** | Inactive Hover State              | `hover:bg-neutral-100` / `hover:bg-sidebar-accent` | Subtle neutral hover without color tint         |
| **DARK**  | Sidebar Background                | `#000000` (`0 0% 0%`)                              | Pure Black surface                              |
| **DARK**  | Inactive Item Background          | `transparent` / `#000000`                          | Blends cleanly with sidebar                     |
| **DARK**  | Inactive Text & Icons             | `#FFFFFF` (`0 0% 100%`)                            | High-contrast Pure White                        |
| **DARK**  | **Active Item (Parent & Single)** | **`#FFFFFF` Background + `#000000` Text/Icons**    | High-contrast Pure White pill with black glyphs |
| **DARK**  | **Active Submenu Item**           | **`#FFFFFF` Background + `#000000` Text/Icons**    | High-contrast Pure White pill with black glyphs |
| **DARK**  | Inactive Hover State              | `hover:bg-neutral-900` / `hover:bg-sidebar-accent` | Subtle neutral hover without color tint         |

---

## 9. Quality Assurance & Verification Matrix

| Verification Check               | Standard                            | Result                                |
| :------------------------------- | :---------------------------------- | :------------------------------------ |
| **Light Mode Base Surface**      | `#FFFFFF` (`0 0% 100%`)             | ✅ **PASS**                           |
| **Light Mode Base Foreground**   | `#000000` (`0 0% 0%`)               | ✅ **PASS**                           |
| **Dark Mode Base Surface**       | `#000000` (`0 0% 0%`)               | ✅ **PASS**                           |
| **Dark Mode Base Foreground**    | `#FFFFFF` (`0 0% 100%`)             | ✅ **PASS**                           |
| **Sidebar Active State (Light)** | `#000000` bg + `#FFFFFF` text/icons | ✅ **PASS**                           |
| **Sidebar Active State (Dark)**  | `#FFFFFF` bg + `#000000` text/icons | ✅ **PASS**                           |
| **Theme Dropdown UI in Navbar**  | Completely Removed                  | ✅ **PASS (One-Click Toggle)**        |
| **Settings 3-Option Selector**   | `Light \| Dark \| System`           | ✅ **PASS (Preserved)**               |
| **Cross-Tab Synchronization**    | Storage event listener              | ✅ **PASS**                           |
| **Anti-Flash Bootstrap**         | Synchronous pre-render script       | ✅ **PASS**                           |
| **TypeScript Typecheck**         | `tsc --noEmit`                      | ✅ **PASS (0 errors, code 0)**        |
| **Production Build**             | `vite build`                        | ✅ **PASS (Built in 11.42s, code 0)** |
| **Backend & Database Freeze**    | Zero DDL/Prisma/API mutations       | ✅ **PASS (0 modifications)**         |
