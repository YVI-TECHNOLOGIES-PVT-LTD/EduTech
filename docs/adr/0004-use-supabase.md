# ADR 0004: Adoption of Supabase Identity & Storage

## Status

Accepted

## Context

Building custom auth identity, password resets, and file upload buckets from scratch increases security risk.

## Decision

We integrated Supabase Auth & Storage (`@supabase/supabase-js@2.39.0`).

## Consequences

- **Positive:** Out-of-the-box OAuth providers, JWT generation, and storage bucket security.
- **Positive:** Multi-schema postgres compatibility (`auth` schema managed by Supabase GoTrue).
