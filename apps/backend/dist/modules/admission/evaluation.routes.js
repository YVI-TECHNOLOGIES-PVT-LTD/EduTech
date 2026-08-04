"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluationRouter = void 0;
const express_1 = require("express");
const rbac_middleware_1 = require("../../rbac/rbac.middleware");
const idempotency_middleware_1 = require("../../middleware/idempotency.middleware");
const index_1 = require("./index");
exports.evaluationRouter = (0, express_1.Router)();
// 1. Exams Templates & Schedule Allocations
exports.evaluationRouter.post('/exam/template', (0, rbac_middleware_1.checkPermission)('admission.exam.manage'), idempotency_middleware_1.checkIdempotency, index_1.evaluationController.createTemplate);
exports.evaluationRouter.post('/exam/schedule', (0, rbac_middleware_1.checkPermission)('admission.exam.manage'), idempotency_middleware_1.checkIdempotency, index_1.evaluationController.scheduleExam);
exports.evaluationRouter.post('/exam/allocate', (0, rbac_middleware_1.checkPermission)('admission.exam.manage'), idempotency_middleware_1.checkIdempotency, index_1.evaluationController.allocateCandidate);
// 2. Exam Attendance & Marks published
exports.evaluationRouter.post('/exam/attendance', (0, rbac_middleware_1.checkPermission)('admission.exam.evaluate'), idempotency_middleware_1.checkIdempotency, index_1.evaluationController.recordAttendance);
exports.evaluationRouter.post('/exam/result', (0, rbac_middleware_1.checkPermission)('admission.exam.evaluate'), idempotency_middleware_1.checkIdempotency, index_1.evaluationController.recordMarks);
exports.evaluationRouter.get('/exam/results/:id', (0, rbac_middleware_1.checkPermission)('admission.exam.evaluate'), index_1.evaluationController.getExamResults);
// 3. Interview Schedule & Criteria Scoring
exports.evaluationRouter.post('/interview/schedule', (0, rbac_middleware_1.checkPermission)('admission.interview.manage'), idempotency_middleware_1.checkIdempotency, index_1.evaluationController.scheduleInterview);
exports.evaluationRouter.post('/interview/result', (0, rbac_middleware_1.checkPermission)('admission.interview.evaluate'), idempotency_middleware_1.checkIdempotency, index_1.evaluationController.recordInterviewScore);
// 4. Merit Engine Rank selections
exports.evaluationRouter.post('/merit/generate', (0, rbac_middleware_1.checkPermission)('admission.merit.generate'), idempotency_middleware_1.checkIdempotency, index_1.evaluationController.generateMeritList);
exports.evaluationRouter.get('/merit/:applicationId', (0, rbac_middleware_1.checkPermission)('admission.merit.generate'), index_1.evaluationController.getMeritList);
// 5. Offer Letter dispatch Accept & Declines
exports.evaluationRouter.post('/offer/generate', (0, rbac_middleware_1.checkPermission)('admission.offer.manage'), idempotency_middleware_1.checkIdempotency, index_1.evaluationController.generateOffer);
exports.evaluationRouter.post('/offer/send', (0, rbac_middleware_1.checkPermission)('admission.offer.manage'), idempotency_middleware_1.checkIdempotency, index_1.evaluationController.sendOffer);
exports.evaluationRouter.post('/offer/accept', index_1.evaluationController.acceptOffer);
exports.evaluationRouter.post('/offer/reject', index_1.evaluationController.rejectOffer);
// 6. Enrichment timeline
exports.evaluationRouter.get('/timeline/:applicationId', index_1.evaluationController.getTimeline);
