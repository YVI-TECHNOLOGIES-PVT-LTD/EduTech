import { BloomLevel } from '../dto/request/lesson-planning.dto';

export interface PromptContextData {
  schoolName: string;
  academicYearName: string;
  gradeName: string;
  sectionName?: string;
  subjectName: string;
  subjectCode: string;
  curriculumPlanTitle: string;
  curriculumPlanDescription?: string | null;
  unitTitle: string;
  unitCode?: string | null;
  unitDescription?: string | null;
  officialOutcomes: Array<{
    learning_outcome_id: string;
    outcome_code: string | null;
    outcome_statement: string;
    bloom_level: BloomLevel | null;
  }>;
  availableResources: Array<{
    resource_id: string;
    title: string;
    resource_type: string;
    description?: string | null;
  }>;
  topic: string;
  durationMinutes: number;
  teachingDate?: string;
  preferredMethodology?: string;
  difficultyLevel?: string;
  includeDifferentiatedInstruction?: boolean;
  includeExitTicket?: boolean;
}

export class LessonPromptBuilder {
  /**
   * Sanitize untrusted user text against prompt injection.
   */
  static sanitizeInput(input: string): string {
    if (!input) return '';
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .trim();
  }

  /**
   * System Prompt defining the AI assistant's role, rules, and grounding constraints.
   */
  static buildSystemPrompt(): string {
    return `You are the EduTrack Academic Pedagogical Architect — an advanced instructional design AI embedded in a school ERP system.
Your mission is to help K-12 teachers create rigorous, structured, curriculum-aligned lesson plans grounded in real educational standards and Bloom's Taxonomy.

STRICT GOVERNANCE & GROUNDING RULES:
1. NEVER invent official curriculum learning outcomes. Every learning objective marked as an official outcome MUST map to one of the provided official outcomes. Supplementary objectives must be explicitly labeled.
2. The sum of durations for all individual lesson activities MUST equal or fit comfortably within the requested lesson duration.
3. Incorporate active learning methodologies (e.g. inquiry, collaborative problem solving, guided practice) appropriate for the subject and grade.
4. Recommend instructional resources ONLY from the provided authorized resources list if applicable. Do not invent fake URLs or external web links.
5. Provide genuine differentiated instruction guidelines (scaffolding for emerging learners and extensions for high-aptitude students).
6. Provide an exit ticket with an explicit formative assessment prompt and clear evaluation criteria.
7. Return ONLY a single, valid JSON object matching the requested schema. No conversational filler, no markdown code block fences (\`\`\`json).`;
  }

