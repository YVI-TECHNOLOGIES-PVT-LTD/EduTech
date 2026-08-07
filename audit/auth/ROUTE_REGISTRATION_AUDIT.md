# Route Registration Audit Report

**Scope**: Router Mounting, Middleware Order & Route Precedence Audit  
**Source File**: `apps/backend/src/routes.ts`

---

## 1. Route Mounting Analysis

```text
apps/backend/src/routes.ts
├── Lines 37 - 294: Public Endpoints (/health, /system/info, /v1/admission/public-apply, /public/admission/config)
├── Line 342: router.use(authenticate) <--- GLOBAL AUTHENTICATION GUARD MOUNTED HERE
├── Line 343: router.use(checkLoginApproval)
├── Line 360: router.get('/me', ...)
├── Line 480 - 490: router.use('/v1/admission/...', ...)
└── Lines 612 - 613: router.use('/v1/users', authenticate, userManagementRouter) <--- LOGIN ROUTE MOUNTED HERE
```

---

## 2. Critical Order Finding

`router.use(authenticate)` is executed at **line 342 of `routes.ts`**.
Because `/v1/auth/login` is registered after line 342, every request sent to `/api/v1/auth/login` triggers `authenticate` BEFORE reaching the login controller handler!
