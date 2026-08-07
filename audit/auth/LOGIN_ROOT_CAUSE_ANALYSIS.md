# Root Cause Analysis: "Missing or invalid Authorization header"

**Issue Description**: Client receives `401 Unauthorized` with `{ "error": "Missing or invalid Authorization header" }` when attempting to log in via `POST /api/v1/auth/login`.

---

## 1. Exact Source File & Line Number Evidence

- **File**: `apps/backend/src/routes.ts`
- **Line Number**: Line 342 (`router.use(authenticate)`)
- **Middleware File**: `apps/backend/src/auth/auth.middleware.ts`
- **Line Number**: Line 26-28 (`if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing or invalid Authorization header' })`)

---

## 2. Why It Happens

1. In `apps/backend/src/routes.ts` line 342, the global router registers `router.use(authenticate)`.
2. The login route `/v1/auth/login` is mounted in `userManagementRouter` registered at line 612 (`router.use('/v1/users', authenticate, userManagementRouter)`).
3. Because Express processes middleware sequentially, Express runs `authenticate` at line 342 BEFORE the request can ever reach `userManagementRouter` or `UserController.login`.
4. Since an unauthenticated user attempting to log in does NOT possess an `Authorization: Bearer <token>` header yet, `authenticate` immediately rejects the request with HTTP `401 Unauthorized`.

---

## 3. Recommended Fix (DO NOT APPLY - AUDIT ONLY)

Register `/v1/auth/login` on a public router BEFORE line 342 of `src/routes.ts`, or exclude public auth routes inside `authenticate` in `auth.middleware.ts`.
