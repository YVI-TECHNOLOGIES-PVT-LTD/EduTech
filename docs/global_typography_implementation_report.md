# EduTrack ERP — Global Typography Implementation Report

## Production-Safe Frontend Typography System Upgrade

---

### 1. Font Selected

- **Primary UI Font**: `Plus Jakarta Sans`
  - High-clarity geometric sans-serif optimized for modern enterprise SaaS, dashboards, and EdTech portals.
- **Technical / Identifier Font**: `JetBrains Mono`
  - High-legibility monospaced typeface designed for precise technical identifiers, reference codes, application numbers, receipts, and tabular metrics.

---

### 2. Font Packages Installed

Self-hosted and bundled via `pnpm` (no external runtime CDN dependencies or privacy concerns):

- `@fontsource/plus-jakarta-sans` (`^5.2.8`)
- `@fontsource/jetbrains-mono` (`^5.2.6`)

---

### 3. Font Weights Loaded

Only the essential production weights were imported to optimize bundle size and prevent layout shifts:

- **Plus Jakarta Sans**:
  - `400` (Regular)
  - `500` (Medium)
  - `600` (SemiBold)
  - `700` (Bold)
- **JetBrains Mono**:
  - `400` (Regular)
  - `500` (Medium)
  - `600` (SemiBold)

---

### 4. Global Font Configuration

