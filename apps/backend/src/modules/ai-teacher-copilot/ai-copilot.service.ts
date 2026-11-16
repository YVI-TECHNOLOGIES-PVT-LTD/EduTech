import { randomUUID } from 'crypto';
import {
  AiCopilotError,
  AiCopilotNotFoundError,
  AiCopilotProviderError,
  AiCopilotValidationError,
  DraftFeedbackOutput,
  DraftParentCommunicationOutput,
  GeneratedActivityOutput,
  GeneratedAssessmentOutput,
  GeneratedLessonPlanOutput,
  GeneratedTeachingMaterialOutput,
  LearningGapAnalysisOutput,
  StudentPerformanceAnalysisOutput,
  StudentStudyAssistantOutput,
} from './ai-copilot.types';
import { AiCopilotContextService } from './ai-copilot.context.service';
import { AiCopilotGuardrails } from './ai-copilot.guardrails';
import { PROMPTS } from './ai-copilot.prompts';
import { AiCopilotProviderFactory } from './ai-copilot.provider';
import { AiCopilotRepository } from './ai-copilot.repository';
import { AiCopilotUsageService } from './ai-copilot.usage.service';

export class AiCopilotService {
  /**
   * Return operational AI status and enabled capabilities.
   */
  static async getServiceStatus() {
    const provider = AiCopilotProviderFactory.getProvider();
    return provider.checkStatus();
  }

  /**
   * Fetch authenticated teacher's assigned classes, sections, and subjects.
   */
  static async getTeacherContext(orgId: string, userId: string) {
    return AiCopilotContextService.resolveTeacherContext(orgId, userId);
  }

  /**
   * Generate an academic curriculum-aligned lesson plan.
   */
  static async generateLessonPlan(
    orgId: string,
    userId: string,
    input: {
      faculty_assignment_id: string;
      curriculum_unit_id?: string | null;
      topic: string;
      duration_minutes?: number;
      teaching_approach?: string;
      difficulty_level?: string;
      learning_objectives?: string[];
      teacher_notes?: string | null;
    },
  ): Promise<{ generation_request_id: string | null; lesson_plan: GeneratedLessonPlanOutput }> {
    const teacher = await AiCopilotContextService.resolveTeacherContext(orgId, userId);
    const assignment = await AiCopilotContextService.verifyFacultyAssignment(
      orgId,
      teacher.staff_id,
      input.faculty_assignment_id,
    );

    const sanitizedTopic = AiCopilotGuardrails.sanitizeInput(input.topic, 200);
    const sanitizedNotes = input.teacher_notes
      ? AiCopilotGuardrails.sanitizeInput(input.teacher_notes, 1000)
      : undefined;

    const curriculumContext = await AiCopilotContextService.assembleCurriculumContext(
      assignment.curriculum_plan_id,
    );

    const userPrompt = PROMPTS.LESSON_PLAN.userTemplate({
      subject: assignment.subject_name,
      grade: assignment.grade_name,
      topic: sanitizedTopic,
      durationMinutes: input.duration_minutes || 45,
      approach: input.teaching_approach || 'collaborative',
      difficulty: input.difficulty_level || 'intermediate',
      learningObjectives: input.learning_objectives,
      curriculumOutline: curriculumContext,
      teacherNotes: sanitizedNotes,
    });

    const provider = AiCopilotProviderFactory.getProvider();
    const startTime = Date.now();
    try {
      const result = await provider.generateStructured<GeneratedLessonPlanOutput>(
        PROMPTS.LESSON_PLAN.system,
        userPrompt,
      );

      AiCopilotUsageService.recordUsage({
        requestId: randomUUID(),
        orgId,
        userId,
        generationType: 'lesson_plan',
        provider: result.provider,
        model: result.model,
        tokensUsed: result.tokenUsage?.totalTokens || 0,
        durationMs: result.durationMs,
        success: true,
      });

      let generationRequestId: string | null = null;
      if (assignment.curriculum_plan_id) {
        try {
          const req = await AiCopilotRepository.createGenerationRequest({
            orgId,
            userId,
            facultyAssignmentId: assignment.faculty_assignment_id,
            sectionId: assignment.section_id,
            academicYearGradeSubjectId: assignment.academic_year_grade_subject_id,
            curriculumPlanId: assignment.curriculum_plan_id,
            generationType: 'worksheet',
            title: `${assignment.subject_name} - ${sanitizedTopic} (Lesson Plan)`,
            teacherInstructions: sanitizedNotes,
            generationConfig: input,
            generatedContent: result.data,
            generatedAnswerKey: { rubric: 'Lesson Plan Checkpoints' },
            requestStatus: 'ready_for_review',
          });
          generationRequestId = req?.generation_request_id || null;
        } catch {
          // Do not fail user generation
        }
      }

      return {
        generation_request_id: generationRequestId,
        lesson_plan: result.data,
      };
    } catch (err: any) {
      AiCopilotUsageService.recordUsage({
        requestId: randomUUID(),
        orgId,
        userId,
        generationType: 'lesson_plan',
        provider: 'unknown',
        model: 'unknown',
        tokensUsed: 0,
        durationMs: Date.now() - startTime,
        success: false,
        errorCode: err?.code || 'GENERATION_FAILED',
      });
      throw err;
    }
  }

