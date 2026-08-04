import { RoleDashboard } from '../types/dashboard.types';
import { DASHBOARD_CONSTANTS } from '../constants/DashboardConstants';
import { LAYOUT_REGISTRY } from '../registry/LayoutRegistry';

export const studentConfig: RoleDashboard = {
    role: DASHBOARD_CONSTANTS.ROLES.STUDENT,
    layouts: LAYOUT_REGISTRY[DASHBOARD_CONSTANTS.ROLES.STUDENT],
    widgets: ['student.kpi.attendance', 'student.kpi.fees_due'],

    refreshConfig: {
        intervalMs: DASHBOARD_CONSTANTS.REFRESH_INTERVALS.KPI,
        enabled: true
    }
};

export default studentConfig;
