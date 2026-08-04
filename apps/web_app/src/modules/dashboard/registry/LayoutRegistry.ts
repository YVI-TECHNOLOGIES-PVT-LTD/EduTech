import { DashboardLayout } from '../types/dashboard.types';
import { DASHBOARD_CONSTANTS } from '../constants/DashboardConstants';

export const LAYOUT_REGISTRY: Record<string, DashboardLayout> = {
    [DASHBOARD_CONSTANTS.ROLES.ADMIN]: {
        columns: 12,
        rows: [
            {
                id: 'admin-kpis-row',
                height: 'auto',
                widgets: [
                    { widgetId: 'admin.kpi.admissions', span: 12 }
                ]
            },
            {
                id: 'admin-charts-row',
                height: '400px',
                widgets: [
                    { widgetId: 'admin.chart.enrollment_trends', span: 12 }
                ]
            }
        ]
    },
    [DASHBOARD_CONSTANTS.ROLES.FACULTY]: {
        columns: 12,
        rows: [
            {
                id: 'faculty-kpis-row',
                height: 'auto',
                widgets: [
                    { widgetId: 'faculty.kpi.classes_today', span: 4 },
                    { widgetId: 'faculty.kpi.my_sections', span: 4 },
                    { widgetId: 'faculty.kpi.pending_works', span: 4 }
                ]
            }
        ]
    },
    [DASHBOARD_CONSTANTS.ROLES.STUDENT]: {
        columns: 12,
        rows: [
            {
                id: 'student-kpis-row',
                height: 'auto',
                widgets: [
                    { widgetId: 'student.kpi.attendance', span: 6 },
                    { widgetId: 'student.kpi.fees_due', span: 6 }
                ]
            },
        ]
    },
    [DASHBOARD_CONSTANTS.ROLES.PARENT]: {
        columns: 12,
        rows: [
            {
                id: 'parent-kpis-row',
                height: 'auto',
                widgets: [
                    { widgetId: 'student.kpi.attendance', span: 6 },
                    { widgetId: 'student.kpi.fees_due', span: 6 }
                ]
            }
        ]
    },
    [DASHBOARD_CONSTANTS.ROLES.RECEPTIONIST]: {
        columns: 12,
        rows: [
            {
                id: 'receptionist-kpis-row',
                widgets: [{ widgetId: 'reception.kpi.walkins', span: 12 }]
            }
        ]
    },
    [DASHBOARD_CONSTANTS.ROLES.COUNSELOR]: {
        columns: 12,
        rows: [
            {
                id: 'counselor-kpis-row',
                widgets: [{ widgetId: 'counselor.kpi.leads', span: 12 }]
            }
        ]
    },
    [DASHBOARD_CONSTANTS.ROLES.ADMISSION_OFFICER]: {
        columns: 12,
        rows: [
            {
                id: 'officer-kpis-row',
                widgets: [{ widgetId: 'officer.kpi.reviews', span: 12 }]
            }
        ]
    },
    [DASHBOARD_CONSTANTS.ROLES.FINANCE]: {
        columns: 12,
        rows: [
            {
                id: 'finance-kpis-row',
                widgets: [{ widgetId: 'finance.kpi.ledger', span: 12 }]
            }
        ]
    },
    [DASHBOARD_CONSTANTS.ROLES.PRINCIPAL]: {
        columns: 12,
        rows: [
            {
                id: 'principal-kpis-row',
                widgets: [{ widgetId: 'principal.kpi.conversions', span: 12 }]
            }
        ]
    },
    [DASHBOARD_CONSTANTS.ROLES.EXAM_CELL]: {
        columns: 12,
        rows: [
            {
                id: 'exam-kpis-row',
                widgets: [{ widgetId: 'exam.kpi.upcoming', span: 12 }]
            },
            {
                id: 'exam-charts-row',
                widgets: [{ widgetId: 'exam.chart.grades', span: 12 }]
            }
        ]
    }
};

export const getLayoutByRole = (role: string): DashboardLayout | undefined => {
    return LAYOUT_REGISTRY[role];
};

export default LAYOUT_REGISTRY;
