# STAGE 3 PHASE 5 — PARENT COMMUNICATION ASSISTANT

## Professional Communication Drafting with Educator Approval

**Repository:** `/Users/sathish/Documents/GitHub/EduTech`  
**Endpoint:** `POST /api/v1/ai-teacher-copilot/teacher/parent-communications/draft`  
**Core Principle:** NO AUTOMATED OUTBOUND SENDING. All communications require teacher review and explicit dispatch.

---

## 1. Capability Description

Clear, consistent communication between school and home is vital to student success. The Parent Communication Assistant helps teachers compose professional, empathetic, and constructive updates for parents in seconds.

Supported Communication Categories:

- `progress_update`: Regular academic progress summary and positive reinforcement.
- `intervention_notice`: Gentle notification of an academic learning gap with home support tips.
- `appreciation`: Recognition of outstanding classroom effort, participation, or improvement.
- `homework_reminder`: Friendly reminder regarding upcoming deadlines or missing project parts.

---

## 2. API Contract

### Request Payload (`draftParentCommunicationSchema`)

```json
{
  "faculty_assignment_id": "3f6357d6-77ff-4719-9a28-33ad86367626",
  "communication_type": "progress_update",
  "topic": "Mathematics Midterm Progress",
  "specific_observations": "Alex is showing consistent effort and scored 82% in recent assessments. Practicing word problems for 15 minutes at home will help further.",
  "tone": "friendly"
}
```

### Response Payload

```json
{
  "success": true,
  "data": {
    "tone": "friendly",
    "subject_line": "Academic Progress Update — Mathematics",
    "greeting": "Dear Parent / Guardian,",
    "body": "I am writing to share an update on your child's recent progress in Mathematics. They have shown great consistency in class participation and scored a solid 82% in our recent assessments. They demonstrate strong conceptual understanding of algebraic operations.\n\nTo help them build even greater confidence with multi-step word problems, I recommend 10 to 15 minutes of relaxed problem-solving practice at home a couple of evenings per week.",
    "key_points": [
      "Consistent classroom participation and effort",
      "Scored 82% in recent mathematics assessments",
      "Focus area: Translating word problems into algebraic equations"
    ],
    "action_items_for_parents": [
      "Encourage 10-15 minutes of quiet practice with textbook word problems.",
      "Celebrate their consistent effort and positive attitude in class."
    ],
    "closing": "Warm regards,\nSubject Teacher\nEduTrack Academy"
  }
}
```

---

## 3. Communication Governance & Safety

- The AI assistant outputs a draft in the UI.
- The teacher can copy, refine, or edit any sentence.
- No emails, SMS messages, or notifications are transmitted without explicit teacher confirmation.
- Eliminates administrative jargon, maintains professional school branding, and ensures family-friendly clarity.
