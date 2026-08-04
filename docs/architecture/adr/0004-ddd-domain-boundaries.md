# ADR 0004: Domain-Driven Design (DDD) Boundaries

## Status
Accepted

## Context
Applying full DDD multi-layer structures (`presentation`, `application`, `domain`, `infrastructure`) to simple utility modules creates empty folders and unnecessary indirection.

## Decision
1. Standardize all 15 backend feature modules into `controllers`, `services`, `repositories`, `dto`, `validators`, and public barrel exports (`index.ts`).
2. Evolve high-complexity domain modules (`admission`, `student`, `fees`, `staff`) into full DDD layered sub-structures (`presentation/`, `application/`, `domain/`, `infrastructure/`).
3. Lean utility modules (`dashboard`, `timetable`, `compatibility`) remain in standard module structure.

## Consequences
- Clean Architecture without artificial complexity.
- Scalable design for high-traffic core domains.
- Clear public boundaries via barrel exports (`index.ts`).
