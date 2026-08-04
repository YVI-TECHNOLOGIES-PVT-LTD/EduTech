export const API_ENDPOINTS = {
    AUTH: {
        ME: '/me',
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
    },
    ADMISSION: {
        LEADS: '/admission/leads',
        APPLICATIONS: '/admission/applications',
        EVALUATIONS: '/admission/evaluations',
        MERIT_LIST: '/admission/merit-lists',
        ENROLL: '/admission/enrollment',
    },
    STUDENT: {
        MASTER: '/student/master',
        PROFILE: '/student/profile',
        ALLOCATION: '/student/allocation',
        PROMOTION: '/student/promotion',
        TRANSFER: '/student/transfer',
    },
    ATTENDANCE: {
        SESSION: '/student/attendance/session',
        DAILY_MARK: '/student/attendance/daily/mark',
        BULK_MARK: '/student/attendance/daily/bulk',
        PERIOD_MARK: '/student/attendance/period/mark',
        LEAVE_SUBMIT: '/student/attendance/leave/submit',
        LEAVE_APPROVE: (id: string) => `/student/attendance/leave/approve/${id}`,
        CORRECTION: '/student/attendance/correction/request',
        CORRECTION_APPROVE: (id: string) => `/student/attendance/correction/approve/${id}`,
        HOLIDAY: '/student/attendance/holiday',
        WORKING_DAYS: '/student/attendance/working-days',
        BIOMETRIC_SYNC: '/student/attendance/biometric/sync',
        SUMMARY: (studentId: string) => `/student/attendance/summary/${studentId}`,
        TIMELINE: (studentId: string) => `/student/attendance/timeline/${studentId}`,
    },
    SYSTEM: {
        INFO: '/system/info',
        HEALTH: '/system/health',
    }
};
