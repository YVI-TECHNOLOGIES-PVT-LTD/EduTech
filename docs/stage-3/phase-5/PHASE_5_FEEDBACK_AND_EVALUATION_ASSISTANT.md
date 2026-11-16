# STAGE 3 PHASE 5 — FEEDBACK & EVALUATION ASSISTANT

## Formative Grading Guidance & Teacher Authority Preservation

**Repository:** `/Users/sathish/Documents/GitHub/EduTech`  
**Endpoint:** `POST /api/v1/ai-teacher-copilot/teacher/feedback/draft`  
**Core Principle:** NO AUTOMATED GRADING. Teacher maintains exclusive evaluation authority.

---

## 1. Capability Description & Ethical Governance

A central design requirement of EduTrack ERP Stage 3 is the strict preservation of **Teacher Authority**:

- The AI **NEVER** auto-assigns permanent grades or marks to student submissions.
- The AI acts as a **formative feedback drafter**, helping educators construct constructive, empathetic, and actionable feedback messages faster while preserving human discretion.

Key Features:

1. **Strengths & Growth Balancing**: Identifies concrete positive achievements alongside specific correction areas.
2. **Actionable Next Steps**: Points students to specific textbook sections, review notes, or practice drills.
3. **Tone Adaptation**: Supports customizable tones (`encouraging`, `direct`, `academic`, `celebratory`).
4. **Suggested Score Range (Formative Only)**: Suggests a score range based on the grading rubric for the teacher's consideration. The teacher must manually review and enter the official score.

---

## 2. API Contract

### Request Payload (`draftFeedbackSchema`)

```json
{
  "faculty_assignment_id": "3f6357d6-77ff-4719-9a28-33ad86367626",
  "student_work_text": "Student solved the equation 2x^2 - 8 = 0 by factoring 2(x^2 - 4) = 0 and wrote roots x = 2, omitting x = -2.",
  "observed_strengths": "Clean layout, correctly identified common factor 2 and difference of squares.",
  "observed_weaknesses": "Omitted the negative root in the final solution step.",
  "tone": "encouraging"
}
```

### Response Payload

```json
{
  "success": true,
  "data": {
    "overall_tone": "encouraging",
    "positive_reinforcement": "Great job recognizing the common factor of 2 and applying the difference of two squares formula cleanly!",
    "specific_areas_for_improvement": [
      "Remember that quadratic equations of the form x^2 = k have two real roots: both positive and negative."
    ],
    "recommended_next_steps": "Review page 54 on quadratic roots and verify your solution by substituting both +2 and -2 back into the original equation.",
    "draft_feedback_message": "Well done on structuring your work so clearly! You factored the expression perfectly. Just remember that x^2 - 4 = 0 gives both x = 2 and x = -2. Keep up the great mathematical reasoning!",
    "suggested_score_range": {
      "min": 18,
      "max": 20,
      "rationale": "Strong conceptual approach with minor omission of the second root."
    }
  }
}
```

---

## 3. Integration with Stage 3 Phase 4 Submission Reviews

Teachers reviewing submissions in the Teacher Portal can click "Draft Feedback with Copilot":

1. The assistant pre-populates draft feedback into the teacher's review drawer.
2. The teacher edits the wording, enters the official obtained mark, and clicks "Submit Final Review".
3. The submission status transitions to `reviewed` through the authoritative Phase 4 endpoint (`POST /v1/learning-activities/teacher/submissions/:id/reviews`).
