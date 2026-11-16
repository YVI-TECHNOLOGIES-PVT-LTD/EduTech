import { Request, Response } from 'express';
import { extractAiCopilotAuthContext } from './ai-copilot.policy';
import { AiCopilotGuardrails } from './ai-copilot.guardrails';
import { AiCopilotService } from './ai-copilot.service';
import {
  analyzeLearningGapsSchema,
  analyzePerformanceSchema,
  approveMaterialSchema,
  dismissRecommendationSchema,
  draftFeedbackSchema,
  draftParentCommunicationSchema,
  generateActivitySchema,
  generateAssessmentSchema,
  generateLessonPlanSchema,
  generateQuestionsSchema,
  generateRemedialPlanSchema,
  generateTeachingMaterialSchema,
  studentStudyAssistantSchema,
} from './ai-copilot.validation';

export class AiCopilotController {
  static async getStatus(req: Request, res: Response) {
    try {
      const status = await AiCopilotService.getServiceStatus();
      return res.status(200).json({ success: true, data: status });
    } catch (err: any) {
      return res.status(err?.statusCode || 500).json({
        success: false,
        error: err?.code || 'STATUS_ERROR',
        message: err?.message || 'Failed to check AI status',
      });
    }
  }

  static async getTeacherContext(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractAiCopilotAuthContext(req);
      const context = await AiCopilotService.getTeacherContext(orgId, userId);
      return res.status(200).json({ success: true, data: context });
    } catch (err: any) {
      return res.status(err?.statusCode || 500).json({
        success: false,
        error: err?.code || 'CONTEXT_ERROR',
        message: err?.message || 'Failed to fetch teacher context',
      });
    }
  }

  static async generateLessonPlan(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractAiCopilotAuthContext(req);
      const validated = generateLessonPlanSchema.parse(req.body);
      const plan = await AiCopilotService.generateLessonPlan(orgId, userId, validated);
      return res.status(200).json({ success: true, data: plan });
    } catch (err: any) {
      return res.status(err?.statusCode || (err?.name === 'ZodError' ? 400 : 500)).json({
        success: false,
        error: err?.code || (err?.name === 'ZodError' ? 'VALIDATION_ERROR' : 'GENERATION_ERROR'),
        message: err?.message || 'Failed to generate lesson plan',
        details: err?.errors || err?.details,
      });
    }
  }

  static async generateTeachingMaterial(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractAiCopilotAuthContext(req);
      const validated = generateTeachingMaterialSchema.parse(req.body);
      const material = await AiCopilotService.generateTeachingMaterial(orgId, userId, validated);
      return res.status(200).json({ success: true, data: material });
    } catch (err: any) {
      return res.status(err?.statusCode || (err?.name === 'ZodError' ? 400 : 500)).json({
        success: false,
        error: err?.code || (err?.name === 'ZodError' ? 'VALIDATION_ERROR' : 'GENERATION_ERROR'),
        message: err?.message || 'Failed to generate teaching material',
        details: err?.errors || err?.details,
      });
    }
  }

  static async generateAssessment(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractAiCopilotAuthContext(req);
      const validated = generateAssessmentSchema.parse(req.body);
      const assessment = await AiCopilotService.generateAssessment(orgId, userId, validated);
      return res.status(200).json({ success: true, data: assessment });
    } catch (err: any) {
      return res.status(err?.statusCode || (err?.name === 'ZodError' ? 400 : 500)).json({
        success: false,
        error: err?.code || (err?.name === 'ZodError' ? 'VALIDATION_ERROR' : 'GENERATION_ERROR'),
        message: err?.message || 'Failed to generate assessment',
        details: err?.errors || err?.details,
      });
    }
  }

  static async generateQuestions(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractAiCopilotAuthContext(req);
      const validated = generateQuestionsSchema.parse(req.body);
      const assessment = await AiCopilotService.generateAssessment(orgId, userId, {
        faculty_assignment_id: validated.faculty_assignment_id,
        title: `${validated.topic} - Practice Questions`,
        topic: validated.topic,
        question_count: validated.total_questions,
        question_types: validated.question_types,
      });
      return res.status(200).json({
        success: true,
        data: {
          generation_request_id: assessment.generation_request_id,
          question_set: {
            questions: assessment.assessment.questions,
          },
        },
      });
    } catch (err: any) {
      return res.status(err?.statusCode || (err?.name === 'ZodError' ? 400 : 500)).json({
        success: false,
        error: err?.code || (err?.name === 'ZodError' ? 'VALIDATION_ERROR' : 'GENERATION_ERROR'),
        message: err?.message || 'Failed to generate questions',
        details: err?.errors || err?.details,
      });
    }
  }

  static async generateHomework(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractAiCopilotAuthContext(req);
      const validated = generateActivitySchema.parse({ ...req.body, activity_type: 'homework' });
      const activity = await AiCopilotService.generateActivity(orgId, userId, validated);
      return res.status(200).json({ success: true, data: activity });
    } catch (err: any) {
      return res.status(err?.statusCode || (err?.name === 'ZodError' ? 400 : 500)).json({
        success: false,
        error: err?.code || (err?.name === 'ZodError' ? 'VALIDATION_ERROR' : 'GENERATION_ERROR'),
        message: err?.message || 'Failed to generate homework',
        details: err?.errors || err?.details,
      });
    }
  }

  static async generateProject(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractAiCopilotAuthContext(req);
      const validated = generateActivitySchema.parse({ ...req.body, activity_type: 'project' });
      const activity = await AiCopilotService.generateActivity(orgId, userId, validated);
      return res.status(200).json({ success: true, data: activity });
    } catch (err: any) {
      return res.status(err?.statusCode || (err?.name === 'ZodError' ? 400 : 500)).json({
        success: false,
        error: err?.code || (err?.name === 'ZodError' ? 'VALIDATION_ERROR' : 'GENERATION_ERROR'),
        message: err?.message || 'Failed to generate project instructions',
        details: err?.errors || err?.details,
      });
    }
  }

  static async analyzePerformance(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractAiCopilotAuthContext(req);
      const validated = analyzePerformanceSchema.parse(req.body);
      const analysis = await AiCopilotService.analyzePerformance(orgId, userId, validated);
      return res.status(200).json({ success: true, data: analysis });
    } catch (err: any) {
      return res.status(err?.statusCode || (err?.name === 'ZodError' ? 400 : 500)).json({
        success: false,
        error: err?.code || (err?.name === 'ZodError' ? 'VALIDATION_ERROR' : 'ANALYSIS_ERROR'),
        message: err?.message || 'Failed to analyze student performance',
        details: err?.errors || err?.details,
      });
    }
  }

  static async analyzeLearningGaps(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractAiCopilotAuthContext(req);
      const validated = analyzeLearningGapsSchema.parse(req.body);
      const gaps = await AiCopilotService.analyzeLearningGaps(orgId, userId, validated);
      return res.status(200).json({ success: true, data: gaps });
    } catch (err: any) {
      return res.status(err?.statusCode || (err?.name === 'ZodError' ? 400 : 500)).json({
        success: false,
        error: err?.code || (err?.name === 'ZodError' ? 'VALIDATION_ERROR' : 'ANALYSIS_ERROR'),
        message: err?.message || 'Failed to analyze learning gaps',
        details: err?.errors || err?.details,
      });
    }
  }

  static async generateRemedialPlan(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractAiCopilotAuthContext(req);
      const validated = generateRemedialPlanSchema.parse(req.body);
      AiCopilotGuardrails.sanitizeInput(validated.learning_gap_description, 2000);
      AiCopilotGuardrails.sanitizeInput(validated.affected_concept, 200);
      const plan = await AiCopilotService.analyzeLearningGaps(orgId, userId, {
        faculty_assignment_id: validated.faculty_assignment_id,
        topic: validated.affected_concept,
      });
      return res.status(200).json({ success: true, data: plan.remedial_teaching_plan });
    } catch (err: any) {
      return res.status(err?.statusCode || (err?.name === 'ZodError' ? 400 : 500)).json({
        success: false,
        error: err?.code || (err?.name === 'ZodError' ? 'VALIDATION_ERROR' : 'GENERATION_ERROR'),
        message: err?.message || 'Failed to generate remedial plan',
        details: err?.errors || err?.details,
      });
    }
  }

  static async draftFeedback(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractAiCopilotAuthContext(req);
      const validated = draftFeedbackSchema.parse(req.body);
      const feedback = await AiCopilotService.draftFeedback(orgId, userId, validated);
      return res.status(200).json({ success: true, data: feedback });
    } catch (err: any) {
      return res.status(err?.statusCode || (err?.name === 'ZodError' ? 400 : 500)).json({
        success: false,
        error: err?.code || (err?.name === 'ZodError' ? 'VALIDATION_ERROR' : 'GENERATION_ERROR'),
        message: err?.message || 'Failed to draft evaluation feedback',
        details: err?.errors || err?.details,
      });
    }
  }

  static async draftParentCommunication(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractAiCopilotAuthContext(req);
      const validated = draftParentCommunicationSchema.parse(req.body);
      const draft = await AiCopilotService.draftParentCommunication(orgId, userId, validated);
      return res.status(200).json({ success: true, data: draft });
    } catch (err: any) {
      return res.status(err?.statusCode || (err?.name === 'ZodError' ? 400 : 500)).json({
        success: false,
        error: err?.code || (err?.name === 'ZodError' ? 'VALIDATION_ERROR' : 'GENERATION_ERROR'),
        message: err?.message || 'Failed to draft parent communication',
        details: err?.errors || err?.details,
      });
    }
  }

  static async respondStudentStudyAssistant(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractAiCopilotAuthContext(req);
      const validated = studentStudyAssistantSchema.parse(req.body);
      const response = await AiCopilotService.respondStudentStudyAssistant(
        orgId,
        userId,
        validated,
      );
      return res.status(200).json({ success: true, data: response });
    } catch (err: any) {
      return res.status(err?.statusCode || (err?.name === 'ZodError' ? 400 : 500)).json({
        success: false,
        error: err?.code || (err?.name === 'ZodError' ? 'VALIDATION_ERROR' : 'GENERATION_ERROR'),
        message: err?.message || 'Failed to generate study assistance response',
        details: err?.errors || err?.details,
      });
    }
  }

  static async approveMaterial(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractAiCopilotAuthContext(req);
      const validated = approveMaterialSchema.parse(req.body);
      const result = await AiCopilotService.approveMaterial(orgId, userId, validated);
      return res.status(201).json({ success: true, data: result });
    } catch (err: any) {
      return res.status(err?.statusCode || 500).json({
        success: false,
        error: err?.code || 'APPROVAL_ERROR',
        message: err?.message || 'Failed to approve material',
      });
    }
  }

  static async listTeacherMaterials(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractAiCopilotAuthContext(req);
      const materials = await AiCopilotService.listTeacherMaterials(orgId, userId);
      return res.status(200).json({ success: true, data: materials });
    } catch (err: any) {
      return res.status(err?.statusCode || 500).json({
        success: false,
        error: err?.code || 'FETCH_ERROR',
        message: err?.message || 'Failed to list approved materials',
      });
    }
  }

  static async dismissRecommendation(req: Request, res: Response) {
    try {
      const { orgId } = extractAiCopilotAuthContext(req);
      const validated = dismissRecommendationSchema.parse(req.body);
      await AiCopilotService.dismissRecommendation(orgId, validated.recommendation_id);
      return res.status(200).json({ success: true, message: 'Recommendation dismissed' });
    } catch (err: any) {
      return res.status(err?.statusCode || 500).json({
        success: false,
        error: err?.code || 'DISMISS_ERROR',
        message: err?.message || 'Failed to dismiss recommendation',
      });
    }
  }

  static async getAdminMetrics(req: Request, res: Response) {
    try {
      const { orgId } = extractAiCopilotAuthContext(req);
      const metrics = await AiCopilotService.getAdminMetrics(orgId);
      return res.status(200).json({ success: true, data: metrics });
    } catch (err: any) {
      return res.status(err?.statusCode || 500).json({
        success: false,
        error: err?.code || 'METRICS_ERROR',
        message: err?.message || 'Failed to fetch AI metrics',
      });
    }
  }
}
