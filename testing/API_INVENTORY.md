# EduTrack ERP — Complete Stage 0 & Stage 1 API Inventory

**Base Route**: `/api/v1`  
**Total Endpoint Surface**: **135 Itemized REST Endpoints**

---

## 1. Platform & Health APIs (22 Endpoints)

### Authentication

- `POST /api/v1/auth/login` (Public, Auth: None)
- `POST /api/v1/auth/logout` (Auth: Bearer Token)
- `POST /api/v1/auth/refresh` (Auth: Bearer Token)
- `GET /api/v1/auth/me` (Auth: Bearer Token)
- `POST /api/v1/auth/change-password` (Auth: Bearer Token)

### Organizations

- `GET /api/v1/organizations` (Auth: Bearer Token)
- `POST /api/v1/organizations` (Auth: Bearer Token)
- `GET /api/v1/organizations/:id` (Auth: Bearer Token)
- `PATCH /api/v1/organizations/:id` (Auth: Bearer Token)
- `DELETE /api/v1/organizations/:id` (Auth: Bearer Token)

### Geographies & Storage & Health

- `GET /api/v1/countries`, `GET /api/v1/countries/:id`
- `GET /api/v1/states`, `GET /api/v1/states/:id`
- `GET /api/v1/cities`, `GET /api/v1/cities/:id`
- `POST /api/v1/storage/upload`, `DELETE /api/v1/storage/:fileId`, `GET /api/v1/storage/:fileId`
- `GET /health`, `GET /ready`, `GET /live`

---

## 2. Business Domain APIs (113 Endpoints)

### Phase 3.1: Lead Management & CRM (18 Endpoints)

- `POST /api/v1/leads`
- `GET /api/v1/leads`
- `GET /api/v1/leads/search`
- `GET /api/v1/leads/dashboard`
- `GET /api/v1/leads/pipeline`
- `GET /api/v1/leads/:id`
- `PATCH /api/v1/leads/:id`
- `DELETE /api/v1/leads/:id`
- `PATCH /api/v1/leads/:id/status`
- `PATCH /api/v1/leads/:id/assign`
- `GET /api/v1/leads/:id/timeline`
- `POST /api/v1/leads/:id/notes`
- `GET /api/v1/leads/:id/notes`
- `POST /api/v1/leads/:id/followups`
- `GET /api/v1/leads/:id/followups`
- `PATCH /api/v1/followups/:id`
- `POST /api/v1/leads/:id/visits`
- `GET /api/v1/leads/:id/visits`

### Phase 3.2: Admission Application Management (18 Endpoints)

- `POST /api/v1/applications`
- `GET /api/v1/applications`
- `GET /api/v1/applications/dashboard`
- `GET /api/v1/applications/pending`
- `GET /api/v1/applications/:id`
- `PATCH /api/v1/applications/:id`
- `DELETE /api/v1/applications/:id`
- `PATCH /api/v1/applications/:id/status`
- `GET /api/v1/applications/:id/timeline`
- `POST /api/v1/applications/:id/documents`
- `GET /api/v1/applications/:id/documents`
- `PATCH /api/v1/applications/documents/:id/verify`
- `POST /api/v1/applications/:id/assessment`
- `GET /api/v1/applications/:id/assessment`
- `POST /api/v1/applications/:id/decision`
- `GET /api/v1/applications/:id/decision`
- `POST /api/v1/applications/:id/payment`
- `GET /api/v1/applications/:id/payment`

### Phase 3.3: Student Management (14 Endpoints)

- `POST /api/v1/students`
- `GET /api/v1/students`
- `GET /api/v1/students/dashboard`
- `GET /api/v1/students/:id`
- `PATCH /api/v1/students/:id`
- `DELETE /api/v1/students/:id`
- `PATCH /api/v1/students/:id/status`
- `GET /api/v1/students/:id/timeline`
- `POST /api/v1/students/:id/enrollments`
- `GET /api/v1/students/:id/enrollments`
- `PATCH /api/v1/students/enrollments/:id/section`
- `POST /api/v1/students/:id/parents`
- `GET /api/v1/students/:id/parents`
- `DELETE /api/v1/students/:id/parents/:parentId`

### Phase 3.4: Parent Management (11 Endpoints)

- `POST /api/v1/parents`
- `GET /api/v1/parents`
- `GET /api/v1/parents/search`
- `GET /api/v1/parents/dashboard`
- `GET /api/v1/parents/:id`
- `PATCH /api/v1/parents/:id`
- `DELETE /api/v1/parents/:id`
- `GET /api/v1/parents/:id/timeline`
- `POST /api/v1/parents/:id/students`
- `GET /api/v1/parents/:id/students`
- `DELETE /api/v1/parents/:id/students/:studentId`

### Phase 3.5: Academic Structure (21 Endpoints)

- `POST /api/v1/academic-years`, `GET /api/v1/academic-years`, `GET /api/v1/academic-years/:id`, `PATCH /api/v1/academic-years/:id`, `DELETE /api/v1/academic-years/:id`
- `POST /api/v1/grades`, `GET /api/v1/grades`, `GET /api/v1/grades/:id`, `PATCH /api/v1/grades/:id`, `DELETE /api/v1/grades/:id`
- `POST /api/v1/sections`, `GET /api/v1/sections`, `GET /api/v1/sections/:id`, `PATCH /api/v1/sections/:id`, `DELETE /api/v1/sections/:id`, `PATCH /api/v1/sections/:id/class-teacher`
- `POST /api/v1/academic-year-grades`, `GET /api/v1/academic-year-grades`, `GET /api/v1/academic-year-grades/:id`, `PATCH /api/v1/academic-year-grades/:id`, `DELETE /api/v1/academic-year-grades/:id`

### Phase 3.6: Staff Management & HR (15 Endpoints)

- `GET /api/v1/staff/dashboard`, `GET /api/v1/staff/search`, `POST /api/v1/staff`, `GET /api/v1/staff`, `GET /api/v1/staff/:id`, `PATCH /api/v1/staff/:id`, `DELETE /api/v1/staff/:id`, `PATCH /api/v1/staff/:id/designation`, `PATCH /api/v1/staff/:id/user`, `GET /api/v1/staff/:id/timeline`
- `POST /api/v1/staff/designations`, `GET /api/v1/staff/designations`, `GET /api/v1/staff/designations/:id`, `PATCH /api/v1/staff/designations/:id`, `DELETE /api/v1/staff/designations/:id`

### Phase 3.7: User & Role Administration (16 Endpoints)

- `GET /api/v1/users/dashboard`, `GET /api/v1/users/search`, `POST /api/v1/users`, `GET /api/v1/users`, `GET /api/v1/users/:id`, `PATCH /api/v1/users/:id`, `PATCH /api/v1/users/:id/status`, `GET /api/v1/users/:id/timeline`
- `POST /api/v1/users/roles`, `GET /api/v1/users/roles`, `GET /api/v1/users/roles/:id`, `PATCH /api/v1/users/roles/:id`, `DELETE /api/v1/users/roles/:id`, `POST /api/v1/users/:userId/roles`, `DELETE /api/v1/users/:userId/roles/:roleId`, `GET /api/v1/users/:userId/roles`
