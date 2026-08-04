# ADR-012: Release Engineering & Automation

## Status
Accepted

## Context
The EduTrack monorepo required automated release workflows, semantic versioning governance (SemVer 2.0.0), changelog management (`CHANGELOG.md`), and artifact checksum verification (`release-checksums.sha256`) to ensure reproducible production deployments and release quality gates.

## Decision
We implement enterprise release engineering:
1. **Release Automation**: `.github/workflows/release.yml` executing 5 sequential quality gates (Typecheck, Lint, Turbo Build, Newman API Tests, SHA-256 Checksums).
2. **Semantic Versioning Governance**: Enforcing `MAJOR.MINOR.PATCH` across all monorepo workspaces (`apps/*`, `packages/*`).
3. **Automated Changelog Management**: Maintaining root `CHANGELOG.md` adhering to Keep a Changelog standards.
4. **Artifact Checksum Verification**: Generating SHA-256 checksums (`release-checksums.sha256`) for all application build artifacts prior to release publication.

## Consequences
### Positive
- Reproducible, audit-verifiable release artifacts and automated GitHub releases.
- Strict quality gates prevent broken code from being tagged or published.
- Zero change to application business logic, API contracts, or database schemas.

### Negative
- Requires maintaining release tags and GitHub Actions permissions.

## Rollback Strategy
Revert `.github/workflows/release.yml` and delete release tag in Git.
