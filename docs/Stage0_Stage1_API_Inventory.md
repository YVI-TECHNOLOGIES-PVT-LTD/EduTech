# EduTrack ERP — Stage 0 & Stage 1 Complete API Inventory

**API Base Route**: `/api/v1`  
**Total Endpoint Surface**: **135 REST Endpoints** (100% Mathematically Synchronized Baseline)  
**Architecture**: Monorepo Backend API Gateway (NestJS + PostgreSQL + Prisma ORM)  
**Status**: Certified & Frozen Stage-1 Contract

---

## 1. Stage 0 — Platform & Infrastructure APIs (22 Endpoints)

### Authentication (5 Endpoints)

- `POST   /api/v1/auth/login` — Authenticate user credentials & return JWT tokens
- `POST   /api/v1/auth/logout` — Invalidate session and refresh token
- `POST   /api/v1/auth/refresh` — Rotate expired JWT access token
- `GET    /api/v1/auth/me` — Fetch authenticated user profile & feature flags
- `POST   /api/v1/auth/change-password` — Update account credentials

### Organizations (Multi-Tenant Management) (5 Endpoints)

- `GET    /api/v1/organizations` — List tenant organizations
- `POST   /api/v1/organizations` — Register new tenant organization
- `GET    /api/v1/organizations/:id` — Get organization profile
- `PATCH  /api/v1/organizations/:id` — Update organization metadata & branding
- `DELETE /api/v1/organizations/:id` — Soft-delete tenant organization

### Geographical Masters (Countries, States, Cities) (6 Endpoints)

- `GET    /api/v1/countries` — List supported countries
- `GET    /api/v1/countries/:id` — Get country details
- `GET    /api/v1/states` — List states by country
- `GET    /api/v1/states/:id` — Get state details
- `GET    /api/v1/cities` — List cities by state
- `GET    /api/v1/cities/:id` — Get city details

### Object Storage Service (3 Endpoints)

- `POST   /api/v1/storage/upload` — Upload application document or asset
- `DELETE /api/v1/storage/:fileId` — Delete uploaded file asset
- `GET    /api/v1/storage/:fileId` — Stream file or fetch download URL

### System Health & Monitoring (3 Endpoints)

- `GET    /health` — Application health check
- `GET    /ready` — Database readiness probe
- `GET    /live` — Liveness check

---

## 2. Stage 1 — Business Domain APIs (113 Endpoints)

### Phase 3.1: Lead Management & CRM (18 Endpoints)

- `POST   /api/v1/leads` — Capture inbound lead inquiry
- `GET    /api/v1/leads` — List prospective leads with pagination
- `GET    /api/v1/leads/search` — Search leads by query
- `GET    /api/v1/leads/dashboard` — Lead metrics & analytics
- `GET    /api/v1/leads/pipeline` — Lead stage funnel distribution
- `GET    /api/v1/leads/:id` — Get lead details
- `PATCH  /api/v1/leads/:id` — Update lead info
- `DELETE /api/v1/leads/:id` — Soft-delete lead
- `PATCH  /api/v1/leads/:id/status` — Transition lead pipeline status
- `PATCH  /api/v1/leads/:id/assign` — Assign counsellor to lead
- `GET    /api/v1/leads/:id/timeline` — Lead activity timeline
- `POST   /api/v1/leads/:id/notes` — Add counselling note
- `GET    /api/v1/leads/:id/notes` — List counselling notes
- `POST   /api/v1/leads/:id/followups` — Schedule followup reminder
- `GET    /api/v1/leads/:id/followups` — List followups
- `PATCH  /api/v1/followups/:id` — Complete/reschedule followup
- `POST   /api/v1/leads/:id/visits` — Schedule campus visit
- `GET    /api/v1/leads/:id/visits` — List campus visits

---

### Phase 3.2: Admission Application Management (18 Endpoints)

