"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluationRouter = void 0;
const express_1 = require("express");
const EvaluationController_1 = require("./controllers/EvaluationController");
const RubricController_1 = require("./controllers/RubricController");
const ModerationController_1 = require("./controllers/ModerationController");
const RevaluationController_1 = require("./controllers/RevaluationController");
const GradeCalculationController_1 = require("./controllers/GradeCalculationController");
const EvaluationAnalyticsController_1 = require("./controllers/EvaluationAnalyticsController");
const rbac_middleware_1 = require("../../../rbac/rbac.middleware");
exports.evaluationRouter = (0, express_1.Router)();
// ==========================================
// ANALYTICS & METRICS
// ==========================================
exports.evaluationRouter.get('/analytics', (0, rbac_middleware_1.checkPermission)('assessment.evaluation.analytics'), EvaluationAnalyticsController_1.EvaluationAnalyticsController.getMetrics);
// ==========================================
// RUBRICS LIBRARY
// ==========================================
exports.evaluationRouter.get('/rubrics', (0, rbac_middleware_1.checkPermission)('assessment.evaluation.view'), RubricController_1.RubricController.listRubrics);
exports.evaluationRouter.post('/rubrics', (0, rbac_middleware_1.checkPermission)('assessment.evaluation.score'), RubricController_1.RubricController.createRubric);
// ==========================================
// MODERATION QUEUE
// ==========================================
exports.evaluationRouter.get('/moderation', (0, rbac_middleware_1.checkPermission)('assessment.evaluation.moderate'), ModerationController_1.ModerationController.listQueue);
exports.evaluationRouter.post('/moderation/:id/resolve', (0, rbac_middleware_1.checkPermission)('assessment.evaluation.moderate'), ModerationController_1.ModerationController.resolveModeration);
// ==========================================
// REVALUATION FLOW
// ==========================================
exports.evaluationRouter.get('/revaluation', (0, rbac_middleware_1.checkPermission)('assessment.evaluation.view'), RevaluationController_1.RevaluationController.listRequests);
exports.evaluationRouter.post('/revaluation', (0, rbac_middleware_1.checkPermission)('assessment.evaluation.revaluate'), RevaluationController_1.RevaluationController.apply);
exports.evaluationRouter.post('/revaluation/:id/approve', (0, rbac_middleware_1.checkPermission)('assessment.evaluation.revaluate'), RevaluationController_1.RevaluationController.approve);
// ==========================================
// GRADE CALCULATIONS
// ==========================================
exports.evaluationRouter.post('/grades/calculate', (0, rbac_middleware_1.checkPermission)('assessment.evaluation.finalize'), GradeCalculationController_1.GradeCalculationController.calculateGrade);
exports.evaluationRouter.get('/grades/attempt/:attemptId', (0, rbac_middleware_1.checkPermission)('assessment.evaluation.view'), GradeCalculationController_1.GradeCalculationController.getCalculationByAttempt);
// ==========================================
// EVALUATION SESSIONS WORKSPACE
// ==========================================
exports.evaluationRouter.get('/sessions', (0, rbac_middleware_1.checkPermission)('assessment.evaluation.view'), EvaluationController_1.EvaluationController.listSessions);
exports.evaluationRouter.post('/start', (0, rbac_middleware_1.checkPermission)('assessment.evaluation.start'), EvaluationController_1.EvaluationController.startSession);
exports.evaluationRouter.get('/session/:id', (0, rbac_middleware_1.checkPermission)('assessment.evaluation.view'), EvaluationController_1.EvaluationController.getSessionById);
exports.evaluationRouter.post('/session/:id/evaluate', (0, rbac_middleware_1.checkPermission)('assessment.evaluation.score'), EvaluationController_1.EvaluationController.evaluateQuestion);
exports.evaluationRouter.post('/session/:id/workflow/transition', (0, rbac_middleware_1.checkPermission)('assessment.evaluation.finalize'), EvaluationController_1.EvaluationController.transitionWorkflow);
exports.default = exports.evaluationRouter;
