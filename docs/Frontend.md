# EduTrack ERP Frontend Architecture Guide

## Tech Stack & Libraries

- **Framework**: React 19 + TypeScript (Strict Mode)
- **State Management**: Redux Toolkit (`@reduxjs/toolkit`)
- **Data Fetching**: RTK Query (`apiSlice.ts`)
- **Routing**: React Router v7 (`react-router-dom`) with `React.lazy` bundle splitting
- **Form System**: React Hook Form + Zod (`FormBuilder.tsx`)
- **Data Tables**: TanStack Table (`@tanstack/react-table` in `EnterpriseDataTable.tsx`)
- **Icons & Styling**: Lucide React + Tailwind CSS + Vanilla CSS Tokens

---

## Directory Layout

```text
src/
├── app/                  # Store, base query, declarative routes
├── config/               # Environment, app, api, feature flags
├── theme/                # Design tokens (colors, typography, spacing)
├── shared/               # Reusable API SDK, auth hooks, components, forms
└── features/             # Feature modules
    ├── auth/
    ├── dashboard/
    ├── organization/
    ├── users/
    ├── roles/
    ├── hr/
    ├── academics/
    ├── crm/
    ├── admissions/
    ├── students/
    ├── settings/
    ├── reports/
    └── audit/
```
