# EduTrack API Filtering Standard

> **Document Version:** 1.0.0  
> **Owner:** EduTrack Platform Team  
> **Status:** Approved  
> **Last Updated:** 2026-07-29  

---

## Canonical Query Pattern
Multiple filter operators can be combined seamlessly with pagination and sorting in a single request.

### Example Combined Query URL
```text
GET /api/v1/admission/enquiries?status=APPROVED&search=john&startDate=2026-01-01&endDate=2026-12-31&page=1&limit=10&sortBy=createdAt&sortOrder=desc
```

### Supported Filter Operators
- **Search**: `search=john` (performs partial case-insensitive string matching across primary fields).
- **Exact Field**: `status=APPROVED` (matches exact enum/value).
- **Date Range**: `startDate=YYYY-MM-DD` and `endDate=YYYY-MM-DD`.
