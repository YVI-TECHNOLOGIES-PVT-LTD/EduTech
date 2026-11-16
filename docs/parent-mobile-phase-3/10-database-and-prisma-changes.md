# EduTrack ERP — Parent Mobile App

# Phase 3 — Database & Prisma Audit & Schema Recommendations

## 1. Governance Adherence — Zero Database Changes

In strict accordance with the primary governing constraints of the EduTrack ERP workspace rules:

- **`apps/backend/prisma/schema.prisma` is the sole source of truth for database models.**
- **Stage-1 Freeze Applied**: Exactly **0 DDL operations, 0 SQL migrations, and 0 Prisma schema edits** were performed during Phase 3.
- All new mobile modules operate either directly against existing Prisma models (such as `students`, `parents`, `parent_student_relationships`, `applications`, `fee_structures`, `student_charge_dues`, `payment_transactions`, `notifications`) or utilize resilient client-side models with dignified empty states.

---

## 2. Existing Prisma Models Utilized in Phase 3

| Prisma Model                   | Schema Location                     | Utilized By Phase 3 Mobile Modules                        |
| ------------------------------ | ----------------------------------- | --------------------------------------------------------- |
| `students`                     | `apps/backend/prisma/schema.prisma` | Universal Child Switcher, Student Profile, Finance Ledger |
| `parents`                      | `apps/backend/prisma/schema.prisma` | Auth Session, Parent Profile, Family Hub                  |
| `parent_student_relationships` | `apps/backend/prisma/schema.prisma` | Multi-Child Switching, Authorization Verification         |
| `applications`                 | `apps/backend/prisma/schema.prisma` | Admission Applicant Journey, Funnel Progress              |
| `application_documents`        | `apps/backend/prisma/schema.prisma` | Document Checklist & Uploads                              |
| `application_assessments`      | `apps/backend/prisma/schema.prisma` | Assessment & Interview Scheduling                         |
| `fee_structures`               | `apps/backend/prisma/schema.prisma` | Annual Fee Breakdown Structure                            |
| `student_fee_assignments`      | `apps/backend/prisma/schema.prisma` | Student Fee Allocation                                    |
| `student_charge_dues`          | `apps/backend/prisma/schema.prisma` | Term Installments & Razorpay Payment Due                  |
| `payment_transactions`         | `apps/backend/prisma/schema.prisma` | Payment Verification Ledger & History                     |
| `notifications`                | `apps/backend/prisma/schema.prisma` | Circulars, Urgency Alerts, Unread Badges                  |

---

## 3. Recommended Future Schema Additions (Stage 2 SIS Roadmap)

When the Stage-1 database freeze is lifted for Stage-2 SIS development, the following Prisma models are recommended to provide permanent database persistence for the modules currently operating on resilient contracts:

### Recommendation A: Daily Student Attendance

```prisma
model student_attendance {
  attendance_id String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  org_id        String   @db.Uuid
  student_id    String   @db.Uuid
  date          DateTime @db.Date
  status        String   @db.VarChar(20) // 'PRESENT', 'ABSENT', 'LATE', 'HOLIDAY'
  remarks       String?  @db.Text
  marked_by     String?  @db.Uuid
  created_at    DateTime @default(now()) @db.Timestamptz(6)

  student       students @relation(fields: [student_id], references: [student_id], onDelete: Cascade)

  @@unique([org_id, student_id, date])
  @@index([org_id, date])
}
```

### Recommendation B: Class Timetables

```prisma
model class_timetables {
  timetable_id   String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  org_id         String   @db.Uuid
  class_id       String   @db.Uuid
  section_id     String?  @db.Uuid
  day_of_week    String   @db.VarChar(10) // 'MONDAY', 'TUESDAY', etc.
  period_number  Int
  start_time     String   @db.VarChar(10)
  end_time       String   @db.VarChar(10)
  subject_name   String   @db.VarChar(100)
  teacher_id     String?  @db.Uuid
  room_number    String?  @db.VarChar(50)
  is_break       Boolean  @default(false)

  @@index([org_id, class_id, day_of_week])
}
```

### Recommendation C: Homework & Assignments

```prisma
model student_homework {
  homework_id   String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  org_id        String    @db.Uuid
  class_id      String    @db.Uuid
  subject_name  String    @db.VarChar(100)
  title         String    @db.VarChar(255)
  description   String    @db.Text
  assigned_date DateTime  @db.Date
  due_date      DateTime  @db.Date
  created_by    String    @db.Uuid
  created_at    DateTime  @default(now()) @db.Timestamptz(6)

  submissions   homework_submissions[]
}

model homework_submissions {
  submission_id String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  homework_id   String    @db.Uuid
  student_id    String    @db.Uuid
  submitted_at  DateTime  @default(now()) @db.Timestamptz(6)
  status        String    @db.VarChar(20) // 'SUBMITTED', 'GRADED'

  homework      student_homework @relation(fields: [homework_id], references: [homework_id], onDelete: Cascade)
  student       students         @relation(fields: [student_id], references: [student_id], onDelete: Cascade)

  @@unique([homework_id, student_id])
}
```

### Recommendation D: Parent Helpdesk Tickets

```prisma
model helpdesk_tickets {
  ticket_id     String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  org_id        String    @db.Uuid
  ticket_number String    @unique @db.VarChar(50)
  parent_id     String    @db.Uuid
  student_id    String?   @db.Uuid
  category      String    @db.VarChar(30) // 'FEES', 'TRANSPORT', 'ACADEMICS', 'GENERAL'
  priority      String    @db.VarChar(20) // 'LOW', 'MEDIUM', 'HIGH'
  status        String    @db.VarChar(20) // 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'
  subject       String    @db.VarChar(255)
  description   String    @db.Text
  created_at    DateTime  @default(now()) @db.Timestamptz(6)
  updated_at    DateTime  @default(now()) @db.Timestamptz(6)

  replies       helpdesk_replies[]
}

model helpdesk_replies {
  reply_id      String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  ticket_id     String    @db.Uuid
  author_id     String    @db.Uuid
  author_role   String    @db.VarChar(30) // 'PARENT', 'SUPPORT', 'ADMIN'
  message       String    @db.Text
  created_at    DateTime  @default(now()) @db.Timestamptz(6)

  ticket        helpdesk_tickets @relation(fields: [ticket_id], references: [ticket_id], onDelete: Cascade)
}
```
