/**
 * Centralized React Query keys for the Admissions module.
 * All admission hooks must use these keys — no inline duplicates.
 */

export const ADMISSION_STALE_TIME = 5 * 60 * 1000;
export const ADMISSION_GC_TIME = 10 * 60 * 1000;

const ALL_KEY = ['admissions'] as const;

export const ADMISSION_CACHE_KEYS = {
    all: ALL_KEY,

    lists: (params?: Record<string, unknown>) =>
        [...ALL_KEY, 'list', params ?? {}] as const,

    myApplications: () => [...ALL_KEY, 'my'] as const,

    detail: (id: string) => [...ALL_KEY, 'detail', id] as const,

    stats: (schoolId?: string) => [...ALL_KEY, 'stats', schoolId ?? 'all'] as const,

    reviewQueue: (status?: string) => [...ALL_KEY, 'review-queue', status ?? 'all'] as const,

    inquiry: {
        all: [...ALL_KEY, 'inquiries'] as const,
        lists: (params?: Record<string, unknown>) =>
            [...ALL_KEY, 'inquiries', params ?? {}] as const,
        detail: (id: string) => [...ALL_KEY, 'inquiry', id] as const,
    },

    lead: {
        all: [...ALL_KEY, 'leads'] as const,
        lists: (params?: Record<string, unknown>) =>
            [...ALL_KEY, 'leads', params ?? {}] as const,
        detail: (id: string) => [...ALL_KEY, 'lead', id] as const,
    },

    followups: (params?: Record<string, unknown>) =>
        [...ALL_KEY, 'followups', params ?? {}] as const,

    visitors: (params?: Record<string, unknown>) =>
        [...ALL_KEY, 'visitors', params ?? {}] as const,

    timeline: (applicationId: string) => [...ALL_KEY, 'timeline', applicationId] as const,

    documents: (applicationId: string) => [...ALL_KEY, 'documents', applicationId] as const,

    progress: (applicationId: string) => [...ALL_KEY, 'progress', applicationId] as const,

    payments: (applicationId: string) => [...ALL_KEY, 'payments', applicationId] as const,

    feesSummary: (applicationId: string) => [...ALL_KEY, 'fees-summary', applicationId] as const,

    offers: (applicationId: string) => [...ALL_KEY, 'offers', applicationId] as const,

    merit: (applicationId: string) => [...ALL_KEY, 'merit-list', applicationId] as const,

    examResults: (applicationId: string) => [...ALL_KEY, 'exam-results', applicationId] as const,

    interviewEvaluation: (applicationId: string) => [...ALL_KEY, 'interview-evaluation', applicationId] as const,

    enrollment: (applicationId: string) => [...ALL_KEY, 'enrollment-status', applicationId] as const,
};
