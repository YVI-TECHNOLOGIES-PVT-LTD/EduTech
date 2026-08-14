# Stage-1 Prisma vs Live Database Schema Reconciliation Audit Report

**EduTrack ERP System Architecture**

---

## 1. Executive Summary

This read-only reconciliation audit evaluates the exact schema alignment between the committed Prisma schema file ([`apps/backend/prisma/schema.prisma`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/prisma/schema.prisma)) and the live PostgreSQL database (`information_schema.columns`).

### Audit Summary:

- **Database Status**: The live PostgreSQL database **PHYSICALLY CONTAINS ALL SIX COLUMNS** on the `admissions_applications` table (`nationality`, `previous_school_name`, `previous_school_address`, `previous_school_board`, `previous_grade`, `previous_school_year`).
- **Prisma Schema Status**: The committed [`apps/backend/prisma/schema.prisma`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/prisma/schema.prisma) file lacks model property definitions for these 6 fields.
- **Migration Impact**: Adding these 6 fields to `schema.prisma` requires **ZERO database DDL changes and ZERO database migrations** because the columns already exist in PostgreSQL with exact matching types and nullability.
- **Final Verdict**: **SAFE TO ALIGN PRISMA SCHEMA**.

---

## 2. Prisma Model Snapshot (`schema.prisma`)

