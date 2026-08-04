# EduTrack HTTP Status Standards

| Status Code | Meaning | Use Case |
| :--- | :--- | :--- |
| **200 OK** | Successful Request | Standard GET, PUT, PATCH responses |
| **201 Created** | Resource Created | Successful POST creation |
| **204 No Content** | Successful Execution | Successful DELETE request |
| **400 Bad Request** | Validation Failure | Invalid request payload or missing fields |
| **401 Unauthorized** | Unauthenticated | Missing or expired JWT token |
| **403 Forbidden** | Unauthorized Role | Valid JWT but inadequate RBAC permissions |
| **404 Not Found** | Missing Resource | Requested entity does not exist |
| **409 Conflict** | State Conflict | Duplicate unique field value |
| **500 Internal Error** | Server Error | Uncaught backend runtime exception |
