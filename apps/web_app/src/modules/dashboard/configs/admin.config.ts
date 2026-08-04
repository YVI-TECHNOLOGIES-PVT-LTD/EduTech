import { RoleDashboard } from '../types/dashboard.types';
import { DASHBOARD_CONSTANTS } from '../constants/DashboardConstants';
import { LAYOUT_REGISTRY } from '../registry/LayoutRegistry';

export const adminConfig: RoleDashboard = {
    role: DASHBOARD_CONSTANTS.ROLES.ADMIN,
    layouts: LAYOUT_REGISTRY[DASHBOARD_CONSTANTS.ROLES.ADMIN],
    widgets: ['admin.kpi.admissions', 'admin.chart.enrollment_trends'],


    refreshConfig: {
        intervalMs: DASHBOARD_CONSTANTS.REFRESH_INTERVALS.KPI,
        enabled: true
    }
};

export default adminConfig;
