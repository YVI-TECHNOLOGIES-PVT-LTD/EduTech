# STAGE 3 PHASE 5 — REMEDIAL TEACHING ENGINE

## Targeted Academic Interventions & Step-by-Step Recovery Plans

**Repository:** `/Users/sathish/Documents/GitHub/EduTech`  
**Endpoint:** `POST /api/v1/ai-teacher-copilot/teacher/remedial-plans/generate`  
**Supporting Table:** `ai_copilot_intervention_recommendations`

---

## 1. Capability Description

The Remedial Teaching Engine empowers educators to generate targeted academic recovery plans addressing specific learning obstacles identified in their classroom.

Features:

1. **Direct Intervention Planning**: Focuses on a single affected concept and teacher-provided observation of student error patterns.
2. **Pedagogical Action Steps**: Details timed instructional actions (e.g., visual recap, scaffolded pair-work, hands-on modeling).
3. **Exit Ticket & Verification**: Provides an objective follow-up checkpoint to confirm concept recovery before resuming normal syllabus progression.
4. **Safety Verification**: Rejects any request attempting to pathologize learning difficulties into psychological/psychiatric disorders.

---

## 2. API Contract

### Request Payload (`generateRemedialPlanSchema`)

```json
{
  "faculty_assignment_id": "3f6357d6-77ff-4719-9a28-33ad86367626",
  "affected_concept": "Sign conventions in algebraic fractions",
  "learning_gap_description": "Students frequently make errors with negative signs when distributing across fractions",
  "target_duration_days": 7
}
```

### Response Payload

```json
{
  "success": true,
  "data": {
    "objective": "Eliminate negative sign errors in polynomial and fractional subtraction",
    "step_by_step_plan": [
      {
        "step": 1,
        "activity": "Sign rule recap and visual examples using number lines",
        "duration_minutes": 10
      },
      {
        "step": 2,
        "activity": "Guided practice with peer sign-check review",
        "duration_minutes": 20
      },
      {
        "step": 3,
        "activity": "Formative exit ticket with 3 targeted sign problems",
        "duration_minutes": 10
      }
    ],
    "follow_up_assessment_idea": "5-minute exit ticket checking negative signs across parentheses"
  }
}
```

---

## 3. Intervention Recommendations Table Alignment

In addition to section-level plans, individual student academic recommendations can be recorded in `ai_copilot_intervention_recommendations`:

- `student_id`: Target student UUID
- `academic_year_grade_subject_id`: Grade-subject offering UUID
- `recommendation_type`: `remedial_practice`
- `recommendation_text`: Actionable pedagogical strategy
- `evidence_snapshot`: JSON snapshot of historical quiz or activity scores
