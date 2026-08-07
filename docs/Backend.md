# EduTrack ERP Backend Architecture Guide

## Tech Stack & Core Services

- **Framework**: NestJS (Node.js)
- **Database ORM**: Prisma ORM
- **Database Engine**: PostgreSQL
- **Security**: Passport JWT + Refresh Token Rotation
- **Multi-Tenancy**: Tenant Middleware validating `x-tenant-id` header

---

## Domain Services

- `AuthModule`: Handles `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me`, `/auth/password-reset`.
- `OrganizationModule`: Handles multi-tenant organization creation, branding, settings.
- `UserModule`: User accounts, RBAC role assignment, permissions matrix.
- `HrModule`: Departments, designations, staff onboarding.
- `AcademicModule`: Academic years, grades (1-12), sections allocation.
- `CrmModule`: Inbound leads, counselling logs, campus visits.
- `AdmissionModule`: Applications, document verification, entrance assessments, admission decisioning, fee receipts.
- `StudentModule`: Student master directory, parent linkage, Stage-1 enrollment execution.
- `DashboardModule`: Aggregated metrics endpoint (`/dashboard/summary`).
