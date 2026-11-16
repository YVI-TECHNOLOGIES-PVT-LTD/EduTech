# STAGE 3 PHASE 5 — STUDENT PERFORMANCE ANALYTICS

## Academic Data Synthesis & Insight Generation

**Repository:** `/Users/sathish/Documents/GitHub/EduTech`  
**Endpoint:** `POST /api/v1/ai-teacher-copilot/teacher/performance/analyze`  
**Data Sources:** PostgreSQL `classroom_session_attendance`, `learning_activity_submissions`, `learning_submission_reviews`

---

## 1. Capability Description

The Student Performance Analytics module provides assigned subject teachers with actionable academic insights derived from verified PostgreSQL database records.

Key capabilities:

1. **Aggregated Academic Telemetry**: Computes section-level submission counts, average obtained marks, passing percentage, and attendance rates directly via SQL.
2. **Context Snapshotting**: Feeds anonymized section performance indicators into the AI model.
3. **Qualitative Synthesis**: Highlights section-wide conceptual strengths, areas requiring remediation, and common systematic error patterns.
4. **Targeted Student Flagging**: Identifies students who may benefit from scaffolded intervention without emitting clinical or psychological diagnoses.

---

## 2. API Contract

### Request Payload

```json
{
  "faculty_assignment_id": "3f6357d6-77ff-4719-9a28-33ad86367626",
  "focus_area": "overall"
}
```

### Response Payload

```json
{
  "success": true,
  "data": {
    "analysis_scope": "Section 10-A Mathematics",
    "analyzed_student_count": 28,
    "data_confidence": "high",
    "data_summary": "Strong conceptual understanding of quadratic factoring with isolated calculation slips during algebraic fraction operations.",
    "overall_strengths": [
      "Consistent activity submission rate (92%)",
      "Solid recall of zero-product property and standard forms"
    ],
    "areas_for_improvement": [
      "Negative sign distribution across parentheses",
      "Formulating word problem algebraic equations"
    ],
    "repeated_error_patterns": ["Omission of negative signs when expanding expressions"],
    "students_requiring_attention": [
      {
        "student_label": "Student #1",
        "concern_area": "Fraction manipulation",
        "suggested_focus": "Provide scaffolded review on algebraic signs"
      }
    ],
    "suggested_remedial_topics": [
      "Rules of signs in subtraction",
      "Algebraic fraction simplification"
    ]
  }
}
```

---

## 3. Data Integrity & Sparse Data Handling

When a section is newly initialized or has zero graded submissions, the system:

1. Computes `submission_count = 0` and `avg_score = 0`.
2. Sets `data_confidence = 'insufficient'`.
3. Advises the educator that additional assignments and attendance data points are needed before high-confidence trend analysis can be performed.
4. Strictly forbids hallucinating fabricated scores or attendance percentages.
