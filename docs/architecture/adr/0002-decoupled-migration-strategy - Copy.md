# ADR 0002: Decoupled Migration Strategy

## Status
Accepted

## Context
Refactoring repository structure and refactoring internal backend code at the same time introduces single points of failure and makes root-cause analysis ambiguous when errors occur.

## Decision
Separate the migration into two completely independent, sequentially executed projects:
1. **Project A (Repository Migration)**: Restructure physical repository into `apps/api`, `apps/web`, `apps/mobile`. Zero internal backend code changes.
2. **Project B (Backend Architecture Refactor)**: Standardize backend feature modules and introduce DDD layers strictly for complex domain modules. Initiates only after Project A is 100% verified and tagged.

## Consequences
- Deterministic risk isolation.
- Easy debugging and step-by-step verification.
- Zero risk of regression.
