# STAGE 3 PHASE 5 — LESSON PLAN GENERATOR

## End-to-End Pedagogical Lesson Planning Capability

**Repository:** `/Users/sathish/Documents/GitHub/EduTech`  
**Endpoint:** `POST /api/v1/ai-teacher-copilot/teacher/lesson-plans/generate`  
**Role Authorization:** `TEACHER`, `FACULTY` (Assigned subject teacher only)

---

## 1. Capability Description

The Lesson Plan Generator produces comprehensive, standards-aligned instructional outlines tailored to a teacher's specific class, subject, and curriculum pacing.

Unlike generic chatbot responses, EduTrack's generator:

1. Validates that the requesting teacher is actively assigned to the target class and subject.
2. Ingests curriculum outcomes from `curriculum_learning_outcomes` when available.
3. Structures lesson delivery into timed instructional phases (Introduction, Modeling, Guided Practice, Independent Practice, Review).
4. Provides differentiated instruction strategies for struggling and advanced learners.
5. Produces quick formative assessment checkpoints and homework recommendations.

---

## 2. API Contract

### Request Payload (`generateLessonPlanSchema`)

```json
{
  "faculty_assignment_id": "3f6357d6-77ff-4719-9a28-33ad86367626",
  "unit_id": "c8d06fc8-6459-51fb-b250-7411042804c7",
  "topic": "Solving Quadratic Equations by Factoring",
  "duration_minutes": 45,
  "pedagogical_approach": "inquiry-based",
  "target_learning_outcomes": [
    "Identify quadratic equations in standard form",
    "Apply factoring techniques to solve for real roots"
  ],
  "special_instructions": "Include scaffolded peer-review activities"
}
```

### Response Payload

```json
{
  "success": true,
  "data": {
    "generation_request_id": "a9018e47-8173-4554-b529-57ef9a023b18",
    "lesson_plan": {
      "title": "Solving Quadratic Equations by Factoring - Lesson Plan",
      "grade_level": "Grade 10",
      "subject": "Mathematics",
      "topic": "Solving Quadratic Equations by Factoring",
      "duration_minutes": 45,
      "learning_outcomes": [
        "Students will recognize standard quadratic equations",
        "Students will find real roots through algebraic factoring"
      ],
      "prerequisites": ["Basic algebraic manipulation", "Linear equations"],
      "pedagogical_approach": "Inquiry-based with guided problem solving",
      "lesson_phases": [
        {
          "title": "Warm-up & Prior Knowledge",
          "duration_minutes": 10,
          "description": "Review factoring binomials"
        },
        {
          "title": "Guided Instruction & Modeling",
          "duration_minutes": 15,
          "description": "Demonstrate zero-product property"
        },
        {
          "title": "Collaborative Problem Solving",
          "duration_minutes": 15,
          "description": "Pairs solve practice sets"
        },
        {
          "title": "Exit Ticket & Synthesis",
          "duration_minutes": 5,
          "description": "Quick check on understanding"
        }
      ],
      "teaching_resources": ["Whiteboard", "Grid paper", "Practice sheet"],
      "student_engagement_strategy": "Think-pair-share problem solving",
      "differentiated_instruction": {
        "support_for_struggling_learners": "Provide quadratic template with step-by-step guidance",
        "extension_for_advanced_learners": "Challenge with word problems involving area optimization"
      },
      "assessment_checkpoints": [
        {
          "checkpoint": "Mid-lesson check",
          "question": "What is the zero product property?",
          "expected_understanding": "If ab=0, then a=0 or b=0"
        }
      ],
      "homework_recommendation": "Complete practice problems 1 through 6 on worksheet 4B"
    }
  }
}
```

---

## 3. PostgreSQL Persistence & Audit

When `curriculum_plan_id` is available for the assigned subject:

- A new row is inserted into `ai_copilot_generation_requests` with:
  - `generation_type = 'lesson_plan_supplement'`
  - `request_status = 'ready_for_review'`
  - `generated_content = lesson_plan`
- Returns `generation_request_id` to allow subsequent review and permanent export.
