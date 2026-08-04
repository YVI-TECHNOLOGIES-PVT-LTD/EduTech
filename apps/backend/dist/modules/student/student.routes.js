"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentRouter = void 0;
const express_1 = require("express");
const rbac_middleware_1 = require("../../rbac/rbac.middleware");
const idempotency_middleware_1 = require("../../middleware/idempotency.middleware");
const index_1 = require("./index");
exports.studentRouter = (0, express_1.Router)();
// 1. Core Student Registrations
exports.studentRouter.post('/', (0, rbac_middleware_1.checkPermission)('student.create'), idempotency_middleware_1.checkIdempotency, index_1.studentController.createStudent);
exports.studentRouter.get('/', (0, rbac_middleware_1.checkPermission)('student.view'), index_1.studentController.listStudents);
exports.studentRouter.get('/:id', (0, rbac_middleware_1.checkPermission)('student.view'), index_1.studentController.getStudent);
// 2. Profile and parent mappings
exports.studentRouter.patch('/:id/profile', (0, rbac_middleware_1.checkPermission)('student.update'), index_1.studentController.updateProfile);
exports.studentRouter.patch('/:id/parents', (0, rbac_middleware_1.checkPermission)('student.update'), index_1.studentController.addParent);
// 3. Class allocation, promotion and transfers
exports.studentRouter.post('/:id/allocate', (0, rbac_middleware_1.checkPermission)('student.create'), idempotency_middleware_1.checkIdempotency, index_1.studentController.allocateClass);
exports.studentRouter.post('/:id/promote', (0, rbac_middleware_1.checkPermission)('student.promote'), idempotency_middleware_1.checkIdempotency, index_1.studentController.promoteStudent);
exports.studentRouter.post('/:id/transfer', (0, rbac_middleware_1.checkPermission)('student.transfer'), idempotency_middleware_1.checkIdempotency, index_1.studentController.requestTransfer);
exports.studentRouter.post('/transfer/approve/:id', (0, rbac_middleware_1.checkPermission)('student.transfer'), idempotency_middleware_1.checkIdempotency, index_1.studentController.approveTransfer);
// 4. Identity cards
exports.studentRouter.post('/:id/id-card', (0, rbac_middleware_1.checkPermission)('student.identity.generate'), idempotency_middleware_1.checkIdempotency, index_1.studentController.generateIdCard);
exports.studentRouter.post('/:id/barcode', (0, rbac_middleware_1.checkPermission)('student.identity.generate'), index_1.studentController.getBarcode);
// 5. Timelines & history
exports.studentRouter.get('/:id/timeline', (0, rbac_middleware_1.checkPermission)('student.view'), index_1.studentController.getTimeline);
exports.studentRouter.get('/:id/history', (0, rbac_middleware_1.checkPermission)('student.view'), index_1.studentController.getHistory);
