# ADR 0005: Separation of Client & Server State (React Query + Zustand)

## Status

Accepted

## Context

Mixing server data fetching with local UI state in Redux orContext API causes unnecessary re-renders and complex caching logic.

## Decision

We adopted **TanStack React Query** for server state caching and **Zustand** for local client UI state.

## Consequences

- **Positive:** Automatic background refetching and cache invalidation via React Query.
- **Positive:** Lightweight, boilerplate-free client state via Zustand.
