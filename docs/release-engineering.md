# EduTrack Release Engineering & Automation

> **Document Version:** 1.0.0  
> **Owner:** EduTrack Platform Team  
> **Status:** Approved  
> **Last Updated:** 2026-07-29  

---

## 1. Overview & Release Quality Gates
The EduTrack monorepo employs an automated release pipeline (`.github/workflows/release.yml`) enforcing 5 sequential quality gates before artifact publication:

```text
Git Release Tag (v*)
  ├── Gate 1: Typecheck Verification (pnpm run typecheck)
  ├── Gate 2: ESLint Compliance (pnpm run lint)
  ├── Gate 3: Monorepo Turbo Build (pnpm run build)
  ├── Gate 4: API Quality Verification (Newman CLI Runner)
  └── Gate 5: SHA-256 Artifact Checksum Generation (release-checksums.sha256)
```

## 2. Release Promotion Protocol
1. Merge feature branch into `main` after PR approval and CI pass.
2. Update `CHANGELOG.md` under `## [Unreleased]`.
3. Tag release commit using Semantic Versioning format (`git tag -a v2.10.0 -m "Release v2.10.0"`).
4. Push git tag (`git push origin v2.10.0`) to trigger GitHub Actions release pipeline.
