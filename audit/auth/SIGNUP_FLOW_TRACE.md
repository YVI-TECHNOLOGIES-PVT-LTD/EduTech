# Signup & Public Intake Flow Trace Report

## 1. Intended Execution Trace

$$\text{Client POST /api/v1/admission/public-apply} \longrightarrow \text{publicApplicationController.apply} \longrightarrow \text{PublicApplicationService} \longrightarrow \text{Prisma $transaction} \longrightarrow \text{User + Student + Parent Records Created}$$

---

## 2. Source-Code Verification

- `POST /api/v1/admission/public-apply` is registered at **line 70 of `src/routes.ts`**.
- Line 70 is placed BEFORE line 342 (`router.use(authenticate)`), so public intake applications process successfully without requiring a Bearer token.
