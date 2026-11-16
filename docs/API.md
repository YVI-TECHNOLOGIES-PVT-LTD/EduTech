# EduTrack ERP REST API Inventory

## Base Configuration

- **Base URL**: `http://localhost:3000/api/v1`
- **Authentication**: `Authorization: Bearer <accessToken>`
- **Multi-Tenancy Header**: `x-tenant-id: <organizationId>`

---

## Core Endpoint Catalog

### Authentication

- `POST /auth/login` — Authenticate user credentials
- `POST /auth/refresh` — Rotate expired access token
- `POST /auth/logout` — Revoke active session
- `GET /auth/me` — Fetch current logged-in user profile

### Dashboard

- `GET /dashboard/summary` — Aggregated KPI metrics, conversion funnel, pending tasks, recent audit activities

### Organization Management

- `GET /organization/profile` — Fetch tenant institution metadata
- `PUT /organization/profile` — Update institution profile
- `PUT /organization/branding` — Update logo, theme colors, display titles

### Users & RBAC

- `GET /users` — Paginated user directory
- `POST /users` — Create administrative user account
- `GET /users/roles` — List system roles and permission matrices
- `PUT /users/roles/:id/permissions` — Update role permissions matrix

### HR & Staff Management

- `GET /hr/departments` — List department tree
- `GET /hr/designations` — List job designations
- `GET /hr/staff` — List staff directory
- `POST /hr/staff` — Onboard new staff member

### Academic Structure

- `GET /academics/years` — List academic session calendars
- `GET /academics/grades` — List grades / classes catalog
- `GET /academics/sections` — List class section allocations

### CRM & Lead Inquiries

- `GET /crm/leads` — List prospective student leads
- `POST /crm/leads` — Capture inbound lead inquiry
- `GET /crm/campus-visits` — List scheduled campus visits

### Admissions Pipeline

- `GET /admissions/applications` — List formal admission applications
- `POST /admissions/applications/:id/documents` — Verify uploaded documents
- `POST /admissions/applications/:id/assessment` — Record entrance test/interview score
- `POST /admissions/applications/:id/decision` — Approve or reject application
- `POST /admissions/applications/:id/fees` — Record fee payment receipt

### Student Management & Stage-1 Enrollment

- `GET /students/directory` — List enrolled student master directory
- `GET /students/parents` — List parents & guardians catalog
- `POST /students/enroll` — Execute final Stage-1 student creation and enrollment
