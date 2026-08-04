"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assessmentRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../auth/auth.middleware");
const AssessmentEngineController_1 = require("./controllers/evaluation/AssessmentEngineController");
exports.assessmentRouter = (0, express_1.Router)();
const controller = new AssessmentEngineController_1.AssessmentEngineController();
// Assessment Engine Student/Candidate Endpoints
exports.assessmentRouter.post('/otp/request', auth_middleware_1.authenticate, controller.requestOTP);
exports.assessmentRouter.post('/otp/verify', auth_middleware_1.authenticate, controller.verifyOTP);
exports.assessmentRouter.post('/attempt/start', auth_middleware_1.authenticate, controller.startAttempt);
exports.assessmentRouter.get('/attempt/:attemptId/questions', auth_middleware_1.authenticate, controller.loadQuestions);
exports.assessmentRouter.post('/attempt/:attemptId/autosave', auth_middleware_1.authenticate, controller.autosaveResponses);
exports.assessmentRouter.post('/attempt/telemetry', auth_middleware_1.authenticate, controller.logTelemetryEvent);
exports.assessmentRouter.post('/attempt/heartbeat', auth_middleware_1.authenticate, controller.heartbeat);
exports.assessmentRouter.post('/attempt/:attemptId/submit', auth_middleware_1.authenticate, controller.submitAttempt);
