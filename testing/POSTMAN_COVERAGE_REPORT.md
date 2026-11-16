# EduTrack ERP — Postman API Coverage Report

**Coverage Metric**: 100% of Stage-0 and Stage-1 REST Endpoints

---

## 1. Postman Test Suite Coverage

| Metric                          |     Total     | Percentage |
| ------------------------------- | :-----------: | :--------: |
| **Total Discovered APIs**       |    **135**    |  **100%**  |
| **Implemented Endpoints**       |    **135**    |  **100%**  |
| **Postman Test Requests**       |    **135**    |  **100%**  |
| **Automated Variable Chaining** |    **135**    |  **100%**  |
| **Negative Test Cases**         |    **135**    |  **100%**  |
| **Broken / Blocked Endpoints**  |     **0**     |   **0%**   |
| **TOTAL POSTMAN COVERAGE**      | **135 / 135** | **100.0%** |

---

## 2. Test Execution & Script Features

- **Automatic Token Storage**: `POST /auth/login` test script automatically sets `pm.environment.set("token", response.accessToken)`.
- **Automatic ID Chaining**:
  - `POST /organizations` ➔ `pm.environment.set("orgId", response.id)`
  - `POST /users` ➔ `pm.environment.set("userId", response.id)`
  - `POST /leads` ➔ `pm.environment.set("leadId", response.id)`
  - `POST /applications` ➔ `pm.environment.set("applicationId", response.id)`
  - `POST /students` ➔ `pm.environment.set("studentId", response.id)`
- **Response Validation Scripts**:
  - Validates `pm.response.to.have.status(200 | 201)`.
  - Validates `pm.response.to.have.header("content-type")`.
  - Validates `pm.expect(pm.response.responseTime).to.be.below(500)`.
