"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceController = void 0;
const PermissionError_1 = require("../../../admission/errors/PermissionError");
const ControllerErrorHandler_1 = require("../../../admission/controllers/crm/ControllerErrorHandler");
class AttendanceController {
    constructor(attendanceService, sessionService, periodService, leaveService, leaveApprovalService, correctionService, holidayService, workingDayService, biometricSyncService, summaryService, timelineService, reportService, flagService) {
        this.attendanceService = attendanceService;
        this.sessionService = sessionService;
        this.periodService = periodService;
        this.leaveService = leaveService;
        this.leaveApprovalService = leaveApprovalService;
        this.correctionService = correctionService;
        this.holidayService = holidayService;
        this.workingDayService = workingDayService;
        this.biometricSyncService = biometricSyncService;
        this.summaryService = summaryService;
        this.timelineService = timelineService;
        this.reportService = reportService;
        this.flagService = flagService;
        this.getOrCreateSession = async (req, res) => {
            try {
                await this.verifyFlag(req, 'attendance_tracking');
                const { school_id, academic_year_id, grade, section_id, date } = req.body;
                const data = await this.sessionService.getOrCreateSession(school_id, academic_year_id, grade, section_id, new Date(date), req.context?.user?.id || null);
                res.status(201).json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.markAttendance = async (req, res) => {
            try {
                await this.verifyFlag(req, 'attendance_tracking');
                const { session_id, student_id, status, remarks } = req.body;
                const data = await this.attendanceService.markAttendance(session_id, student_id, status, remarks || null, req.context?.user?.id || null, req.headers['x-correlation-id']);
                res.status(201).json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.bulkMark = async (req, res) => {
            try {
                await this.verifyFlag(req, 'attendance_tracking');
                const { session_id, records } = req.body;
                const recordsFormatted = records.map((r) => ({
                    studentId: r.student_id,
                    status: r.status,
                    remarks: r.remarks
                }));
                await this.attendanceService.bulkMark(session_id, recordsFormatted, req.context?.user?.id || null, req.headers['x-correlation-id']);
                res.json({ success: true, message: 'Bulk attendance recorded successfully' });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.markPeriod = async (req, res) => {
            try {
                await this.verifyFlag(req, 'period_attendance');
                const { student_id, academic_year_id, date, period_number, subject_id, status } = req.body;
                const data = await this.periodService.markPeriod(student_id, academic_year_id, new Date(date), period_number, subject_id || null, status, req.context?.user?.id || null);
                res.status(201).json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.submitLeave = async (req, res) => {
            try {
                await this.verifyFlag(req, 'leave_management');
                const { student_id, leave_type_id, start_date, end_date, reason } = req.body;
                const data = await this.leaveService.submitLeave(student_id, leave_type_id, new Date(start_date), new Date(end_date), reason, req.context?.user?.id || null, req.headers['x-correlation-id']);
                res.status(201).json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.approveLeave = async (req, res) => {
            try {
                await this.verifyFlag(req, 'leave_management');
                const { id } = req.params;
                const { remarks } = req.body;
                await this.leaveApprovalService.approveLeave(id, remarks || null, req.context?.user?.id || null, req.headers['x-correlation-id']);
                res.json({ success: true, message: 'Leave request approved successfully' });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.requestCorrection = async (req, res) => {
            try {
                await this.verifyFlag(req, 'attendance_tracking');
                const { attendance_id, requested_status, reason } = req.body;
                const data = await this.correctionService.requestCorrection(attendance_id, requested_status, reason, req.context?.user?.id || null, req.headers['x-correlation-id']);
                res.status(201).json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.approveCorrection = async (req, res) => {
            try {
                await this.verifyFlag(req, 'attendance_tracking');
                const { id } = req.params;
                const role = req.context?.user?.roles?.[0] || 'teacher';
                await this.correctionService.approveCorrection(id, role, req.context?.user?.id || null, req.headers['x-correlation-id']);
                res.json({ success: true, message: 'Correction request approved and attendance updated.' });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.createHoliday = async (req, res) => {
            try {
                await this.verifyFlag(req, 'attendance_tracking');
                const { school_id, holiday_date, name, description } = req.body;
                const data = await this.holidayService.createHoliday(school_id, new Date(holiday_date), name, description || null);
                res.status(201).json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.configureWorkingDays = async (req, res) => {
            try {
                await this.verifyFlag(req, 'attendance_tracking');
                const { school_id, academic_year_id, grade, month, total_working_days } = req.body;
                const data = await this.workingDayService.configureWorkingDays(school_id, academic_year_id, grade, month, total_working_days);
                res.status(201).json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.generateReport = async (req, res) => {
            try {
                await this.verifyFlag(req, 'attendance_analytics');
                const { school_id, academic_year_id, report_type, parameters } = req.body;
                const fileUrl = await this.reportService.generateReport(school_id, academic_year_id, report_type, parameters || {}, req.context?.user?.id || null);
                res.json({ success: true, file_url: fileUrl });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.syncLogs = async (req, res) => {
            try {
                await this.verifyFlag(req, 'biometric_sync');
                const { device_code } = req.body;
                const data = await this.biometricSyncService.syncLogs(device_code);
                res.json({ success: true, records_processed: data });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.getSummary = async (req, res) => {
            try {
                await this.verifyFlag(req, 'attendance_analytics');
                const { studentId } = req.params;
                const { academicYearId, month } = req.query;
                const data = await this.summaryService.calculateMonthlySummary(studentId, academicYearId, Number(month));
                res.json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.getTimeline = async (req, res) => {
            try {
                const { studentId } = req.params;
                const data = await this.timelineService.getTimeline(studentId);
                res.json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
    }
    async verifyFlag(req, key) {
        const schoolId = req.context?.user?.school_id || null;
        const envMode = process.env.NODE_ENV || 'development';
        if (!await this.flagService.isEnabled('student', key, envMode, schoolId)) {
            throw new PermissionError_1.PermissionError(`Feature Disabled: ${key}`);
        }
    }
}
exports.AttendanceController = AttendanceController;
