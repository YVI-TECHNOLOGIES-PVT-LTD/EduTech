# EduTrack ERP — Frontend Architecture (`FRONTEND_ARCHITECTURE.md`)

**Generated Date:** August 5, 2026  
**Source of Truth:** Physical code audit of [`apps/web_app/src/`](file:///c:/Program%20Files/EduTech/apps/web_app/src).

---

## 1. Web Application Component Architecture

```
                          +-------------------------+
                          |   Vite SPA Entrypoint   |
                          |      (main.tsx)         |
                          +------------+------------+
                                       |
                                       v
                          +-------------------------+
                          |  React Router DOM v6    |
                          |     (App Routes)        |
                          +------------+------------+
                                       |
           +---------------------------+---------------------------+
           |                                                       |
           v                                                       v
+-------------------------+                             +-------------------------+
|    Public Route Tree    |                             |  Protected Route Tree   |
| (Home, Login, Admissions)|                            | (Dashboard, Admin, Fees)|
+------------+------------+                             +------------+------------+
             |                                                       |
             +---------------------------+---------------------------+
                                         |
                                         v
                          +-------------------------+
                          | Component & Layout Layer|
                          | - Radix UI Primitives   |
                          | - Tailwind CSS          |
                          | - Recharts Visualization|
                          +------------+------------+
                                       |
                   +-------------------+-------------------+
                   |                                       |
                   v                                       v
+------------------------------------+   +------------------------------------+
|       Zustand State Store          |   |     TanStack React Query           |
|  - Client-side UI & Auth Store     |   |  - API Server Query & Cache Hooks  |
+------------------------------------+   +------------------------------------+
```

---

## 2. Page & Feature Module Distribution

| Module Area           | Path Location                                                                                 | Key Components / Features                                                                                        |
| :-------------------- | :-------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------- |
| **Pages Catalog**     | [`apps/web_app/src/pages`](file:///c:/Program%20Files/EduTech/apps/web_app/src/pages)         | 23 Top-level views (`Home`, `Dashboard`, `Admissions`, `Faculty`, `Departments`, `Login`, `Profile`, `Settings`) |
| **Domain Modules**    | [`apps/web_app/src/modules`](file:///c:/Program%20Files/EduTech/apps/web_app/src/modules)     | 7 Modular directories (`admin`, `admission`, `common`, `dashboard`, `fees`, `import`, `student`)                 |
| **Shared Primitives** | [`packages/ui/src/components`](file:///c:/Program%20Files/EduTech/packages/ui/src/components) | UI primitives (`Button`, `Card`, `Badge`) shared across workspaces                                               |
