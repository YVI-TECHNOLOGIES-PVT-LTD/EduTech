# EduTrack Architecture Governance PR Checklist

> **Architecture Version:** 2.12.0  
> **Owner:** EduTrack Architecture Board  
> **Status:** Active Governance  
> **Last Updated:** 2026-07-29  

---

## PR Architectural Review Requirements
Before merging any Pull Request into `main`, reviewers MUST verify:

- [ ] **ADR Impact**: Does this PR introduce architectural changes requiring a new ADR?
- [ ] **Protected Scope Isolation**: Ensures business logic, API envelopes, and database schemas are untouched.
- [ ] **Package Boundary Compliance**: Public imports from `@edutrack/*` use official package entry points without deep internal path imports.
- [ ] **Security Audit**: No plain-text secrets, non-root container compliance verified, Zod schema validation enforced.
- [ ] **Quality Gates**: `pnpm run typecheck`, `pnpm run lint`, `pnpm run build`, and `pnpm run test:all` pass cleanly.
