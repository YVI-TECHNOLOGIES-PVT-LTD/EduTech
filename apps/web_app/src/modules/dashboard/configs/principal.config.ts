import { RoleDashboard } from '../types/dashboard.types';
import { DASHBOARD_CONSTANTS } from '../constants/DashboardConstants';
import { LAYOUT_REGISTRY } from '../registry/LayoutRegistry';

export const principalConfig: RoleDashboard = {
    role: DASHBOARD_CONSTANTS.ROLES.PRINCIPAL,
    layouts: LAYOUT_REGISTRY[DASHBOARD_CONSTANTS.ROLES.PRINCIPAL],
    widgets: ['principal.kpi.conversions'],
    refreshConfig: {
        intervalMs: DASHBOARD_CONSTANTS.REFRESH_INTERVALS.KPI,
        enabled: true
    }
};

export default principalConfig;
