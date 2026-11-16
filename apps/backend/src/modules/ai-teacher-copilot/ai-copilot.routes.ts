import { Router } from 'express';
import { AiCopilotController } from './ai-copilot.controller';
import { AiCopilotPolicy } from './ai-copilot.policy';

export const aiCopilotRouter: Router = Router();

// ─── PUBLIC / GENERAL STATUS ───────────────────────────────────────────────
aiCopilotRouter.get('/status', AiCopilotController.getStatus);

// ─── TEACHER COPILOT ROUTES ────────────────────────────────────────────────
const teacherRouter = Router();
teacherRouter.use(AiCopilotPolicy.requireTeacherRole());

teacherRouter.get('/context', AiCopilotController.getTeacherContext);
teacherRouter.get('/status', AiCopilotController.getStatus);

// 1. Lesson Planning
teacherRouter.post('/lesson-plans/generate', AiCopilotController.generateLessonPlan);

// 2. Teaching Materials
teacherRouter.post('/teaching-materials/generate', AiCopilotController.generateTeachingMaterial);
teacherRouter.get('/materials', AiCopilotController.listTeacherMaterials);
teacherRouter.post('/materials/approve', AiCopilotController.approveMaterial);

// 3. Assessments & Questions
teacherRouter.post('/assessments/generate', AiCopilotController.generateAssessment);
teacherRouter.post('/questions/generate', AiCopilotController.generateQuestions);

// 4. Learning Activities Integration
teacherRouter.post('/activities/homework/generate', AiCopilotController.generateHomework);
teacherRouter.post('/activities/project/generate', AiCopilotController.generateProject);

// 5. Performance Intelligence & Remedial
teacherRouter.post('/performance/analyze', AiCopilotController.analyzePerformance);
teacherRouter.post('/learning-gaps/analyze', AiCopilotController.analyzeLearningGaps);
teacherRouter.post('/remedial-plans/generate', AiCopilotController.generateRemedialPlan);
teacherRouter.post('/recommendations/dismiss', AiCopilotController.dismissRecommendation);

// 6. Feedback & Parent Communication
teacherRouter.post('/feedback/draft', AiCopilotController.draftFeedback);
teacherRouter.post('/parent-communications/draft', AiCopilotController.draftParentCommunication);

aiCopilotRouter.use('/teacher', teacherRouter);

// ─── STUDENT STUDY ASSISTANT ROUTES (CONTROLLED) ───────────────────────────
const studentRouter = Router();
studentRouter.use(AiCopilotPolicy.requireStudentRole());
studentRouter.post('/study-assistant/respond', AiCopilotController.respondStudentStudyAssistant);

aiCopilotRouter.use('/student', studentRouter);

// ─── ADMIN OVERSIGHT & METRICS ─────────────────────────────────────────────
const adminRouter = Router();
adminRouter.use(AiCopilotPolicy.requireAdminRole());
adminRouter.get('/usage', AiCopilotController.getAdminMetrics);
adminRouter.get('/health', AiCopilotController.getAdminMetrics);

aiCopilotRouter.use('/admin', adminRouter);

export default aiCopilotRouter;
