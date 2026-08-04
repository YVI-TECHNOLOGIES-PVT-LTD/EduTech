import { ROUTES } from '../constants/routes';
import { PERMISSIONS } from '../constants/permissions';

export interface NavigationItem {
    title: string;
    path: string;
    permission?: string | string[];
    icon: string;
    badge?: string;
    children?: NavigationItem[];
}

export const NAVIGATION_CONFIG: NavigationItem[] = [
    {
        title: 'Dashboard',
        path: ROUTES.APP.DASHBOARD,
        icon: 'LayoutDashboard',
    },
    {
        title: 'Admissions',
        path: '/app/admissions',
        permission: PERMISSIONS.ADMISSION.VIEW_OWN,
        icon: 'UserPlus',
        children: [
            {
                title: 'Overview',
                path: '/app/admissions/dashboard',
                permission: 'admission.review',
                icon: 'LayoutDashboard',
            },
            {
                title: 'Analytics',
                path: '/app/admissions/analytics',
                permission: 'admission.review',
                icon: 'BarChart2',
            },
            {
                title: 'Inquiry CRM',
                path: '/app/admissions/inquiries',
                permission: PERMISSIONS.ADMISSION.ENQUIRY_VIEW,
                icon: 'PhoneCall',
            },
            {
                title: 'Apply Now',
                path: ROUTES.ADMISSION.APPLY,
                icon: 'FilePlus',
            },
            {
                title: 'Application Wizard',
                path: '/app/admissions/wizard',
                icon: 'FileText',
            },
            {
                title: 'My Applications',
                path: ROUTES.ADMISSION.MY,
                icon: 'FolderOpen',
            },
            {
                title: 'Review Desk',
                path: ROUTES.ADMISSION.LIST,
                permission: PERMISSIONS.ADMISSION.REVIEW,
                icon: 'ShieldCheck',
            },
            {
                title: 'Doc Verification',
                path: '/app/admissions/verification',
                permission: 'admission.review',
                icon: 'ClipboardCheck',
            },
            {
                title: 'Entrance Exams',
                path: '/app/admissions/exams',
                permission: ['admission.review', 'admission.exam.manage', 'admission.exam.evaluate'],
                icon: 'GraduationCap',
            },
            {
                title: 'Entrance Assessment',
                path: '/app/admissions/entrance-assessment',
                permission: 'admission.assessment.write',
                icon: 'GraduationCap',
            },
            {
                title: 'Interview Desk',
                path: '/app/admissions/interviews',
                permission: ['admission.review', 'admission.interview.manage', 'admission.interview.evaluate'],
                icon: 'MessageSquare',
            },
            {
                title: 'Merit Desk',
                path: '/app/admissions/merit',
                permission: 'admission.review',
                icon: 'Award',
            },
            {
                title: 'Offer Letters',
                path: '/app/admissions/offers',
                permission: 'admission.review',
                icon: 'MailOpen',
            },
            {
                title: 'Fee Collection',
                path: '/app/admissions/fees',
                permission: 'admission.review',
                icon: 'CreditCard',
            },
            {
                title: 'Enrollment Handoff',
                path: '/app/admissions/enrollment',
                permission: 'admission.review',
                icon: 'UserCheck',
            },
            {
                title: 'Module Reports',
                path: '/app/admissions/reports',
                permission: 'admission.review',
                icon: 'FileSpreadsheet',
            },
            {
                title: 'Module Settings',
                path: '/app/admissions/settings',
                permission: 'admission.review',
                icon: 'Settings',
            }
        ]
    },
    {
        title: 'Student SIS',
        path: '/app/students-root',
        permission: PERMISSIONS.STUDENT.VIEW,
        icon: 'Users',
        children: [
            {
                title: 'Dashboard',
                path: '/app/students/dashboard',
                icon: 'LayoutDashboard',
            },
            {
                title: 'Student Master',
                path: ROUTES.STUDENT.LIST,
                icon: 'UserSquare',
            },
            {
                title: 'Class Allocation',
                path: '/app/students/allocation',
                permission: PERMISSIONS.STUDENT.ASSIGN_SECTION,
                icon: 'Layers',
            },
            {
                title: 'Promotions',
                path: ROUTES.STUDENT.PROMOTE,
                permission: PERMISSIONS.STUDENT.ASSIGN_SECTION,
                icon: 'TrendingUp',
            },
            {
                title: 'Transfers',
                path: '/app/students/transfer',
                permission: PERMISSIONS.STUDENT.VIEW,
                icon: 'ArrowLeftRight',
            },
            {
                title: 'Identity Cards',
                path: '/app/students/identity',
                permission: PERMISSIONS.STUDENT.VIEW,
                icon: 'Barcode',
            },
            {
                title: 'Import Wizard',
                path: '/app/students/import',
                permission: PERMISSIONS.STUDENT.VIEW,
                icon: 'Upload',
            },
            {
                title: 'Reports',
                path: '/app/students/reports',
                permission: PERMISSIONS.STUDENT.VIEW,
                icon: 'FileSpreadsheet',
            },
            {
                title: 'Settings',
                path: '/app/students/settings',
                permission: PERMISSIONS.STUDENT.VIEW,
                icon: 'Settings',
            }
        ]
    },
    {
        title: 'Attendance',
        path: '/app/attendance-root',
        permission: 'attendance.mark',
        icon: 'CalendarCheck',
        children: [
            {
                title: 'Dashboard',
                path: '/app/attendance/dashboard',
                icon: 'LayoutDashboard',
            },
            {
                title: 'Daily Attendance',
                path: '/app/attendance/mark-daily',
                icon: 'ClipboardList',
            },
            {
                title: 'Period Attendance',
                path: '/app/attendance/period',
                icon: 'CalendarCheck',
            },
            {
                title: 'Leave Management',
                path: '/app/attendance/leaves',
                icon: 'PlaneTakeoff',
            },
            {
                title: 'Corrections',
                path: '/app/attendance/corrections',
                icon: 'ShieldAlert',
            },
            {
                title: 'Holiday Calendar',
                path: '/app/attendance/holidays',
                icon: 'Calendar',
            },
            {
                title: 'Biometric',
                path: '/app/attendance/biometric',
                icon: 'Cpu',
            },
            {
                title: 'Reports',
                path: '/app/attendance/reports',
                icon: 'FileSpreadsheet',
            },
            {
                title: 'Analytics',
                path: '/app/attendance/analytics',
                icon: 'BarChart2',
            },
            {
                title: 'Settings',
                path: '/app/attendance/settings',
                icon: 'Settings',
            }
        ]
    },
    {
        title: 'Workflows',
        path: '/app/workflows-root',
        icon: 'Cpu',
        children: [
            {
                title: 'Dashboard',
                path: '/app/workflows/dashboard',
                icon: 'LayoutDashboard',
            },
            {
                title: 'Visual Builder',
                path: '/app/workflows/builder',
                icon: 'Settings',
            },
            {
                title: 'Task Center',
                path: '/app/workflows/tasks',
                icon: 'ClipboardList',
            },
            {
                title: 'Analytics',
                path: '/app/workflows/analytics',
                icon: 'BarChart2',
            }
        ]
    }
];
