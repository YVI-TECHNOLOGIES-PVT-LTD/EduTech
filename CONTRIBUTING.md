# Contributing to EduTrack Enterprise Platform

Thank you for your interest in contributing to EduTrack!

## 1. Development Process

1. Fork the repository and create a feature branch (`git checkout -b feat/my-feature`).
2. Install monorepo dependencies (`pnpm install`).
3. Ensure local verification passes (`pnpm verify`).

## 2. Commit Message Conventions

EduTrack enforces Conventional Commits (`@commitlint/config-conventional`):

- `feat:` A new feature for the user or system.
- `fix:` A bug fix.
- `chore:` Changes to build process, tooling, or documentation.
- `refactor:` Code change that neither fixes a bug nor adds a feature.

Example:

```bash
git commit -m "feat(admission): add round-robin counselor assignment policy"
```
