# EduTrack ERP — RBAC Matrix & Role Permissions Catalog

**Security Model**: Role-Based & Policy-Driven Attribute Access Control  
**SuperAdmin Role**: `SUPERADMIN` (Unrestricted bypass across all endpoints)

---

## 1. System Roles Definition

| Role Code           | Role Name           | System Scope & Description                                         |
| ------------------- | ------------------- | ------------------------------------------------------------------ |
| `SUPERADMIN`        | Super Administrator | Full unrestricted multi-tenant system administration               |
| `ORG_ADMIN`         | Organization Admin  | Full management access within tenant institution                   |
| `ADMISSION_OFFICER` | Admission Officer   | Manages CRM leads, applications, document verifications, decisions |
| `COUNSELLOR`        | Academic Counsellor | Manages lead inquiries, notes, followups, campus visits            |
| `FINANCE_OFFICER`   | Finance Officer     | Processes admission fee collections, receipts, financial reports   |
| `TEACHER`           | Faculty / Teacher   | Access to assigned academic sections and student directory         |
| `PARENT`            | Parent / Guardian   | Access to linked children's application status and profile         |
| `STUDENT`           | Student             | Read-only access to self profile and academic records              |

---

## 2. Permission Groups Matrix

| Permission Code               | Permission Description                        | SUPERADMIN | ORG_ADMIN | ADMISSION_OFFICER | COUNSELLOR | FINANCE_OFFICER |
| ----------------------------- | --------------------------------------------- | :--------: | :-------: | :---------------: | :--------: | :-------------: |
| `organization.read`           | View organization profile                     |     ✅     |    ✅     |        ✅         |     ✅     |       ✅        |
| `organization.update`         | Update institution profile & branding         |     ✅     |    ✅     |        ❌         |     ❌     |       ❌        |
| `user.read`                   | View user directory                           |     ✅     |    ✅     |        ❌         |     ❌     |       ❌        |
| `user.write`                  | Create / edit user accounts                   |     ✅     |    ✅     |        ❌         |     ❌     |       ❌        |
| `user.role_assign`            | Assign roles to user accounts                 |     ✅     |    ✅     |        ❌         |     ❌     |       ❌        |
| `staff.read`                  | View HR staff directory                       |     ✅     |    ✅     |        ✅         |     ❌     |       ❌        |
| `staff.write`                 | Onboard faculty & personnel                   |     ✅     |    ✅     |        ❌         |     ❌     |       ❌        |
| `academics.read`              | View sessions, grades, sections               |     ✅     |    ✅     |        ✅         |     ✅     |       ✅        |
| `academics.write`             | Configure academic sessions & grades          |     ✅     |    ✅     |        ❌         |     ❌     |       ❌        |
| `crm.lead.read`               | View inbound lead pipeline                    |     ✅     |    ✅     |        ✅         |     ✅     |       ❌        |
| `crm.lead.write`              | Capture & edit lead inquiries                 |     ✅     |    ✅     |        ✅         |     ✅     |       ❌        |
| `crm.visit.schedule`          | Book campus visit appointments                |     ✅     |    ✅     |        ✅         |     ✅     |       ❌        |
| `admission.application.read`  | View formal applications                      |     ✅     |    ✅     |        ✅         |     ✅     |       ✅        |
| `admission.application.write` | Submit & edit applications                    |     ✅     |    ✅     |        ✅         |     ❌     |       ❌        |
| `admission.document.verify`   | Verify uploaded document checklist            |     ✅     |    ✅     |        ✅         |     ❌     |       ❌        |
| `admission.assessment.score`  | Record entrance test / interview score        |     ✅     |    ✅     |        ✅         |     ❌     |       ❌        |
| `admission.decision.make`     | Approve or reject admission application       |     ✅     |    ✅     |        ✅         |     ❌     |       ❌        |
| `admission.fee.collect`       | Process admission fee payment receipt         |     ✅     |    ✅     |        ❌         |     ❌     |       ✅        |
| `student.read`                | View enrolled student directory               |     ✅     |    ✅     |        ✅         |     ✅     |       ✅        |
| `student.enroll`              | Execute Stage-1 student creation & enrollment |     ✅     |    ✅     |        ✅         |     ❌     |       ❌        |
| `dashboard.read`              | View executive summary dashboard              |     ✅     |    ✅     |        ✅         |     ✅     |       ✅        |
| `audit.log.read`              | View system audit trail logs                  |     ✅     |    ✅     |        ❌         |     ❌     |       ❌        |
