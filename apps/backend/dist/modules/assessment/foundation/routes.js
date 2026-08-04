"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assessmentCoreRouter = void 0;
const express_1 = require("express");
const AssessmentConfigurationController_1 = require("./controllers/AssessmentConfigurationController");
const WorkflowController_1 = require("./controllers/WorkflowController");
const rbac_middleware_1 = require("../../../rbac/rbac.middleware");
const permissions_1 = require("../../../rbac/permissions");
exports.assessmentCoreRouter = (0, express_1.Router)();
// ==========================================
// ASSESSMENT CONFIGURATIONS ENDPOINTS
// ==========================================
exports.assessmentCoreRouter.get('/configurations', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_CONFIGURATION_VIEW), AssessmentConfigurationController_1.AssessmentConfigurationController.listConfigurations);
exports.assessmentCoreRouter.get('/configurations/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_CONFIGURATION_VIEW), AssessmentConfigurationController_1.AssessmentConfigurationController.getConfiguration);
exports.assessmentCoreRouter.post('/configurations', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_CONFIGURATION_MANAGE), AssessmentConfigurationController_1.AssessmentConfigurationController.createConfiguration);
exports.assessmentCoreRouter.put('/configurations/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_CONFIGURATION_MANAGE), AssessmentConfigurationController_1.AssessmentConfigurationController.updateConfiguration);
exports.assessmentCoreRouter.delete('/configurations/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_CONFIGURATION_MANAGE), AssessmentConfigurationController_1.AssessmentConfigurationController.deleteConfiguration);
exports.assessmentCoreRouter.post('/configurations/clone', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_CONFIGURATION_MANAGE), AssessmentConfigurationController_1.AssessmentConfigurationController.cloneConfiguration);
exports.assessmentCoreRouter.post('/configurations/reset', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_CONFIGURATION_MANAGE), AssessmentConfigurationController_1.AssessmentConfigurationController.resetConfiguration);
exports.assessmentCoreRouter.post('/configurations/validate', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_CONFIGURATION_MANAGE), AssessmentConfigurationController_1.AssessmentConfigurationController.validateConfiguration);
// ==========================================
// WORKFLOW DEFINITIONS ENDPOINTS
// ==========================================
exports.assessmentCoreRouter.get('/workflows', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_WORKFLOW_VIEW), WorkflowController_1.WorkflowController.listWorkflows);
exports.assessmentCoreRouter.get('/workflows/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_WORKFLOW_VIEW), WorkflowController_1.WorkflowController.getWorkflow);
exports.assessmentCoreRouter.post('/workflows', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_WORKFLOW_MANAGE), WorkflowController_1.WorkflowController.createWorkflow);
exports.assessmentCoreRouter.put('/workflows/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_WORKFLOW_MANAGE), WorkflowController_1.WorkflowController.updateWorkflow);
exports.assessmentCoreRouter.delete('/workflows/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_WORKFLOW_MANAGE), WorkflowController_1.WorkflowController.deleteWorkflow);
// ==========================================
// WORKFLOW STEPS ENDPOINTS
// ==========================================
exports.assessmentCoreRouter.get('/workflows/:id/steps', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_WORKFLOW_VIEW), WorkflowController_1.WorkflowController.getSteps);
exports.assessmentCoreRouter.post('/workflows/:id/steps', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_WORKFLOW_MANAGE), WorkflowController_1.WorkflowController.addStep);
exports.assessmentCoreRouter.put('/workflow-steps/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_WORKFLOW_MANAGE), WorkflowController_1.WorkflowController.updateStep);
exports.assessmentCoreRouter.delete('/workflow-steps/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_WORKFLOW_MANAGE), WorkflowController_1.WorkflowController.deleteStep);
// ==========================================
// WORKFLOW TRANSITIONS ENDPOINTS
// ==========================================
exports.assessmentCoreRouter.get('/workflows/:id/transitions', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_WORKFLOW_VIEW), WorkflowController_1.WorkflowController.getTransitions);
exports.assessmentCoreRouter.post('/workflows/:id/transitions', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_WORKFLOW_MANAGE), WorkflowController_1.WorkflowController.addTransition);
exports.assessmentCoreRouter.put('/workflow-transitions/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_WORKFLOW_MANAGE), WorkflowController_1.WorkflowController.updateTransition);
exports.assessmentCoreRouter.delete('/workflow-transitions/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_WORKFLOW_MANAGE), WorkflowController_1.WorkflowController.deleteTransition);
exports.default = exports.assessmentCoreRouter;
