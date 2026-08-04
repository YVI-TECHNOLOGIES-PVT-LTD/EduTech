# EduTrack Mobile API Standards

## Multi-Tenant Headers
Every outbound request must include:
- `Authorization`: `Bearer <token>`
- `X-Tenant-ID`: `<tenant-id>`
- `Workspace-ID`: `<workspace-id>`
- `School-ID`: `<school-id>`
- `Academic-Year-ID`: `<academic-year-id>`

## Refresh Token Flow
When a 401 Unauthorized occurs, the response interceptor automatically pauses pending requests, refreshes the access token using the stored refresh token in Expo SecureStore, and retries the failed request queue transparently.
