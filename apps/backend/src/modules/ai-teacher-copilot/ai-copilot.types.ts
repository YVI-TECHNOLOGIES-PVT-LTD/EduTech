export type AiCopilotGenerationType =
  | 'lesson_plan'
  | 'teaching_material'
  | 'worksheet'
  | 'quiz'
  | 'question_paper'
  | 'question_paper_blueprint'
  | 'homework'
  | 'project'
  | 'performance_analysis'
  | 'learning_gap'
  | 'remedial_plan'
  | 'feedback'
  | 'parent_communication'
  | 'study_assistant';

export type AiCopilotRequestStatus =
  'queued' | 'generating' | 'ready_for_review' | 'approved' | 'rejected' | 'failed' | 'expired';

export type AiCopilotMaterialStatus = 'active' | 'archived';
export type AiCopilotRecommendationStatus = 'active' | 'dismissed' | 'expired';

export class AiCopilotError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, code = 'AI_COPILOT_ERROR', details?: unknown) {
    super(message);
    this.name = 'AiCopilotError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class AiCopilotValidationError extends AiCopilotError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'AI_VALIDATION_ERROR', details);
    this.name = 'AiCopilotValidationError';
  }
}

export class AiCopilotForbiddenError extends AiCopilotError {
  constructor(message: string, details?: unknown) {
    super(message, 403, 'AI_FORBIDDEN', details);
    this.name = 'AiCopilotForbiddenError';
  }
}

export class AiCopilotNotFoundError extends AiCopilotError {
  constructor(message: string, details?: unknown) {
    super(message, 404, 'AI_NOT_FOUND', details);
    this.name = 'AiCopilotNotFoundError';
  }
}

export class AiCopilotProviderError extends AiCopilotError {
  constructor(message: string, statusCode = 502, code = 'AI_PROVIDER_ERROR', details?: unknown) {
    super(message, statusCode, code, details);
    this.name = 'AiCopilotProviderError';
  }
}

export interface TeacherAcademicContextDto {
  staff_id: string;
  user_id: string;
  teacher_name: string;
  org_id: string;
  org_name: string;
  academic_year: {
    academic_year_id: string;
    academic_year_name: string;
    status: string;
  } | null;
  assigned_sections: Array<{
    faculty_assignment_id: string;
    section_id: string;
    section_name: string;
    grade_id: string;
    grade_name: string;
    grade_code: string;
    academic_year_grade_subject_id: string;
    subject_id: string;
    subject_name: string;
    subject_code: string;
    curriculum_plan_id: string | null;
    curriculum_plan_title: string | null;
  }>;
}

export interface GeneratedLessonPlanOutput {
  title: string;
  subject: string;
  grade_level: string;
  duration_minutes: number;
  teaching_approach: string;
  learning_objectives: string[];
  prerequisite_knowledge: string[];
  topic_introduction: string;
  key_concepts: Array<{ concept: string; explanation: string }>;
  classroom_activities: Array<{ title: string; duration_minutes: number; description: string }>;
  teaching_resources: string[];
  student_engagement_strategy: string;
  differentiated_instruction: {
    support_for_struggling_learners: string;
    extension_for_advanced_learners: string;
  };
  formative_assessment: string[];
  homework_suggestions: string[];
  expected_outcomes: string[];
}

export interface GeneratedTeachingMaterialOutput {
  title: string;
  material_type: string;
  grade_level: string;
  subject: string;
  topic: string;
  summary: string;
  key_definitions: Array<{ term: string; definition: string }>;
  worked_examples: Array<{ problem: string; solution: string; explanation: string }>;
  discussion_prompts: string[];
  student_worksheet: {
    instructions: string;
    practice_problems: Array<{ question: string; points: number; hints?: string }>;
  };
  revision_checklist: string[];
}

export interface GeneratedAssessmentQuestion {
  question_id: string;
  question_number: number;
  question_type: 'mcq' | 'true_false' | 'short_answer' | 'descriptive';
  question_text: string;
  options?: string[];
  correct_answer: string;
  explanation: string;
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  blooms_taxonomy_level: string;
  learning_objective?: string;
}

export interface GeneratedAssessmentOutput {
  title: string;
  grade_level: string;
  subject: string;
  topic: string;
  duration_minutes: number;
  total_marks: number;
  instructions: string[];
  questions: GeneratedAssessmentQuestion[];
  answer_key: Array<{
    question_number: number;
    correct_answer: string;
    scoring_guide: string;
  }>;
}

export interface GeneratedActivityOutput {
  title: string;
  activity_type: 'homework' | 'project';
  target_grade: string;
  subject: string;
  overview: string;
  detailed_instructions: string;
  submission_guidelines: string;
  deliverables: string[];
  evaluation_rubric_summary: string;
  recommended_duration_days: number;
  suggested_maximum_marks: number;
}

export interface StudentPerformanceAnalysisOutput {
  analysis_scope: string;
  analyzed_student_count: number;
  data_confidence: 'high' | 'medium' | 'low' | 'insufficient';
  data_summary: string;
  overall_strengths: string[];
  areas_for_improvement: string[];
  repeated_error_patterns: string[];
  students_requiring_attention: Array<{
    student_id?: string;
    student_label: string;
    concern_area: string;
    suggested_focus: string;
  }>;
  suggested_remedial_topics: string[];
}

export interface LearningGapAnalysisOutput {
  topic: string;
  identified_gaps: Array<{
    concept: string;
    affected_students_estimate: number;
    severity: 'mild' | 'moderate' | 'critical';
    potential_reason_hypothesis: string;
    suggested_revision_strategy: string;
    suggested_practice_questions: string[];
  }>;
  remedial_teaching_plan: {
    objective: string;
    step_by_step_plan: Array<{ step: number; activity: string; duration_minutes: number }>;
    follow_up_assessment_idea: string;
  };
}

export interface DraftFeedbackOutput {
  overall_tone: string;
  positive_reinforcement: string;
  specific_areas_for_improvement: string[];
  recommended_next_steps: string;
  draft_feedback_message: string;
  suggested_score_range?: { min: number; max: number; rationale: string };
}

export interface DraftParentCommunicationOutput {
  tone: 'formal' | 'friendly' | 'concise' | 'detailed';
  subject_line: string;
  greeting: string;
  body: string;
  key_points: string[];
  action_items_for_parents: string[];
  closing: string;
}

export interface StudentStudyAssistantOutput {
  topic: string;
  conceptual_explanation: string;
  step_by_step_breakdown: string[];
  real_world_analogy: string;
  practice_questions: Array<{ question: string; hint: string; answer_reveal: string }>;
  encouragement: string;
}

export interface AiServiceStatusDto {
  provider: 'gemini' | 'openai' | 'mock' | 'none';
  status: 'operational' | 'degraded' | 'unconfigured' | 'error';
  primary_model: string;
  capabilities: {
    lesson_planning: boolean;
    teaching_materials: boolean;
    assessments: boolean;
    learning_activities: boolean;
    performance_analysis: boolean;
    learning_gaps: boolean;
    feedback_drafting: boolean;
    parent_communication: boolean;
    student_study_assistant: boolean;
  };
  notice?: string;
}
