import { RoleDashboard, DashboardLayout, DashboardWidget } from '../types/dashboard.types';
import { DASHBOARD_CONSTANTS } from '../constants/DashboardConstants';
import { adminConfig } from '../configs/admin.config';
import { facultyConfig } from '../configs/faculty.config';
import { studentConfig } from '../configs/student.config';
import { parentConfig } from '../configs/parent.config';
import { admissionConfig } from '../configs/admission.config';
import { receptionConfig } from '../configs/reception.config';
import { financeConfig } from '../configs/finance.config';
import { examConfig } from '../configs/exam.config';
import { principalConfig } from '../configs/principal.config';
import { getWidgetById } from '../registry/WidgetRegistry';

export class DashboardRegistry {
    private static configs: Record<string, RoleDashboard> = {
        [DASHBOARD_CONSTANTS.ROLES.ADMIN]: adminConfig,
        [DASHBOARD_CONSTANTS.ROLES.FACULTY]: facultyConfig,
        [DASHBOARD_CONSTANTS.ROLES.STUDENT]: studentConfig,
        [DASHBOARD_CONSTANTS.ROLES.PARENT]: parentConfig,
        [DASHBOARD_CONSTANTS.ROLES.COUNSELOR]: admissionConfig,
        [DASHBOARD_CONSTANTS.ROLES.RECEPTIONIST]: receptionConfig,
        [DASHBOARD_CONSTANTS.ROLES.FINANCE]: financeConfig,
        [DASHBOARD_CONSTANTS.ROLES.EXAM_CELL]: examConfig,
        [DASHBOARD_CONSTANTS.ROLES.PRINCIPAL]: principalConfig
    };

    public static getConfig(role: string): RoleDashboard | undefined {
        return this.configs[role];
    }

    public static getLayout(role: string): DashboardLayout | undefined {
        return this.configs[role]?.layouts;
    }

    public static getWidgetsForRole(role: string): DashboardWidget[] {
        const widgetIds = this.configs[role]?.widgets || [];
        return widgetIds
            .map(id => getWidgetById(id))
            .filter((w): w is DashboardWidget => w !== undefined);
    }
}

export default DashboardRegistry;