- `POST   /api/v1/applications` — Submit formal admission application
- `GET    /api/v1/applications` — List applications
- `GET    /api/v1/applications/dashboard` — Admission funnel KPIs
- `GET    /api/v1/applications/pending` — Applications requiring action
- `GET    /api/v1/applications/:id` — Get application details
- `PATCH  /api/v1/applications/:id` — Update application details
- `DELETE /api/v1/applications/:id` — Soft-delete application
- `PATCH  /api/v1/applications/:id/status` — Transition application status
- `GET    /api/v1/applications/:id/timeline` — Application audit log
- `POST   /api/v1/applications/:id/documents` — Upload application document
- `GET    /api/v1/applications/:id/documents` — List application documents
- `PATCH  /api/v1/applications/documents/:id/verify` — Verify document
- `POST   /api/v1/applications/:id/assessment` — Record entrance assessment score
- `GET    /api/v1/applications/:id/assessment` — Get assessment results
- `POST   /api/v1/applications/:id/decision` — Approve/Reject application
- `GET    /api/v1/applications/:id/decision` — Get decision details
- `POST   /api/v1/applications/:id/payment` — Record fee payment receipt
- `GET    /api/v1/applications/:id/payment` — Get fee payment status

---

### Phase 3.3: Student Management (14 Endpoints)

- `POST   /api/v1/students` — Create student record
- `GET    /api/v1/students` — Enrolled student directory
- `GET    /api/v1/students/dashboard` — Student demographics summary
- `GET    /api/v1/students/:id` — Get student profile
- `PATCH  /api/v1/students/:id` — Update student profile
- `DELETE /api/v1/students/:id` — Soft-delete student
- `PATCH  /api/v1/students/:id/status` — Update enrollment status
- `GET    /api/v1/students/:id/timeline` — Student lifecycle timeline
- `POST   /api/v1/students/:id/enrollments` — Execute Stage-1 enrollment
- `GET    /api/v1/students/:id/enrollments` — Get enrollment history
- `PATCH  /api/v1/students/enrollments/:id/section` — Assign section
- `POST   /api/v1/students/:id/parents` — Link parent/guardian
- `GET    /api/v1/students/:id/parents` — List linked parents
- `DELETE /api/v1/students/:id/parents/:parentId` — Unlink parent

---

### Phase 3.4: Parent Management (11 Endpoints)

- `POST   /api/v1/parents` — Create parent/guardian record
- `GET    /api/v1/parents` — List parents directory
- `GET    /api/v1/parents/search` — Search parents
- `GET    /api/v1/parents/dashboard` — Parent analytics summary
- `GET    /api/v1/parents/:id` — Get parent details
- `PATCH  /api/v1/parents/:id` — Update parent info
- `DELETE /api/v1/parents/:id` — Soft-delete parent
- `GET    /api/v1/parents/:id/timeline` — Parent activity timeline
- `POST   /api/v1/parents/:id/students` — Link student to parent
- `GET    /api/v1/parents/:id/students` — List children of parent
- `DELETE /api/v1/parents/:id/students/:studentId` — Unlink student

---

### Phase 3.5: Academic Structure (21 Endpoints)

- `POST   /api/v1/academic-years` — Create academic session
- `GET    /api/v1/academic-years` — List academic sessions
- `GET    /api/v1/academic-years/:id` — Get academic session
- `PATCH  /api/v1/academic-years/:id` — Update academic session
- `DELETE /api/v1/academic-years/:id` — Soft-delete academic session
- `POST   /api/v1/grades` — Create grade/class
- `GET    /api/v1/grades` — List grades
- `GET    /api/v1/grades/:id` — Get grade details
- `PATCH  /api/v1/grades/:id` — Update grade
- `DELETE /api/v1/grades/:id` — Soft-delete grade
- `POST   /api/v1/sections` — Create section
- `GET    /api/v1/sections` — List sections
- `GET    /api/v1/sections/:id` — Get section details
- `PATCH  /api/v1/sections/:id` — Update section
- `DELETE /api/v1/sections/:id` — Soft-delete section
- `PATCH  /api/v1/sections/:id/class-teacher` — Assign class teacher
- `POST   /api/v1/academic-year-grades` — Map grade to academic session
- `GET    /api/v1/academic-year-grades` — List session grade mappings
- `GET    /api/v1/academic-year-grades/:id` — Get grade mapping details
- `PATCH  /api/v1/academic-year-grades/:id` — Update grade mapping
- `DELETE /api/v1/academic-year-grades/:id` — Delete grade mapping

