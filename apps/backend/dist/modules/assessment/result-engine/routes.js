"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resultEngineRouter = void 0;
const express_1 = require("express");
const ResultController_1 = require("./controllers/ResultController");
const PublicationController_1 = require("./controllers/PublicationController");
const RankingController_1 = require("./controllers/RankingController");
const PromotionController_1 = require("./controllers/PromotionController");
const WorkflowController_1 = require("./controllers/WorkflowController");
const rbac_middleware_1 = require("../../../rbac/rbac.middleware");
exports.resultEngineRouter = (0, express_1.Router)();
// ==========================================
// RESULT SESSIONS CALCULATIONS
// ==========================================
exports.resultEngineRouter.get('/sessions', (0, rbac_middleware_1.checkPermission)('assessment.result.view'), ResultController_1.ResultController.listSessions);
exports.resultEngineRouter.post('/sessions', (0, rbac_middleware_1.checkPermission)('assessment.result.calculate'), ResultController_1.ResultController.createSession);
exports.resultEngineRouter.post('/calculate', (0, rbac_middleware_1.checkPermission)('assessment.result.calculate'), ResultController_1.ResultController.calculateResults);
// ==========================================
// WORKFLOW APPROVALS & SNAPSHOTS
// ==========================================
exports.resultEngineRouter.post('/session/:id/workflow/transition', (0, rbac_middleware_1.checkPermission)('assessment.result.verify'), WorkflowController_1.WorkflowController.transitionStatus);
exports.resultEngineRouter.post('/session/:id/publish', (0, rbac_middleware_1.checkPermission)('assessment.result.publish'), PublicationController_1.PublicationController.publishResults);
// ==========================================
// COHORT MERIT RANKINGS
// ==========================================
exports.resultEngineRouter.post('/rankings/calculate', (0, rbac_middleware_1.checkPermission)('assessment.result.statistics'), RankingController_1.RankingController.calculateRankings);
// ==========================================
// STUDENT PROMOTIONS ENGINE
// ==========================================
exports.resultEngineRouter.post('/promotions/process', (0, rbac_middleware_1.checkPermission)('assessment.result.promotion'), PromotionController_1.PromotionController.processPromotion);
exports.default = exports.resultEngineRouter;
