# ADR 0002: Adoption of Turborepo Task Orchestrator

## Status

Accepted

## Context

Compiling, linting, and building 7 workspace projects sequentially in CI caused long build times.

## Decision

We adopted `Turborepo` (`turbo@2.10.8`) to orchestrate monorepo build, lint, and typecheck tasks.

## Consequences

- **Positive:** Task graph scheduling enables maximum CPU parallelism.
- **Positive:** Intelligent content hashing avoids re-evaluating unchanged package tasks.
