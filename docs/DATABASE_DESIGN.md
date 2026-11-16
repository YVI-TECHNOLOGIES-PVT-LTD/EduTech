# EduTrack ERP — Database Design & Schema Reference

**Engine**: PostgreSQL 15+  
**ORM**: Prisma ORM  
**Multi-Tenancy**: Tenant-isolated schema via mandatory `organizationId` foreign keys

---

## 1. Schema ER Diagram Overview

```text
[ Organization ] ──< [ User ] ──< [ UserRole ] >── [ Role ] >── [ RolePermission ] >── [ Permission ]
        │                 │
        ├──< [ Staff ] ───┘
        │
        ├──< [ AcademicYear ] ──< [ Grade ] ──< [ Section ]
        │
        ├──< [ Lead ] ──< [ CampusVisit ]
        │
        └──< [ Application ] ──< [ Document ] / [ Assessment ] / [ FeePayment ] ──< [ Student ] ──< [ Parent ]
```

---

## 2. Table Specifications & Indexes

### `organizations` (Schools / Institutions)

- `id` (UUID, Primary Key)
- `name` (VarChar, Not Null)
- `code` (VarChar, Unique, Not Null)
- `email` (VarChar, Not Null)
- `branding` (JSONB, Optional)
- `settings` (JSONB, Optional)
- `created_at`, `updated_at`, `deleted_at`

### `users` (User Accounts)

- `id` (UUID, Primary Key)
- `email` (VarChar, Unique, Not Null)
- `password_hash` (VarChar, Not Null)
- `organization_id` (UUID, FK -> organizations.id, Indexed)
- `status` (Enum: `ACTIVE`, `SUSPENDED`, `INACTIVE`)
- `created_at`, `updated_at`, `deleted_at`

### `leads` (Prospective Intake)

- `id` (UUID, Primary Key)
- `lead_number` (VarChar, Unique, Not Null)
- `organization_id` (UUID, FK -> organizations.id, Indexed)
- `student_name` (VarChar, Not Null)
- `parent_name` (VarChar, Not Null)
- `email` (VarChar, Indexed)
- `phone` (VarChar, Indexed)
- `grade_applying_for` (VarChar, Not Null)
- `status` (Enum: `NEW`, `COUNSELLING_SCHEDULED`, `CAMPUS_VISITED`, `APPLICATION_SUBMITTED`, `CONVERTED`, `LOST`)
- `ai_score` (Integer, Default 0)
- `created_at`, `updated_at`, `deleted_at`

### `applications` (Admission Applications)

- `id` (UUID, Primary Key)
- `application_number` (VarChar, Unique, Not Null)
- `organization_id` (UUID, FK -> organizations.id, Indexed)
- `lead_id` (UUID, FK -> leads.id, Optional)
- `applicant_name` (VarChar, Not Null)
- `parent_name` (VarChar, Not Null)
- `grade_applying_for` (VarChar, Not Null)
- `status` (Enum: `SUBMITTED`, `DOCUMENT_VERIFIED`, `ASSESSMENT_COMPLETED`, `APPROVED`, `REJECTED`, `FEE_PAID`, `ENROLLED`)
- `created_at`, `updated_at`, `deleted_at`

### `students` (Enrolled Students)

- `id` (UUID, Primary Key)
- `admission_number` (VarChar, Unique, Not Null)
- `student_id` (VarChar, Unique, Not Null)
- `organization_id` (UUID, FK -> organizations.id, Indexed)
- `first_name` (VarChar, Not Null)
- `last_name` (VarChar, Not Null)
- `grade_id` (UUID, FK -> grades.id, Indexed)
- `section_id` (UUID, FK -> sections.id, Indexed)
- `status` (Enum: `ENROLLED`, `ACTIVE`, `WITHDRAWN`, `ALUMNI`)
- `created_at`, `updated_at`, `deleted_at`
