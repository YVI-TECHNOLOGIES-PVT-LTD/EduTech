import { apiSlice } from '@/app/store/apiSlice';
import { ENDPOINTS } from './endpoints';

export interface TeacherAssignmentContext {
  faculty_assignment_id: string;
  section_id: string;
  section_name: string;
  grade_id: string;
  grade_name: string;
  grade_code: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  curriculum_plan_id: string | null;
}

export interface TeacherContextResponse {
  staff_id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  assigned_subjects: TeacherAssignmentContext[];
}

export interface LessonPlanOutput {
  title: string;
  grade_level: string;
  subject: string;
  topic: string;
  duration_minutes: number;
  learning_outcomes: string[];
  prerequisites: string[];
  pedagogical_approach: string;
  lesson_phases: Array<{
    title: string;
    duration_minutes: number;
    description: string;
  }>;
  teaching_resources: string[];
  student_engagement_strategy: string;
  differentiated_instruction: {
    support_for_struggling_learners: string;
    extension_for_advanced_learners: string;
  };
  assessment_checkpoints: Array<{
    checkpoint: string;
    question: string;
    expected_understanding: string;
  }>;
  homework_recommendation: string;
}

export interface TeachingMaterialOutput {
  title: string;
  material_type: string;
  grade_level: string;
  subject: string;
  topic: string;
  summary: string;
  key_definitions: Array<{ term: string; definition: string }>;
  worked_examples: Array<{ problem: string; solution: string; explanation: string }>;
  discussion_prompts: string[];
  student_worksheet?: {
    instructions: string;
    practice_problems: Array<{ question: string; points: number; hints: string }>;
  };
  revision_checklist: string[];
}

export interface QuestionOutput {
  question_id?: string;
  question_number: number;
  question_type: 'mcq' | 'true_false' | 'short_answer' | 'descriptive';
  question_text: string;
  options?: string[];
  correct_answer?: string;
  explanation: string;
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  blooms_level?: string;
}

export interface AssessmentOutput {
  title: string;
  grade_level: string;
  subject: string;
  topic: string;
  duration_minutes: number;
  total_marks: number;
  instructions: string[];
  questions: QuestionOutput[];
  answer_key?: Array<{
    question_number: number;
    correct_answer: string;
    scoring_guide: string;
  }>;
}

export interface ActivityOutput {
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

export interface PerformanceAnalysisOutput {
  analysis_scope: string;
  analyzed_student_count: number;
  data_confidence: string;
  data_summary: string;
  overall_strengths: string[];
  areas_for_improvement: string[];
  repeated_error_patterns: string[];
  students_requiring_attention: Array<{
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
    step_by_step_plan: Array<{
      step: number;
      activity: string;
      duration_minutes: number;
    }>;
    follow_up_assessment_idea: string;
  };
}

export interface DraftFeedbackOutput {
  overall_tone: string;
  positive_reinforcement: string;
  specific_areas_for_improvement: string[];
  recommended_next_steps: string;
  draft_feedback_message: string;
  suggested_score_range: {
    min: number;
    max: number;
    rationale: string;
  };
}

export interface DraftParentCommunicationOutput {
  tone: string;
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
  practice_questions: Array<{
    question: string;
    hint: string;
  }>;
  summary_takeaway: string;
}

export interface AdminUsageMetrics {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  estimated_tokens: number;
  provider: string;
  by_type: Record<string, { requests: number; tokens: number; errors: number }>;
}

export interface ApprovedMaterialItem {
  material_id: string;
  curriculum_unit_id: string | null;
  material_type: string;
  title: string;
  description: string | null;
  target_role: string;
  current_version_number: number;
  created_at: string;
}

function unwrap<T>(res: any): T {
  return res?.data !== undefined ? res.data : res;
}

export const aiCopilotApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAiCopilotStatus: builder.query<{ service: string; status: string; provider: string }, void>({
      query: () => ({ url: ENDPOINTS.AI_COPILOT.STATUS }),
      transformResponse: unwrap,
    }),

