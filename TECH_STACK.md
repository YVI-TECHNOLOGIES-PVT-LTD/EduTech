# EduTrack ERP — Enterprise Technology Matrix (`TECH_STACK.md`)

**Generated Date:** August 5, 2026  
**Source of Truth:** Physical code audit of `package.json` manifests and lockfiles across workspace.

---

## 1. Core Platform Technology Stack

| Technology Layer       | Framework / Technology | Installed Version | Primary Role / Purpose                                  | Status / Lifecycle |
| :--------------------- | :--------------------- | :---------------- | :------------------------------------------------------ | :----------------- |
| **Package Manager**    | `pnpm`                 | `9.15.4`          | Workspace monorepo dependency manager                   | `ACTIVE`           |
| **Build Orchestrator** | `turbo`                | `^2.3.4`          | Monorepo task pipeline execution & caching              | `ACTIVE`           |
| **Language Runtime**   | Node.js                | `>=20.x`          | Server execution runtime                                | `ACTIVE`           |
| **Language**           | TypeScript             | `^5.3.2`          | Static typing across backend, web, mobile, and packages | `ACTIVE`           |
| **Backend Framework**  | Express.js             | `^4.22.1`         | REST API HTTP web application server                    | `ACTIVE`           |
| **Database ORM**       | Prisma Client          | `^5.22.0`         | Type-safe PostgreSQL database ORM client                | `ACTIVE`           |
| **Auth & DB Client**   | Supabase JS SDK        | `^2.39.0`         | User auth session validation & database access          | `ACTIVE`           |
| **Web SPA Framework**  | React                  | `^18.2.0`         | Frontend Web User Interface                             | `ACTIVE`           |
| **Web Build Tool**     | Vite                   | `^5.0.0`          | Web dev server & production bundler                     | `ACTIVE`           |
| **Web Router**         | React Router DOM       | `^6.20.0`         | Client-side routing and navigation                      | `ACTIVE`           |
| **Web State Engine**   | Zustand                | `^4.4.0`          | Client-side global UI state management                  | `ACTIVE`           |
| **Web Data Fetching**  | TanStack React Query   | `^5.101.2`        | Asynchronous API query & cache management               | `ACTIVE`           |
| **Web UI Styling**     | Tailwind CSS           | `^3.3.5`          | Utility-first CSS styling engine                        | `ACTIVE`           |
| **Web UI Primitives**  | Radix UI               | `@radix-ui/*`     | Unstyled accessible UI component primitives             | `ACTIVE`           |
| **Web Charts Engine**  | Recharts               | `^3.7.0`          | SVG React analytics data chart rendering                | `ACTIVE`           |
| **Form Management**    | React Hook Form        | `^7.71.1`         | Form state management & validation binding              | `ACTIVE`           |
| **Validation Engine**  | Zod                    | `^3.22.4`         | Schema validation for DTOs & form fields                | `ACTIVE`           |
| **Mobile Platform**    | Expo                   | `~51.0.28`        | Cross-platform mobile app framework                     | `ACTIVE`           |
| **Mobile Runtime**     | React Native           | `0.74.5`          | Native mobile rendering engine                          | `ACTIVE`           |
| **Mobile Router**      | Expo Router            | `~3.5.24`         | File-based mobile routing engine                        | `ACTIVE`           |
| **Mobile Styling**     | NativeWind             | `^2.0.11`         | Tailwind CSS for React Native                           | `ACTIVE`           |
| **Mobile Storage**     | Expo Secure Store      | `~13.0.2`         | Encrypted native auth key storage                       | `ACTIVE`           |
| **API Testing**        | Newman                 | `^6.2.1`          | Postman integration test execution                      | `ACTIVE`           |

---

## 2. Infrastructure & Security Components

| Security Component                | Installed Package    | Version   | Implementation Details                  |
| :-------------------------------- | :------------------- | :-------- | :-------------------------------------- |
| **HTTP Security Headers**         | `helmet`             | `^7.1.0`  | Express security header middleware      |
| **Cross-Origin Resource Sharing** | `cors`               | `^2.8.5`  | Centralized CORS origin validation      |
| **Rate Limiting**                 | `express-rate-limit` | `^8.2.1`  | Auth & public API rate limit middleware |
| **Gzip Compression**              | `compression`        | `^1.8.1`  | HTTP payload gzip compression           |
| **HTTP Request Logging**          | `morgan`             | `^1.10.0` | HTTP request access logging             |
| **File Upload Handling**          | `multer`             | `^2.0.2`  | Multipart form data upload parser       |

---

## 3. Technology Status & Non-Implemented Components

| Technology / Component            | Documented Status | Reality & Implementation Notes                                               |
| :-------------------------------- | :---------------: | :--------------------------------------------------------------------------- |
| **NestJS Backend**                | `NOT IMPLEMENTED` | No `@nestjs/*` dependencies exist in codebase. Backend is 100% Express 4.22. |
| **Redis Cache / BullMQ**          | `NOT IMPLEMENTED` | Neither `ioredis` nor `bullmq` are installed. Queue/Cache uses Node Map.     |
| **Redux Toolkit / RTK Query**     | `NOT IMPLEMENTED` | State management uses Zustand & TanStack React Query exclusively.            |
| **ECharts**                       | `NOT IMPLEMENTED` | Web chart visualization relies on Recharts (`recharts^3.7.0`).               |
| **Argon2 Password Hashing**       | `NOT IMPLEMENTED` | Password authentication is managed via Supabase Auth service.                |
| **Kubernetes / Terraform / Helm** | `NOT IMPLEMENTED` | Infrastructure uses Docker containerization (`docker-compose.yml`).          |
| **Jest / Supertest / Playwright** | `NOT IMPLEMENTED` | API integration testing is executed via Newman Postman runners.              |

---

## 4. Enterprise Target Stacks & Migration Roadmap

For complete specifications on the target Security, AI/Analytics, Frontend Evolution (Redux Toolkit / RTK Query / ECharts), and Enterprise Integrations (Razorpay, Keycloak, WhatsApp, Microsoft Graph), see:
👉 **[`docs/ROADMAP_AND_TARGET_ARCHITECTURE.md`](file:///c:/Program%20Files/EduTech/docs/ROADMAP_AND_TARGET_ARCHITECTURE.md)**
