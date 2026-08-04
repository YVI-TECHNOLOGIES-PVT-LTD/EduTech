import { ROUTES } from '../constants/routes';
import { PERMISSIONS } from '../constants/permissions';

export const STUDENT_ROUTES_REGISTRY = [
    {
        path: '/app/students/dashboard',
        component: 'student/DashboardPage',
        permission: PERMISSIONS.STUDENT.VIEW,
    },
    {
        path: ROUTES.STUDENT.LIST,
        component: 'student/StudentListPage',
        permission: PERMISSIONS.STUDENT.VIEW,
    },
    {
        path: '/app/students/:id',
        component: 'student/StudentDetailsPage',
        permission: PERMISSIONS.STUDENT.VIEW,
    },
    {
        path: '/app/students/:id/edit',
        component: 'student/StudentProfilePage',
        permission: PERMISSIONS.STUDENT.UPDATE,
    },
    {
        path: '/app/students/:id/parents',
        component: 'student/ParentGuardianPage',
        permission: PERMISSIONS.STUDENT.UPDATE,
    },
    {
        path: '/app/students/:id/academics',
        component: 'student/AcademicRecordPage',
        permission: PERMISSIONS.STUDENT.VIEW,
    },
    {
        path: '/app/students/:id/allocation',
        component: 'student/ClassAllocationPage',
        permission: PERMISSIONS.STUDENT.ASSIGN_SECTION,
    },
    {
        path: ROUTES.STUDENT.PROMOTE,
        component: 'student/PromotionPage',
        permission: PERMISSIONS.STUDENT.ASSIGN_SECTION,
    },
    {
        path: '/app/students/transfer',
        component: 'student/TransferPage',
        permission: PERMISSIONS.STUDENT.VIEW,
    },
    {
        path: '/app/students/identity',
        component: 'student/IdentityCardPage',
        permission: PERMISSIONS.STUDENT.VIEW,
    },
    {
        path: '/app/students/:id/timeline',
        component: 'student/TimelinePage',
        permission: PERMISSIONS.STUDENT.VIEW,
    },
    {
        path: '/app/students/:id/audit',
        component: 'student/AuditLogsPage',
        permission: PERMISSIONS.STUDENT.VIEW,
    },
    {
        path: '/app/students/reports',
        component: 'student/ReportsPage',
        permission: PERMISSIONS.STUDENT.VIEW,
    },
    {
        path: '/app/students/settings',
        component: 'student/SettingsPage',
        permission: PERMISSIONS.STUDENT.VIEW,
    },
    {
        path: '/app/students/import',
        component: 'student/ImportWizardPage',
        permission: PERMISSIONS.STUDENT.VIEW,
    },
    {
        path: '/app/students/:id/admission-history',
        component: 'student/AdmissionHistoryPage',
        permission: PERMISSIONS.STUDENT.VIEW,
    }
];