Canonical imports consolidated into [`apps/web_app/src/styles/globals.css`](file:///C:/Users/DELL/Desktop/EduTech/apps/web_app/src/styles/globals.css):

```css
@import '@fontsource/plus-jakarta-sans/400.css';
@import '@fontsource/plus-jakarta-sans/500.css';
@import '@fontsource/plus-jakarta-sans/600.css';
@import '@fontsource/plus-jakarta-sans/700.css';

@import '@fontsource/jetbrains-mono/400.css';
@import '@fontsource/jetbrains-mono/500.css';
@import '@fontsource/jetbrains-mono/600.css';

html,
body,
#root {
  font-family: var(--font-sans);
  color: rgb(var(--foreground-rgb));
  background: #f8fafc;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

button,
input,
optgroup,
select,
textarea {
  font-family: inherit;
}
```

---

### 5. Tailwind Configuration

Safely merged into [`apps/web_app/tailwind.config.ts`](file:///C:/Users/DELL/Desktop/EduTech/apps/web_app/tailwind.config.ts):

```typescript
fontFamily: {
    sans: ["var(--font-sans)", "Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
    mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
    display: ["var(--font-sans)", "Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
},
```

---

### 6. CSS Variables

Configured in `:root` inside [`apps/web_app/src/styles/globals.css`](file:///C:/Users/DELL/Desktop/EduTech/apps/web_app/src/styles/globals.css) and [`apps/web_app/src/theme/typography.ts`](file:///C:/Users/DELL/Desktop/EduTech/apps/web_app/src/theme/typography.ts):

```css
:root {
  --font-sans:
    'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    Roboto, 'Helvetica Neue', Arial, sans-serif;
  --font-mono:
    'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
}
```

---

### 7. Components Affected

1. **Public & Landing Pages**:
   - Hero, Navigation, Feature cards, Testimonials, Footer ([`landing.css`](file:///C:/Users/DELL/Desktop/EduTech/apps/web_app/src/styles/landing.css)).
2. **Authentication Pages**:
   - Split AuthLayout, Login, Registration, Password Reset, OTP verification ([`input-otp.tsx`](file:///C:/Users/DELL/Desktop/EduTech/apps/web_app/src/components/ui/input-otp.tsx)).
3. **Parent Portal**:
   - Parent Dashboard, My Applications ([`MyApplications.tsx`](file:///C:/Users/DELL/Desktop/EduTech/apps/web_app/src/modules/admission/pages/MyApplications.tsx)), Application Status ([`ApplicationStatusCard.tsx`](file:///C:/Users/DELL/Desktop/EduTech/apps/web_app/src/modules/admission/components/ApplicationStatusCard.tsx), [`ParentAdmissionStatusPage.tsx`](file:///C:/Users/DELL/Desktop/EduTech/apps/web_app/src/modules/admission/pages/parent/ParentAdmissionStatusPage.tsx)), Read-Only Application View ([`ParentReadOnlyApplicationView.tsx`](file:///C:/Users/DELL/Desktop/EduTech/apps/web_app/src/modules/admission/components/parent/ParentReadOnlyApplicationView.tsx)), Document Center ([`ParentDocumentCenterPage.tsx`](file:///C:/Users/DELL/Desktop/EduTech/apps/web_app/src/modules/admission/pages/parent/ParentDocumentCenterPage.tsx)), Fee Payment Statement ([`ParentFeePaymentPage.tsx`](file:///C:/Users/DELL/Desktop/EduTech/apps/web_app/src/modules/admission/pages/parent/ParentFeePaymentPage.tsx)).
4. **Front Office & Staff Workspaces**:
   - Applicant 360 Profile ([`ProfileHeader.tsx`](file:///C:/Users/DELL/Desktop/EduTech/apps/web_app/src/modules/admission/components/profile360/ProfileHeader.tsx)), Applications Management ([`ApplicationsManagementPage.tsx`](file:///C:/Users/DELL/Desktop/EduTech/apps/web_app/src/modules/admission/pages/front-office/ApplicationsManagementPage.tsx)), Document Verification Center ([`DocumentVerificationPage.tsx`](file:///C:/Users/DELL/Desktop/EduTech/apps/web_app/src/modules/admission/pages/front-office/DocumentVerificationPage.tsx)), Fee Collection Workspace ([`FeeCollectionPage.tsx`](file:///C:/Users/DELL/Desktop/EduTech/apps/web_app/src/modules/admission/pages/front-office/FeeCollectionPage.tsx), [`AdmissionFeeReceiptDialog.tsx`](file:///C:/Users/DELL/Desktop/EduTech/apps/web_app/src/modules/admission/components/fee/AdmissionFeeReceiptDialog.tsx)).
5. **Shared UI & Reporting**:
   - Data Grids & Export Menus ([`GridExportMenu.tsx`](file:///C:/Users/DELL/Desktop/EduTech/apps/web_app/src/modules/common/datagrid/GridExportMenu.tsx)), Print Reports ([`PrintPreview.tsx`](file:///C:/Users/DELL/Desktop/EduTech/apps/web_app/src/modules/common/reports/PrintPreview.tsx)), Fee Receipts ([`ReceiptCenter.tsx`](file:///C:/Users/DELL/Desktop/EduTech/apps/web_app/src/modules/fees/pages/ReceiptCenter.tsx)).

---

### 8. Old Fonts Removed

- Removed runtime `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display...&family=Inter...')` from `landing.css`.
- Replaced fragmented `font-family: 'Inter', sans-serif` and `Playfair Display` declarations with unified `var(--font-sans)`.
- Replaced unstyled browser defaults in print templates with `Plus Jakarta Sans` and `JetBrains Mono`.

---

### 9. JetBrains Mono Usage

Applied selectively and strictly to technical/identifier data fields:

- Application Numbers (e.g. `APP-2026-00369`, `APP-PENDING`)
- Receipt Numbers (e.g. `REC-ADM-2026-00042`)
- Transaction / UTR References
- Table Serial Numbers (S.NO)
- OTP Input Slots
- Contact Phone Numbers on receipts

---

### 10. Accessibility Verification

- **Contrast Ratios**: Preserved 100% of the existing EduTrack deep emerald (`#063F40`) and gold (`#E7B76A`) palette.
- **Legibility**: Plus Jakarta Sans delivers larger x-height and open apertures, improving small label reading (11px–13px) and form inputs.
- **Focus Rings**: Preserved default and theme-based outline focus indicators.
- **Semantic Hierarchy**: Clear distinctions between 700 (Bold headings), 600 (Section headers & button labels), 500 (Form labels & navigation items), and 400 (Body copy & secondary metadata).

---

### 11. Responsive Verification

- **Desktop (1920x1080 / 1440x900)**: Clean typographic grid, crisp tabular alignment, and zero overflow.
- **Tablet (768x1024)**: Responsive header scaling with seamless flex wrapping.
- **Mobile (375x667)**: Input text, badges, and button labels fit standard viewport widths without truncation or horizontal scroll.

---

### 12. Typecheck Result

- **Command**: `pnpm --filter @edutrack/web run typecheck` (`tsc --noEmit`)
- **Status**: **PASS (0 errors)**

---

### 13. Build Result

- **Command**: `pnpm --filter @edutrack/web run build` (`tsc && vite build`)
- **Status**: **PASS (built in 26.18s, all woff/woff2 font assets bundled)**

---

### 14. Governance & Safety Metrics

- **Backend changes**: **0**
- **Database changes**: **0**
- **Prisma changes**: **0**
- **Migration changes**: **0**

---

### Final Status

# **GLOBAL TYPOGRAPHY IMPLEMENTATION — PASS**
