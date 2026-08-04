# EduTrack Enterprise Platform — Backend Architecture (`apps/backend`)

## 1. Modular Domain Architecture

The backend REST API is structured into explicit feature modules within `apps/backend/src/modules/`:

```text
apps/backend/src/
├── config/                  # Supabase, Prisma, Express, Logger setup
├── middlewares/             # Request ID, Logging, Production block
├── modules/
│   ├── academic/            # Academic Year & Section Faculty Assignments
│   ├── admin/               # Administrative & Bulk Import Routes
│   ├── admission/           # Admissions CRM, Lead Pipeline, Applications
│   ├── compatibility/       # Legacy System & Dual-Write Adapters
│   ├── dashboard/           # Role-based Executive KPI Services
│   ├── departments/         # Department & Staff Management
│   ├── fees/                # Fee Structures, Demands, Ledgers, Receipts
│   ├── import/              # Bulk CSV/XLSX Ingestion Engines
│   └── student/             # Student Records, Attendance & Transcripts
├── rbac/                    # Permissions Registry & RBAC Middleware
├── utils/                   # Logger, Helper Utilities
├── workflows/               # Event Workflows & Notification Engine
└── server.ts                # Application Entry Point
```

---

## 2. Key Service Architecture

### 2.1 Admissions Workflow Engine (`ApplicationWorkflowService.ts`)

Handles application state transitions (`INQUIRY_CREATED` → `LEAD_ASSIGNED` → `APPLICATION_SUBMITTED` → `EXAM_SCHEDULED` → `MERIT_PUBLISHED` → `OFFER_SENT` → `PAYMENT_VERIFIED` → `ENROLLMENT_COMPLETE`) with notification event triggers.

### 2.2 Counselor Assignment Strategy (`CounselorAssignmentService.ts`)

Implements manual assignment (`ManualAssignmentStrategy`) and automated round-robin assignment (`RoundRobinAssignmentStrategy`) with optimistic locking checks.

### 2.3 Compatibility Dual-Write Repository (`CompatibilityRepository.ts`)

Dual-writes attendance sessions and records atomically across legacy `attendance_sessions` and new `student_attendance_sessions` tables.