    getTeacherAiContext: builder.query<TeacherContextResponse, void>({
      query: () => ({ url: ENDPOINTS.AI_COPILOT.TEACHER_CONTEXT }),
      transformResponse: unwrap,
    }),

    generateLessonPlan: builder.mutation<
      { generation_request_id: string | null; lesson_plan: LessonPlanOutput },
      {
        faculty_assignment_id: string;
        unit_id?: string | null;
        topic: string;
        duration_minutes?: number;
        pedagogical_approach?: string;
        target_learning_outcomes?: string[];
        special_instructions?: string | null;
      }
    >({
      query: (body) => ({
        url: ENDPOINTS.AI_COPILOT.LESSON_PLANS_GENERATE,
        method: 'POST',
        body,
      }),
      transformResponse: unwrap,
    }),

    generateTeachingMaterial: builder.mutation<
      { generation_request_id: string | null; material: TeachingMaterialOutput },
      {
        faculty_assignment_id: string;
        unit_id?: string | null;
        material_type: 'worksheet' | 'summary' | 'worked_examples' | 'glossary';
        topic: string;
        difficulty?: string;
        length?: string;
        special_instructions?: string | null;
      }
    >({
      query: (body) => ({
        url: ENDPOINTS.AI_COPILOT.TEACHING_MATERIALS_GENERATE,
        method: 'POST',
        body,
      }),
      transformResponse: unwrap,
    }),

    generateQuestions: builder.mutation<
      { generation_request_id: string | null; question_set: { questions: QuestionOutput[] } },
      {
        faculty_assignment_id: string;
        topic: string;
        total_questions: number;
        question_types?: string[];
      }
    >({
      query: (body) => ({
        url: ENDPOINTS.AI_COPILOT.QUESTIONS_GENERATE,
        method: 'POST',
        body,
      }),
      transformResponse: unwrap,
    }),

    generateAssessment: builder.mutation<
      { generation_request_id: string | null; assessment: AssessmentOutput },
      {
        faculty_assignment_id: string;
        title: string;
        topic: string;
        duration_minutes?: number;
        total_marks?: number;
        question_count?: number;
        question_types?: string[];
      }
    >({
      query: (body) => ({
        url: ENDPOINTS.AI_COPILOT.ASSESSMENTS_GENERATE,
        method: 'POST',
        body,
      }),
      transformResponse: unwrap,
    }),

    generateHomework: builder.mutation<
      { generation_request_id: string | null; activity: ActivityOutput },
      {
        faculty_assignment_id: string;
        topic: string;
        difficulty?: string;
        suggested_days?: number;
        additional_notes?: string | null;
      }
    >({
      query: (body) => ({
        url: ENDPOINTS.AI_COPILOT.HOMEWORK_GENERATE,
        method: 'POST',
        body,
      }),
      transformResponse: unwrap,
    }),

    generateProject: builder.mutation<
      { generation_request_id: string | null; activity: ActivityOutput },
      {
        faculty_assignment_id: string;
        topic: string;
        difficulty?: string;
        suggested_days?: number;
        additional_notes?: string | null;
      }
    >({
      query: (body) => ({
        url: ENDPOINTS.AI_COPILOT.PROJECT_GENERATE,
        method: 'POST',
        body,
      }),
      transformResponse: unwrap,
    }),

    analyzePerformance: builder.mutation<
      PerformanceAnalysisOutput,
      {
        faculty_assignment_id: string;
        focus_area?: string;
        unit_id?: string | null;
      }
    >({
      query: (body) => ({
        url: ENDPOINTS.AI_COPILOT.PERFORMANCE_ANALYZE,
        method: 'POST',
        body,
      }),
      transformResponse: unwrap,
    }),

