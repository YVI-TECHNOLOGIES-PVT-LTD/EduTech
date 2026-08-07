# EduTrack ERP — Production Readiness Checklist

## 1. Database & Migrations

- [x] PostgreSQL 15+ instance provisioned.
- [x] Prisma migrations deployed (`npx prisma migrate deploy`).
- [x] Indexes verified on `organization_id`, `email`, `lead_number`, `application_number`, `admission_number`.

## 2. Security & Environment

- [x] Strong secrets generated for `JWT_SECRET` and `JWT_REFRESH_SECRET`.
- [x] Multi-tenancy header (`x-tenant-id`) enforced.
- [x] CORS origins restricted to approved web admin domains.

## 3. Web & API Build Integrity

- [x] Web app bundle builds cleanly (`npm run build --workspace=apps/web_app`).
- [x] Backend bundle builds cleanly (`npm run build --workspace=apps/backend`).
- [x] Zero TypeScript errors (`typecheck` clean).
