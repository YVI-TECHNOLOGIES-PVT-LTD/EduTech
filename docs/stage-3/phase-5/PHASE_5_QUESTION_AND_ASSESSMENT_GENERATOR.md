# STAGE 3 PHASE 5 — QUESTION & ASSESSMENT GENERATOR

## Assessment Item Authoring, Question Papers & Blueprints

**Repository:** `/Users/sathish/Documents/GitHub/EduTech`  
**Endpoints:**

- `POST /api/v1/ai-teacher-copilot/teacher/questions/generate`
- `POST /api/v1/ai-teacher-copilot/teacher/assessments/generate`

---

## 1. Capability Description

The Question and Assessment Generator provides two targeted modes for educators:

1. **Quick Question Bank (`/questions/generate`)**: Produces targeted pools of practice or quiz questions across multiple question formats (MCQ, True/False, Short Answer, Descriptive).
2. **Formal Assessment Blueprint (`/assessments/generate`)**: Generates a balanced examination paper with duration, total marks, difficulty distribution (Easy, Medium, Hard), Bloom's Taxonomy categorization, detailed answer keys, and teacher scoring rubrics.

---

## 2. Supported Question Types & Cognitive Levels

| Question Type             | Schema Representation | Auto-Generated Fields                                               |
| :------------------------ | :-------------------- | :------------------------------------------------------------------ |
| **Multiple Choice (MCQ)** | `mcq`                 | `options` (4 distractors), `correct_answer`, `explanation`, `marks` |
| **True / False**          | `true_false`          | `correct_answer` ("True"/"False"), `explanation`, `marks`           |
| **Short Answer**          | `short_answer`        | `correct_answer`, `scoring_guide`, `marks`                          |
| **Descriptive**           | `descriptive`         | `correct_answer`, `rubric_breakdown`, `marks`                       |

**Bloom's Taxonomy Levels Tagged**:

- `Remember`: Fact recall and term definition
- `Understand`: Concept explanation and translation
- `Apply`: Problem solving in standard situations
- `Analyze`: Deconstruction of relationships and proofs
- `Evaluate`: Comparison of solutions and critique

---

## 3. Sample Assessment Output

```json
{
  "title": "Midterm Assessment Blueprint - Algebra and Geometry",
  "grade_level": "Grade 10",
  "subject": "Mathematics",
  "topic": "Algebra and Geometry",
  "duration_minutes": 60,
  "total_marks": 50,
  "instructions": [
    "Answer all questions showing complete working.",
    "Non-programmable calculators are permitted."
  ],
  "questions": [
    {
      "question_number": 1,
      "question_type": "mcq",
      "question_text": "What is the discriminant of 2x^2 + 4x + 2 = 0?",
      "options": ["0", "4", "8", "16"],
      "correct_answer": "0",
      "explanation": "b^2 - 4ac = 16 - 16 = 0",
      "difficulty": "easy",
      "blooms_level": "remember",
      "marks": 1
    },
    {
      "question_number": 2,
      "question_type": "short_answer",
      "question_text": "State the quadratic formula.",
      "correct_answer": "x = (-b +- sqrt(b^2-4ac))/(2a)",
      "explanation": "Standard quadratic root formula",
      "difficulty": "medium",
      "blooms_level": "understand",
      "marks": 2
    }
  ],
  "answer_key": [
    {
      "question_number": 1,
      "correct_answer": "0",
      "scoring_guide": "1 mark for correct selection"
    },
    {
      "question_number": 2,
      "correct_answer": "x = (-b +- sqrt(b^2-4ac))/(2a)",
      "scoring_guide": "1 mark for formula structure, 1 mark for correct signs"
    }
  ]
}
```
