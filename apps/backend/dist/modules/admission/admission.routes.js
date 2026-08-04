"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.admissionRouter = void 0;
const express_1 = require("express");
const admission_controller_1 = require("./admission.controller");
const rbac_middleware_1 = require("../../rbac/rbac.middleware");
const permissions_1 = require("../../rbac/permissions");
exports.admissionRouter = (0, express_1.Router)();
// PUBLIC Admission Routes (No Auth required)
exports.admissionRouter.post('/public-apply', admission_controller_1.AdmissionController.publicApply);
// PROTECTED Admission Routes (Auth required)
// PARENT ROUTES
exports.admissionRouter.post('/', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_CREATE), admission_controller_1.AdmissionController.create);
exports.admissionRouter.put('/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_CREATE), // Shared permission for draft edits
admission_controller_1.AdmissionController.update);
exports.admissionRouter.post('/:id/submit', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_CREATE), admission_controller_1.AdmissionController.submit);
// SHARED LIST/DETAILS
exports.admissionRouter.get('/stats', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_REVIEW), admission_controller_1.AdmissionController.getStats);
exports.admissionRouter.get('/', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_VIEW_SELF), // Both Parent and Staff can call, controller handles filtering
admission_controller_1.AdmissionController.list);
exports.admissionRouter.get('/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_VIEW_SELF), admission_controller_1.AdmissionController.getById);
// STAFF REVIEW ROUTES
exports.admissionRouter.post('/:id/review', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_REVIEW), admission_controller_1.AdmissionController.review);
exports.admissionRouter.post('/:id/verify-docs', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_REVIEW), admission_controller_1.AdmissionController.verifyDocs);
exports.admissionRouter.post('/:id/initiate-payment', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_REVIEW), admission_controller_1.AdmissionController.initiatePayment);
exports.admissionRouter.post('/:id/billing', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_REVIEW), admission_controller_1.AdmissionController.initializeBilling);
exports.admissionRouter.post('/:id/recommend', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_RECOMMEND), admission_controller_1.AdmissionController.recommend);
exports.admissionRouter.post('/:id/approve', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_APPROVE), admission_controller_1.AdmissionController.approve);
exports.admissionRouter.post('/:id/reject', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_REJECT), admission_controller_1.AdmissionController.reject);
exports.admissionRouter.post('/:id/enrol', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_ENROL), admission_controller_1.AdmissionController.enrol);
exports.admissionRouter.post('/:id/decide-login', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_APPROVE), // Reusing APPROVE permission or could be a new one
admission_controller_1.AdmissionController.decideLogin);
// PAYMENT ROUTES (Parent)
exports.admissionRouter.post('/:id/pay', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_CREATE), admission_controller_1.AdmissionController.makePayment);
// FINANCE ROUTES
exports.admissionRouter.post('/:id/verify-fee', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_APPROVE), // Assuming Finance shares or needs specific perm
admission_controller_1.AdmissionController.verifyFee);
// DOCUMENT ROUTES
exports.admissionRouter.post('/:id/documents', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_CREATE), admission_controller_1.AdmissionController.uploadDoc);