  /**
   * Generate teaching materials (worksheets, definitions, summaries).
   */
  static async generateTeachingMaterial(
    orgId: string,
    userId: string,
    input: {
      faculty_assignment_id: string;
      curriculum_unit_id?: string | null;
      material_type: string;
      topic: string;
      difficulty_level?: string;
      target_length?: string;
      teacher_instructions?: string | null;
    },
  ): Promise<{ generation_request_id: string | null; material: GeneratedTeachingMaterialOutput }> {
    const teacher = await AiCopilotContextService.resolveTeacherContext(orgId, userId);
    const assignment = await AiCopilotContextService.verifyFacultyAssignment(
      orgId,
      teacher.staff_id,
      input.faculty_assignment_id,
    );

    const sanitizedTopic = AiCopilotGuardrails.sanitizeInput(input.topic, 200);
    const sanitizedInstructions = input.teacher_instructions
      ? AiCopilotGuardrails.sanitizeInput(input.teacher_instructions, 1000)
      : undefined;

    const userPrompt = PROMPTS.TEACHING_MATERIAL.userTemplate({
      subject: assignment.subject_name,
      grade: assignment.grade_name,
      materialType: input.material_type,
      topic: sanitizedTopic,
      difficulty: input.difficulty_level || 'intermediate',
      length: input.target_length || 'standard',
      instructions: sanitizedInstructions,
    });

    const provider = AiCopilotProviderFactory.getProvider();
    const startTime = Date.now();
    try {
      const result = await provider.generateStructured<GeneratedTeachingMaterialOutput>(
        PROMPTS.TEACHING_MATERIAL.system,
        userPrompt,
      );

      // If published curriculum plan exists, store generation request draft in PostgreSQL
      let generationRequestId: string | null = null;
      if (assignment.curriculum_plan_id) {
        try {
          const req = await AiCopilotRepository.createGenerationRequest({
            orgId,
            userId,
            facultyAssignmentId: assignment.faculty_assignment_id,
            sectionId: assignment.section_id,
            academicYearGradeSubjectId: assignment.academic_year_grade_subject_id,
            curriculumPlanId: assignment.curriculum_plan_id,
            generationType: input.material_type === 'quiz' ? 'quiz' : 'worksheet',
            title: `${assignment.subject_name} - ${sanitizedTopic} (${input.material_type})`,
            teacherInstructions: sanitizedInstructions,
            generationConfig: input,
            generatedContent: result.data,
            generatedAnswerKey: { answer_key: 'Standard answer key and solutions' },
            requestStatus: 'ready_for_review',
          });
          generationRequestId = req?.generation_request_id || null;
        } catch {
          // If DB insertion fails, do not block teacher viewing output
        }
      }

      AiCopilotUsageService.recordUsage({
        requestId: randomUUID(),
        orgId,
        userId,
        generationType: 'teaching_material',
        provider: result.provider,
        model: result.model,
        tokensUsed: result.tokenUsage?.totalTokens || 0,
        durationMs: result.durationMs,
        success: true,
      });

      return {
        generation_request_id: generationRequestId,
        material: result.data,
      };
    } catch (err: any) {
      AiCopilotUsageService.recordUsage({
        requestId: randomUUID(),
        orgId,
        userId,
        generationType: 'teaching_material',
        provider: 'unknown',
        model: 'unknown',
        tokensUsed: 0,
        durationMs: Date.now() - startTime,
        success: false,
        errorCode: err?.code || 'GENERATION_FAILED',
      });
      throw err;
    }
  }

