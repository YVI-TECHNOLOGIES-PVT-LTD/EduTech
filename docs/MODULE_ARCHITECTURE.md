# EduTrack ERP — Backend Module Architecture Specification

**Architecture**: Decoupled Monorepo Gateway (`apps/backend`)  
**Design Pattern**: Feature-Isolated Controller-Service-Repository Pattern

---

## 1. Directory Structure per Module

Every backend domain module under `apps/backend/src/modules/<module>/` strictly maintains:

```text
modules/<module>/
├── routes/
│   └── <module>.routes.ts       # Express/NestJS Router definitions & guards
├── controllers/
│   └── <module>.controller.ts   # Request parsing, DTO validation, status responses
├── services/
│   └── <module>.service.ts      # Transactional business logic & event dispatching
├── dtos/
│   ├── create-<module>.dto.ts   # Request payload validation schema
│   └── update-<module>.dto.ts
├── repositories/                # Direct Prisma queries & atomic transactions
└── index.ts                     # Module export boundary
```

---

## 2. Domain Modules Inventory

1. **`auth`**: Authentication, session invalidation, JWT token rotation.
2. **`organization`**: Multi-tenant institutional management & branding settings.
3. **`user-management`**: User accounts, status transitions, role assignments.
4. **`staff-management`**: HR personnel, department hierarchy, job designations.
5. **`academic-management`**: Session calendars, grades (1-12), section capacities.
6. **`lead-management`**: Inbound CRM inquiries, followups, campus visits.
7. **`admission`**: Applications, document verification, entrance assessment scoring, decisions, fee collections.
8. **`student-management`**: Enrolled student master directory, parent linkage, Stage-1 enrollment execution.
9. **`dashboard`**: Aggregated metric summary (`/dashboard/summary`).
