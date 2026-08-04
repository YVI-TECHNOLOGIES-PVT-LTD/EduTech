import { RoleDashboard } from '../types/dashboard.types';
import { DASHBOARD_CONSTANTS } from '../constants/DashboardConstants';
import { LAYOUT_REGISTRY } from '../registry/LayoutRegistry';

export const financeConfig: RoleDashboard = {
    role: DASHBOARD_CONSTANTS.ROLES.FINANCE,
    layouts: LAYOUT_REGISTRY[DASHBOARD_CONSTANTS.ROLES.FINANCE],
    widgets: ['finance.kpi.ledger'],
    refreshConfig: {
        intervalMs: DASHBOARD_CONSTANTS.REFRESH_INTERVALS.KPI,
        enabled: true
    }
};

export default financeConfig;