  /**
   * Generate an assessment / question paper with answer key.
   */
  static async generateAssessment(
    orgId: string,
    userId: string,
    input: {
      faculty_assignment_id: string;
      title: string;
      topic: string;
      duration_minutes?: number;
      total_marks?: number;
      question_count?: number;
      question_types?: string[];
      difficulty_distribution?: {
        easy_percent: number;
        medium_percent: number;
        hard_percent: number;
      };
    },
  ): Promise<{ generation_request_id: string | null; assessment: GeneratedAssessmentOutput }> {
    const teacher = await AiCopilotContextService.resolveTeacherContext(orgId, userId);
    const assignment = await AiCopilotContextService.verifyFacultyAssignment(
      orgId,
      teacher.staff_id,
      input.faculty_assignment_id,
    );

    const sanitizedTopic = AiCopilotGuardrails.sanitizeInput(input.topic, 200);
    const sanitizedTitle = AiCopilotGuardrails.sanitizeInput(input.title, 200);

    const userPrompt = PROMPTS.ASSESSMENT.userTemplate({
      subject: assignment.subject_name,
      grade: assignment.grade_name,
      title: sanitizedTitle,
      topic: sanitizedTopic,
      durationMinutes: input.duration_minutes || 60,
      totalMarks: input.total_marks || 50,
      questionCount: input.question_count || 10,
      questionTypes: input.question_types || ['mcq', 'short_answer'],
      distribution: input.difficulty_distribution || {
        easy_percent: 30,
        medium_percent: 50,
        hard_percent: 20,
      },
    });

    const provider = AiCopilotProviderFactory.getProvider();
    const startTime = Date.now();
    try {
      const result = await provider.generateStructured<GeneratedAssessmentOutput>(
        PROMPTS.ASSESSMENT.system,
        userPrompt,
      );

      // Validate question count and format
      if (!Array.isArray(result.data?.questions) || result.data.questions.length === 0) {
        throw new AiCopilotValidationError('Assessment generation returned empty questions list.');
      }

      let generationRequestId: string | null = null;
      if (assignment.curriculum_plan_id) {
        try {
          const req = await AiCopilotRepository.createGenerationRequest({
            orgId,
            userId,
            facultyAssignmentId: assignment.faculty_assignment_id,
            sectionId: assignment.section_id,
            academicYearGradeSubjectId: assignment.academic_year_grade_subject_id,
            curriculumPlanId: assignment.curriculum_plan_id,
            generationType: 'question_paper',
            title: sanitizedTitle,
            teacherInstructions: null,
            generationConfig: input,
            generatedContent: result.data,
            generatedAnswerKey: result.data?.answer_key || { answer_key: 'Assessment answer key' },
            requestStatus: 'ready_for_review',
          });
          generationRequestId = req?.generation_request_id || null;
        } catch {
          // Do not block user generation
        }
      }

      AiCopilotUsageService.recordUsage({
        requestId: randomUUID(),
        orgId,
        userId,
        generationType: 'assessment',
        provider: result.provider,
        model: result.model,
        tokensUsed: result.tokenUsage?.totalTokens || 0,
        durationMs: result.durationMs,
        success: true,
      });

      return {
        generation_request_id: generationRequestId,
        assessment: result.data,
      };
    } catch (err: any) {
      AiCopilotUsageService.recordUsage({
        requestId: randomUUID(),
        orgId,
        userId,
        generationType: 'assessment',
        provider: 'unknown',
        model: 'unknown',
        tokensUsed: 0,
        durationMs: Date.now() - startTime,
        success: false,
        errorCode: err?.code || 'GENERATION_FAILED',
      });
      throw err;
    }
  }

