# API Contract & Client Compatibility Report

**Scope**: Web Admin Portal, Mobile Applications & Postman Suite

---

## 1. Request / Response Contract Verification

- **Login Request**: Accepts `{ "email": "...", "password": "..." }` (and `passwordHash` fallback).
- **Login Response**: Returns `{ "accessToken": "...", "refreshToken": "...", "expiresIn": 86400, "user": { ... } }`.
- **Refresh Request**: Accepts `{ "refreshToken": "..." }`.
- **Refresh Response**: Returns `{ "accessToken": "...", "refreshToken": "...", "expiresIn": 86400 }`.
- **Profile Response (`GET /me`)**: Returns user profile with roles, permissions, and `enabledFeatures`.

---

## 2. Client Compatibility Status

- **Web Admin Portal (React / Redux Toolkit)**: ✅ 100% Compatible
- **Parent / Student / Teacher Mobile Apps**: ✅ 100% Compatible
- **Postman Collection & Environment**: ✅ 100% Compatible
