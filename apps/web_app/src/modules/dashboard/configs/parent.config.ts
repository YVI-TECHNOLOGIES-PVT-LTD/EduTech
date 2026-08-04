import { RoleDashboard } from '../types/dashboard.types';
import { DASHBOARD_CONSTANTS } from '../constants/DashboardConstants';
import { LAYOUT_REGISTRY } from '../registry/LayoutRegistry';

export const parentConfig: RoleDashboard = {
    role: DASHBOARD_CONSTANTS.ROLES.PARENT,
    layouts: LAYOUT_REGISTRY[DASHBOARD_CONSTANTS.ROLES.PARENT],
    widgets: ['student.kpi.attendance', 'student.kpi.fees_due'],
    refreshConfig: {
        intervalMs: DASHBOARD_CONSTANTS.REFRESH_INTERVALS.KPI,
        enabled: true
    }
};

export default parentConfig;