  /**
   * Generate homework or project instructions integrating with Phase 4 Learning Activities.
   */
  static async generateActivity(
    orgId: string,
    userId: string,
    input: {
      faculty_assignment_id: string;
      activity_type: 'homework' | 'project';
      topic: string;
      difficulty?: string;
      suggested_days?: number;
      learning_objectives?: string[];
      additional_notes?: string | null;
    },
  ): Promise<{ generation_request_id: string | null; activity: GeneratedActivityOutput }> {
    const teacher = await AiCopilotContextService.resolveTeacherContext(orgId, userId);
    const assignment = await AiCopilotContextService.verifyFacultyAssignment(
      orgId,
      teacher.staff_id,
      input.faculty_assignment_id,
    );

    const sanitizedTopic = AiCopilotGuardrails.sanitizeInput(input.topic, 200);
    const sanitizedNotes = input.additional_notes
      ? AiCopilotGuardrails.sanitizeInput(input.additional_notes, 1000)
      : undefined;

    const userPrompt = PROMPTS.ACTIVITY.userTemplate({
      subject: assignment.subject_name,
      grade: assignment.grade_name,
      activityType: input.activity_type,
      topic: sanitizedTopic,
      difficulty: input.difficulty || 'intermediate',
      suggestedDays: input.suggested_days || 3,
      learningObjectives: input.learning_objectives,
      notes: sanitizedNotes,
    });

    const provider = AiCopilotProviderFactory.getProvider();
    const startTime = Date.now();
    try {
      const result = await provider.generateStructured<GeneratedActivityOutput>(
        PROMPTS.ACTIVITY.system,
        userPrompt,
      );

      let generationRequestId: string | null = null;
      if (assignment.curriculum_plan_id) {
        try {
          const req = await AiCopilotRepository.createGenerationRequest({
            orgId,
            userId,
            facultyAssignmentId: assignment.faculty_assignment_id,
            sectionId: assignment.section_id,
            academicYearGradeSubjectId: assignment.academic_year_grade_subject_id,
            curriculumPlanId: assignment.curriculum_plan_id,
            generationType: 'worksheet',
            title: `${assignment.subject_name} - ${sanitizedTopic} (${input.activity_type})`,
            teacherInstructions: sanitizedNotes,
            generationConfig: input,
            generatedContent: result.data,
            generatedAnswerKey: { rubric: result.data?.evaluation_rubric_summary },
            requestStatus: 'ready_for_review',
          });
          generationRequestId = req?.generation_request_id || null;
        } catch {
          // Do not fail user generation
        }
      }

      AiCopilotUsageService.recordUsage({
        requestId: randomUUID(),
        orgId,
        userId,
        generationType: input.activity_type,
        provider: result.provider,
        model: result.model,
        tokensUsed: result.tokenUsage?.totalTokens || 0,
        durationMs: result.durationMs,
        success: true,
      });

      return {
        generation_request_id: generationRequestId,
        activity: result.data,
      };
    } catch (err: any) {
      AiCopilotUsageService.recordUsage({
        requestId: randomUUID(),
        orgId,
        userId,
        generationType: input.activity_type,
        provider: 'unknown',
        model: 'unknown',
        tokensUsed: 0,
        durationMs: Date.now() - startTime,
        success: false,
        errorCode: err?.code || 'GENERATION_FAILED',
      });
      throw err;
    }
  }