---

### Phase 3.6: Staff Management & HR (15 Endpoints)

- `GET    /api/v1/staff/dashboard` — HR metrics summary
- `GET    /api/v1/staff/search` — Search staff directory
- `POST   /api/v1/staff` — Onboard staff member
- `GET    /api/v1/staff` — List staff directory
- `GET    /api/v1/staff/:id` — Get staff profile
- `PATCH  /api/v1/staff/:id` — Update staff profile
- `DELETE /api/v1/staff/:id` — Soft-delete staff
- `PATCH  /api/v1/staff/:id/designation` — Update designation
- `PATCH  /api/v1/staff/:id/user` — Link staff to user account
- `GET    /api/v1/staff/:id/timeline` — Staff activity timeline
- `POST   /api/v1/staff/designations` — Create job designation
- `GET    /api/v1/staff/designations` — List designations
- `GET    /api/v1/staff/designations/:id` — Get designation details
- `PATCH  /api/v1/staff/designations/:id` — Update designation
- `DELETE /api/v1/staff/designations/:id` — Delete designation

---

### Phase 3.7: User & Role Administration (16 Endpoints)

- `GET    /api/v1/users/dashboard` — User account analytics
- `GET    /api/v1/users/search` — Search users
- `POST   /api/v1/users` — Create administrative user account
- `GET    /api/v1/users` — List system users
- `GET    /api/v1/users/:id` — Get user profile
- `PATCH  /api/v1/users/:id` — Update user profile
- `PATCH  /api/v1/users/:id/status` — Suspend/Activate user account
- `GET    /api/v1/users/:id/timeline` — User audit trail
- `POST   /api/v1/users/roles` — Create RBAC role
- `GET    /api/v1/users/roles` — List roles & permissions
- `GET    /api/v1/users/roles/:id` — Get role details
- `PATCH  /api/v1/users/roles/:id` — Update role & permissions
- `DELETE /api/v1/users/roles/:id` — Delete role
- `POST   /api/v1/users/:userId/roles` — Assign role to user
- `DELETE /api/v1/users/:userId/roles/:roleId` — Revoke role from user
- `GET    /api/v1/users/:userId/roles` — List assigned roles for user

---

## 3. Synchronized Endpoint Summary Table

| Domain Module                                | Enumerated Endpoints Count |           Verification Status           |
| -------------------------------------------- | :------------------------: | :-------------------------------------: |
| **Platform & Health**                        |           **22**           |         ✅ 100% Itemized Match          |
| **Lead Management (CRM)**                    |           **18**           |         ✅ 100% Itemized Match          |
| **Admission Application Management**         |           **18**           |         ✅ 100% Itemized Match          |
| **Student Management**                       |           **14**           |         ✅ 100% Itemized Match          |
| **Parent Management**                        |           **11**           |         ✅ 100% Itemized Match          |
| **Academic Structure**                       |           **21**           |         ✅ 100% Itemized Match          |
| **Staff Management & HR**                    |           **15**           |         ✅ 100% Itemized Match          |
| **User & Role Administration**               |           **16**           |         ✅ 100% Itemized Match          |
| **TOTAL STAGE 0 + STAGE 1 CONTRACT SURFACE** |     **135 Endpoints**      | ✅ **100% MATHEMATICALLY SYNCHRONIZED** |
