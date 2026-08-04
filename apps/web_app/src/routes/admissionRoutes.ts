import { ROUTES } from '../constants/routes';
import { PERMISSIONS } from '../constants/permissions';

export const ADMISSION_ROUTES_REGISTRY = [
    {
        path: '/app/admissions/dashboard',
        component: 'admission/DashboardPage',
        permission: PERMISSIONS.ADMISSION.REVIEW,
    },
    {
        path: '/app/admissions/analytics',
        component: 'admission/AnalyticsPage',
        permission: PERMISSIONS.ADMISSION.REVIEW,
    },
    {
        path: '/app/admissions/inquiries',
        component: 'admission/InquiryListPage',
        permission: PERMISSIONS.ADMISSION.REVIEW,
    },
    {
        path: ROUTES.ADMISSION.APPLY,
        component: 'admission/AdmissionForm',
        permission: PERMISSIONS.ADMISSION.CREATE,
    },
    {
        path: '/app/admissions/wizard',
        component: 'admission/ApplicationWizardPage',
        permission: PERMISSIONS.ADMISSION.CREATE,
    },
    {
        path: ROUTES.ADMISSION.MY,
        component: 'admission/MyApplications',
        permission: PERMISSIONS.ADMISSION.VIEW_OWN,
    },
    {
        path: ROUTES.ADMISSION.LIST,
        component: 'admission/AdmissionReviewList',
        permission: PERMISSIONS.ADMISSION.REVIEW,
    },
    {
        path: '/app/admissions/review/:id',
        component: 'admission/AdmissionReviewPage',
        permission: PERMISSIONS.ADMISSION.REVIEW,
    },
    {
        path: '/app/admissions/:id',
        component: 'admission/ApplicationDetails',
        permission: PERMISSIONS.ADMISSION.VIEW_OWN,
    },
    {
        path: '/app/admissions/verification',
        component: 'admission/DocumentVerificationPage',
        permission: PERMISSIONS.ADMISSION.REVIEW,
    },
    {
        path: '/app/admissions/exams',
        component: 'admission/EntranceExamPage',
        permission: PERMISSIONS.ADMISSION.REVIEW,
    },
    {
        path: '/app/admissions/interviews',
        component: 'admission/InterviewPage',
        permission: PERMISSIONS.ADMISSION.REVIEW,
    },
    {
        path: '/app/admissions/merit',
        component: 'admission/MeritListPage',
        permission: PERMISSIONS.ADMISSION.REVIEW,
    },
    {
        path: '/app/admissions/offers',
        component: 'admission/OfferLetterPage',
        permission: PERMISSIONS.ADMISSION.REVIEW,
    },
    {
        path: '/app/admissions/fees',
        component: 'admission/FeeCollectionPage',
        permission: PERMISSIONS.ADMISSION.REVIEW,
    },
    {
        path: '/app/admissions/enrollment',
        component: 'admission/EnrollmentPage',
        permission: PERMISSIONS.ADMISSION.REVIEW,
    },
    {
        path: '/app/admissions/reports',
        component: 'admission/ReportsPage',
        permission: PERMISSIONS.ADMISSION.REVIEW,
    },
    {
        path: '/app/admissions/settings',
        component: 'admission/SettingsPage',
        permission: PERMISSIONS.ADMISSION.REVIEW,
    }
];
