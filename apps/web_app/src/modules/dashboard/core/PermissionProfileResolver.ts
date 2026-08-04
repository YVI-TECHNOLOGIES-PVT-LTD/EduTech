import { DashboardRegistry } from './DashboardRegistry';
import { DASHBOARD_CONSTANTS } from '../constants/DashboardConstants';
import { DashboardLayout } from '../types/dashboard.types';

export interface ResolvedDashboardConfig {
    profile: string;
    widgets: string[];
    homeRoute: string;
    layouts: DashboardLayout | undefined;
}

export class PermissionProfileResolver {
    public static resolve(permissions: string[]): ResolvedDashboardConfig {
        const permsSet = new Set(permissions);

        // Determine rendering profile based on positive permission checks
        let profile = DASHBOARD_CONSTANTS.ROLES.FACULTY; // Safe fallback

        if (permsSet.has('admin.dashboard.view')) {
            // Principal/HOI has additional approval capabilities
            if (permsSet.has('admission.approve') || permsSet.has('fees.waiver.approve')) {
                profile = DASHBOARD_CONSTANTS.ROLES.PRINCIPAL;
            } else {
                profile = DASHBOARD_CONSTANTS.ROLES.ADMIN;
            }
        } else if (permsSet.has('fees.dashboard.view')) {
            profile = DASHBOARD_CONSTANTS.ROLES.FINANCE;
        } else if (permsSet.has('exam.dashboard.view')) {
            profile = DASHBOARD_CONSTANTS.ROLES.EXAM_CELL;
        } else if (permsSet.has('admission.dashboard.view') || permsSet.has('admission.review')) {
            profile = DASHBOARD_CONSTANTS.ROLES.ADMISSION_OFFICER;
        } else if (permsSet.has('admission.leads.manage')) {
            profile = DASHBOARD_CONSTANTS.ROLES.COUNSELOR;
        } else if (permsSet.has('admission.enquiry.create')) {
            profile = DASHBOARD_CONSTANTS.ROLES.RECEPTIONIST;
        } else if (permsSet.has('parent.dashboard.view')) {
            profile = DASHBOARD_CONSTANTS.ROLES.PARENT;
        } else if (permsSet.has('student.dashboard.view') || permsSet.has('STUDENT_VIEW_SELF')) {
            profile = DASHBOARD_CONSTANTS.ROLES.STUDENT;
        } else if (permsSet.has('faculty.dashboard.view') || permsSet.has('exam.marks.enter')) {
            profile = DASHBOARD_CONSTANTS.ROLES.FACULTY;
        }

        // Determine home route dynamically for the resolved profile
        let homeRoute = '/app/dashboard';
        if (profile === DASHBOARD_CONSTANTS.ROLES.EXAM_CELL) {
            homeRoute = '/app/exam-admin/dashboard';
        } else if (profile === DASHBOARD_CONSTANTS.ROLES.STUDENT) {
            homeRoute = '/app/student/exams/dashboard';
        } else if (profile === DASHBOARD_CONSTANTS.ROLES.PARENT) {
            homeRoute = '/app/student/exams/dashboard';
        }

        const config = DashboardRegistry.getConfig(profile);
        const layouts = config?.layouts;
        const widgets = config?.widgets || [];

        return {
            profile,
            widgets,
            homeRoute,
            layouts
        };
    }
}

export default PermissionProfileResolver;
