# EduTrack Standard Rollback Procedure

> **Document Version:** 1.0.0  
> **Owner:** EduTrack Platform Team  
> **Status:** Approved  
> **Last Updated:** 2026-07-29  

---

## 1. Rollback Execution Checklist
When a production deployment fails quality criteria or exceeds error budgets (P1/P2 alert triggers):
1. **Identify Previous Artifact**: Select last known good release tag (e.g. `v2.9.0`) and verify `release-manifest.json` SHA-256 checksums.
2. **Revert Deployment Route**: Re-route load balancer / CDN traffic to previous release container/artifact.
3. **Database Compatibility Check**: Ensure zero destructive schema changes occurred during the failed release (Prisma migrations in EduTrack are additive & non-breaking).
4. **Post-Rollback Verification**: Run `pnpm run test:all` against rolling deployment to confirm full operational recovery.
