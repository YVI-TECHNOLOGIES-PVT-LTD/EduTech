# STAGE 3 PHASE 5 — ADMIN OVERSIGHT & METRICS

## Usage Analytics, Token Tracking, Safety Auditing & Multi-Tenant Oversight

**Repository:** `/Users/sathish/Documents/GitHub/EduTech`  
**Endpoint:** `GET /api/v1/ai-teacher-copilot/admin/usage`  
**Frontend Route:** `/app/admin/ai-oversight`  
**Role Authorization:** `ADMIN`, `SUPERADMIN` (Assigned school administrator only)

---

## 1. Capability Description

The Admin Oversight dashboard provides school leadership and IT administrators with real-time transparency into how AI intelligence is being utilized across the institution:

1. **Active Provider & Health**: Verifies current provider (`Google Gemini`, `OpenAI`, or `Mock Provider`) and system responsiveness.
2. **Operational Request Volume**: Tracks total, successful, and rejected AI generation calls.
3. **Token & Cost Management**: Real-time aggregation of input and output tokens consumed across lesson planning, worksheets, assessments, and study coaching.
4. **Volume Breakdown by Capability**: Displays distribution of requests across lesson plans, worksheets, questions, blueprints, performance diagnostics, and feedback.
5. **Safety Architecture Transparency**: Validates active multi-tenant boundary checks, prompt injection shields, and clinical diagnosis filters.

---

## 2. API Contract

### Request

```http
GET /api/v1/ai-teacher-copilot/admin/usage HTTP/1.1
Authorization: Bearer <Admin_JWT_Token>
```

### Response Payload

```json
{
  "success": true,
  "data": {
    "total_requests": 18,
    "successful_requests": 18,
    "failed_requests": 0,
    "estimated_tokens": 14250,
    "provider": "google-gemini",
    "by_type": {
      "lesson_plan": { "requests": 3, "tokens": 2700, "errors": 0 },
      "teaching_material": { "requests": 4, "tokens": 3600, "errors": 0 },
      "assessment": { "requests": 4, "tokens": 3600, "errors": 0 },
      "activity": { "requests": 2, "tokens": 1500, "errors": 0 },
      "performance_analysis": { "requests": 2, "tokens": 1400, "errors": 0 },
      "learning_gap": { "requests": 2, "tokens": 1450, "errors": 0 },
      "study_assistant": { "requests": 1, "tokens": 600, "errors": 0 }
    }
  }
}
```

---

## 3. UI Implementation

The Admin AI Oversight dashboard is integrated at `/app/admin/ai-oversight`:

- 4 Key Metric summary cards: Active Provider, Total Generation Requests, Success Rate (%), and Estimated Tokens Consumed.
- Operational Volume Table breaking down request counts, tokens, and error rates per capability.
- Active Safety Architecture card displaying multi-tenant boundary guarantees, prompt injection shields, and clinical non-diagnosis policies.