    analyzeLearningGaps: builder.mutation<
      LearningGapAnalysisOutput,
      {
        faculty_assignment_id: string;
        topic: string;
        unit_id?: string | null;
      }
    >({
      query: (body) => ({
        url: ENDPOINTS.AI_COPILOT.LEARNING_GAPS_ANALYZE,
        method: 'POST',
        body,
      }),
      transformResponse: unwrap,
    }),

    generateRemedialPlan: builder.mutation<
      LearningGapAnalysisOutput['remedial_teaching_plan'],
      {
        faculty_assignment_id: string;
        affected_concept: string;
        learning_gap_description: string;
        target_duration_days?: number;
      }
    >({
      query: (body) => ({
        url: ENDPOINTS.AI_COPILOT.REMEDIAL_PLANS_GENERATE,
        method: 'POST',
        body,
      }),
      transformResponse: unwrap,
    }),

    draftFeedback: builder.mutation<
      DraftFeedbackOutput,
      {
        faculty_assignment_id: string;
        student_work_text?: string | null;
        observed_strengths?: string | null;
        observed_weaknesses?: string | null;
        tone?: string;
      }
    >({
      query: (body) => ({
        url: ENDPOINTS.AI_COPILOT.FEEDBACK_DRAFT,
        method: 'POST',
        body,
      }),
      transformResponse: unwrap,
    }),

    draftParentCommunication: builder.mutation<
      DraftParentCommunicationOutput,
      {
        faculty_assignment_id: string;
        communication_type: string;
        topic?: string | null;
        specific_observations?: string | null;
        tone?: string;
      }
    >({
      query: (body) => ({
        url: ENDPOINTS.AI_COPILOT.PARENT_COMMUNICATIONS_DRAFT,
        method: 'POST',
        body,
      }),
      transformResponse: unwrap,
    }),

    approveMaterial: builder.mutation<
      { material_id: string; version_id: string; message: string },
      {
        generation_request_id: string;
        title: string;
        material_type: string;
        content: any;
        review_comments?: string | null;
      }
    >({
      query: (body) => ({
        url: ENDPOINTS.AI_COPILOT.MATERIALS_APPROVE,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AiCopilotMaterial'],
      transformResponse: unwrap,
    }),

    listTeacherMaterials: builder.query<ApprovedMaterialItem[], { limit?: number } | void>({
      query: (params) => ({
        url: ENDPOINTS.AI_COPILOT.MATERIALS_LIST,
        params: params || undefined,
      }),
      providesTags: ['AiCopilotMaterial'],
      transformResponse: unwrap,
    }),

    respondStudentStudyAssistant: builder.mutation<
      StudentStudyAssistantOutput,
      {
        topic: string;
        subject_name?: string;
        grade_level?: string;
        student_question: string;
        preferred_style?: string;
      }
    >({
      query: (body) => ({
        url: ENDPOINTS.AI_COPILOT.STUDENT_STUDY_ASSISTANT,
        method: 'POST',
        body,
      }),
      transformResponse: unwrap,
    }),

    getAdminAiUsage: builder.query<AdminUsageMetrics, void>({
      query: () => ({ url: ENDPOINTS.AI_COPILOT.ADMIN_USAGE }),
      providesTags: ['AiCopilotUsage'],
      transformResponse: unwrap,
    }),
  }),
});

export const {
  useGetAiCopilotStatusQuery,
  useGetTeacherAiContextQuery,
  useGenerateLessonPlanMutation,
  useGenerateTeachingMaterialMutation,
  useGenerateQuestionsMutation,
  useGenerateAssessmentMutation,
  useGenerateHomeworkMutation,
  useGenerateProjectMutation,
  useAnalyzePerformanceMutation,
  useAnalyzeLearningGapsMutation,
  useGenerateRemedialPlanMutation,
  useDraftFeedbackMutation,
  useDraftParentCommunicationMutation,
  useApproveMaterialMutation,
  useListTeacherMaterialsQuery,
  useRespondStudentStudyAssistantMutation,
  useGetAdminAiUsageQuery,
} = aiCopilotApi;