  /**
   * Analyze student or section performance based on verified attendance & submission data.
   */
  static async analyzePerformance(
    orgId: string,
    userId: string,
    input: {
      faculty_assignment_id: string;
      student_id?: string | null;
      topic?: string | null;
      focus_area?: string;
    },
  ): Promise<StudentPerformanceAnalysisOutput> {
    const teacher = await AiCopilotContextService.resolveTeacherContext(orgId, userId);
    const assignment = await AiCopilotContextService.verifyFacultyAssignment(
      orgId,
      teacher.staff_id,
      input.faculty_assignment_id,
    );

    const snapshot = await AiCopilotContextService.buildPerformanceContextSnapshot(
      orgId,
      assignment.section_id,
      input.student_id,
    );

    const userPrompt = PROMPTS.PERFORMANCE_ANALYSIS.userTemplate({
      subject: assignment.subject_name,
      gradeSection: `${assignment.grade_name} - ${assignment.section_name}`,
      focusArea: input.focus_area || 'overall',
      performanceStats: snapshot,
      topic: input.topic || undefined,
    });

    const provider = AiCopilotProviderFactory.getProvider();
    const startTime = Date.now();
    try {
      const result = await provider.generateStructured<StudentPerformanceAnalysisOutput>(
        PROMPTS.PERFORMANCE_ANALYSIS.system,
        userPrompt,
      );

      AiCopilotUsageService.recordUsage({
        requestId: randomUUID(),
        orgId,
        userId,
        generationType: 'performance_analysis',
        provider: result.provider,
        model: result.model,
        tokensUsed: result.tokenUsage?.totalTokens || 0,
        durationMs: result.durationMs,
        success: true,
      });

      return result.data;
    } catch (err: any) {
      AiCopilotUsageService.recordUsage({
        requestId: randomUUID(),
        orgId,
        userId,
        generationType: 'performance_analysis',
        provider: 'unknown',
        model: 'unknown',
        tokensUsed: 0,
        durationMs: Date.now() - startTime,
        success: false,
        errorCode: err?.code || 'GENERATION_FAILED',
      });
      throw err;
    }
  }

  /**
   * Identify learning gaps and recommend revision strategies.
   */
  static async analyzeLearningGaps(
    orgId: string,
    userId: string,
    input: {
      faculty_assignment_id: string;
      topic: string;
      unit_id?: string | null;
    },
  ): Promise<LearningGapAnalysisOutput> {
    const teacher = await AiCopilotContextService.resolveTeacherContext(orgId, userId);
    const assignment = await AiCopilotContextService.verifyFacultyAssignment(
      orgId,
      teacher.staff_id,
      input.faculty_assignment_id,
    );

    const sanitizedTopic = AiCopilotGuardrails.sanitizeInput(input.topic, 200);
    const snapshot = await AiCopilotContextService.buildPerformanceContextSnapshot(
      orgId,
      assignment.section_id,
    );

    const userPrompt = PROMPTS.LEARNING_GAP.userTemplate({
      subject: assignment.subject_name,
      gradeSection: `${assignment.grade_name} - ${assignment.section_name}`,
      topic: sanitizedTopic,
      performanceData: snapshot,
    });

    const provider = AiCopilotProviderFactory.getProvider();
    const startTime = Date.now();
    try {
      const result = await provider.generateStructured<LearningGapAnalysisOutput>(
        PROMPTS.LEARNING_GAP.system,
        userPrompt,
      );

      AiCopilotUsageService.recordUsage({
        requestId: randomUUID(),
        orgId,
        userId,
        generationType: 'learning_gap',
        provider: result.provider,
        model: result.model,
        tokensUsed: result.tokenUsage?.totalTokens || 0,
        durationMs: result.durationMs,
        success: true,
      });

      return result.data;
    } catch (err: any) {
      AiCopilotUsageService.recordUsage({
        requestId: randomUUID(),
        orgId,
        userId,
        generationType: 'learning_gap',
        provider: 'unknown',
        model: 'unknown',
        tokensUsed: 0,
        durationMs: Date.now() - startTime,
        success: false,
        errorCode: err?.code || 'GENERATION_FAILED',
      });
      throw err;
    }
  }

