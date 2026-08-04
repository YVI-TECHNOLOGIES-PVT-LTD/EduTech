# EduTrack Enterprise API Standards

> **Document Version:** 1.0.0  
> **Owner:** EduTrack Platform Team  
> **Status:** Approved  
> **Last Updated:** 2026-07-29  

---

## 1. Response Envelope Standard
All REST API endpoints across `@edutrack/api` MUST return a consistent top-level JSON structure for success and error responses.

### Standard Success Response Envelope
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "timestamp": "2026-07-29T15:00:00Z",
  "requestId": "req-c7e5b31f-88ab-46e2"
}
```

### Standard Error Response Envelope
```json
{
  "success": false,
  "error": "UNAUTHORIZED_ACCESS",
  "message": "Authentication token missing or invalid",
  "timestamp": "2026-07-29T15:00:00Z",
  "requestId": "req-c7e5b31f-88ab-46e2"
}
```

---

## 2. Mandatory Rules

### Timestamp Standard
All timestamps MUST use **UTC ISO-8601** format (`YYYY-MM-DDTHH:mm:ssZ`). Example: `2026-07-29T15:00:00Z`.

### Request Correlation (`requestId`)
Every API response MUST include a unique request identifier (`requestId`) for logging and debugging traceability across microservices and clients.

### Required Response Headers
- `Content-Type`: `application/json; charset=utf-8`
- `Cache-Control`: `no-store, max-age=0` (for sensitive/authenticated APIs)
- `X-Request-Id`: Matching the envelope `requestId`
- `X-API-Version`: e.g. `v1.0.0`
