# EduTrack ERP — Repository Inventory Ledger

**Generated Date:** August 5, 2026  
**Source of Truth:** Physical workspace inspection of `c:\Program Files\EduTech`

---

## 1. Monorepo Structural Inventory

| Workspace Directory                                                             | Primary Identity            | Framework / Tooling                       | Target Environment                  |
| :------------------------------------------------------------------------------ | :-------------------------- | :---------------------------------------- | :---------------------------------- |
| [`apps/backend`](file:///c:/Program%20Files/EduTech/apps/backend)               | `@edutrack/api` (v0.1.0)    | Express 4.22, TypeScript 5.3, Prisma 5.22 | Node.js Runtime (Port 3000)         |
| [`apps/database`](file:///c:/Program%20Files/EduTech/apps/database)             | Database DDL Schemas        | PostgreSQL 3NF SQL DDL                    | PostgreSQL 15+ / Supabase           |
| [`apps/web_app`](file:///c:/Program%20Files/EduTech/apps/web_app)               | `@edutrack/web` (v0.1.0)    | React 18.2, Vite 5.0, Tailwind CSS 3.3    | Web Browsers (Port 5173 / 80)       |
| [`apps/mobile_app`](file:///c:/Program%20Files/EduTech/apps/mobile_app)         | `@edutrack/mobile` (v1.0.0) | Expo 51.0, React Native 0.74, NativeWind  | iOS / Android Native Apps           |
| [`packages/config`](file:///c:/Program%20Files/EduTech/packages/config)         | `@edutrack/config`          | ESLint, Prettier, TypeScript base configs | Internal Workspace Monorepo Package |
| [`packages/types`](file:///c:/Program%20Files/EduTech/packages/types)           | `@edutrack/types`           | Shared TypeScript domain interfaces       | Internal Workspace Monorepo Package |
| [`packages/ui`](file:///c:/Program%20Files/EduTech/packages/ui)                 | `@edutrack/ui`              | React UI Primitives (Button, Card, Badge) | Internal Workspace Monorepo Package |
| [`packages/validation`](file:///c:/Program%20Files/EduTech/packages/validation) | `@edutrack/validation`      | Shared Zod Validation Schemas             | Internal Workspace Monorepo Package |

---

## 2. Codebase Component Metrics

### Backend (`apps/backend/src`)

- **Total Module Subdirectories:** 9 (`academic`, `admin`, `admission`, `compatibility`, `dashboard`, `departments`, `fees`, `import`, `student`)
- **Infrastructure Folders:** 14 (`auth`, `cache`, `config`, `events`, `jobs`, `lib`, `middleware`, `middlewares`, `modules`, `observability`, `rbac`, `routes`, `utils`, `workflows`)
- **Active Controllers Detected:** 5 Primary Controller files (`admission.controller.ts`, `department.controller.ts`, `import.controller.ts`, `task.controller.ts`, `workflow.controller.ts`) + exported sub-controllers (`applicationController`, `publicApplicationController`).
- **Active Services Detected:** 16 Service modules (`SessionService`, `RoleService`, `JobService`, `SchedulerService`, `WorkerService`, `EventBusService`, `CacheService`, `LoggerService`, `MetricsService`, `AcademicService`, `AdmissionService`, `DepartmentService`, `ImportService`, `NotificationService`, `WorkflowSchedulerService`, `WorkflowService`).
- **Active Middleware Functions:** 8 Middleware components (`authenticate`, `authenticateOptional`, `checkLoginApproval`, `checkPermission`, `requestIdMiddleware`, `rateLimitMiddleware`, `productionMiddleware`, `errorHandlerMiddleware`).

### Web Application (`apps/web_app/src`)

- **Total Top-Level Directories:** 22 (`api`, `app`, `auth`, `components`, `config`, `constants`, `context`, `features`, `hooks`, `i18n`, `layouts`, `lib`, `modules`, `pages`, `rbac`, `routes`, `services`, `store`, `styles`, `theme`, `types`, `utils`)
- **Page Components:** 23 `.tsx` files (`Home`, `About`, `Academics`, `Achievements`, `AdmissionProcess`, `Admissions`, `Campus`, `Contact`, `Dashboard`, `Departments`, `ErrorPages`, `Events`, `Faculty`, `Leadership`, `Login`, `NotFound`, `Notifications`, `PendingApproval`, `Profile`, `Settings`, `StudentLife`, `Unauthorized`, `VisionMission`).
- **Feature Modules:** 7 Domain folders (`admin`, `admission`, `common`, `dashboard`, `fees`, `import`, `student`).

### Mobile Application (`apps/mobile_app`)

- **Expo Router Groups:** 7 Layout groups in `app/` (`(admission)`, `(auth)`, `(common)`, `(parent)`, `(student)`, `(tabs)`, `(teacher)`).
- **Source Architecture Folders:** 15 Directories in `src/` (`assets`, `components`, `config`, `constants`, `core`, `features`, `hooks`, `navigation`, `providers`, `services`, `stores`, `theme`, `types`, `utils`, `validation`).

### Database Platform (`apps/database` & `apps/backend/prisma`)

- **SQL DDL Scripts:** 7 Schema definition files in `apps/database/stage_1/schema/`.
- **Prisma Model File:** 1 Comprehensive schema file (`apps/backend/prisma/schema.prisma` — 6,326 lines).
