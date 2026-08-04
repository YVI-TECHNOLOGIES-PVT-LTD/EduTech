"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paperGeneratorRouter = void 0;
const express_1 = require("express");
const PaperController_1 = require("./controllers/PaperController");
const PaperWorkflowController_1 = require("./controllers/PaperWorkflowController");
const PaperValidationController_1 = require("./controllers/PaperValidationController");
const PaperVersionController_1 = require("./controllers/PaperVersionController");
const PaperStatisticsController_1 = require("./controllers/PaperStatisticsController");
const PaperExportController_1 = require("./controllers/PaperExportController");
const GenerationJobController_1 = require("./controllers/GenerationJobController");
const rbac_middleware_1 = require("../../../rbac/rbac.middleware");
exports.paperGeneratorRouter = (0, express_1.Router)();
// ==========================================
// ANALYTICS & JOBS QUEUE
// ==========================================
exports.paperGeneratorRouter.get('/analytics', (0, rbac_middleware_1.checkPermission)('assessment.paper.analytics'), PaperStatisticsController_1.PaperStatisticsController.getMetrics);
exports.paperGeneratorRouter.get('/jobs', (0, rbac_middleware_1.checkPermission)('assessment.paper.generate'), GenerationJobController_1.GenerationJobController.listJobs);
exports.paperGeneratorRouter.post('/jobs', (0, rbac_middleware_1.checkPermission)('assessment.paper.generate'), GenerationJobController_1.GenerationJobController.createJob);
// ==========================================
// VALIDATION & WORKFLOW
// ==========================================
exports.paperGeneratorRouter.post('/:id/validate', (0, rbac_middleware_1.checkPermission)('assessment.paper.validate'), PaperValidationController_1.PaperValidationController.validatePaper);
exports.paperGeneratorRouter.post('/:id/workflow/transition', (0, rbac_middleware_1.checkPermission)('assessment.paper.publish'), PaperWorkflowController_1.PaperWorkflowController.transitionStatus);
// ==========================================
// EXPORTS & VERSIONS
// ==========================================
exports.paperGeneratorRouter.post('/:id/export', (0, rbac_middleware_1.checkPermission)('assessment.paper.export'), PaperExportController_1.PaperExportController.exportPaper);
exports.paperGeneratorRouter.get('/:id/versions', (0, rbac_middleware_1.checkPermission)('assessment.paper.preview'), PaperVersionController_1.PaperVersionController.getHistory);
// ==========================================
// CRUD OPERATIONS
// ==========================================
exports.paperGeneratorRouter.get('/', (0, rbac_middleware_1.checkPermission)('assessment.paper.preview'), PaperController_1.PaperController.listPapers);
exports.paperGeneratorRouter.post('/', (0, rbac_middleware_1.checkPermission)('assessment.paper.generate'), PaperController_1.PaperController.createPaper);
exports.paperGeneratorRouter.get('/:id', (0, rbac_middleware_1.checkPermission)('assessment.paper.preview'), PaperController_1.PaperController.getPaperById);
exports.paperGeneratorRouter.delete('/:id', (0, rbac_middleware_1.checkPermission)('assessment.paper.generate'), PaperController_1.PaperController.deletePaper);
exports.default = exports.paperGeneratorRouter;
