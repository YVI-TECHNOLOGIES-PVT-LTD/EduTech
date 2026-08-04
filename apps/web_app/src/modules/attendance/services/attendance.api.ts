import { apiClient } from '../../../lib/api-client';

export interface AttendanceRecordPayload {
    student_id: string;
    status: string;
    remarks?: string;
}

export interface PeriodAttendancePayload {
    student_id: string;
    academic_year_id: string;
    date: string;
    period_number: number;
    subject_id?: string;
    status: string;
}

export interface LeaveRequestPayload {
    student_id: string;
    leave_type_id: string;
    start_date: string;
    end_date: string;
    reason: string;
}

export interface CorrectionPayload {
    attendance_id: string;
    requested_status: string;
    reason: string;
}

export const attendanceApi = {
    // Sessions & Markings
    getOrCreateSession: (data: { school_id: string; academic_year_id: string; grade: string; section_id: string; date: string }) =>
        apiClient.post('/v1/student/attendance/session', data),

    markAttendance: (data: { session_id: string; student_id: string; status: string; remarks?: string }) =>
        apiClient.post('/v1/student/attendance/daily/mark', data),

    bulkAttendance: (data: { session_id: string; records: AttendanceRecordPayload[] }) =>
        apiClient.post('/v1/student/attendance/daily/bulk', data),

    markPeriodAttendance: (data: PeriodAttendancePayload) =>
        apiClient.post('/v1/student/attendance/period/mark', data),

    // Leaves
    submitLeave: (data: LeaveRequestPayload) =>
        apiClient.post('/v1/student/attendance/leave/submit', data),

    approveLeave: (id: string, data?: { remarks?: string }) =>
        apiClient.post(`/v1/student/attendance/leave/approve/${id}`, data),

    rejectLeave: (id: string, data?: { remarks?: string }) =>
        apiClient.post(`/v1/student/attendance/leave/reject/${id}`, data || { remarks: 'Rejected' }),

    // Corrections
    createCorrection: (data: CorrectionPayload) =>
        apiClient.post('/v1/student/attendance/correction/request', data),

    approveCorrection: (id: string) =>
        apiClient.post(`/v1/student/attendance/correction/approve/${id}`),

    rejectCorrection: (id: string) =>
        apiClient.post(`/v1/student/attendance/correction/reject/${id}`, { remarks: 'Rejected' }),

    // Holidays & Working Days
    createHoliday: (data: { school_id: string; holiday_date: string; name: string; description?: string }) =>
        apiClient.post('/v1/student/attendance/holiday', data),

    configureWorkingDays: (data: { school_id: string; academic_year_id: string; grade: string; month: number; total_working_days: number }) =>
        apiClient.post('/v1/student/attendance/working-days', data),

    // Biometric
    syncBiometric: (data: { device_code: string }) =>
        apiClient.post('/v1/student/attendance/biometric/sync', data),

    // Reports & Timeline Summaries
    generateAttendanceReport: (data: { school_id: string; academic_year_id: string; report_type: string; parameters?: any }) =>
        apiClient.post('/v1/student/attendance/report/generate', data),

    getStudentSummary: (studentId: string, params: { academicYearId: string; month: number }) =>
        apiClient.get(`/v1/student/attendance/summary/${studentId}`, { params }),

    getStudentTimeline: (studentId: string) =>
        apiClient.get(`/v1/student/attendance/timeline/${studentId}`),
};
