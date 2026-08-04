"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attendanceRouter = void 0;
const express_1 = require("express");
const rbac_middleware_1 = require("../../rbac/rbac.middleware");
const idempotency_middleware_1 = require("../../middleware/idempotency.middleware");
const index_1 = require("./index");
exports.attendanceRouter = (0, express_1.Router)();
// 1. Sessions and Marks
exports.attendanceRouter.post('/session', (0, rbac_middleware_1.checkPermission)('attendance.mark'), idempotency_middleware_1.checkIdempotency, index_1.attendanceController.getOrCreateSession);
exports.attendanceRouter.post('/daily/mark', (0, rbac_middleware_1.checkPermission)('attendance.mark'), idempotency_middleware_1.checkIdempotency, index_1.attendanceController.markAttendance);
exports.attendanceRouter.post('/daily/bulk', (0, rbac_middleware_1.checkPermission)('attendance.mark'), idempotency_middleware_1.checkIdempotency, index_1.attendanceController.bulkMark);
exports.attendanceRouter.post('/period/mark', (0, rbac_middleware_1.checkPermission)('attendance.mark'), idempotency_middleware_1.checkIdempotency, index_1.attendanceController.markPeriod);
// 2. Leaves requests and approvals
exports.attendanceRouter.post('/leave/submit', (0, rbac_middleware_1.checkPermission)('attendance.leave.apply'), idempotency_middleware_1.checkIdempotency, index_1.attendanceController.submitLeave);
exports.attendanceRouter.post('/leave/approve/:id', (0, rbac_middleware_1.checkPermission)('attendance.leave.approve'), idempotency_middleware_1.checkIdempotency, index_1.attendanceController.approveLeave);
// 3. Corrections
exports.attendanceRouter.post('/correction/request', (0, rbac_middleware_1.checkPermission)('attendance.mark'), idempotency_middleware_1.checkIdempotency, index_1.attendanceController.requestCorrection);
exports.attendanceRouter.post('/correction/approve/:id', (0, rbac_middleware_1.checkPermission)('attendance.correction.approve'), idempotency_middleware_1.checkIdempotency, index_1.attendanceController.approveCorrection);
// 4. Holidays and Calendar configs
exports.attendanceRouter.post('/holiday', (0, rbac_middleware_1.checkPermission)('attendance.mark'), idempotency_middleware_1.checkIdempotency, index_1.attendanceController.createHoliday);
exports.attendanceRouter.post('/working-days', (0, rbac_middleware_1.checkPermission)('attendance.mark'), idempotency_middleware_1.checkIdempotency, index_1.attendanceController.configureWorkingDays);
// 5. Reports, summaries, biometric syncs
exports.attendanceRouter.post('/report/generate', (0, rbac_middleware_1.checkPermission)('attendance.verify'), idempotency_middleware_1.checkIdempotency, index_1.attendanceController.generateReport);
exports.attendanceRouter.post('/biometric/sync', (0, rbac_middleware_1.checkPermission)('attendance.sync'), idempotency_middleware_1.checkIdempotency, index_1.attendanceController.syncLogs);
exports.attendanceRouter.get('/summary/:studentId', (0, rbac_middleware_1.checkPermission)('attendance.verify'), index_1.attendanceController.getSummary);
exports.attendanceRouter.get('/timeline/:studentId', (0, rbac_middleware_1.checkPermission)('attendance.verify'), index_1.attendanceController.getTimeline);
