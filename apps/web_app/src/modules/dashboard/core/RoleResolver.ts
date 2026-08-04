import { DASHBOARD_CONSTANTS } from '../constants/DashboardConstants';
import { PermissionProfileResolver } from './PermissionProfileResolver';

/**
 * @deprecated RoleResolver is deprecated. Use PermissionProfileResolver instead.
 */
export class RoleResolver {
    public static resolve(rawRoles: string | string[]): string {
        console.warn("RoleResolver is deprecated. Use PermissionProfileResolver.");
        
        const roles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
        const normalizedRoles = roles.map(r => r.toUpperCase());

        // Mapping raw roles to mock permissions to support deprecated compatibility calls
        const mockPermissions: string[] = [];
        if (normalizedRoles.includes('ADMIN')) mockPermissions.push('admin.dashboard.view');
        if (normalizedRoles.includes('PRINCIPAL') || normalizedRoles.includes('HOI') || normalizedRoles.includes('HEAD_OF_INSTITUTE')) {
            mockPermissions.push('admin.dashboard.view', 'admission.approve');
        }
        if (normalizedRoles.includes('FINANCE_OFFICER') || normalizedRoles.includes('ACCOUNTANT') || normalizedRoles.includes('FINANCE')) {
            mockPermissions.push('fees.dashboard.view');
        }
        if (normalizedRoles.includes('EXAM_CELL') || normalizedRoles.includes('EXAM_CELL_ADMIN')) {
            mockPermissions.push('exam.dashboard.view');
        }
        if (normalizedRoles.includes('ADMISSION_OFFICER')) {
            mockPermissions.push('admission.dashboard.view');
        }
        if (normalizedRoles.includes('COUNSELOR') || normalizedRoles.includes('COUNSELLOR')) {
            mockPermissions.push('admission.leads.manage');
        }
        if (normalizedRoles.includes('RECEPTIONIST') || normalizedRoles.includes('FRONT_DESK')) {
            mockPermissions.push('admission.enquiry.create');
        }
        if (normalizedRoles.includes('PARENT') || normalizedRoles.includes('GUARDIAN')) {
            mockPermissions.push('parent.dashboard.view');
        }
        if (normalizedRoles.includes('STUDENT')) {
            mockPermissions.push('student.dashboard.view');
        }
        if (normalizedRoles.includes('FACULTY') || normalizedRoles.includes('TEACHER') || normalizedRoles.includes('STAFF')) {
            mockPermissions.push('faculty.dashboard.view');
        }

        return PermissionProfileResolver.resolve(mockPermissions).profile;
    }
}

export default RoleResolver;
