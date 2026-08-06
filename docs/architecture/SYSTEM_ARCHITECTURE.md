# EduTrack ERP — System Architecture (`SYSTEM_ARCHITECTURE.md`)

**Generated Date:** August 5, 2026  
**Source of Truth:** Physical code and monorepo structure of `c:\Program Files\EduTech`

---

## 1. High-Level System Topology

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|                                                                                   |
|  +-----------------------------------+     +-----------------------------------+  |
|  |           Vite Web SPA            |     |         Expo Mobile App           |  |
|  |           (@edutrack/web)         |     |        (@edutrack/mobile)         |  |
|  |   React 18 + Zustand + TanStack   |     |   React Native + Expo Router v3   |  |
|  +-----------------+-----------------+     +-----------------+-----------------+  |
+--------------------|-----------------------------------------|--------------------+
                     | HTTP REST (JSON)                        | HTTP REST (JSON)
                     +--------------------+--------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                                  BACKEND API                                      |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                          Express.js REST API Server                         |  |
|  |                                (@edutrack/api)                              |  |
|  |                                                                             |  |
|  |   Middleware Chain:                                                         |  |
|  |   [ RequestID -> Gzip -> Helmet -> CORS -> RateLimit -> RequestLogger ]       |  |
|  |                                                                             |  |
|  |   Core Services:                                                            |  |
|  |   [ SessionService | AdmissionService | StudentService | FeeService | Task ]  |  |
|  +--------------------------------------+--------------------------------------+  |
+-----------------------------------------|-----------------------------------------+
                                          |
                        +-----------------+-----------------+
                        |                                   |
                        v                                   v
+---------------------------------------+ +---------------------------------------+
|          DATABASE STORAGE             | |          SUPABASE PLATFORM            |
|                                       | |                                       |
|  PostgreSQL 3NF Relational Database   | |  Supabase Auth API                    |
|  - 26 Tables (Stage-1 DDL)            | |  - User Identity Management           |
|  - Prisma ORM 5.22 Schema Client      | |  - JWT Access Token Verification      |
|  - 24 BEFORE UPDATE Triggers          | |  - Service Role Admin Queries         |
+---------------------------------------+ +---------------------------------------+
```

---

## 2. Monorepo Package Topology

```
                          +-------------------------+
                          |   pnpm Workspace Root   |
                          +------------+------------+
                                       |
        +------------------------------+------------------------------+
        |                              |                              |
 +------v------+                +------v------+                +------v------+
 |apps/backend |                |apps/web_app |                |apps/mobile  |
 |@edutrack/api|                |@edutrack/web|                |@edutrack/mb |
 +------+------+                +------+------+                +------+------+
        |                              |                              |
        +---------------+--------------+---------------+--------------+
                        |                              |
                +-------v-------+              +-------v-------+
                |@edutrack/types|              |@edutrack/valid|
                +---------------+              +---------------+
                        |                              |
                +-------v-------+              +-------v-------+
                |  @edutrack/ui |              |@edutrack/cnfg |
                +---------------+              +---------------+
```

---

## 3. Data & Authentication Interaction Flow

```
User (Browser/Mobile)      Vite/Expo Client           Express Backend           Supabase Auth           PostgreSQL
    |                           |                            |                        |                      |
    |---- Login Request -------->                            |                        |                      |
    |                           |---- authenticate() -------->                        |                      |
    |                           |                            |---- getUser(JWT) ------>                      |
    |                           |                            |<--- User Profile ------|                      |
    |                           |                            |---- Query Users ----------------------------->|
    |                           |                            |<--- Return Record ----------------------------|
    |                           |<--- Bearer Token ----------|                        |                      |
    |<--- Render App Dashboard -|                            |                        |                      |
```
