# EduTrack Enterprise Platform — Database Architecture

## 1. Relational Schema & Multi-Schema Isolation

The database architecture is built on PostgreSQL with multi-schema segregation (`auth` and `public` schemas) managed via Prisma ORM (`apps/backend/prisma/schema.prisma`).

```mermaid
erDiagram
    schools ||--o{ academic_years : "configures"
    schools ||--o{ students : "enrolls"
    schools ||--o{ admission_applications : "processes"
    academic_years ||--o{ classes : "contains"
    classes ||--o{ sections : "subdivides"
    students ||--o{ student_sections : "assigned_to"
    sections ||--o{ student_sections : "includes"
    admission_leads ||--o{ admission_applications : "converts_to"
    admission_applications ||--o{ student_attendance_sessions : "tracks"
    students ||--o{ student_attendance : "records"
```

---

## 2. Master Entity Categories

### 2.1 Multi-Tenant Governance

- `schools`: Root institution record storing school codes, settings, and status.
- `academic_years`: Annual academic calendar sessions (`is_active`, `status: OPEN / CLOSED`).

### 2.2 Academic Hierarchy

- `classes`: Grade levels (e.g., Grade 10).
- `sections`: Section divisions (e.g., Section A).
- `student_sections`: Maps active students to specific sections per academic year.
