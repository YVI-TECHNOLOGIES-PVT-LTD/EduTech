"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attendanceReportSchema = exports.holidaySchema = exports.attendanceCorrectionSchema = exports.approveLeaveSchema = exports.submitLeaveSchema = exports.markPeriodAttendanceSchema = exports.bulkAttendanceSchema = exports.markAttendanceSchema = void 0;
const zod_1 = require("zod");
exports.markAttendanceSchema = zod_1.z.object({
    student_id: zod_1.z.string().uuid('Invalid Student ID'),
    status: zod_1.z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY']),
    remarks: zod_1.z.string().nullable().optional()
});
exports.bulkAttendanceSchema = zod_1.z.object({
    session_id: zod_1.z.string().uuid('Invalid Session ID'),
    records: zod_1.z.array(zod_1.z.object({
        student_id: zod_1.z.string().uuid('Invalid Student ID'),
        status: zod_1.z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY']),
        remarks: zod_1.z.string().nullable().optional()
    }))
});
exports.markPeriodAttendanceSchema = zod_1.z.object({
    student_id: zod_1.z.string().uuid('Invalid Student ID'),
    academic_year_id: zod_1.z.string().uuid('Invalid Academic Year ID'),
    date: zod_1.z.string().datetime('Invalid date format'),
    period_number: zod_1.z.number().int().min(1).max(12),
    subject_id: zod_1.z.string().uuid('Invalid Subject ID').optional().nullable(),
    status: zod_1.z.enum(['PRESENT', 'ABSENT', 'LATE'])
});
exports.submitLeaveSchema = zod_1.z.object({
    leave_type_id: zod_1.z.string().uuid('Invalid Leave Type ID'),
    start_date: zod_1.z.string().datetime('Invalid start date'),
    end_date: zod_1.z.string().datetime('Invalid end date'),
    reason: zod_1.z.string().min(1, 'Reason is required').trim()
});
exports.approveLeaveSchema = zod_1.z.object({
    remarks: zod_1.z.string().nullable().optional()
});
exports.attendanceCorrectionSchema = zod_1.z.object({
    attendance_id: zod_1.z.string().uuid('Invalid Attendance ID'),
    requested_status: zod_1.z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY']),
    reason: zod_1.z.string().min(1, 'Reason is required').trim()
});
exports.holidaySchema = zod_1.z.object({
    holiday_date: zod_1.z.string().datetime('Invalid date format'),
    name: zod_1.z.string().min(1, 'Holiday name is required').trim(),
    description: zod_1.z.string().nullable().optional()
});
exports.attendanceReportSchema = zod_1.z.object({
    academic_year_id: zod_1.z.string().uuid('Invalid Academic Year ID'),
    report_type: zod_1.z.string().min(1, 'Report type is required').trim(),
    parameters: zod_1.z.record(zod_1.z.any()).default({})
});
