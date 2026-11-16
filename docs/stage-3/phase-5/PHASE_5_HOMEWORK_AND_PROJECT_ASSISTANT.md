# STAGE 3 PHASE 5 — HOMEWORK & PROJECT ASSISTANT

## Integration with Stage 3 Phase 4 Learning Activities

**Repository:** `/Users/sathish/Documents/GitHub/EduTech`  
**Endpoints:**

- `POST /api/v1/ai-teacher-copilot/teacher/activities/homework/generate`
- `POST /api/v1/ai-teacher-copilot/teacher/activities/project/generate`

---

## 1. Capability Description & Cross-Phase Alignment

In Stage 3 Phase 4, EduTrack ERP implemented the **Learning Activities & Submissions** engine (`learning_activities`, `learning_activity_submissions`, `learning_submission_reviews`).

The Homework & Project Assistant acts as an intelligent accelerator for teachers creating activities under that lifecycle:

- **Homework**: Offline assignments with structured practice instructions, estimated duration in days, and clear completion checklists.
- **Projects**: Extended collaborative or individual assignments requiring multi-part deliverables (e.g., written reports, diagrams, calculations) and structured evaluation rubrics.

---

## 2. API Contract

### Request Payload (`generateActivitySchema`)

```json
{
  "faculty_assignment_id": "3f6357d6-77ff-4719-9a28-33ad86367626",
  "activity_type": "project",
  "topic": "Statistical Analysis of Environmental Data",
  "difficulty": "advanced",
  "suggested_days": 7,
  "learning_objectives": [
    "Collect local temperature samples over 5 days",
    "Calculate mean, variance, and standard deviation",
    "Plot a frequency distribution chart"
  ]
}
```

### Response Payload

```json
{
  "success": true,
  "data": {
    "generation_request_id": "767429c3-3da6-4aa1-a476-df60721a3777",
    "activity": {
      "title": "Environmental Data Statistics Project",
      "activity_type": "project",
      "target_grade": "Grade 10",
      "subject": "Mathematics",
      "overview": "Practical field task to apply statistical dispersion measures to local environmental datasets.",
      "detailed_instructions": "1. Record morning and afternoon temperature for 5 consecutive days.\n2. Compile data into an organized frequency table.\n3. Compute sample mean and standard deviation.\n4. Write a 1-page summary explaining the variance observed.",
      "submission_guidelines": "Submit a single PDF containing data tables, graphs, calculations, and your reflection.",
      "deliverables": [
        "Raw data log sheet",
        "Calculations for Mean and Standard Deviation",
        "Graph/plot of temperature variation",
        "Brief written reflection"
      ],
      "evaluation_rubric_summary": "Data collection accuracy (25%), mathematical computation correctness (50%), analysis and presentation (25%).",
      "recommended_duration_days": 7,
      "suggested_maximum_marks": 25
    }
  }
}
```

---

## 3. Seamless Transition into Phase 4 Publishing

The generated payload fields map 1-to-1 into the Phase 4 `createTeacherLearningActivityMutation`:

- `activity.title` -> `title`
- `activity.detailed_instructions` -> `instructions`
- `activity.suggested_maximum_marks` -> `total_marks`
- `activity.recommended_duration_days` -> `due_date` offset
- `activity.activity_type` -> `activity_type` (`homework` / `project`)

This enables teachers to generate, review, and publish a rich learning activity in under 60 seconds with full pedagogical rigor.