  /**
   * Draft constructive evaluation feedback for student submissions.
   */
  static async draftFeedback(
    orgId: string,
    userId: string,
    input: {
      faculty_assignment_id: string;
      submission_id?: string | null;
      student_work_text?: string | null;
      observed_strengths?: string | null;
      observed_weaknesses?: string | null;
      tone?: string;
    },
  ): Promise<DraftFeedbackOutput> {
    const teacher = await AiCopilotContextService.resolveTeacherContext(orgId, userId);
    const assignment = await AiCopilotContextService.verifyFacultyAssignment(
      orgId,
      teacher.staff_id,
      input.faculty_assignment_id,
    );

    const sanitizedWork = input.student_work_text
      ? AiCopilotGuardrails.sanitizeInput(input.student_work_text, 5000)
      : undefined;

    const userPrompt = PROMPTS.FEEDBACK.userTemplate({
      subject: assignment.subject_name,
      grade: assignment.grade_name,
      studentWorkText: sanitizedWork,
      strengths: input.observed_strengths || undefined,
      weaknesses: input.observed_weaknesses || undefined,
      tone: input.tone || 'encouraging',
    });

    const provider = AiCopilotProviderFactory.getProvider();
    const startTime = Date.now();
    try {
      const result = await provider.generateStructured<DraftFeedbackOutput>(
        PROMPTS.FEEDBACK.system,
        userPrompt,
      );

      AiCopilotUsageService.recordUsage({
        requestId: randomUUID(),
        orgId,
        userId,
        generationType: 'feedback',
        provider: result.provider,
        model: result.model,
        tokensUsed: result.tokenUsage?.totalTokens || 0,
        durationMs: result.durationMs,
        success: true,
      });

      return result.data;
    } catch (err: any) {
      AiCopilotUsageService.recordUsage({
        requestId: randomUUID(),
        orgId,
        userId,
        generationType: 'feedback',
        provider: 'unknown',
        model: 'unknown',
        tokensUsed: 0,
        durationMs: Date.now() - startTime,
        success: false,
        errorCode: err?.code || 'GENERATION_FAILED',
      });
      throw err;
    }
  }

  /**
   * Draft professional communication for parents.
   */
  static async draftParentCommunication(
    orgId: string,
    userId: string,
    input: {
      faculty_assignment_id: string;
      student_id?: string | null;
      communication_type: string;
      topic?: string | null;
      specific_observations?: string | null;
      tone?: string;
    },
  ): Promise<DraftParentCommunicationOutput> {
    const teacher = await AiCopilotContextService.resolveTeacherContext(orgId, userId);
    const assignment = await AiCopilotContextService.verifyFacultyAssignment(
      orgId,
      teacher.staff_id,
      input.faculty_assignment_id,
    );

    const userPrompt = PROMPTS.PARENT_COMMUNICATION.userTemplate({
      subject: assignment.subject_name,
      grade: assignment.grade_name,
      communicationType: input.communication_type,
      topic: input.topic || undefined,
      observations: input.specific_observations || undefined,
      tone: input.tone || 'friendly',
    });

    const provider = AiCopilotProviderFactory.getProvider();
    const startTime = Date.now();
    try {
      const result = await provider.generateStructured<DraftParentCommunicationOutput>(
        PROMPTS.PARENT_COMMUNICATION.system,
        userPrompt,
      );

      AiCopilotUsageService.recordUsage({
        requestId: randomUUID(),
        orgId,
        userId,
        generationType: 'parent_communication',
        provider: result.provider,
        model: result.model,
        tokensUsed: result.tokenUsage?.totalTokens || 0,
        durationMs: result.durationMs,
        success: true,
      });

      return result.data;
    } catch (err: any) {
      AiCopilotUsageService.recordUsage({
        requestId: randomUUID(),
        orgId,
        userId,
        generationType: 'parent_communication',
        provider: 'unknown',
        model: 'unknown',
        tokensUsed: 0,
        durationMs: Date.now() - startTime,
        success: false,
        errorCode: err?.code || 'GENERATION_FAILED',
      });
      throw err;
    }
  }

