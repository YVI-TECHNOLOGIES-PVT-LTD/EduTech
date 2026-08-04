import { apiClient } from '../../lib/api-client';

export interface AdminSummary {
    totalStudents: number;
    totalFaculty: number;
    totalStaff: number;
    attendanceToday: number;
    admissionPipelineCount: number;
    pendingFeeAmount: number;
    activeTransportRoutes: number;
}

export interface FacultySummary {
    myClasses: number;
    mySubjects: number;
    pendingMarksEntry: number;
    pendingAssignmentReview: number;
    attendanceTakenToday: boolean;
}

export interface StudentSummary {
    attendancePercent: number;
    feeDue: number;
    upcomingExams: number;
    pendingAssignments: number;
    leaveBalance: { casual: number; medical: number };
    todaySchedule: any[];
    announcements: any[];
}

export const DashboardSummaryService = {
    /**
     * Admin overview: students, faculty, fee, admissions, attendance.
     */
    getAdminSummary: async (): Promise<AdminSummary> => {
        const res = await apiClient.get('/dashboard/admin-summary');
        return res.data;
    },

    /**
     * Faculty overview: classes, pending marks, assignment review.
     */
    getFacultySummary: async (): Promise<FacultySummary> => {
        const res = await apiClient.get('/dashboard/faculty-summary');
        return res.data;
    },

    /**
     * Student overview: attendance %, fee, exams, assignments, schedule.
     */
    getStudentSummary: async (): Promise<StudentSummary> => {
        const res = await apiClient.get('/dashboard/student-summary');
        return res.data;
    },

    /**
     * Generic role-based summary — backend decides what to return.
     */
    getSummaryForRole: async (role: string) => {
        const res = await apiClient.get(`/dashboard/summary/${role.toLowerCase()}`);
        return res.data;
    },
};
