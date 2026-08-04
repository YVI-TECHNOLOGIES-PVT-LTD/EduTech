"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enterpriseAttendanceRouter = void 0;
const express_1 = require("express");
const AttendanceSessionController_1 = require("./controllers/AttendanceSessionController");
const AttendanceCaptureController_1 = require("./controllers/AttendanceCaptureController");
const AttendanceWorkflowController_1 = require("./controllers/AttendanceWorkflowController");
const LeaveManagementController_1 = require("./controllers/LeaveManagementController");
const rbac_middleware_1 = require("../../rbac/rbac.middleware");
exports.enterpriseAttendanceRouter = (0, express_1.Router)();
// ==========================================
// ATTENDANCE SESSIONS
// ==========================================
exports.enterpriseAttendanceRouter.get('/sessions', (0, rbac_middleware_1.checkPermission)('attendance.view'), AttendanceSessionController_1.AttendanceSessionController.listSessions);
exports.enterpriseAttendanceRouter.post('/sessions', (0, rbac_middleware_1.checkPermission)('attendance.manage'), AttendanceSessionController_1.AttendanceSessionController.createSession);
// ==========================================
// CAPTURE CHECKINS
// ==========================================
exports.enterpriseAttendanceRouter.post('/mark', (0, rbac_middleware_1.checkPermission)('attendance.mark'), AttendanceCaptureController_1.AttendanceCaptureController.markStudent);
// ==========================================
// HOD APPROVALS
// ==========================================
exports.enterpriseAttendanceRouter.post('/workflow', (0, rbac_middleware_1.checkPermission)('attendance.manage'), AttendanceWorkflowController_1.AttendanceWorkflowController.transitionSession);
// ==========================================
// LEAVE SCHEDULING
// ==========================================
exports.enterpriseAttendanceRouter.post('/leave', (0, rbac_middleware_1.checkPermission)('attendance.leave'), LeaveManagementController_1.LeaveManagementController.submitLeave);
exports.enterpriseAttendanceRouter.post('/leave/approve', (0, rbac_middleware_1.checkPermission)('attendance.leave'), LeaveManagementController_1.LeaveManagementController.approveLeave);
exports.default = exports.enterpriseAttendanceRouter;
