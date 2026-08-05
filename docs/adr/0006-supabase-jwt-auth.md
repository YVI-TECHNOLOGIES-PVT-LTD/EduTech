# ADR 0006: Supabase Authentication and JWT Session Management

- **Status:** Accepted
- **Date:** 2026-08-05

## Context

User authentication and session verification require secure token generation, role mapping, and user identity storage.

## Decision

Use Supabase Auth as the identity provider and JWT validator within Express backend middleware (`SessionService`).

## Consequences

- Offloads OAuth, password hashing, and token signing to Supabase.
- Backend verifies JWT tokens via `@supabase/supabase-js` auth client and queries user roles/permissions.
