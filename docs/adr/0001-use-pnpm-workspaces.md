# ADR 0001: Adoption of pnpm Workspaces

## Status

Accepted

## Context

EduTrack consists of multiple applications (`web_app`, `mobile_app`, `backend`) sharing common type definitions, UI component primitives, and validation schemas. npm/yarn 1 standard hoisting created phantom dependencies and disk space bloat.

## Decision

We adopted `pnpm` workspaces (`pnpm@9.15.4`) for monorepo package management.

## Consequences

- **Positive:** Content-addressable file store reduces disk space usage across workspaces.
- **Positive:** Strict dependency isolation prevents importing unlisted package dependencies.
