"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applicationRouter = void 0;
const express_1 = require("express");
const rbac_middleware_1 = require("../../rbac/rbac.middleware");
const permissions_1 = require("../../rbac/permissions");
const idempotency_middleware_1 = require("../../middleware/idempotency.middleware");
const index_1 = require("./index");
exports.applicationRouter = (0, express_1.Router)();
// Parent portal — must be registered before /:id
exports.applicationRouter.get('/my', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_VIEW_SELF), index_1.applicationController.listMine);
exports.applicationRouter.get('/stats', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_VIEW_ALL), index_1.applicationController.getStats);
exports.applicationRouter.get('/', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_VIEW_ALL), index_1.applicationController.list);
// 1. Core Create & View
exports.applicationRouter.post('/', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.APPLICATION_CREATE), idempotency_middleware_1.checkIdempotency, index_1.applicationController.create);
exports.applicationRouter.get('/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.APPLICATION_VIEW), index_1.applicationController.resume);
// 2. Incremental PATCH Draft Sections
exports.applicationRouter.patch('/:id/profile', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.APPLICATION_UPDATE), index_1.applicationController.patchProfile);
exports.applicationRouter.patch('/:id/parents', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.APPLICATION_UPDATE), index_1.applicationController.patchParents);
exports.applicationRouter.patch('/:id/education', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.APPLICATION_UPDATE), index_1.applicationController.patchEducation);
exports.applicationRouter.patch('/:id/preferences', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.APPLICATION_UPDATE), index_1.applicationController.patchPreferences);
exports.applicationRouter.patch('/:id/declaration', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.APPLICATION_UPDATE), index_1.applicationController.patchDeclaration);
// 3. Submit & Timeline
exports.applicationRouter.post('/:id/submit', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.APPLICATION_SUBMIT), idempotency_middleware_1.checkIdempotency, index_1.applicationController.submit);
exports.applicationRouter.get('/:id/progress', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.APPLICATION_VIEW), index_1.applicationController.getProgress);
exports.applicationRouter.get('/:id/timeline', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.APPLICATION_VIEW), index_1.applicationController.getTimeline);
// 4. State Transition & Soft Delete
exports.applicationRouter.post('/:id/transition', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.APPLICATION_UPDATE), index_1.applicationController.transition);
exports.applicationRouter.post('/:id/review', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_REVIEW), index_1.applicationController.review);
exports.applicationRouter.post('/:id/approve', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_APPROVE), index_1.applicationController.approve);
exports.applicationRouter.post('/:id/reject', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_REJECT), index_1.applicationController.reject);
exports.applicationRouter.post('/:id/verify-docs', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_REVIEW), index_1.applicationController.verifyDocuments);
exports.applicationRouter.delete('/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.APPLICATION_DELETE), index_1.applicationController.deleteDraft);