Inspection of `admissions_applications` in [`apps/backend/prisma/schema.prisma:170-199`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/prisma/schema.prisma#L170-L199):

```prisma
model admissions_applications {
  application_id                                  String                   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  lead_id                                         String                   @unique @db.Uuid
  org_id                                          String                   @db.Uuid
  academic_year_id                                String                   @db.Uuid
  application_number                              String                   @unique @db.VarChar(30)
  application_date                                DateTime                 @default(dbgenerated("CURRENT_DATE")) @db.Date
  status                                          application_status       @default(submitted)
  created_at                                      DateTime                 @default(now()) @db.Timestamptz(6)
  created_by                                      String?                  @db.Uuid
  updated_at                                      DateTime                 @default(now()) @db.Timestamptz(6)
  updated_by                                      String?                  @db.Uuid
  // 🚨 Missing in committed schema.prisma:
  // nationality, previous_school_name, previous_school_address,
  // previous_school_board, previous_grade, previous_school_year
}
```

---

## 3. Live PostgreSQL Snapshot (`information_schema.columns`)

Columns queried directly from live PostgreSQL `admissions_applications` table:

```text
- application_id:          uuid, NOT NULL, DEFAULT gen_random_uuid()
- lead_id:                 uuid, NOT NULL
- org_id:                  uuid, NOT NULL
- academic_year_id:        uuid, NOT NULL
- application_number:      varchar(30), NOT NULL
- application_date:        date, NOT NULL, DEFAULT CURRENT_DATE
- status:                  USER-DEFINED application_status, NOT NULL, DEFAULT 'submitted'
- created_at:              timestamp with time zone, NOT NULL, DEFAULT now()
- created_by:              uuid, NULLABLE
- updated_at:              timestamp with time zone, NOT NULL, DEFAULT now()
- updated_by:              uuid, NULLABLE
- nationality:             character varying(100), NULLABLE
- previous_school_name:    character varying(200), NULLABLE
- previous_school_address: text, NULLABLE
- previous_school_board:   character varying(100), NULLABLE
- previous_grade:          character varying(50), NULLABLE
- previous_school_year:    character varying(20), NULLABLE
```

---

## 4. Six-Field Exact Reconciliation Matrix

| Field                       | Prisma Schema |   PostgreSQL Data Type   | Type Match | Nullable Match | Status                           |
| :-------------------------- | :-----------: | :----------------------: | :--------: | :------------: | :------------------------------- |
| **nationality**             |    MISSING    | `character varying(100)` |    N/A     |      YES       | **DB HAS COLUMN / PRISMA DRIFT** |
| **previous_school_name**    |    MISSING    | `character varying(200)` |    N/A     |      YES       | **DB HAS COLUMN / PRISMA DRIFT** |
| **previous_school_address** |    MISSING    |          `text`          |    N/A     |      YES       | **DB HAS COLUMN / PRISMA DRIFT** |
| **previous_school_board**   |    MISSING    | `character varying(100)` |    N/A     |      YES       | **DB HAS COLUMN / PRISMA DRIFT** |
| **previous_grade**          |    MISSING    | `character varying(50)`  |    N/A     |      YES       | **DB HAS COLUMN / PRISMA DRIFT** |
| **previous_school_year**    |    MISSING    | `character varying(20)`  |    N/A     |      YES       | **DB HAS COLUMN / PRISMA DRIFT** |

---

## 5. Complete Model Drift Audit

### 1) `admissions_applications`:

- **DB vs Prisma**: 6 columns exist in PostgreSQL (`nationality`, `previous_school_name`, `previous_school_address`, `previous_school_board`, `previous_grade`, `previous_school_year`), missing from committed `schema.prisma`.
- **Primary Key**: `application_id` (UUID) - Matched.
- **Foreign Keys**: `lead_id`, `org_id`, `academic_year_id` - Matched.

### 2) `admission_documents`:

- **Columns**: 16 columns (`document_id`, `application_id`, `document_type_id`, `storage_path`, `verify_status`, `verification_remarks`, `uploaded_at`, `verified_by`, `verified_at`, `created_at`, `updated_at`, `created_by`, `updated_by`, `original_file_name`, `mime_type`, `file_size`).
- **Drift**: 0 drift. 100% matched between `schema.prisma` and PostgreSQL.

### 3) `document_types`:

- **Columns**: 11 columns (`document_type_id`, `org_id`, `document_name`, `description`, `is_mandatory`, `is_active`, `display_order`, `created_at`, `updated_at`, `created_by`, `updated_by`).
- **Drift**: 0 drift. 100% matched between `schema.prisma` and PostgreSQL.

---

## 6. Prisma Client & Repository Type-Safety Analysis

- **Generated `@prisma/client`**: When built against committed `schema.prisma`, generated TypeScript types omit the 6 fields on `admissions_applications`.
- **Repository Workaround**: In [`AdmissionRepository.ts`](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission-management/repositories/admission.repository.ts), `{ ... } as any` is currently used to pass the 6 fields into `prisma.admissions_applications.create` and `prisma.admissions_applications.update`.
- **Impact**: While runtime database writes succeed via `as any` casting (because PostgreSQL physically has the columns), static type checking in TypeScript requires `(as any)` type assertions.

---

## 7. Migration Safety Analysis

Based strictly on PostgreSQL `information_schema.columns` inspection:

Adding the 6 fields to `schema.prisma`:

```prisma
nationality                                     String?                  @db.VarChar(100)
previous_school_name                            String?                  @db.VarChar(200)
previous_school_address                         String?
previous_school_board                           String?                  @db.VarChar(100)
previous_grade                                  String?                  @db.VarChar(50)
previous_school_year                            String?                  @db.VarChar(20)
```

Classification: **B. Existing database columns being represented in Prisma**.

- **Database DDL**: ZERO statements (`ALTER TABLE`, `ADD COLUMN`) are required on PostgreSQL.
- **Data Risk**: ZERO risk to existing PostgreSQL data.
- **Outcome**: Regenerates `@prisma/client` to provide native type-safety without `as any` casting.

---

## 8. Final Recommendation & Verdict

### Recommendation:

**SAFE TO ALIGN PRISMA SCHEMA**

Updating `apps/backend/prisma/schema.prisma` to include these 6 nullable fields strictly matches existing live PostgreSQL columns and establishes full end-to-end type-safety across backend repositories, DTOs, and frontend components.

---

AUDIT COMPLETE

Files modified: 0
Schema modified: 0
Migrations created: 0
Database records modified: 0
Supabase objects modified: 0

Final verdict:
SAFE TO ALIGN PRISMA SCHEMA
