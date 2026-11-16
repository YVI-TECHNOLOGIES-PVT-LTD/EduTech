# STAGE 3 PHASE 5 — LEARNING GAP IDENTIFICATION

## Automated Diagnostics & Root-Cause Hypothesis Formulation

**Repository:** `/Users/sathish/Documents/GitHub/EduTech`  
**Endpoint:** `POST /api/v1/ai-teacher-copilot/teacher/learning-gaps/analyze`  
**Role Authorization:** `TEACHER`, `FACULTY` (Assigned subject teacher only)

---

## 1. Capability Description

The Learning Gap Identification engine analyzes classroom academic signals to pinpoint specific sub-concepts where students consistently struggle.

Features:

1. **Topic-Scoped Diagnostics**: Evaluates performance for a designated topic (e.g., "Polynomial Division").
2. **Severity Grading**: Classifies gaps into `mild`, `moderate`, or `critical` based on frequency and impact on downstream curriculum units.
3. **Hypothesis Formulation**: Proposes pedagogical root-cause hypotheses (e.g., "Students struggle with distributing negative signs because they skip written intermediate steps").
4. **Targeted Revision Suggestions**: Recommends visual aids, color-coded notation, or peer activities.
5. **Integrated Remedial Plan**: Generates a synchronized step-by-step remedial lesson plan ready for immediate classroom execution.

---

## 2. API Contract

### Request Payload

```json
{
  "faculty_assignment_id": "3f6357d6-77ff-4719-9a28-33ad86367626",
  "topic": "Polynomial Division and Remainder Theorem"
}
```

### Response Payload

```json
{
  "success": true,
  "data": {
    "topic": "Polynomial Division and Remainder Theorem",
    "identified_gaps": [
      {
        "concept": "Negative sign distribution in polynomial subtraction",
        "affected_students_estimate": 6,
        "severity": "moderate",
        "potential_reason_hypothesis": "Students attempt mental subtraction rather than writing explicit parentheses with flipped signs.",
        "suggested_revision_strategy": "Use two-color pens for original vs subtracted terms during long division.",
        "suggested_practice_questions": [
          "-(3x^2 - 4x + 5) + (2x^2 + x - 1)",
          "Divide (2x^3 - 3x^2 + 4x - 5) by (x - 2)"
        ]
      }
    ],
    "remedial_teaching_plan": {
      "objective": "Eliminate negative sign distribution errors in polynomial subtraction",
      "step_by_step_plan": [
        {
          "step": 1,
          "activity": "Visual review: The meaning of subtracting an entire polynomial",
          "duration_minutes": 10
        },
        {
          "step": 2,
          "activity": "Color-coded bracket distribution exercise in pairs",
          "duration_minutes": 15
        },
        {
          "step": 3,
          "activity": "Independent practice with formative exit ticket",
          "duration_minutes": 10
        }
      ],
      "follow_up_assessment_idea": "3-question exit slip checking sign changes during subtraction"
    }
  }
}
```
