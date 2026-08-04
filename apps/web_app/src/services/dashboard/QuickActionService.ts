import { LucideProps } from 'lucide-react';
import React from 'react';

export interface QuickAction {
    id: string;
    label: string;
    href: string;
    icon: string;
    color: string;
    description?: string;
    /** Roles that can see this action. Empty array = all roles */
    allowedRoles: string[];
    /** Badge count for notifications/pending items */
    badge?: number;
}

/**
 * Role-based quick action definitions.
 * Each action links directly to the relevant ERP page.
 */
const QUICK_ACTIONS_REGISTRY: QuickAction[] = [
    // Admin
    { id: 'admin-admission-applications', label: 'Applications', href: '/app/admissions/review', icon: 'Users', color: 'bg-blue-100 text-blue-600', allowedRoles: ['ADMIN', 'HEAD_OF_INSTITUTE'] },
    { id: 'admin-fee-collection', label: 'Collect Fee', href: '/app/fees/payment-entry', icon: 'DollarSign', color: 'bg-green-100 text-green-600', allowedRoles: ['ADMIN'] },
    { id: 'admin-attendance', label: 'Attendance', href: '/app/admin/attendance', icon: 'CalendarCheck', color: 'bg-purple-100 text-purple-600', allowedRoles: ['ADMIN', 'HEAD_OF_INSTITUTE'] },
    { id: 'admin-reports', label: 'Reports', href: '/app/admin/reports', icon: 'BarChart3', color: 'bg-orange-100 text-orange-600', allowedRoles: ['ADMIN', 'HEAD_OF_INSTITUTE'] },
    { id: 'admin-bulk-ops', label: 'Bulk Ops', href: '/app/admin/bulk-operations', icon: 'Layers', color: 'bg-gray-100 text-gray-600', allowedRoles: ['ADMIN'] },

    // Faculty
    { id: 'faculty-mark-attendance', label: 'Mark Attendance', href: '/app/attendance/marking', icon: 'CalendarCheck', color: 'bg-green-100 text-green-600', allowedRoles: ['FACULTY'] },
    { id: 'faculty-marks-entry', label: 'Enter Marks', href: '/app/faculty/exams/marks-entry', icon: 'PenLine', color: 'bg-blue-100 text-blue-600', allowedRoles: ['FACULTY'] },
    { id: 'faculty-assignments', label: 'Assignments', href: '/app/assignments', icon: 'ClipboardList', color: 'bg-purple-100 text-purple-600', allowedRoles: ['FACULTY'] },
    { id: 'faculty-students', label: 'My Students', href: '/app/my-students', icon: 'GraduationCap', color: 'bg-indigo-100 text-indigo-600', allowedRoles: ['FACULTY'] },

    // Student
    { id: 'student-attendance', label: 'My Attendance', href: '/app/attendance/my', icon: 'CalendarCheck', color: 'bg-green-100 text-green-600', allowedRoles: ['STUDENT'] },
    { id: 'student-fees', label: 'Pay Fees', href: '/app/fees/my', icon: 'DollarSign', color: 'bg-amber-100 text-amber-600', allowedRoles: ['STUDENT'] },
    { id: 'student-results', label: 'My Results', href: '/app/student/exams/dashboard', icon: 'GraduationCap', color: 'bg-purple-100 text-purple-600', allowedRoles: ['STUDENT'] },
    { id: 'student-timetable', label: 'Timetable', href: '/app/my-timetable', icon: 'Calendar', color: 'bg-blue-100 text-blue-600', allowedRoles: ['STUDENT'] },
    { id: 'student-leave', label: 'Apply Leave', href: '/app/attendance/leaves', icon: 'FileText', color: 'bg-rose-100 text-rose-600', allowedRoles: ['STUDENT'] },
    { id: 'student-transport', label: 'My Bus', href: '/app/transport/my', icon: 'Bus', color: 'bg-orange-100 text-orange-600', allowedRoles: ['STUDENT'] },

    // Parent
    { id: 'parent-children', label: 'My Children', href: '/app/my-children', icon: 'Users', color: 'bg-blue-100 text-blue-600', allowedRoles: ['PARENT'] },
    { id: 'parent-fees', label: 'Fee Status', href: '/app/fees/my', icon: 'DollarSign', color: 'bg-amber-100 text-amber-600', allowedRoles: ['PARENT'] },
    { id: 'parent-attendance', label: 'Attendance', href: '/app/attendance/my', icon: 'CalendarCheck', color: 'bg-green-100 text-green-600', allowedRoles: ['PARENT'] },
    { id: 'parent-transport', label: 'Bus Tracking', href: '/app/transport/my', icon: 'MapPin', color: 'bg-orange-100 text-orange-600', allowedRoles: ['PARENT'] },
];

export const QuickActionService = {
    /**
     * Get quick actions for a specific role.
     */
    getActionsForRole: (role: string): QuickAction[] => {
        return QUICK_ACTIONS_REGISTRY.filter(action =>
            action.allowedRoles.length === 0 || action.allowedRoles.includes(role)
        );
    },

    /**
     * Get all quick actions (admin use).
     */
    getAllActions: (): QuickAction[] => QUICK_ACTIONS_REGISTRY,

    /**
     * Find a quick action by ID.
     */
    getActionById: (id: string): QuickAction | undefined => {
        return QUICK_ACTIONS_REGISTRY.find(a => a.id === id);
    },
};
