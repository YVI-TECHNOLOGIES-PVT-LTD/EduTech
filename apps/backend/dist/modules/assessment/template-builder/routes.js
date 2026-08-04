"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.templateBuilderRouter = void 0;
const express_1 = require("express");
const template_controller_1 = require("./controllers/template.controller");
const TemplateLayoutController_1 = require("./controllers/TemplateLayoutController");
const TemplateWorkflowController_1 = require("./controllers/TemplateWorkflowController");
const TemplateAnalyticsController_1 = require("./controllers/TemplateAnalyticsController");
const TemplateVersionController_1 = require("./controllers/TemplateVersionController");
const rbac_middleware_1 = require("../../../rbac/rbac.middleware");
exports.templateBuilderRouter = (0, express_1.Router)();
// ==========================================
// ANALYTICS & METRICS
// ==========================================
exports.templateBuilderRouter.get('/analytics', (0, rbac_middleware_1.checkPermission)('assessment.template.analytics'), TemplateAnalyticsController_1.TemplateAnalyticsController.getMetrics);
// ==========================================
// TEMPLATE LAYOUT & RENDER
// ==========================================
exports.templateBuilderRouter.post('/:id/layout', (0, rbac_middleware_1.checkPermission)('assessment.template.manage'), TemplateLayoutController_1.TemplateLayoutController.saveLayout);
exports.templateBuilderRouter.get('/:id/preview', (0, rbac_middleware_1.checkPermission)('assessment.template.view'), TemplateLayoutController_1.TemplateLayoutController.getPreview);
// ==========================================
// VALIDATION LOGS PIPELINE
// ==========================================
exports.templateBuilderRouter.get('/:id/validate', (0, rbac_middleware_1.checkPermission)('assessment.template.view'), template_controller_1.TemplateController.validateTemplateRules);
// ==========================================
// VERSIONS ROLLBACK & DIFFS
// ==========================================
exports.templateBuilderRouter.get('/:id/versions', (0, rbac_middleware_1.checkPermission)('assessment.template.view'), TemplateVersionController_1.TemplateVersionController.getHistory);
exports.templateBuilderRouter.post('/:id/versions/restore', (0, rbac_middleware_1.checkPermission)('assessment.template.manage'), TemplateVersionController_1.TemplateVersionController.restoreVersion);
// ==========================================
// STATUS WORKFLOW TRANSITION
// ==========================================
exports.templateBuilderRouter.post('/:id/workflow/transition', (0, rbac_middleware_1.checkPermission)('assessment.template.publish'), TemplateWorkflowController_1.TemplateWorkflowController.transitionTemplate);
// ==========================================
// GENERAL CRUD
// ==========================================
exports.templateBuilderRouter.get('/', (0, rbac_middleware_1.checkPermission)('assessment.template.view'), template_controller_1.TemplateController.listTemplates);
exports.templateBuilderRouter.post('/', (0, rbac_middleware_1.checkPermission)('assessment.template.manage'), template_controller_1.TemplateController.createTemplate);
exports.templateBuilderRouter.get('/:id', (0, rbac_middleware_1.checkPermission)('assessment.template.view'), template_controller_1.TemplateController.getTemplateById);
exports.templateBuilderRouter.put('/:id', (0, rbac_middleware_1.checkPermission)('assessment.template.manage'), template_controller_1.TemplateController.updateTemplate);
exports.templateBuilderRouter.delete('/:id', (0, rbac_middleware_1.checkPermission)('assessment.template.manage'), template_controller_1.TemplateController.deleteTemplate);
exports.templateBuilderRouter.post('/:id/sections', (0, rbac_middleware_1.checkPermission)('assessment.template.manage'), template_controller_1.TemplateController.updateTemplateSections);
exports.templateBuilderRouter.post('/:id/publish', (0, rbac_middleware_1.checkPermission)('assessment.template.publish'), template_controller_1.TemplateController.publishTemplate);
exports.templateBuilderRouter.post('/:id/clone', (0, rbac_middleware_1.checkPermission)('assessment.template.manage'), template_controller_1.TemplateController.cloneTemplate);
exports.default = exports.templateBuilderRouter;
