"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRouter = void 0;
const express_1 = require("express");
const AnalyticsController_1 = require("./controllers/AnalyticsController");
const COController_1 = require("./controllers/COController");
const POController_1 = require("./controllers/POController");
const QuestionStatisticsController_1 = require("./controllers/QuestionStatisticsController");
const AccreditationController_1 = require("./controllers/AccreditationController");
const PredictionController_1 = require("./controllers/PredictionController");
const rbac_middleware_1 = require("../../../rbac/rbac.middleware");
exports.analyticsRouter = (0, express_1.Router)();
// ==========================================
// SNAPSHOTS & CACHE WAREHOUSE
// ==========================================
exports.analyticsRouter.post('/snapshots', (0, rbac_middleware_1.checkPermission)('assessment.analytics.manage'), AnalyticsController_1.AnalyticsController.saveSnapshot);
exports.analyticsRouter.get('/snapshots', (0, rbac_middleware_1.checkPermission)('assessment.analytics.view'), AnalyticsController_1.AnalyticsController.listSnapshots);
// ==========================================
// OBE ATTAINMENT METRICS
// ==========================================
exports.analyticsRouter.post('/co/attainment', (0, rbac_middleware_1.checkPermission)('assessment.analytics.manage'), COController_1.COController.calculateAttainment);
exports.analyticsRouter.post('/po/attainment', (0, rbac_middleware_1.checkPermission)('assessment.analytics.manage'), POController_1.POController.calculateAttainment);
// ==========================================
// ITEM STATISTICS
// ==========================================
exports.analyticsRouter.post('/question/stats', (0, rbac_middleware_1.checkPermission)('assessment.analytics.manage'), QuestionStatisticsController_1.QuestionStatisticsController.calculateQuestionStats);
// ==========================================
// ACCREDITATION & BENCHMARKS
// ==========================================
exports.analyticsRouter.post('/accreditation/compile', (0, rbac_middleware_1.checkPermission)('assessment.analytics.accreditation'), AccreditationController_1.AccreditationController.compileReport);
// ==========================================
// PREDICTIVE RISK SCORES
// ==========================================
exports.analyticsRouter.post('/prediction/risk', (0, rbac_middleware_1.checkPermission)('assessment.analytics.prediction'), PredictionController_1.PredictionController.processRiskScore);
exports.default = exports.analyticsRouter;
