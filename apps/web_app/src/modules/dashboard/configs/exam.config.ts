import { RoleDashboard } from '../types/dashboard.types';
import { DASHBOARD_CONSTANTS } from '../constants/DashboardConstants';
import { LAYOUT_REGISTRY } from '../registry/LayoutRegistry';

export const examConfig: RoleDashboard = {
    role: DASHBOARD_CONSTANTS.ROLES.EXAM_CELL,
    layouts: LAYOUT_REGISTRY[DASHBOARD_CONSTANTS.ROLES.EXAM_CELL],
    widgets: ['exam.kpi.upcoming', 'exam.chart.grades'],
    refreshConfig: {
        intervalMs: DASHBOARD_CONSTANTS.REFRESH_INTERVALS.KPI,
        enabled: true
    }
};

export default examConfig;
