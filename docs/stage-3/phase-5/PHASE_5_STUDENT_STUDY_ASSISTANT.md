# STAGE 3 PHASE 5 — STUDENT STUDY ASSISTANT

## Controlled Learning Companion & Conceptual Coaching

**Repository:** `/Users/sathish/Documents/GitHub/EduTech`  
**Endpoint:** `POST /api/v1/ai-teacher-copilot/student/study-assistant/respond`  
**Frontend Route:** `/app/student/ai-study-assistant`  
**Role Authorization:** `STUDENT` (requires valid student session and `student.dashboard.view` permission)

---

## 1. Capability Description & Academic Integrity

The Student Study Assistant acts as a patient, 24/7 personal study coach for enrolled students, providing concept clarification and guided practice while upholding strict academic integrity standards:

1. **Anti-Cheating Guardrail**: Does not solve active exam questions or output direct answers designed to bypass student learning.
2. **Pedagogical Explanation**: Explains complex topics through step-by-step logic, real-world analogies, and guided questions.
3. **Mastery Verification**: Supplies 2-3 formative practice problems with hints to reinforce self-paced learning.
4. **Tone & Safety**: Age-appropriate, supportive, and free of clinical or judgmental language.

---

## 2. API Contract

### Request Payload (`studentStudyAssistantSchema`)

```json
{
  "subject_name": "Mathematics",
  "topic": "Pythagorean Theorem",
  "student_question": "Can you explain why a^2 + b^2 = c^2 and show a simple geometric proof?",
  "preferred_style": "step_by_step"
}
```

### Response Payload

```json
{
  "success": true,
  "data": {
    "topic": "Pythagorean Theorem",
    "conceptual_explanation": "The Pythagorean Theorem states that in any right-angled triangle, the area of the square whose side is the hypotenuse (the longest side opposite the 90-degree angle) is equal to the sum of the areas of the squares on the other two sides: a^2 + b^2 = c^2.",
    "step_by_step_breakdown": [
      "Identify the two shorter legs (a and b) that meet at the right angle (90 degrees).",
      "Imagine building physical square tiles along each side of lengths a, b, and c.",
      "Rearrange four identical copies of the right triangle inside a larger square of side (a + b).",
      "The uncovered area inside equals c^2 in one arrangement and a^2 + b^2 in another, proving they are identical."
    ],
    "practice_questions": [
      {
        "question": "If a right triangle has legs of length 3 cm and 4 cm, what is the length of the hypotenuse?",
        "hint": "Calculate 3^2 + 4^2 = 9 + 16, then find the square root of 25."
      },
      {
        "question": "A right triangle has a hypotenuse of 13 m and one leg of 5 m. Find the length of the other leg.",
        "hint": "Use b^2 = c^2 - a^2. Calculate 169 - 25."
      }
    ],
    "summary_takeaway": "Remember: The formula a^2 + b^2 = c^2 only applies to right triangles (triangles with exactly one 90-degree angle)."
  }
}
```

---

## 3. UI Implementation

The Student Study Assistant is accessible in the Student Portal at `/app/student/ai-study-assistant`:

- Dedicated study assistant workspace with clear subject and topic inputs.
- Real-time responses structured into Conceptual Explanation, Step-by-Step Breakdown, and Interactive Practice Questions.
- Prominent Academic Integrity Notice reminding students of school honesty policies.
