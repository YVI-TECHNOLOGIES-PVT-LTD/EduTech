import { z } from 'zod';

export const markAttendanceSchema = z.object({
    student_id: z.string().uuid('Invalid Student ID'),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY']),
    remarks: z.string().nullable().optional()
});

export const bulkAttendanceSchema = z.object({
    session_id: z.string().uuid('Invalid Session ID'),
    records: z.array(z.object({
        student_id: z.string().uuid('Invalid Student ID'),
        status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY']),
        remarks: z.string().nullable().optional()
    }))
});

export const markPeriodAttendanceSchema = z.object({
    student_id: z.string().uuid('Invalid Student ID'),
    academic_year_id: z.string().uuid('Invalid Academic Year ID'),
    date: z.string().datetime('Invalid date format'),
    period_number: z.number().int().min(1).max(12),
    subject_id: z.string().uuid('Invalid Subject ID').optional().nullable(),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE'])
});

export const submitLeaveSchema = z.object({
    leave_type_id: z.string().uuid('Invalid Leave Type ID'),
    start_date: z.string().datetime('Invalid start date'),
    end_date: z.string().datetime('Invalid end date'),
    reason: z.string().min(1, 'Reason is required').trim()
});

export const approveLeaveSchema = z.object({
    remarks: z.string().nullable().optional()
});

export const attendanceCorrectionSchema = z.object({
    attendance_id: z.string().uuid('Invalid Attendance ID'),
    requested_status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY']),
    reason: z.string().min(1, 'Reason is required').trim()
});

export const holidaySchema = z.object({
    holiday_date: z.string().datetime('Invalid date format'),
    name: z.string().min(1, 'Holiday name is required').trim(),
    description: z.string().nullable().optional()
});

export const attendanceReportSchema = z.object({
    academic_year_id: z.string().uuid('Invalid Academic Year ID'),
    report_type: z.string().min(1, 'Report type is required').trim(),
    parameters: z.record(z.any()).default({})
});
