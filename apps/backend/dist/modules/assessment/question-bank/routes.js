"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.questionBankRouter = void 0;
const express_1 = require("express");
const question_controller_1 = require("./controllers/question.controller");
const FolderController_1 = require("./controllers/FolderController");
const WorkflowController_1 = require("./controllers/WorkflowController");
const AssetController_1 = require("./controllers/AssetController");
const SearchController_1 = require("./controllers/SearchController");
const ImportController_1 = require("./controllers/ImportController");
const VersionController_1 = require("./controllers/VersionController");
const rbac_middleware_1 = require("../../../rbac/rbac.middleware");
const permissions_1 = require("../../../rbac/permissions");
exports.questionBankRouter = (0, express_1.Router)();
// ==========================================
// SEARCH ENDPOINT
// ==========================================
exports.questionBankRouter.get('/search', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_QUESTION_VIEW), SearchController_1.SearchController.searchQuestions);
// ==========================================
// FOLDERS ROUTING
// ==========================================
exports.questionBankRouter.get('/folders', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_QUESTION_VIEW), FolderController_1.FolderController.listFolders);
exports.questionBankRouter.get('/folders/stats', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_QUESTION_VIEW), FolderController_1.FolderController.getFolderStatistics);
exports.questionBankRouter.post('/folders', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_FOLDER_MANAGE), FolderController_1.FolderController.createFolder);
exports.questionBankRouter.put('/folders/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_FOLDER_MANAGE), FolderController_1.FolderController.updateFolder);
exports.questionBankRouter.delete('/folders/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_FOLDER_MANAGE), FolderController_1.FolderController.deleteFolder);
exports.questionBankRouter.post('/folders/move', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_FOLDER_MANAGE), FolderController_1.FolderController.bulkMoveQuestions);
exports.questionBankRouter.post('/folders/copy', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_FOLDER_MANAGE), FolderController_1.FolderController.bulkCopyQuestions);
// ==========================================
// BATCH BULK INGESTION
// ==========================================
exports.questionBankRouter.post('/import', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_QUESTION_IMPORT), ImportController_1.ImportController.importCsv);
// ==========================================
// QUESTION ASSETS ROUTING
// ==========================================
exports.questionBankRouter.post('/assets', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_ASSET_UPLOAD), AssetController_1.AssetController.uploadAsset);
exports.questionBankRouter.post('/assets/link', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_ASSET_UPLOAD), AssetController_1.AssetController.linkAsset);
exports.questionBankRouter.post('/assets/unlink', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_ASSET_UPLOAD), AssetController_1.AssetController.unlinkAsset);
exports.questionBankRouter.get('/:id/assets', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_QUESTION_VIEW), AssetController_1.AssetController.getQuestionAssets);
exports.questionBankRouter.delete('/assets/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_ASSET_DELETE), AssetController_1.AssetController.deleteAsset);
// ==========================================
// QUESTION VERSIONS ROUTING
// ==========================================
exports.questionBankRouter.get('/:id/versions', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_QUESTION_VIEW), VersionController_1.VersionController.getVersionsHistory);
exports.questionBankRouter.post('/:id/versions/restore', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_QUESTION_UPDATE), VersionController_1.VersionController.restoreVersion);
// ==========================================
// WORKFLOW LIFECYCLE TRANSITION
// ==========================================
exports.questionBankRouter.post('/:id/workflow/transition', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_QUESTION_REVIEW), WorkflowController_1.WorkflowController.transitionQuestion);
// ==========================================
// QUESTIONS GENERAL CRUD
// ==========================================
exports.questionBankRouter.get('/', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_QUESTION_VIEW), question_controller_1.QuestionController.listQuestions);
exports.questionBankRouter.get('/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_QUESTION_VIEW), question_controller_1.QuestionController.getQuestionById);
exports.questionBankRouter.post('/', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_QUESTION_CREATE), question_controller_1.QuestionController.createQuestion);
exports.questionBankRouter.put('/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_QUESTION_UPDATE), question_controller_1.QuestionController.updateQuestion);
exports.questionBankRouter.delete('/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ASSESSMENT_QUESTION_DELETE), question_controller_1.QuestionController.deleteQuestion);
exports.default = exports.questionBankRouter;
