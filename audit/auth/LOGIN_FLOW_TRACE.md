# Login Flow Trace Report

## 1. Intended Execution Trace

$$\text{Client POST /api/v1/auth/login} \longrightarrow \text{Express app.use('/api', router)} \longrightarrow \text{UserController.login} \longrightarrow \text{Supabase Auth / SessionService} \longrightarrow \text{JWT Generation} \longrightarrow \text{200 OK Response}$$

---

## 2. Actual Execution Trace (Root Cause Interception)

```text
1. Client sends: POST http://localhost:3000/api/v1/auth/login (Header: Content-Type: application/json)
2. Express matches app.use('/api', router) in src/app.ts (Line 70)
3. Express enters router in src/routes.ts
4. Express executes middleware in sequential order:
   ├── Line 22: requestIdMiddleware
   ├── Line 25: helmet
   ├── Line 41: cors
   ├── Line 60: authRateLimiter
   └── Line 342: router.use(authenticate) <--- INTERCEPTION POINT
5. `authenticate` checks: `req.headers.authorization`
6. `authHeader` is undefined (client is trying to log in and has no token yet!)
7. `authenticate` returns: 401 Unauthorized `{ error: "Missing or invalid Authorization header" }`
8. Request terminates prematurely BEFORE ever reaching `UserController.login`!
```
