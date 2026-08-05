# EduTrack ERP — Target Architecture & Integration Roadmap (`ROADMAP_AND_TARGET_ARCHITECTURE.md`)

**Generated Date:** August 5, 2026  
**Status:** Target Blueprint / Enterprise Roadmap Specifications  
**Principle:** Clear separation between **Current Active Realization** and **Planned Enterprise Target Stacks**.

---

## 1. Target Security Stack

| Security Layer       | Planned / Target Technology | Architectural Rationale ("Why") | Current Active Reality                                  |
| :------------------- | :-------------------------- | :------------------------------ | :------------------------------------------------------ |
| **Authentication**   | JWT + Refresh Tokens        | Secure sessions                 | Implemented via Supabase Auth JWT                       |
| **Authorization**    | RBAC + ABAC                 | Fine-grained permissions        | RBAC middleware active; ABAC dynamic engine roadmap     |
| **Password Hashing** | Argon2                      | Strong password security        | Delegated to Supabase Auth provider                     |
| **Rate Limiting**    | `@nestjs/throttler` + Redis | Abuse prevention                | Express-rate-limit active; Redis/Nest throttler roadmap |
| **Security Headers** | Helmet                      | HTTP hardening                  | Active via Express `helmet^7.1.0`                       |
| **Input Validation** | `class-validator` / `Zod`   | Prevent invalid input           | Active via `zod^3.22.4` in `@edutrack/validation`       |
| **Audit Logs**       | Custom Audit Service        | Compliance & traceability       | Active via `audit.middleware.ts` & `audit_log_entries`  |

---

## 2. Target Frontend Stack & Evolution Strategy

| Layer                | Target Technology    | Architectural Rationale ("Why")              | Current Active Status & Notes                                                             |
| :------------------- | :------------------- | :------------------------------------------- | :---------------------------------------------------------------------------------------- |
| **Framework**        | React 19 / 18        | Enterprise UI ecosystem                      | Active (`react^18.2.0`)                                                                   |
| **Build Tool**       | Vite                 | Fast development and builds                  | Active (`vite^5.0.0`)                                                                     |
| **Language**         | TypeScript           | Type safety                                  | Active (`typescript^5.3.2`)                                                               |
| **Routing**          | React Router         | Standard SPA routing                         | Active (`react-router-dom^6.20.0`)                                                        |
| **State Management** | Redux Toolkit        | Enterprise global state                      | Currently active via Zustand (`zustand^4.4.0`); Redux migration target                    |
| **Server State**     | RTK Query            | Caching & synchronization (pairs with Redux) | Currently active via TanStack Query (`@tanstack/react-query`); RTK Query migration target |
| **Forms**            | React Hook Form      | High-performance forms                       | Active (`react-hook-form^7.71.1`)                                                         |
| **Validation**       | Zod                  | Strong schema validation                     | Active (`zod^3.22.0`)                                                                     |
| **UI Components**    | Shadcn/UI + Radix UI | Accessible and customizable                  | Active (`@radix-ui/react-*`)                                                              |
| **Styling**          | Tailwind CSS         | Utility-first styling                        | Active (`tailwindcss^3.3.5`)                                                              |
| **Charts**           | Apache ECharts       | Enterprise dashboards                        | Currently active via Recharts (`recharts^3.7.0`); ECharts migration target                |
| **Icons**            | Lucide React         | Consistent icon set                          | Active (`lucide-react^0.563.0`)                                                           |

---

## 3. Target AI & Analytics Stack

| Layer               | Target Technology      | Architectural Rationale ("Why") | Implementation Roadmap                      |
| :------------------ | :--------------------- | :------------------------------ | :------------------------------------------ |
| **AI Services**     | Python + FastAPI       | Best AI/ML ecosystem            | Planned AI Microservice Layer               |
| **LLM Integration** | OpenAI API             | Natural language features       | Planned Chatbot & Admissions Assistant      |
| **AI Framework**    | LangChain              | AI orchestration                | Planned Workflow & Agentic Pipeline         |
| **Data Processing** | Pandas                 | Analytics                       | Planned Data Pipeline                       |
| **ML Models**       | Scikit-learn / PyTorch | Predictive features             | Planned Lead Scoring & Attrition Prediction |

---

## 4. Future Enterprise Integrations Matrix

| Integration Category  | Target Integration Technology | Business Capabilities                                |
| :-------------------- | :---------------------------- | :--------------------------------------------------- |
| **ERP Integrations**  | REST APIs / Webhooks          | Cross-system data sync & event notifications         |
| **Payment Gateway**   | Razorpay, Stripe              | Automated online fee collections & invoicing         |
| **Identity Provider** | Keycloak / Auth0 (Optional)   | Enterprise Single Sign-On (SSO) & SAML 2.0           |
| **Google Workspace**  | OAuth2 APIs                   | Google Calendar sync, Gmail, Classroom               |
| **Microsoft 365**     | Microsoft Graph API           | Outlook Calendar, Teams, OneDrive integration        |
| **WhatsApp**          | Meta WhatsApp Business API    | Automated parent notifications & SMS/WhatsApp alerts |
| **LMS Platform**      | Moodle APIs                   | Course materials, quiz scores, and LMS sync          |
| **Video Meetings**    | Zoom / Google Meet APIs       | Virtual classrooms and online counselling meetings   |
