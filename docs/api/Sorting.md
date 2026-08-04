# EduTrack API Sorting Standard

> **Document Version:** 1.0.0  
> **Owner:** EduTrack Platform Team  
> **Status:** Approved  
> **Last Updated:** 2026-07-29  

---

## Query Parameters & Validation
- `sortBy`: Field name to sort by (e.g. `createdAt`, `studentName`).
- `sortOrder`: Sorting direction (`asc` or `desc`, default: `asc`).

### Unknown / Invalid `sortBy` Rule
If an unknown or unsupported `sortBy` field is supplied, the API MUST fallback to sorting by primary creation timestamp (`createdAt` or `id`) rather than throwing an error.
