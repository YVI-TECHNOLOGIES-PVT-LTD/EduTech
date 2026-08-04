import { RoleDashboard } from '../types/dashboard.types';
import { DASHBOARD_CONSTANTS } from '../constants/DashboardConstants';
import { LAYOUT_REGISTRY } from '../registry/LayoutRegistry';

export const facultyConfig: RoleDashboard = {
    role: DASHBOARD_CONSTANTS.ROLES.FACULTY,
    layouts: LAYOUT_REGISTRY[DASHBOARD_CONSTANTS.ROLES.FACULTY],
    widgets: ['faculty.kpi.classes_today', 'faculty.kpi.my_sections', 'faculty.kpi.pending_works'],
    refreshConfig: {
        intervalMs: DASHBOARD_CONSTANTS.REFRESH_INTERVALS.KPI,
        enabled: true
    }
};

export default facultyConfig;
