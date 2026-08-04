"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blueprintRouter = void 0;
const express_1 = require("express");
const BlueprintController_1 = require("./controllers/BlueprintController");
const BlueprintWorkflowController_1 = require("./controllers/BlueprintWorkflowController");
const BlueprintAnalyticsController_1 = require("./controllers/BlueprintAnalyticsController");
const BlueprintVersionController_1 = require("./controllers/BlueprintVersionController");
const rbac_middleware_1 = require("../../../rbac/rbac.middleware");
exports.blueprintRouter = (0, express_1.Router)();
// ==========================================
// METRICS & ANALYTICS
// ==========================================
exports.blueprintRouter.get('/analytics', (0, rbac_middleware_1.checkPermission)('assessment.blueprint.analytics'), BlueprintAnalyticsController_1.BlueprintAnalyticsController.getMetrics);
// ==========================================
// RULES VALIDATION (Ad-hoc)
// ==========================================
exports.blueprintRouter.post('/validate', (0, rbac_middleware_1.checkPermission)('assessment.blueprint.view'), BlueprintController_1.BlueprintController.validateBlueprint);
// ==========================================
// HISTORICAL TIMELINES & ROLLBACKS
// ==========================================
exports.blueprintRouter.get('/:id/versions', (0, rbac_middleware_1.checkPermission)('assessment.blueprint.view'), BlueprintVersionController_1.BlueprintVersionController.getHistory);
exports.blueprintRouter.post('/:id/versions/restore', (0, rbac_middleware_1.checkPermission)('assessment.blueprint.update'), BlueprintVersionController_1.BlueprintVersionController.restoreVersion);
// ==========================================
// WORKFLOW LIFECYCLE STATE CHANGE
// ==========================================
exports.blueprintRouter.post('/:id/workflow/transition', (0, rbac_middleware_1.checkPermission)('assessment.blueprint.review'), BlueprintWorkflowController_1.BlueprintWorkflowController.transitionBlueprint);
// ==========================================
// CLONING TRIGGER
// ==========================================
exports.blueprintRouter.post('/:id/clone', (0, rbac_middleware_1.checkPermission)('assessment.blueprint.create'), BlueprintController_1.BlueprintController.cloneBlueprint);
// ==========================================
// CORE CRUD
// ==========================================
exports.blueprintRouter.get('/', (0, rbac_middleware_1.checkPermission)('assessment.blueprint.view'), BlueprintController_1.BlueprintController.listBlueprints);
exports.blueprintRouter.get('/:id', (0, rbac_middleware_1.checkPermission)('assessment.blueprint.view'), BlueprintController_1.BlueprintController.getBlueprintById);
exports.blueprintRouter.post('/', (0, rbac_middleware_1.checkPermission)('assessment.blueprint.create'), BlueprintController_1.BlueprintController.createBlueprint);
exports.blueprintRouter.put('/:id', (0, rbac_middleware_1.checkPermission)('assessment.blueprint.update'), BlueprintController_1.BlueprintController.updateBlueprint);
exports.blueprintRouter.delete('/:id', (0, rbac_middleware_1.checkPermission)('assessment.blueprint.delete'), BlueprintController_1.BlueprintController.deleteBlueprint);
exports.default = exports.blueprintRouter;
