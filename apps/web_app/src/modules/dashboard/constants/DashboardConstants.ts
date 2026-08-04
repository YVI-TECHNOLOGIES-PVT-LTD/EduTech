export const DASHBOARD_CONSTANTS = {
    REFRESH_INTERVALS: {
        KPI: 60 * 1000,          // 60 seconds
        ACTIVITIES: 30 * 1000,   // 30 seconds
        NOTIFICATIONS: 15 * 1000, // 15 seconds
        CHARTS: 60 * 1000,       // 60 seconds
        TASKS: 30 * 1000,        // 30 seconds
        DEFAULT: 30 * 1000,
    },
    COLORS: {
        STATUS: {
            PENDING: '#F59E0B',
            IN_PROGRESS: '#3B82F6',
            COMPLETED: '#10B981',
            FAILED: '#EF4444',
            WAITING: '#8B5CF6',
            ESCALATED: '#EF4444',
            CANCELLED: '#6B7280',
        },
        TREND: {
            UP: '#10B981',
            DOWN: '#EF4444',
            NEUTRAL: '#6B7280',
        },
        THEME: [
            '#4F46E5', // Indigo
            '#10B981', // Emerald
            '#3B82F6', // Blue
            '#F59E0B', // Amber
            '#EC4899', // Pink
            '#8B5CF6', // Purple
            '#06B6D4', // Cyan
        ]
    },
    FORMATS: {
        DATE: 'yyyy-MM-dd',
        TIME: 'hh:mm a',
        DATE_TIME: 'yyyy-MM-dd hh:mm a',
        CURRENCY: 'INR',
    },
    ROLES: {
        ADMIN: 'ADMIN',
        FACULTY: 'FACULTY',
        STUDENT: 'STUDENT',
        PARENT: 'PARENT',
        RECEPTIONIST: 'RECEPTIONIST',
        COUNSELOR: 'COUNSELOR',
        ADMISSION_OFFICER: 'ADMISSION_OFFICER',
        EXAM_CELL: 'EXAM_CELL',
        FINANCE: 'FINANCE',
        PRINCIPAL: 'PRINCIPAL',
    },
    PROFILES: {
        SYSTEM_ADMIN: 'ADMIN',
        ACADEMIC_ADMIN: 'ADMIN',
        EXAM_ADMIN: 'EXAM_CELL',
        FINANCE_ADMIN: 'FINANCE',
        RECEPTION: 'RECEPTIONIST',
        STUDENT: 'STUDENT',
        PARENT: 'PARENT',
        FACULTY: 'FACULTY',
        LIBRARY: 'LIBRARY',
        TRANSPORT: 'TRANSPORT',
        HR: 'HR',
        PRINCIPAL: 'PRINCIPAL',
        COUNSELOR: 'COUNSELOR',
        ADMISSION_OFFICER: 'ADMISSION_OFFICER',
    }
};

export type DashboardProfileType = typeof DASHBOARD_CONSTANTS.PROFILES[keyof typeof DASHBOARD_CONSTANTS.PROFILES];


export default DASHBOARD_CONSTANTS;
