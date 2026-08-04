# EduTrack Pagination Standard

> **Document Version:** 1.0.0  
> **Owner:** EduTrack Platform Team  
> **Status:** Approved  
> **Last Updated:** 2026-07-29  

---

## 1. Query Parameters & Edge Cases
- `page`: Page number (1-based index).
  - If `page < 1` or omitted → defaults to `1`.
- `limit`: Items per page.
  - If `limit < 1` or omitted → defaults to `10`.
  - Maximum limit = `100` (values > 100 are capped to 100).
- **Empty Result Sets**: If no items match, the API returns HTTP 200 OK with `items: []`, `total: 0`, `totalPages: 0`.

---

## 2. Standardized Paginated Response Envelope
Paginated endpoints MUST use the unified success response envelope:

```json
{
  "success": true,
  "data": {
    "items": [
      { "id": "1", "name": "John Doe" }
    ],
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  },
  "message": "Records retrieved successfully",
  "timestamp": "2026-07-29T15:00:00Z",
  "requestId": "req-891a012e"
}
```
