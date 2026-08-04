import { RoleDashboard } from '../types/dashboard.types';
import { DASHBOARD_CONSTANTS } from '../constants/DashboardConstants';
import { LAYOUT_REGISTRY } from '../registry/LayoutRegistry';

export const receptionConfig: RoleDashboard = {
    role: DASHBOARD_CONSTANTS.ROLES.RECEPTIONIST,
    layouts: LAYOUT_REGISTRY[DASHBOARD_CONSTANTS.ROLES.RECEPTIONIST],
    widgets: ['reception.kpi.walkins'],
    refreshConfig: {
        intervalMs: DASHBOARD_CONSTANTS.REFRESH_INTERVALS.KPI,
        enabled: true
    }
};

export default receptionConfig;
