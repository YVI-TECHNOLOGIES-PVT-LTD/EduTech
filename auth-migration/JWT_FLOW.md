# Custom JWT Architecture Specification

**Library**: `jsonwebtoken`  
**Secrets**: `JWT_SECRET` (Access Tokens), `JWT_REFRESH_SECRET` (Refresh Tokens)

---

## 1. Token Specification

- **Access Token Payload**:
  ```json
  {
    "userId": "usr-uuid-001",
    "email": "admin@apexacademy.edu",
    "orgId": "org-apex-001",
    "roles": ["ADMIN"],
    "iat": 1786073000,
    "exp": 1786159400
  }
  ```
- **Access Token TTL**: 1 Day (`1d`).
- **Refresh Token TTL**: 7 Days (`7d`).
- **Token Verification**: Handled natively in `SessionService.validateSession` using `jwt.verify(token, JWT_SECRET)`.
