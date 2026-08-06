# EduTrack ERP — Git Standards & Release Workflow (`GIT_STANDARDS.md`)

**Generated Date:** August 5, 2026  
**Source of Truth:** Git repository governance guidelines.

---

## 1. Branch Strategy (Git Flow)

- **`main`**: Production-ready code. Protected branch.
- **`develop`**: Integration branch for upcoming releases.
- **`feature/<feature-name>`**: New feature development (branched off `develop`).
- **`bugfix/<issue-name>`**: Non-critical bug fixes (branched off `develop`).
- **`hotfix/<hotfix-name>`**: Emergency production fixes (branched off `main`).

---

## 2. Commit Message Convention (Conventional Commits)

Commit messages must follow the format: `<type>(<scope>): <short description>`

- **`feat`**: A new feature (e.g. `feat(admission): add document upload route`).
- **`fix`**: A bug fix (e.g. `fix(auth): fix token expiration check`).
- **`docs`**: Documentation updates (e.g. `docs(architecture): update system diagram`).
- **`refactor`**: Code restructuring without behavior changes.
- **`test`**: Adding or updating tests.
- **`chore`**: Maintenance tasks, dependency updates, build configs.