  /**
   * User Prompt providing the verified academic context and user specifications.
   */
  static buildGenerationPrompt(context: PromptContextData): string {
    const cleanTopic = this.sanitizeInput(context.topic);
    const cleanMethodology = context.preferredMethodology
      ? this.sanitizeInput(context.preferredMethodology)
      : 'Interactive blended instruction';
    const cleanDifficulty = context.difficultyLevel || 'standard';

    const outcomesList =
      context.officialOutcomes.length > 0
        ? context.officialOutcomes
            .map(
              (o, idx) =>
                `  ${idx + 1}. [Code: ${o.outcome_code || 'N/A'}] [Bloom: ${o.bloom_level || 'understand'}] ${o.outcome_statement} (ID: ${o.learning_outcome_id})`,
            )
            .join('\n')
        : '  (No official learning outcomes registered for this unit. You may generate curriculum-aligned supplementary objectives.)';

    const resourcesList =
      context.availableResources.length > 0
        ? context.availableResources
            .map(
              (r, idx) =>
                `  ${idx + 1}. [ID: ${r.resource_id}] "${r.title}" (Type: ${r.resource_type}${r.description ? ` - ${r.description}` : ''})`,
            )
            .join('\n')
        : '  (No digital resources currently linked to this unit.)';

    return `Please generate a comprehensive, structured lesson plan based on the following verified academic context:

ACADEMIC CONTEXT:
- School: ${context.schoolName}
- Academic Year: ${context.academicYearName}
- Grade: ${context.gradeName}${context.sectionName ? ` (Section: ${context.sectionName})` : ''}
- Subject: ${context.subjectName} (${context.subjectCode})
- Curriculum Plan: ${context.curriculumPlanTitle}
- Syllabus Unit: ${context.unitTitle}${context.unitCode ? ` (${context.unitCode})` : ''}
${context.unitDescription ? `- Unit Description: ${context.unitDescription}` : ''}

OFFICIAL LEARNING OUTCOMES FROM CURRICULUM:
${outcomesList}

AVAILABLE INSTITUTIONAL DIGITAL RESOURCES:
${resourcesList}

TEACHER SPECIFICATIONS:
<user_topic>${cleanTopic}</user_topic>
- Requested Lesson Duration: ${context.durationMinutes} minutes
${context.teachingDate ? `- Planned Teaching Date: ${context.teachingDate}` : ''}
- Preferred Teaching Methodology: ${cleanMethodology}
- Difficulty Level: ${cleanDifficulty}
- Include Differentiated Strategies: ${context.includeDifferentiatedInstruction ? 'Yes' : 'No'}
- Include Exit Ticket: ${context.includeExitTicket ? 'Yes' : 'No'}

JSON OUTPUT SPECIFICATION:
Your response must be a single JSON object with these exact keys:
{
  "lesson_title": "Descriptive, engaging lesson title",
  "estimated_duration_minutes": ${context.durationMinutes},
  "topic": "${cleanTopic}",
  "grade": "${context.gradeName}",
  "subject": "${context.subjectName}",
  "curriculum_unit_title": "${context.unitTitle}",
  "prerequisite_knowledge": "Concise summary of student background knowledge needed",
  "teaching_approach": "Primary instructional strategy summary",
  "learning_objectives": [
    {
      "description": "Specific, measurable student action statement",
      "bloom_level": "one of: remember, understand, apply, analyze, evaluate, create",
      "curriculum_alignment": "Outcome code or 'Supplementary'",
      "is_official_outcome": true/false,
      "assessment_method": "How teacher will assess this objective"
    }
  ],
  "teaching_introduction": {
    "hook": "Engaging real-world phenomenon, question, or demonstration",
    "previous_knowledge_connection": "Explicit bridge to prior concept",
    "motivational_questions": ["Question 1", "Question 2"]
  },
  "teaching_methodologies": ["Methodology 1", "Methodology 2"],
  "lesson_activities": [
    {
      "sequence_number": 1,
      "activity_title": "Activity name",
      "activity_type": "one of: direct_instruction, discussion, group_work, individual_work, practical, project, inquiry, assessment, reflection, other",
      "duration_minutes": 10,
      "teacher_instructions": "Step-by-step guidance for teacher",
      "student_participation": "What students are doing during this time",
      "materials_required": "Materials needed",
      "expected_result": "Observable learning evidence"
    }
  ],
  "instructional_resources": [
    {
      "resource_id": "UUID from available resources or null",
      "title": "Resource title",
      "resource_type": "file or document or presentation",
      "recommendation_reason": "Why this resource supports this lesson",
      "usage_guidelines": "How to deploy during instruction",
      "is_existing_resource": true/false
    }
  ],
  "assessments": {
    "formative_questions": ["Check for understanding question 1", "Question 2"],
    "exit_ticket": {
      "prompt": "Exit ticket prompt for end of lesson",
      "expected_criteria": "Target rubric / criteria for mastery"
    },
    "homework": "Meaningful independent consolidation task"
  },
  "differentiated_instruction": [
    {
      "learner_group": "Emerging Learners / High-Aptitude Learners / English Language Learners",
      "strategy_description": "Specific targeted adaptation"
    }
  ],
  "lesson_closure": {
    "summary": "Core conceptual takeaway",
    "reflection_questions": ["Metacognitive question 1"],
    "next_steps": "Preview of next lesson"
  }
}`;
  }

  /**
   * Prompt for refining an existing generated lesson plan.
   */
  static buildRefinementPrompt(
    currentPlanJson: string,
    refinementInstructions: string,
    focusAreas?: string[],
    targetDuration?: number,
  ): string {
    const cleanInstructions = this.sanitizeInput(refinementInstructions);
    const focusClause =
      focusAreas && focusAreas.length > 0
        ? `Focus your revisions especially on: ${focusAreas.join(', ')}.`
        : '';
    const durationClause = targetDuration
      ? `Adjust all activity durations so the total estimated duration is ${targetDuration} minutes.`
      : 'Maintain the current total lesson duration.';

    return `You are asked to refine an existing AI-generated lesson plan according to teacher feedback.

CURRENT LESSON PLAN (JSON):
${currentPlanJson}

TEACHER REFINEMENT INSTRUCTIONS:
<refinement_request>
${cleanInstructions}
</refinement_request>

${focusClause}
${durationClause}

INSTRUCTIONS:
1. Preserve all verified academic context (Grade, Subject, Curriculum Unit, official learning outcomes).
2. Apply the requested pedagogical changes precisely.
3. Ensure the activity durations sum up correctly.
4. Output ONLY the updated complete lesson plan as a single JSON object matching the original schema.`;
  }
}
