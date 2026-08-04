# EduTrack Authentication Flow Standard

## JWT Authentication Protocol
1. Client POSTs credentials to `/api/auth/login`.
2. Server validates credentials and returns `accessToken` and optional `refreshToken`.
3. Client includes `Authorization: Bearer <accessToken>` header on all protected requests.
4. When `accessToken` expires (401), client calls `/api/auth/refresh` using `refreshToken` to acquire a new token.
