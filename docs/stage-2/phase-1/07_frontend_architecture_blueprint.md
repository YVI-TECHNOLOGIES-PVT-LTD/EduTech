# EduTrack ERP — Stage-2 Phase 1: Frontend Architecture Blueprint

**Document ID:** `docs/stage-2/phase-1/07_frontend_architecture_blueprint.md`  
**Phase:** Stage-2 Phase 1: Foundation & Database Contract Verification  
**Author:** Frontend Engineering Lead & Design System Specialist  
**Date:** November 2026  
**Status:** COMPLETE / ARCHITECTURAL BLUEPRINT

---

## 1. Executive Summary

This document establishes the UI architecture, navigation integration, state management, and component blueprints for the frontend implementation of Stage-2 (**Academic Planning & Digital Campus Setup**).

The web application (`apps/web_app`) is built on **React 18**, **Vite**, **Redux Toolkit Query (RTK Query)**, and **Tailwind CSS**. Stage 2 will introduce an academic planning console within the existing School Operations Workspace.

---

## 2. Navigation & Sidebar Architecture

Navigation in EduTrack ERP is metadata-driven:

1. Canonical menu hierarchies are defined in `packages/types/src/core/menu-registry.ts` (`WORKSPACE_MENU_GROUPS`).
2. Mapped to Lucide React icons in `apps/web_app/src/config/menu_registry.ts`.
3. Rendered conditionally based on user permissions by `apps/web_app/src/components/shell/AppSidebar.tsx`.

### 2.1 Proposed Menu Structure for Stage-2

In `packages/types/src/core/menu-registry.ts`, the `grp_academics` menu group will be expanded:

```typescript
{
  id: 'grp_academics',
  title: 'Academic Planning',
  featurePackage: 'ACADEMICS',
  items: [
    {
      id: 'menu_academic_dashboard',
      title: 'Planning Overview',
      route: '/app/academic/overview',
      icon: 'BookOpen',
      permission: 'ACADEMIC_VIEW',
    },
    {
      id: 'menu_academic_years',
      title: 'Sessions & Grades',
      route: '/app/academic/years',
      icon: 'Calendar',
      permission: 'ACADEMIC_SETUP',
    },
    {
      id: 'menu_framework_mapping',
      title: 'Board & Frameworks',
      route: '/app/academic/frameworks',
      icon: 'Award',
      permission: 'ACADEMIC_SETUP',
    },
    {
      id: 'menu_curriculum_designer',
      title: 'Curriculum Designer',
      route: '/app/academic/curriculum',
      icon: 'Sparkles',
      permission: 'ACADEMIC_SETUP',
    },
    {
      id: 'menu_digital_resources',
      title: 'Resource Library',
      route: '/app/academic/resources',
      icon: 'FileText',
      permission: 'ACADEMIC_VIEW',
    },
    {
      id: 'menu_lesson_planning',
      title: 'Lesson Planning',
      route: '/app/academic/lesson-planning',
      icon: 'Clock',
      permission: 'ACADEMIC_VIEW',
    },
    {
      id: 'menu_setup_published',
      title: 'Publish & Setup',
      route: '/app/academic/publish',
      icon: 'ShieldCheck',
      permission: 'ACADEMIC_SETUP',
    },
  ],
}
```

---

## 3. Proposed Frontend Module Structure

All Stage-2 frontend code will be encapsulated under `apps/web_app/src/modules/academic-planning/`:

