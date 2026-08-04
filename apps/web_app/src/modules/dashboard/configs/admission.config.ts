import { RoleDashboard } from '../types/dashboard.types';
import { DASHBOARD_CONSTANTS } from '../constants/DashboardConstants';
import { LAYOUT_REGISTRY } from '../registry/LayoutRegistry';

export const admissionConfig: RoleDashboard = {
    role: DASHBOARD_CONSTANTS.ROLES.COUNSELOR, // maps to counselor role
    layouts: LAYOUT_REGISTRY[DASHBOARD_CONSTANTS.ROLES.COUNSELOR],
    widgets: ['counselor.kpi.leads'],
    refreshConfig: {
        intervalMs: DASHBOARD_CONSTANTS.REFRESH_INTERVALS.KPI,
        enabled: true
    }
};

export default admissionConfig;
