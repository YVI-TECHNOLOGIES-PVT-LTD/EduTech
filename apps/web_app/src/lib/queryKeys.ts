export const QUERY_KEYS = {
    ADMISSION: {
        ALL: ['admissions'] as const,
        LISTS: () => [...QUERY_KEYS.ADMISSION.ALL, 'list'] as const,
        DETAILS: (id: string) => [...QUERY_KEYS.ADMISSION.ALL, 'detail', id] as const,
        REVIEW: (id: string) => [...QUERY_KEYS.ADMISSION.ALL, 'review', id] as const,
    },
    STUDENT: {
        ALL: ['students'] as const,
        LISTS: () => [...QUERY_KEYS.STUDENT.ALL, 'list'] as const,
        DETAILS: (id: string) => [...QUERY_KEYS.STUDENT.ALL, 'detail', id] as const,
        PROFILE: (id: string) => [...QUERY_KEYS.STUDENT.ALL, 'profile', id] as const,
    },
    ATTENDANCE: {
        ALL: ['attendance'] as const,
        DAILY: (sessionId: string) => [...QUERY_KEYS.ATTENDANCE.ALL, 'daily', sessionId] as const,
        PERIOD: (studentId: string, date: string) => [...QUERY_KEYS.ATTENDANCE.ALL, 'period', studentId, date] as const,
        LEAVES: (studentId?: string) => [...QUERY_KEYS.ATTENDANCE.ALL, 'leaves', studentId || 'all'] as const,
        SUMMARY: (studentId: string, month: number) => [...QUERY_KEYS.ATTENDANCE.ALL, 'summary', studentId, month] as const,
    },

    // ── Auth ────────────────────────────────────────────────────────────────
    CURRENT_USER: ['currentUser'] as const,
    SESSIONS: ['sessions'] as const,

    // ── Dashboard — DashboardQueryKeys ──────────────────────────────────────
    DASHBOARD: {
        ALL: ['dashboard'] as const,

        /** Role-based summary stats (admin overview, student overview, etc.) */
        SUMMARY: (role: string) =>
            ['dashboard', 'summary', role] as const,

        /** Per-entity daily metrics */
        METRICS: (schoolId: string, date: string) =>
            ['dashboard', 'metrics', schoolId, date] as const,

        /** Activity feed / recent events */
        ACTIVITIES: (limit = 10) =>
            ['dashboard', 'activities', limit] as const,

        /** School-wide announcements */
        ANNOUNCEMENTS: (limit = 5) =>
            ['dashboard', 'announcements', limit] as const,

        /** Academic calendar events for a given month */
        CALENDAR: (month: string) =>
            ['dashboard', 'calendar', month] as const,

        /** Student-specific timeline */
        TIMELINE: (studentId: string) =>
            ['dashboard', 'timeline', studentId] as const,

        /** Admission pipeline funnel counts */
        ADMISSION_PIPELINE: () =>
            ['dashboard', 'admission-pipeline'] as const,

        /** Fee collection daily/weekly totals */
        FEE_COLLECTION: (range: 'today' | 'week' | 'month') =>
            ['dashboard', 'fee-collection', range] as const,

        /** Student attendance heatmap data */
        ATTENDANCE_HEATMAP: (classId: string) =>
            ['dashboard', 'attendance-heatmap', classId] as const,
    },

    // ── Notifications ────────────────────────────────────────────────────────
    NOTIFICATIONS: {
        ALL: ['notifications'] as const,
        LIST: (filter?: string) =>
            ['notifications', 'list', filter || 'all'] as const,
        UNREAD_COUNT: () =>
            ['notifications', 'unread-count'] as const,
    },
};

export default QUERY_KEYS;

