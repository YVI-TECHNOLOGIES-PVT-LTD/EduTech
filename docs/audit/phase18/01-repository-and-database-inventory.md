# Phase 18 — 01. Repository and Database Inventory

**Audit Date:** 2026-10-30  
**Target Monorepo:** EduTrack ERP (`EduTech`)  
**Current Branch:** `hari-finance` (Commit: `9a80154`, Tracking: `origin/hari-finance`)  
**Sole Source of Truth for Database:** `apps/backend/prisma/schema.prisma`

---

## 1. Monorepo Structure & Applications

The repository is configured as a PNPM workspace containing three production applications:

```text
EduTech/
├── apps/
│   ├── backend/           # Node.js Express + Prisma ORM (Port: 3000)
│   ├── web_app/           # React 18 + Vite + Tailwind CSS + Radix UI
│   ├── mobile_app/        # React Native + Expo Router + TanStack Query
│   └── database/          # Archived Stage-1 SQL blueprints (REFERENCE ONLY)
├── packages/              # Shared types and validation packages
└── docs/audit/            # Authoritative audit and forensic documentation
```

---

## 2. Recent Commit History & Phase 17 Handover

Prior to Phase 18 commencement, the recent commit history verified clean continuity:

- `9a80154`: `feat(phase17): implement database-aligned services & audit report`
- `60dd424`: `feat(notifications): complete parent mobile finance & notification audit`
- `a9c3486`: `fix(finance): fix dashboard loading and 403 unauthorized access`
- `7da311f`: `fix(finance): map fee structure retrieval and dashboard kpis to schema.prisma tables`

The Phase 17 repair of [`DepartmentService`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/departments/department.service.ts) and [`DepartmentController`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/departments/department.controller.ts) was inspected and confirmed 100% intact, with all 6 unit tests in [`department.service.spec.ts`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/src/modules/departments/tests/department.service.spec.ts) passing.

---

## 3. Authoritative Prisma Schema Inventory

The authoritative database contract is defined exclusively in [`apps/backend/prisma/schema.prisma`](file:///Users/sathish/Documents/GitHub/EduTech/apps/backend/prisma/schema.prisma) (2,582 lines, 67 models, 58 Prisma enums, 65 database PostgreSQL enums).

### The 67 Authoritative Models:

1. `academic_year_grades`
2. `academic_years`
3. `admission_configurations`
4. `admission_decisions`
5. `admission_documents`
6. `admission_fee_payments`
7. `admissions_applications`
8. `application_assessments`
9. `assessment_configurations`
10. `bank_statement_entries`
11. `chatbot_messages`
12. `chatbot_sessions`
13. `countries`
14. `departments`
15. `designations`
16. `document_chunks`
17. `document_types`
18. `fee_components`
19. `fee_structures`
20. `feed_comments`
21. `feed_post_academic_year_grade_targets`
22. `feed_post_allowed_reactions`
23. `feed_post_reactions`
24. `feed_post_section_targets`
25. `feed_post_student_targets`
26. `feed_posts`
27. `feed_reaction_types`
28. `gateway_settlement_items`
29. `gateway_settlements`
30. `grades`
31. `helpdesk_attachments`
32. `helpdesk_categories`
33. `helpdesk_escalation_rules`
34. `helpdesk_messages`
35. `helpdesk_ticket_history`
36. `helpdesk_tickets`
37. `installment_plan_terms`
38. `installment_plans`
39. `lead_activities`
40. `lead_query_type_mappings`
41. `lead_query_types`
42. `lead_visits`
43. `leads`
44. `notifications`
45. `organizations`
46. `parents`
47. `payment_adjustments`
48. `payment_allocations`
49. `payment_orders`
50. `payment_reconciliation_matches`
51. `payment_reconciliation_runs`
52. `payment_refunds`
53. `payment_transactions`
54. `payment_webhook_events`
55. `roles`
56. `scholarship_concession_approval_history`
57. `scholarship_concessions`
58. `sections`
59. `staff`
60. `student_charge_dues`
61. `student_charges`
62. `student_enrollments`
63. `student_fee_assignments`
64. `student_parents`
65. `students`
66. `user_roles`
67. `users`

---

## 4. Architectural Boundaries & Non-Negotiable Source of Truth Hierarchy

In strict accordance with the project governing hierarchy:

```text
           FINALIZED DATABASE
                   │
                   ▼
    apps/backend/prisma/schema.prisma
                   │
                   ▼
         Backend API Layer (Express)
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
apps/web_app (Admin)   apps/mobile_app (Parent)
```

No module, repository, controller, or UI may reference tables or fields outside of `schema.prisma`.
Older legacy scripts in `apps/database/stage_1/` are superseded wherever they conflict with `schema.prisma`.
