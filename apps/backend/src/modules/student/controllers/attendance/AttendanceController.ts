import { Request, Response } from 'express';
import { AttendanceService } from '../../services/attendance/AttendanceService';
import { AttendanceSessionService } from '../../services/attendance/AttendanceSessionService';
import { PeriodAttendanceService } from '../../services/attendance/PeriodAttendanceService';
import { LeaveService } from '../../services/attendance/LeaveService';
import { LeaveApprovalService } from '../../services/attendance/LeaveApprovalService';
import { AttendanceCorrectionService } from '../../services/attendance/AttendanceCorrectionService';
import { HolidayService } from '../../services/attendance/HolidayService';
import { WorkingDayService } from '../../services/attendance/WorkingDayService';
import { BiometricSyncService } from '../../services/attendance/BiometricSyncService';
import { AttendanceSummaryService } from '../../services/attendance/AttendanceSummaryService';
import { AttendanceTimelineService } from '../../services/attendance/AttendanceTimelineService';
import { AttendanceReportService } from '../../services/attendance/AttendanceReportService';
import { FeatureFlagService } from '../../../admission/services/FeatureFlagService';
import { PermissionError } from '../../../admission/errors/PermissionError';
import { handleControllerError } from '../../../admission/controllers/crm/ControllerErrorHandler';

export class AttendanceController {
    constructor(
        private readonly attendanceService: AttendanceService,
        private readonly sessionService: AttendanceSessionService,
        private readonly periodService: PeriodAttendanceService,
        private readonly leaveService: LeaveService,
        private readonly leaveApprovalService: LeaveApprovalService,
        private readonly correctionService: AttendanceCorrectionService,
        private readonly holidayService: HolidayService,
        private readonly workingDayService: WorkingDayService,
        private readonly biometricSyncService: BiometricSyncService,
        private readonly summaryService: AttendanceSummaryService,
        private readonly timelineService: AttendanceTimelineService,
        private readonly reportService: AttendanceReportService,
        private readonly flagService: FeatureFlagService
    ) {}

    private async verifyFlag(req: Request, key: string) {
        const schoolId = req.context?.user?.school_id || null;
        const envMode = process.env.NODE_ENV || 'development';
        if (!await this.flagService.isEnabled('student', key, envMode, schoolId)) {
            throw new PermissionError(`Feature Disabled: ${key}`);
        }
    }

    public getOrCreateSession = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'attendance_tracking');
            const { school_id, academic_year_id, grade, section_id, date } = req.body;
            const data = await this.sessionService.getOrCreateSession(
                school_id,
                academic_year_id,
                grade,
                section_id,
                new Date(date),
                req.context?.user?.id || null
            );
            res.status(201).json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public markAttendance = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'attendance_tracking');
            const { session_id, student_id, status, remarks } = req.body;
            const data = await this.attendanceService.markAttendance(
                session_id,
                student_id,
                status,
                remarks || null,
                req.context?.user?.id || null,
                req.headers['x-correlation-id'] as string
            );
            res.status(201).json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public bulkMark = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'attendance_tracking');
            const { session_id, records } = req.body;
            const recordsFormatted = records.map((r: any) => ({
                studentId: r.student_id,
                status: r.status,
                remarks: r.remarks
            }));
            await this.attendanceService.bulkMark(
                session_id,
                recordsFormatted,
                req.context?.user?.id || null,
                req.headers['x-correlation-id'] as string
            );
            res.json({ success: true, message: 'Bulk attendance recorded successfully' });
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public markPeriod = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'period_attendance');
            const { student_id, academic_year_id, date, period_number, subject_id, status } = req.body;
            const data = await this.periodService.markPeriod(
                student_id,
                academic_year_id,
                new Date(date),
                period_number,
                subject_id || null,
                status,
                req.context?.user?.id || null
            );
            res.status(201).json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public submitLeave = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'leave_management');
            const { student_id, leave_type_id, start_date, end_date, reason } = req.body;
            const data = await this.leaveService.submitLeave(
                student_id,
                leave_type_id,
                new Date(start_date),
                new Date(end_date),
                reason,
                req.context?.user?.id || null,
                req.headers['x-correlation-id'] as string
            );
            res.status(201).json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public approveLeave = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'leave_management');
            const { id } = req.params;
            const { remarks } = req.body;
            await this.leaveApprovalService.approveLeave(
                id,
                remarks || null,
                req.context?.user?.id || null,
                req.headers['x-correlation-id'] as string
            );
            res.json({ success: true, message: 'Leave request approved successfully' });
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public requestCorrection = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'attendance_tracking');
            const { attendance_id, requested_status, reason } = req.body;
            const data = await this.correctionService.requestCorrection(
                attendance_id,
                requested_status,
                reason,
                req.context?.user?.id || null,
                req.headers['x-correlation-id'] as string
            );
            res.status(201).json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public approveCorrection = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'attendance_tracking');
            const { id } = req.params;
            const role = req.context?.user?.roles?.[0] || 'teacher';
            await this.correctionService.approveCorrection(
                id,
                role,
                req.context?.user?.id || null,
                req.headers['x-correlation-id'] as string
            );
            res.json({ success: true, message: 'Correction request approved and attendance updated.' });
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public createHoliday = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'attendance_tracking');
            const { school_id, holiday_date, name, description } = req.body;
            const data = await this.holidayService.createHoliday(
                school_id,
                new Date(holiday_date),
                name,
                description || null
            );
            res.status(201).json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public configureWorkingDays = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'attendance_tracking');
            const { school_id, academic_year_id, grade, month, total_working_days } = req.body;
            const data = await this.workingDayService.configureWorkingDays(
                school_id,
                academic_year_id,
                grade,
                month,
                total_working_days
            );
            res.status(201).json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public generateReport = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'attendance_analytics');
            const { school_id, academic_year_id, report_type, parameters } = req.body;
            const fileUrl = await this.reportService.generateReport(
                school_id,
                academic_year_id,
                report_type,
                parameters || {},
                req.context?.user?.id || null
            );
            res.json({ success: true, file_url: fileUrl });
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public syncLogs = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'biometric_sync');
            const { device_code } = req.body;
            const data = await this.biometricSyncService.syncLogs(device_code);
            res.json({ success: true, records_processed: data });
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public getSummary = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'attendance_analytics');
            const { studentId } = req.params;
            const { academicYearId, month } = req.query;
            const data = await this.summaryService.calculateMonthlySummary(
                studentId,
                academicYearId as string,
                Number(month)
            );
            res.json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public getTimeline = async (req: Request, res: Response) => {
        try {
            const { studentId } = req.params;
            const data = await this.timelineService.getTimeline(studentId);
            res.json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };
}
