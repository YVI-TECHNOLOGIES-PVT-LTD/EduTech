"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const rbac_middleware_1 = require("../../rbac/rbac.middleware");
const idempotency_middleware_1 = require("../../middleware/idempotency.middleware");
const index_1 = require("./index");
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
exports.documentRouter = (0, express_1.Router)();
// 1. Upload & View & Delete
exports.documentRouter.post('/upload', upload.single('file'), (0, rbac_middleware_1.checkPermission)('admission.document.upload'), idempotency_middleware_1.checkIdempotency, index_1.documentController.upload);
exports.documentRouter.post('/upload/bulk', upload.array('files', 20), (0, rbac_middleware_1.checkPermission)('admission.document.upload'), idempotency_middleware_1.checkIdempotency, index_1.documentController.bulkUpload);
exports.documentRouter.get('/:id', (0, rbac_middleware_1.checkPermission)('admission.document.view'), index_1.documentController.getById);
exports.documentRouter.delete('/:id', (0, rbac_middleware_1.checkPermission)('admission.document.delete'), index_1.documentController.delete);
// 2. Verification Review Status transitions
exports.documentRouter.post('/:id/verify', (0, rbac_middleware_1.checkPermission)('admission.document.verify'), index_1.documentController.verify);
exports.documentRouter.post('/verify/bulk', (0, rbac_middleware_1.checkPermission)('admission.document.verify'), index_1.documentController.bulkVerify);
exports.documentRouter.post('/:id/reject', (0, rbac_middleware_1.checkPermission)('admission.document.verify'), index_1.documentController.reject);
exports.documentRouter.post('/:id/request-correction', (0, rbac_middleware_1.checkPermission)('admission.document.verify'), index_1.documentController.requestCorrection);
// 3. Downloads & Checklists
exports.documentRouter.get('/:id/download-url', (0, rbac_middleware_1.checkPermission)('admission.document.download'), index_1.documentController.getSignedUrl);
exports.documentRouter.get('/:id/versions', (0, rbac_middleware_1.checkPermission)('admission.document.view'), index_1.documentController.getVersions);
exports.documentRouter.post('/:id/restore', (0, rbac_middleware_1.checkPermission)('admission.document.upload'), index_1.documentController.restoreVersion);
exports.documentRouter.get('/checklist/:grade', (0, rbac_middleware_1.checkPermission)('admission.document.checklist'), index_1.documentController.getChecklist);
exports.documentRouter.get('/application/:applicationId', (0, rbac_middleware_1.checkPermission)('admission.document.view'), index_1.documentController.listByApplication);
