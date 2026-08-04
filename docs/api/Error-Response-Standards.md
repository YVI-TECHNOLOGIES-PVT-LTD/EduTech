# EduTrack Error Response Standards

> **Document Version:** 1.0.0  
> **Owner:** EduTrack Platform Team  
> **Status:** Approved  
> **Last Updated:** 2026-07-29  

---

## 1. Controlled Error Vocabulary
The `error` field in error response envelopes MUST use one of the following controlled constants:

| Error Code | HTTP Status | Description |
| :--- | :---: | :--- |
| `INVALID_INPUT` | `400` | Payload syntax error or unparseable JSON |
| `VALIDATION_ERROR` | `400` | Zod schema or field constraint violation |
| `UNAUTHORIZED_ACCESS` | `401` | Missing, malformed, or expired JWT token |
| `FORBIDDEN` | `403` | Insufficient RBAC permission or tenant mismatch |
| `RESOURCE_NOT_FOUND` | `404` | Requested entity or route does not exist |
| `CONFLICT` | `409` | Unique key or database state violation |
| `RATE_LIMIT_EXCEEDED` | `429` | Client exceeded API rate limit quota |
| `INTERNAL_SERVER_ERROR` | `500` | Unhandled backend runtime error |

---

## 2. Standard Error Payload Format
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Email address must be a valid format",
  "timestamp": "2026-07-29T15:00:00Z",
  "requestId": "req-98fa7210"
}
```
