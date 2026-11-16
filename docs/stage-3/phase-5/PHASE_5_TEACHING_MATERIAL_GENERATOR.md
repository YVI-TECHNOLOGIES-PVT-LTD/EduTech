# STAGE 3 PHASE 5 — TEACHING MATERIAL GENERATOR & LIBRARY

## Educational Material Creation, Teacher Review & Versioned Storage

**Repository:** `/Users/sathish/Documents/GitHub/EduTech`  
**Endpoints:**

- `POST /api/v1/ai-teacher-copilot/teacher/teaching-materials/generate`
- `POST /api/v1/ai-teacher-copilot/teacher/materials/approve`
- `GET /api/v1/ai-teacher-copilot/teacher/materials`

---

## 1. Capability Description

The Teaching Material Generator enables teachers to create printable, structured instructional materials tailored to their specific classroom:

- **Worksheets**: Scaffolded practice problems with points and hints.
- **Concept Summaries**: High-yield study notes with essential formulas and explanations.
- **Worked Examples**: Detailed step-by-step problem breakdowns with rationale.
- **Glossaries**: Key definitions and vocabulary lists.

---

## 2. Teacher-in-the-Loop Approval & Version Control

To prevent hallucinated or unverified content from entering the classroom:

1. All AI-generated materials are initially created as drafts in `ai_copilot_generation_requests`.
2. The teacher reviews the draft in the UI, makes any required adjustments, and provides review comments.
3. Upon approval, an atomic PostgreSQL transaction:
   - Inserts the approved material into `ai_copilot_materials`.
   - Creates Version 1 in `ai_copilot_material_versions` with `is_published = true`.
   - Updates `ai_copilot_generation_requests` to `request_status = 'approved'`, clearing temporary payloads as mandated by PostgreSQL triggers.

---

## 3. API Contract

### Generate Material Request

```json
{
  "faculty_assignment_id": "3f6357d6-77ff-4719-9a28-33ad86367626",
  "material_type": "worksheet",
  "topic": "Properties of Circles: Chords and Tangents",
  "difficulty": "intermediate",
  "length": "standard"
}
```

### Approve Material Request

```json
{
  "generation_request_id": "3bb635c0-1282-4fbe-9b37-23f20e439bb7",
  "title": "Approved Practice Worksheet - Circle Theorems",
  "material_type": "worksheet",
  "content": { ... },
  "review_comments": "Verified theorem definitions and adjusted points distribution."
}
```

### Approved Materials List Response

```json
{
  "success": true,
  "data": [
    {
      "material_id": "8c459814-41e7-497d-a19f-b778a46b9649",
      "curriculum_unit_id": "c8d06fc8-6459-51fb-b250-7411042804c7",
      "material_type": "worksheet",
      "title": "Approved Practice Worksheet - Circle Theorems",
      "description": "High school geometry practice worksheet",
      "target_role": "student",
      "current_version_number": 1,
      "created_at": "2026-11-13T04:39:25.725Z"
    }
  ]
}
```
