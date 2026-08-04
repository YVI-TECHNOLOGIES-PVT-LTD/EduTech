# EduTrack Dependency Governance Guide

> **Architecture Version:** 2.12.0  
> **Owner:** EduTrack Platform Team  
> **Status:** Active Governance  
> **Last Updated:** 2026-07-29  

---

## 1. Dependency Cadence & Updates
- **Routine Updates**: Patch and minor updates audited bi-weekly.
- **Lockfile Enforcement**: All monorepo builds MUST use `pnpm install --frozen-lockfile`.
- **License Compliance**: Only MIT, Apache 2.0, and BSD licensed third-party packages are permitted.