```text
apps/web_app/src/modules/academic-planning/
├── api/
│   └── academicPlanningApiSlice.ts           # RTK Query API slice
├── components/
│   ├── calendar/                             # Interactive academic calendar matrix
│   │   ├── CalendarGrid.tsx
│   │   └── TermModal.tsx
│   ├── curriculum/                           # AI Curriculum designer components
│   │   ├── UnitOutlineTree.tsx
│   │   ├── OutcomeTaxonomyBadge.tsx
│   │   └── AiCurriculumModal.tsx
│   ├── frameworks/                           # Board & framework matrix
│   │   ├── FrameworkCard.tsx
│   │   └── SubjectGradeMatrix.tsx
│   ├── lesson-plans/                         # AI Lesson plan builder
│   │   ├── LessonActivityTimeline.tsx
│   │   ├── DifferentiationPill.tsx
│   │   └── ExitTicketDrawer.tsx
│   ├── resources/                            # Digital resource grid & previewers
│   │   ├── ResourceCard.tsx
│   │   ├── ResourceUploadModal.tsx
│   │   └── ExternalResourcePreview.tsx
│   └── publish/                              # Academic setup publication wizard
│       ├── EligibilityChecklist.tsx
│       ├── PrePublishDiffSummary.tsx
│       └── PublishSuccessBanner.tsx
├── hooks/
│   ├── useAcademicYear.ts
│   ├── useCurriculumDraft.ts
│   └── useSetupValidation.ts
├── pages/
│   ├── AcademicOverviewPage.tsx              # Landing / Readiness dashboard
│   ├── AcademicYearsPage.tsx                 # Module 1
│   ├── FrameworkMappingPage.tsx              # Module 2
│   ├── CurriculumDesignerPage.tsx            # Module 3
│   ├── DigitalResourceLibraryPage.tsx        # Module 4
│   ├── LessonPlanningPage.tsx                # Module 5
│   └── AcademicSetupPublishPage.tsx          # Module 6
└── types/
    └── academicPlanning.types.ts
```

---

## 4. RTK Query API Slice Architecture

Stage-2 endpoints will inject into the central `apiSlice` (`apps/web_app/src/app/store/apiSlice.ts`), providing automatic tag invalidation and caching:

```typescript
import { apiSlice } from '@/app/store/apiSlice';

export const academicPlanningApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAcademicOverview: builder.query<any, { academicYearId?: string }>({
      query: (params) => ({
        url: '/v1/academic/overview',
        params,
      }),
      providesTags: ['AcademicSetup'],
    }),

    getAcademicYears: builder.query<any, void>({
      query: () => '/v1/academic/years',
      providesTags: ['AcademicYears'],
    }),

    generateCurriculum: builder.mutation<any, any>({
      query: (body) => ({
        url: '/v1/academic/curriculum/ai-generate',
        method: 'POST',
        body,
      }),
    }),

    validateSetupEligibility: builder.query<any, { academicYearId: string }>({
      query: ({ academicYearId }) =>
        `/v1/academic/setup/validate?academic_year_id=${academicYearId}`,
      providesTags: ['AcademicSetup'],
    }),

    publishAcademicSetup: builder.mutation<any, { academicYearId: string }>({
      query: (body) => ({
        url: '/v1/academic/setup/publish',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AcademicSetup', 'AcademicYears'],
    }),
  }),
});

export const {
  useGetAcademicOverviewQuery,
  useGetAcademicYearsQuery,
  useGenerateCurriculumMutation,
  useValidateSetupEligibilityQuery,
  usePublishAcademicSetupMutation,
} = academicPlanningApiSlice;
```

---

## 5. Frontend Readiness Assessment Matrix

| Functional Area     | Existing Implementation   | Reusable Assets                                | Implementation Gap                              | Recommendation                                                |
| ------------------- | ------------------------- | ---------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------- |
| **Design System**   | Tailwind CSS + Radix UI   | Buttons, Dialogs, Drawers, Tabs, Dropdowns     | Specialized timeline component for lesson flow  | Compose using Tailwind + Radix Slider                         |
| **Form Management** | `react-hook-form` + `zod` | Input fields, Select dropdowns, Error labels   | Multi-step curriculum wizard form state         | Implement using `react-hook-form` with step-based Zod schemas |
| **Data Tables**     | `@tanstack/react-table`   | Pagination, sorting, column filters            | Matrix grid for Subject-Grade framework mapping | Build 2D grid component on TanStack Table                     |
| **Media Previews**  | Basic image/PDF viewer    | Document verification previewer                | Audio/Video/YouTube embed previewer             | Add sanitized iframe wrapper and HTML5 video modal            |
| **Data Fetching**   | RTK Query (`apiSlice.ts`) | Auto-caching, optimistic updates, auth headers | Stage-2 endpoint slice                          | Inject endpoints via `academicPlanningApiSlice.ts`            |
| **Feedback UI**     | `sonner` toasts           | Success/Error toasts                           | AI generation streaming state indicators        | Create AI Progress & Shimmer Card components                  |
