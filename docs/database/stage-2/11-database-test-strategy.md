# EduTrack ERP — Stage 2 Database Architecture

# Report 11: Stage 2 Database Quality Assurance & Test Strategy

**Document ID:** STG2-DB-TST-11  
**Date:** November 10, 2026  
**Author:** Principal QA Architect & Data Integrity Test Engineer  
**Scope:** Automated Test Suite Design for Relational Integrity, Multi-Tenant Security, Durable Persistence, and Query Latency  
**Governing Rule:** `.agents/AGENTS.md` (Stage-1 Database Freeze)

---

## 1. Executive Summary

This test strategy defines the verification battery required before certifying the Stage-2 database implementation for production readiness.

The test suite covers four rigorous testing dimensions:

1. **Relational & Constraint Integrity** (Foreign keys, check constraints, date boundaries, immutability)
2. **Multi-Tenant Security** (Cross-tenant leakage, RBAC authorization, least-privilege role boundaries)
3. **Durable Persistence & ACID Guarantees** (Verification against RAM-only mock leaks, rollback verification)
4. **Performance & Query Latency Benchmarks** (P95 latency targets under simulated multi-tenant loads)

---

## 2. Test Suite Category A: Relational & Constraint Integrity

| Test Case ID  | Test Objective                               | Input Condition / Payload                                                                              | Expected Database Behavior                                                                      | Status Target |
| :------------ | :------------------------------------------- | :----------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------- | :-----------: |
| **TC-INT-01** | Valid Term Date Range                        | `start_date: '2026-06-01'`, `end_date: '2026-10-31'`                                                   | Record inserted successfully.                                                                   |     PASS      |
| **TC-INT-02** | Invalid Inverted Term Date Range             | `start_date: '2026-10-31'`, `end_date: '2026-06-01'`                                                   | PostgreSQL check constraint `chk_term_dates` raises exception. Write blocked.                   |     PASS      |
| **TC-INT-03** | Invalid Foreign Key Reference                | Insert `curriculum_plans` referencing non-existent `mapping_id`                                        | Foreign key violation raised (`violates foreign key constraint`). Write rejected.               |     PASS      |
| **TC-INT-04** | Duplicate Organization Subject Code          | Two subjects in Org 1 with `subject_code: 'MATH101'`                                                   | Unique constraint `(org_id, subject_code)` violation raised.                                    |     PASS      |
| **TC-INT-05** | Same Subject Code Across Different Orgs      | Org 1 and Org 2 both create `subject_code: 'MATH101'`                                                  | Both succeed. Confirms uniqueness is correctly scoped to tenant.                                |     PASS      |
| **TC-INT-06** | Published Calendar Immutability              | Attempt to update `start_date` of an entry on a `published` calendar                                   | Database trigger `trg_calendar_immutable` raises error: `Published calendar cannot be mutated`. |     PASS      |
| **TC-INT-07** | Cascade Delete Safety on Curriculum Outcomes | Attempt to delete a `curriculum_learning_outcomes` record linked to an existing `lesson_plan_outcomes` | Foreign key `ON DELETE RESTRICT` halts delete, preserving lesson plan integrity.                |     PASS      |

---

## 3. Test Suite Category B: Multi-Tenant Security & Isolation

