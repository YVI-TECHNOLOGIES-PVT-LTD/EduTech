import { Router } from 'express';
import { authenticate } from '../../auth/auth.middleware';
import { AssessmentEngineController } from './controllers/evaluation/AssessmentEngineController';

export const assessmentRouter = Router();
const controller = new AssessmentEngineController();

// Assessment Engine Student/Candidate Endpoints
assessmentRouter.post('/otp/request', authenticate, controller.requestOTP);
assessmentRouter.post('/otp/verify', authenticate, controller.verifyOTP);
assessmentRouter.post('/attempt/start', authenticate, controller.startAttempt);
assessmentRouter.get('/attempt/:attemptId/questions', authenticate, controller.loadQuestions);
assessmentRouter.post('/attempt/:attemptId/autosave', authenticate, controller.autosaveResponses);
assessmentRouter.post('/attempt/telemetry', authenticate, controller.logTelemetryEvent);
assessmentRouter.post('/attempt/heartbeat', authenticate, controller.heartbeat);
assessmentRouter.post('/attempt/:attemptId/submit', authenticate, controller.submitAttempt);
