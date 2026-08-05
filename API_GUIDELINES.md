# EduTrack ERP — REST API Guidelines (`API_GUIDELINES.md`)

**Generated Date:** August 5, 2026  
**Source of Truth:** REST API endpoint specifications of `@edutrack/api`.

---

## 1. Response Payload Standardization

All Express API endpoints return standardized JSON payloads:

### Success Response Format

```json
{
  "success": true,
  "data": {},
  "timestamp": "2026-08-05T15:45:00.000Z"
}
```

### Error Response Format

```json
{
  "success": false,
  "error": "ERROR_CODE_STRING",
  "message": "Human readable error description",
  "timestamp": "2026-08-05T15:45:00.000Z",
  "requestId": "req-12345"
}
```

---

## 2. HTTP Status Code Conventions

- `200 OK`: Successful retrieval or update.
- `201 Created`: Successful creation of a resource.
- `400 Bad Request`: Validation failure or bad input payload.
- `401 Unauthorized`: Missing or expired Bearer JWT token.
- `403 Forbidden`: Insufficient RBAC permission code.
- `404 Not Found`: Target resource or route does not exist.
- `500 Internal Server Error`: Unhandled server exception.
