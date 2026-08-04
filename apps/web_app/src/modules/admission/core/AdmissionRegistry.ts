/**
 * Declarative registry mapping admission pages to hooks, permissions, and widgets.
 * No API calls — configuration only.
 */

export const ADMISSION_PAGES = {
    inquiry: {
        path: '/app/admissions/inquiries',
        hook: 'useInquiryWorkspace',
        permission: 'admission.enquiry.view',
        permissions: [
            'admission.enquiry.view',
            'admission.enquiry.create',
            'admission.leads.manage',
            'admission.review',
        ],
        widgets: ['inquiry-list', 'lead-assignment'],
    },
    applicant360: {
        path: '/app/admissions/:id',
        hook: 'useApplicant360',
        permission: 'admission.view_own',
        widgets: ['profile-header', 'timeline', 'documents', 'communications'],
    },
    review: {
        path: '/app/admissions/review/:id',
        hook: 'useWorkflow',
        permission: 'admission.view_all',
        widgets: ['status-panels', 'audit-trail'],
    },
    pipeline: {
        path: '/app/admissions/review',
        hook: 'usePipeline',
        permission: 'admission.review',
        widgets: ['kanban-board'],
    },
    enrollment: {
        path: '/app/admissions/enrollment',
        hook: 'useEnrollmentWorkspace',
        permission: 'admission.review',
        widgets: ['enrollment-queue', 'provisioning-status', 'enrollment-validation', 'enrollment-audit'],
    },
    dashboard: {
        path: '/app/admissions/dashboard',
        hook: 'useAdmission',
        permission: 'admission.review',
        widgets: ['role-kpis', 'action-queues'],
    },
    documentVerification: {
        path: '/app/admissions/verification',
        hook: 'useDocumentVerification',
        permission: 'admission.review',
        widgets: ['verification-queue', 'document-grid', 'document-preview'],
    },
    entranceExam: {
        path: '/app/admissions/exams',
        hook: 'useExamEvaluation',
        permission: 'admission.review',
        widgets: ['exam-queue', 'evaluation-panel', 'exam-summary', 'exam-history'],
    },
    interviewEvaluation: {
        path: '/app/admissions/interviews',
        hook: 'useInterviewEvaluation',
        permission: 'admission.review',
        widgets: ['interview-queue', 'panel-assignment', 'interview-evaluation', 'interview-history'],
    },
    meritSelection: {
        path: '/app/admissions/merit',
        hook: 'useMeritWorkspace',
        permission: 'admission.review',
        widgets: ['merit-queue', 'merit-ranking', 'seat-allocation', 'waitlist-manager'],
    },
    offerManagement: {
        path: '/app/admissions/offers',
        hook: 'useOfferWorkspace',
        permission: 'admission.review',
        widgets: ['offer-queue', 'offer-toolbar', 'offer-preview', 'offer-audit'],
    },
    admissionFinance: {
        path: '/app/admissions/fees',
        hook: 'useFinanceWorkspace',
        permission: 'admission.review',
        widgets: ['payment-queue', 'payment-toolbar', 'receipt-viewer', 'waiver-panel'],
    },
    analytics: {
        path: '/app/admissions/analytics',
        hook: 'useAdmission',
        permission: 'admission.review',
        widgets: ['executive-analytics', 'funnel-chart'],
    },
    reports: {
        path: '/app/admissions/reports',
        hook: 'useApplicationList',
        permission: 'admission.review',
        widgets: ['reports-grid', 'export-menu'],
    },
    myApplications: {
        path: '/app/admissions/my',
        hook: 'useApplicationList',
        permission: 'admission.view_own',
        widgets: ['application-list'],
    },
    applicationForm: {
        path: '/app/admissions/new',
        hook: 'useApplication',
        permission: 'admission.create',
        widgets: ['application-form'],
    },
    applicationWizard: {
        path: '/app/admissions/wizard',
        hook: 'useApplication',
        permission: 'admission.create',
        widgets: ['application-wizard'],
    },
    settings: {
        path: '/app/admissions/settings',
        hook: 'useAdmission',
        permission: 'admission.review',
        widgets: ['admission-settings'],
    },
    applicationDetails: {
        path: '/app/admissions/details/:id',
        hook: 'useApplication',
        permission: 'admission.review',
        widgets: ['timeline', 'action-panel'],
    },
} as const;

export const ADMISSION_WORKFLOW_ACTIONS = [
    'review',
    'verify',
    'billing',
    'initiate_payment',
    'verify_fee',
    'recommend',
    'approve',
    'enrol',
    'reject',
    'decide_login',
    'submit_payment',
] as const;

export type AdmissionWorkflowAction = (typeof ADMISSION_WORKFLOW_ACTIONS)[number];

export const AdmissionRegistry = {
    pages: ADMISSION_PAGES,
    workflowActions: ADMISSION_WORKFLOW_ACTIONS,

    getPageConfig(pageKey: keyof typeof ADMISSION_PAGES) {
        return ADMISSION_PAGES[pageKey];
    },

    getHookForPage(pageKey: keyof typeof ADMISSION_PAGES): string {
        return ADMISSION_PAGES[pageKey].hook;
    },
};
