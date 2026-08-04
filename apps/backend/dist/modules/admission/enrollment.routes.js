"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrollmentRouter = void 0;
const express_1 = require("express");
const rbac_middleware_1 = require("../../rbac/rbac.middleware");
const permissions_1 = require("../../rbac/permissions");
const idempotency_middleware_1 = require("../../middleware/idempotency.middleware");
const index_1 = require("./index");
exports.enrollmentRouter = (0, express_1.Router)();
// 1. Fee structure setup & waivers
exports.enrollmentRouter.post('/fees/assign', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_FEES_INITIALIZE), idempotency_middleware_1.checkIdempotency, index_1.enrollmentController.assignFeeStructure);
exports.enrollmentRouter.get('/fees/:applicationId', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.APPLICATION_VIEW), index_1.enrollmentController.getFeesSummary);
exports.enrollmentRouter.post('/waivers', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_WAIVER_APPROVE), idempotency_middleware_1.checkIdempotency, index_1.enrollmentController.applyFeeWaiver);
// 2. Payments collection & verification
exports.enrollmentRouter.post('/payments', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.PAYMENT_RECORD), idempotency_middleware_1.checkIdempotency, index_1.enrollmentController.collectPayment);
exports.enrollmentRouter.post('/payments/verify', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.PAYMENT_RECORD), idempotency_middleware_1.checkIdempotency, index_1.enrollmentController.verifyPayment);
exports.enrollmentRouter.get('/payments/:paymentId/receipt', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_RECEIPT_GENERATE), index_1.enrollmentController.getReceipt);
// 3. Confirmations & handover enrollments
exports.enrollmentRouter.post('/confirm', (0, rbac_middleware_1.checkPermission)('admission.confirm.enroll'), idempotency_middleware_1.checkIdempotency, index_1.enrollmentController.confirmAdmission);
exports.enrollmentRouter.post('/enroll', (0, rbac_middleware_1.checkPermission)('admission.confirm.enroll'), idempotency_middleware_1.checkIdempotency, index_1.enrollmentController.enrollStudent);
exports.enrollmentRouter.get('/status/:applicationId', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.APPLICATION_VIEW), index_1.enrollmentController.getEnrollmentStatus);
