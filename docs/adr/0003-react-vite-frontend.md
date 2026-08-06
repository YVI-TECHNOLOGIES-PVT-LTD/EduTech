# ADR 0003: Vite with React 18 for Web Application Platform

- **Status:** Accepted
- **Date:** 2026-08-05

## Context

The web administration portal requires a high-performance Single Page Application (SPA) with fast hot module replacement (HMR) and optimized build outputs.

## Decision

Use React 18.2 with Vite 5.0, Tailwind CSS, Radix UI, Zustand, and TanStack React Query (`@edutrack/web`).

## Consequences

- Ultra-fast HMR local development build cycles.
- Declarative component architecture using headless Radix UI primitives.
- Decoupled client state (Zustand) and server state caching (TanStack Query).
