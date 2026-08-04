import { PERMISSIONS } from '../constants/permissions';

export const ATTENDANCE_ROUTES_REGISTRY = [
    {
        path: '/app/attendance/dashboard',
        component: 'attendance/DashboardPage',
        permission: 'attendance.verify',
    },
    {
        path: '/app/attendance/mark-daily',
        component: 'attendance/DailyAttendancePage',
        permission: 'attendance.mark',
    },
    {
        path: '/app/attendance/period',
        component: 'attendance/PeriodAttendancePage',
        permission: 'attendance.mark',
    },
    {
        path: '/app/attendance/student/:id',
        component: 'attendance/StudentAttendancePage',
        permission: 'attendance.verify',
    },
    {
        path: '/app/attendance/leaves',
        component: 'attendance/LeaveManagementPage',
        permission: 'attendance.leave.approve',
    },
    {
        path: '/app/attendance/corrections',
        component: 'attendance/CorrectionPage',
        permission: 'attendance.correction.approve',
    },
    {
        path: '/app/attendance/holidays',
        component: 'attendance/HolidayPage',
        permission: 'attendance.mark',
    },
    {
        path: '/app/attendance/biometric',
        component: 'attendance/BiometricPage',
        permission: 'attendance.sync',
    },
    {
        path: '/app/attendance/reports',
        component: 'attendance/ReportsPage',
        permission: 'attendance.verify',
    },
    {
        path: '/app/attendance/analytics',
        component: 'attendance/AnalyticsPage',
        permission: 'attendance.verify',
    },
    {
        path: '/app/attendance/settings',
        component: 'attendance/SettingsPage',
        permission: 'attendance.verify',
    }
];
