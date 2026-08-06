# EduTrack ERP — Project Structure Map (`PROJECT_STRUCTURE.md`)

**Generated Date:** August 5, 2026  
**Source of Truth:** Physical monorepo workspace directory tree of `c:\Program Files\EduTech`.

---

## Workspace Directory Tree

```
EduTech/
├── .github/workflows/ci.yml   # CI/CD GitHub Actions Workflow
├── apps/
│   ├── backend/               # @edutrack/api (Express.js REST API)
│   ├── database/              # Stage-1 PostgreSQL DDL Schemas
│   ├── mobile_app/            # @edutrack/mobile (Expo React Native App)
│   └── web_app/               # @edutrack/web (React 18 Vite Web App)
├── assets/                    # Shared static branding assets
├── docker/                    # Docker orchestration documentation
├── docs/                      # Enterprise documentation portal
│   ├── adr/                   # Architecture Decision Records (0001-0006)
│   ├── architecture/          # System Architecture & Topology
│   ├── backend/               # Backend Architecture & Env Vars
│   ├── database/              # Database Architecture & Inventory Ledger
│   ├── devops/                # DevOps & Docker Documentation
│   ├── frontend/              # Frontend Architecture & Env Vars
│   ├── git/                   # Git Standards & Workflow Conventions
│   ├── mobile/                # Mobile Architecture & Env Vars
│   ├── security/              # Security Architecture & Baseline Matrix
│   └── standards/             # Coding & Engineering Standards
│   ├── API_INVENTORY.md       # Inventory of all REST API Endpoints
│   ├── DATABASE_INVENTORY.md  # Inventory of 26 3NF Relational Tables
│   ├── DEPENDENCY_AUDIT.md    # Monorepo Dependency Audit
│   ├── FOLDER_STRUCTURE_AUDIT # Directory Taxonomy Audit
│   ├── PACKAGE_INVENTORY.md   # Shared Workspace Package Tree
│   ├── PHASE_0_AUDIT_REPORT.md# Phase-0 Final Completion Audit Report
│   ├── REPOSITORY_HEALTH.md   # Repository Quality Gate Metrics
│   ├── REPOSITORY_INVENTORY.md# Codebase Component Inventory Ledger
│   └── SCRIPT_INVENTORY.md    # Inventory of all NPM Scripts
├── examples/                  # Standard implementation code templates
├── infrastructure/            # Infrastructure maintenance scripts
├── packages/
│   ├── config/                # @edutrack/config (Shared ESLint/Prettier/TS)
│   ├── types/                 # @edutrack/types (Shared TypeScript Interfaces)
│   ├── ui/                    # @edutrack/ui (Shared React UI Primitives)
│   └── validation/            # @edutrack/validation (Shared Zod Schemas)
├── postman/                   # Postman Integration API Collections
├── scripts/                   # Migration runner and build scripts
├── tools/                     # Workspace developer utility tools
├── .env.example               # Unified monorepo environment template
├── ARCHITECTURE.md            # Root Architecture Portal
├── API_GUIDELINES.md          # REST API Payload Specifications
├── CODING_STANDARDS.md        # Root Coding Standards Portal
├── DEPLOYMENT.md              # Containerized Deployment Instructions
├── DEVELOPMENT.md             # Local Developer Setup Guide
├── PHASE_CHECKLIST.md         # Phase-0 Sign-Off Verification Checklist
├── PROJECT_STRUCTURE.md       # Monorepo Directory Map
└── TECH_STACK.md              # Technology Stack Matrix
```
