# STAGE 3 PHASE 5 — API SPECIFICATION

## AI Teacher Copilot & Intelligent Learning Assistance REST Endpoints

**Repository:** `/Users/sathish/Documents/GitHub/EduTech`  
**Base URL:** `/api/v1/ai-teacher-copilot`  
**Authentication:** `Bearer <JWT_TOKEN>` (Except `/status`)

---

## 1. Endpoints Summary Table

| Method | Endpoint Path                           | Target Persona  | Required Roles        | Description                                                   |
| :----- | :-------------------------------------- | :-------------- | :-------------------- | :------------------------------------------------------------ |
| `GET`  | `/status`                               | Public / DevOps | None                  | Public service operational heartbeat and provider health      |
| `GET`  | `/teacher/context`                      | Teacher         | `TEACHER`, `FACULTY`  | Teacher active assignments, subjects, grades, sections        |
| `POST` | `/teacher/lesson-plans/generate`        | Teacher         | `TEACHER`, `FACULTY`  | Structured pedagogical lesson plan generator                  |
| `POST` | `/teacher/teaching-materials/generate`  | Teacher         | `TEACHER`, `FACULTY`  | Worksheets, worked examples, summaries, glossaries            |
| `POST` | `/teacher/materials/approve`            | Teacher         | `TEACHER`, `FACULTY`  | Atomic approval & versioning into permanent library           |
| `GET`  | `/teacher/materials`                    | Teacher         | `TEACHER`, `FACULTY`  | List approved school curriculum materials                     |
| `POST` | `/teacher/questions/generate`           | Teacher         | `TEACHER`, `FACULTY`  | Targeted question bank (MCQ, Short, Descriptive)              |
| `POST` | `/teacher/assessments/generate`         | Teacher         | `TEACHER`, `FACULTY`  | Formal assessment blueprint with answer keys and rubrics      |
| `POST` | `/teacher/activities/homework/generate` | Teacher         | `TEACHER`, `FACULTY`  | Structured homework activity guidelines (Phase 4 integration) |
| `POST` | `/teacher/activities/project/generate`  | Teacher         | `TEACHER`, `FACULTY`  | Extended project instructions & rubrics (Phase 4 integration) |
| `POST` | `/teacher/performance/analyze`          | Teacher         | `TEACHER`, `FACULTY`  | Section-level performance synthesis from real DB data         |
| `POST` | `/teacher/learning-gaps/analyze`        | Teacher         | `TEACHER`, `FACULTY`  | Topic learning gap detection and root-cause hypotheses        |
| `POST` | `/teacher/remedial-plans/generate`      | Teacher         | `TEACHER`, `FACULTY`  | Direct step-by-step remedial recovery plan generator          |
| `POST` | `/teacher/feedback/draft`               | Teacher         | `TEACHER`, `FACULTY`  | Formative evaluation feedback assistant (No auto-grading)     |
| `POST` | `/teacher/parent-communications/draft`  | Teacher         | `TEACHER`, `FACULTY`  | Empathetic parent update email drafter                        |
| `POST` | `/student/study-assistant/respond`      | Student         | `STUDENT`             | Controlled study coach with step-by-step concept breakdown    |
| `GET`  | `/admin/usage`                          | Administrator   | `ADMIN`, `SUPERADMIN` | Usage analytics, token consumption, and safety metrics        |

---

## 2. Standard Response Wrapper

All endpoints return a uniform JSON envelope:

```json
// Success Response
{
  "success": true,
  "data": { ... }
}

// Error Response
{
  "success": false,
  "error": "VALIDATION_ERROR | GENERATION_ERROR | NOT_FOUND | FORBIDDEN",
  "message": "Human-readable error explanation",
  "details": [ ... ]
}
```
