# Native Authentication Flow Specification

$$\text{Client POST /api/v1/auth/login} \longrightarrow \text{AuthController.login} \longrightarrow \text{AuthService.login} \longrightarrow \text{Prisma users.findFirst} \longrightarrow \text{bcrypt.compare} \longrightarrow \text{JWT Generation} \longrightarrow \text{200 OK}$$

---

## 1. Native Execution Sequence

1. Client sends `POST /api/v1/auth/login` with `{ "email": "...", "password": "..." }`.
2. `publicAuthRouter` routes request to `AuthController.login`.
3. `AuthService.login` queries `public.users` via `prisma.users.findFirst({ where: { email } })`.
4. `AuthService` verifies status is `active` and checks `password_hash` using `bcrypt.compare(password, user.password_hash)`.
5. `AuthService` queries user roles and permissions via `prisma.user_roles.findMany({ include: { roles: ... } })`.
6. `AuthService` updates `last_login_at` timestamp in `public.users`.
7. `AuthService` signs native JWT Access Token and Refresh Token.
8. Server returns HTTP `200 OK` with `{ "accessToken": "...", "refreshToken": "...", "expiresIn": 86400, "user": { ... } }`.