  /**
   * Student study assistant for concept breakdown and practice.
   */
  static async respondStudentStudyAssistant(
    orgId: string,
    userId: string,
    input: {
      topic: string;
      subject_name?: string;
      grade_level?: string;
      student_question: string;
      preferred_style?: string;
    },
  ): Promise<StudentStudyAssistantOutput> {
    const sanitizedTopic = AiCopilotGuardrails.sanitizeInput(input.topic, 200);
    const sanitizedQuestion = AiCopilotGuardrails.sanitizeInput(input.student_question, 1000);

    const userPrompt = PROMPTS.STUDY_ASSISTANT.userTemplate({
      topic: sanitizedTopic,
      subjectName: input.subject_name,
      gradeLevel: input.grade_level,
      question: sanitizedQuestion,
      style: input.preferred_style || 'step_by_step',
    });

    const provider = AiCopilotProviderFactory.getProvider();
    const startTime = Date.now();
    try {
      const result = await provider.generateStructured<StudentStudyAssistantOutput>(
        PROMPTS.STUDY_ASSISTANT.system,
        userPrompt,
      );

      AiCopilotUsageService.recordUsage({
        requestId: randomUUID(),
        orgId,
        userId,
        generationType: 'study_assistant',
        provider: result.provider,
        model: result.model,
        tokensUsed: result.tokenUsage?.totalTokens || 0,
        durationMs: result.durationMs,
        success: true,
      });

      return result.data;
    } catch (err: any) {
      AiCopilotUsageService.recordUsage({
        requestId: randomUUID(),
        orgId,
        userId,
        generationType: 'study_assistant',
        provider: 'unknown',
        model: 'unknown',
        tokensUsed: 0,
        durationMs: Date.now() - startTime,
        success: false,
        errorCode: err?.code || 'GENERATION_FAILED',
      });
      throw err;
    }
  }

  /**
   * Approve a generated material and save a version in the PostgreSQL database.
   */
  static async approveMaterial(
    orgId: string,
    userId: string,
    params: {
      generation_request_id: string;
      title: string;
      change_summary?: string | null;
    },
  ) {
    const teacher = await AiCopilotContextService.resolveTeacherContext(orgId, userId);
    return AiCopilotRepository.approveMaterialAndCreateVersion({
      orgId,
      staffId: teacher.staff_id,
      userId,
      generationRequestId: params.generation_request_id,
      title: params.title,
      changeSummary: params.change_summary,
    });
  }

  /**
   * List approved materials for the teacher.
   */
  static async listTeacherMaterials(orgId: string, userId: string) {
    const teacher = await AiCopilotContextService.resolveTeacherContext(orgId, userId);
    return AiCopilotRepository.listApprovedMaterials(orgId, teacher.staff_id);
  }

  /**
   * Record an intervention recommendation in the PostgreSQL database.
   */
  static async recordIntervention(
    orgId: string,
    userId: string,
    input: {
      student_id: string;
      academic_year_grade_subject_id: string;
      recommendation_type: string;
      recommendation_text: string;
      evidence_snapshot?: any;
    },
  ) {
    return AiCopilotRepository.recordInterventionRecommendation({
      orgId,
      studentId: input.student_id,
      academicYearGradeSubjectId: input.academic_year_grade_subject_id,
      recommendationType: input.recommendation_type,
      recommendationText: input.recommendation_text,
      evidenceSnapshot: input.evidence_snapshot || {},
      generatedByUserId: userId,
    });
  }

  /**
   * Dismiss an intervention recommendation.
   */
  static async dismissRecommendation(orgId: string, recommendationId: string) {
    return AiCopilotRepository.dismissRecommendation(orgId, recommendationId);
  }

  /**
   * Admin oversight operational metrics.
   */
  static async getAdminMetrics(orgId: string) {
    const status = await this.getServiceStatus();
    const metrics = AiCopilotUsageService.getOrgMetrics(orgId);
    return {
      total_requests: metrics.totalRequests,
      successful_requests: metrics.successfulRequests,
      failed_requests: metrics.failedRequests,
      estimated_tokens: metrics.totalTokens,
      provider: status.provider,
      service_status: status,
      usage_metrics: metrics,
    };
  }
}