| Test Case ID  | Test Objective                          | Attack Vector / Scenario                                                                         | Expected Security Enforcement                                                                 | Status Target |
| :------------ | :-------------------------------------- | :----------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------- | :-----------: |
| **TC-SEC-01** | Cross-Tenant Calendar Read              | Teacher from Org A attempts to fetch `GET /api/v1/academic/calendars/:id` belonging to Org B     | HTTP 403 Forbidden or 404 Not Found. Zero data leaked.                                        |     PASS      |
| **TC-SEC-02** | Cross-Tenant Lesson Plan Tampering      | Teacher from Org B attempts `PUT /api/v1/lessons/:id` of Org A teacher                           | Request rejected with HTTP 403 Forbidden.                                                     |     PASS      |
| **TC-SEC-03** | Unauthorized Academic Publishing        | User with role `TEACHER` attempts `POST /api/v1/academic/setup/publish`                          | RBAC middleware rejects call with HTTP 403 Forbidden. Only `ADMIN` allowed.                   |     PASS      |
| **TC-SEC-04** | Cross-Tenant Digital Asset Direct Query | Attacker executes raw SQL as unprivileged role `edutrack_app` with `app.current_org_id = 'OrgA'` | Query `SELECT * FROM learning_resources WHERE org_id = 'OrgB'` returns 0 rows (RLS enforced). |     PASS      |
| **TC-SEC-05** | Resource Share Audience Scoping         | Student in Section A queries resources shared strictly with Section B                            | Resource omitted from student's search results.                                               |     PASS      |

---

## 4. Test Suite Category C: Durable Persistence & Anti-Mock Verification

| Test Case ID  | Test Objective                               | Execution Scenario                                                                        | Verification Criteria                                                                                                       | Status Target |
| :------------ | :------------------------------------------- | :---------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------- | :-----------: |
| **TC-PST-01** | Anti-RAM Persistence Audit                   | Invoke `prisma.curriculum_plans.create(...)` in integration environment                   | Inspect Node.js heap memory (`fallbackStores`). Must have size 0. Record must be visible via raw `psql SELECT`.             |     PASS      |
| **TC-PST-02** | Pod Restart Durability                       | Create curriculum plan with 5 units. Restart Node.js container process (`docker restart`) | Subsequent query after restart retrieves all 5 units from database intact.                                                  |     PASS      |
| **TC-PST-03** | Multi-Unit Plan Atomic Rollback              | Induce failure on unit 4 during 5-unit curriculum creation inside `$transaction`          | Entire plan rolled back. Zero units or orphaned plan headers remain in PostgreSQL.                                          |     PASS      |
| **TC-PST-04** | Concurrent Calendar Publication Version Lock | Two administrators trigger publication on the same calendar simultaneously                | PostgreSQL row lock (`SELECT FOR UPDATE`) forces sequential execution; version numbers increment cleanly without collision. |     PASS      |

---

## 5. Test Suite Category D: Query Latency & Performance Benchmarks

| Query Scenario                                       | Target Table(s)                                                             | Benchmark Condition                                                 | Latency SLA (P95) | Tested Index                              |
| :--------------------------------------------------- | :-------------------------------------------------------------------------- | :------------------------------------------------------------------ | :---------------: | :---------------------------------------- |
| **1. Fetch Annual Calendar Timeline**                | `academic_calendars`, `academic_terms`, `academic_calendar_entries`         | 100,000 entries across 50 tenants; 1 academic year filter           |    **< 15 ms**    | `ix_calendar_entries_dates`               |
| **2. Full Curriculum Unit & Outcome Hierarchy**      | `curriculum_plans`, `curriculum_plan_units`, `curriculum_learning_outcomes` | Deep 3-level join on published plan                                 |    **< 25 ms**    | `ix_curriculum_plan_units_plan`           |
| **3. Teacher Daily Lesson Planner View**             | `lesson_plans`, `lesson_activities`, `lesson_differentiation_strategies`    | Filter by `teacher_staff_id` and `planned_date` range               |    **< 20 ms**    | `ix_lesson_plans_teacher_date`            |
| **4. Substring Trigram Search on Digital Resources** | `learning_resources`                                                        | 500,000 resources; wildcard search `title ILIKE '%photosynthesis%'` |    **< 10 ms**    | `ix_learning_resources_trgm_search` (GIN) |
| **5. Student Resource Access Grant Resolution**      | `learning_resource_shares`, `learning_resource_share_sections`              | Section-level permission check for active student                   |    **< 12 ms**    | `ix_share_sections_section`               |
