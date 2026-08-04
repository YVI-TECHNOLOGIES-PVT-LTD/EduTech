import { DashboardWidget } from '../types/dashboard.types';
import { DASHBOARD_CONSTANTS } from '../constants/DashboardConstants';

// ─── Extended Widget Definition ──────────────────────────────────────────────

export interface WidgetVisibilityConfig {
    /** Required permission string — widget hidden if user lacks this */
    permission?: string;
    /** Required role(s) — at least one must match */
    roles?: string[];
    /** Feature flag key — widget hidden if flag is disabled */
    featureFlag?: string;
    /** Whether the widget requires non-empty data to render */
    requiresData?: boolean;
}

export interface DashboardWidgetV2 extends DashboardWidget {
    visibilityConfig?: WidgetVisibilityConfig;
    /** Module identifier (e.g. 'admissions', 'fees') — for cross-module widgets */
    module?: string;
}

// ─── Validation Helper ────────────────────────────────────────────────────────

export interface WidgetValidationContext {
    userRoles: string[];
    userPermissions: string[];
    enabledFeatureFlags: string[];
    hasData: boolean;
}

export function isWidgetVisible(
    widget: DashboardWidgetV2,
    ctx: WidgetValidationContext
): boolean {
    const vc = widget.visibilityConfig;
    if (!vc) return true; // No restrictions → always visible

    // Super Admin bypasses all checks
    if (ctx.userRoles.includes('SUPERADMIN')) return true;

    // 1. Permission check
    if (vc.permission) {
        if (!ctx.userPermissions.includes(vc.permission)) return false;
    }

    // 2. Feature flag check
    if (vc.featureFlag) {
        if (!ctx.enabledFeatureFlags.includes(vc.featureFlag)) return false;
    }

    // 3. Data presence check
    if (vc.requiresData && !ctx.hasData) return false;

    return true;
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export const WIDGET_REGISTRY: Record<string, DashboardWidgetV2> = {
    // ── Admin Widgets ────────────────────────────────────────────────────────
    'admin.kpi.admissions': {
        id: 'admin.kpi.admissions',
        title: 'New Admissions',
        type: 'kpi',
        component: 'AdminKPIAdmissions',
        module: 'admissions',
        permissionConfig: { permission: 'dashboard.admin.view' },
        visibilityConfig: { roles: ['ADMIN'], permission: 'dashboard.admin.view' }
    },
    'admin.chart.enrollment_trends': {
        id: 'admin.chart.enrollment_trends',
        title: 'Enrollment Trends',
        type: 'chart',
        component: 'AdminEnrollmentChart',
        module: 'admissions',
        permissionConfig: { permission: 'dashboard.admin.view' },
        visibilityConfig: { roles: ['ADMIN'], permission: 'dashboard.admin.view', requiresData: true }
    },

    // ── Faculty Widgets ──────────────────────────────────────────────────────
    'faculty.kpi.classes_today': {
        id: 'faculty.kpi.classes_today',
        title: 'Classes Today',
        type: 'kpi',
        component: 'FacultyKPIClasses',
        module: 'academic',
        permissionConfig: { permission: 'dashboard.faculty.view' },
        visibilityConfig: { roles: ['FACULTY'], permission: 'dashboard.faculty.view' }
    },
    'faculty.kpi.my_sections': {
        id: 'faculty.kpi.my_sections',
        title: 'My Sections',
        type: 'kpi',
        component: 'FacultyKPISections',
        module: 'academic',
        permissionConfig: { permission: 'dashboard.faculty.view' },
        visibilityConfig: { roles: ['FACULTY'], permission: 'dashboard.faculty.view' }
    },
    'faculty.kpi.pending_works': {
        id: 'faculty.kpi.pending_works',
        title: 'Pending Submissions',
        type: 'kpi',
        component: 'FacultyKPIPending',
        module: 'exams',
        permissionConfig: { permission: 'dashboard.faculty.view' },
        visibilityConfig: { roles: ['FACULTY'], permission: 'dashboard.faculty.view' }
    },

    // ── Student & Parent Widgets ─────────────────────────────────────────────
    'student.kpi.attendance': {
        id: 'student.kpi.attendance',
        title: 'Attendance Rate',
        type: 'kpi',
        component: 'StudentKPIAttendance',
        module: 'attendance',
        permissionConfig: { permission: 'student.view' },
        visibilityConfig: { permission: 'student.view' }
    },
    'student.kpi.fees_due': {
        id: 'student.kpi.fees_due',
        title: 'Outstanding Fees',
        type: 'kpi',
        component: 'StudentKPIFees',
        module: 'fees',
        permissionConfig: { permission: 'student.view' },
        visibilityConfig: { permission: 'student.view' }
    },


    // ── Admissions Workspace Widgets ─────────────────────────────────────────
    'reception.kpi.walkins': {
        id: 'reception.kpi.walkins',
        title: 'Walk-ins Today',
        type: 'kpi',
        component: 'ReceptionKPIWalkins',
        module: 'admissions',
        permissionConfig: { permission: 'admission.crm.view' },
        visibilityConfig: { roles: ['RECEPTIONIST', 'FRONT_DESK'], permission: 'admission.crm.view' }
    },
    'counselor.kpi.leads': {
        id: 'counselor.kpi.leads',
        title: 'Assigned Leads',
        type: 'kpi',
        component: 'CounselorKPILeads',
        module: 'admissions',
        permissionConfig: { permission: 'admission.crm.view' },
        visibilityConfig: { roles: ['COUNSELOR', 'COUNSELLOR'], permission: 'admission.crm.view' }
    },
    'officer.kpi.reviews': {
        id: 'officer.kpi.reviews',
        title: 'Pending Reviews',
        type: 'kpi',
        component: 'OfficerKPIReviews',
        module: 'admissions',
        permissionConfig: { permission: 'admission.review' },
        visibilityConfig: { roles: ['ADMISSION_OFFICER'], permission: 'admission.review' }
    },
    'finance.kpi.ledger': {
        id: 'finance.kpi.ledger',
        title: 'Outstanding Dues',
        type: 'kpi',
        component: 'FinanceKPILedger',
        module: 'fees',
        permissionConfig: { permission: 'fee.verify' },
        visibilityConfig: { roles: ['FINANCE_OFFICER', 'ACCOUNTANT'], permission: 'fee.verify' }
    },
    'principal.kpi.conversions': {
        id: 'principal.kpi.conversions',
        title: 'Funnel Yield',
        type: 'kpi',
        component: 'PrincipalKPIConversions',
        module: 'admissions',
        permissionConfig: { permission: 'admission.approve' },
        visibilityConfig: { roles: ['PRINCIPAL', 'HOI', 'HEAD_OF_INSTITUTE'], permission: 'admission.approve' }
    },

    // ── Exam Widgets ─────────────────────────────────────────────────────────
    'exam.kpi.upcoming': {
        id: 'exam.kpi.upcoming',
        title: 'Upcoming Exams',
        type: 'kpi',
        component: 'ExamKPIUpcoming',
        module: 'exams',
        permissionConfig: { permission: 'exam.view' },
        visibilityConfig: { permission: 'exam.view' }
    },
    'exam.chart.grades': {
        id: 'exam.chart.grades',
        title: 'Performance Distribution',
        type: 'chart',
        component: 'ExamGradesChart',
        module: 'exams',
        permissionConfig: { permission: 'exam.view' },
        visibilityConfig: { permission: 'exam.view', requiresData: true }
    },

    // ── Cross-Module Widgets (Sprint 3.3.10) ──────────────────────────────────
    'cross.admin.finance_overview': {
        id: 'cross.admin.finance_overview',
        title: 'Finance Overview',
        type: 'kpi',
        component: 'AdminFinanceCrossWidget',
        module: 'fees',
        permissionConfig: { permission: 'dashboard.admin.view' },
        visibilityConfig: { roles: ['ADMIN', 'PRINCIPAL'], permission: 'dashboard.admin.view' }
    },
    'cross.admin.attendance_summary': {
        id: 'cross.admin.attendance_summary',
        title: 'Attendance Summary',
        type: 'kpi',
        component: 'AdminAttendanceCrossWidget',
        module: 'attendance',
        permissionConfig: { permission: 'dashboard.admin.view' },
        visibilityConfig: { roles: ['ADMIN', 'PRINCIPAL', 'HOI'], permission: 'dashboard.admin.view' }
    },
    'cross.principal.exam_progress': {
        id: 'cross.principal.exam_progress',
        title: 'Exam Progress',
        type: 'kpi',
        component: 'PrincipalExamCrossWidget',
        module: 'exams',
        permissionConfig: { permission: 'exam.view' },
        visibilityConfig: { roles: ['PRINCIPAL', 'HOI', 'ADMIN'], permission: 'exam.view' }
    },
    'cross.admissions.finance_pending': {
        id: 'cross.admissions.finance_pending',
        title: 'Pending Fee Verifications',
        type: 'kpi',
        component: 'AdmissionsFinanceCrossWidget',
        module: 'fees',
        permissionConfig: { permission: 'fee.verify' },
        visibilityConfig: { roles: ['ADMISSION_OFFICER', 'FINANCE_OFFICER'], permission: 'fee.verify' }
    }
};

export const getWidgetById = (id: string): DashboardWidgetV2 | undefined => {
    return WIDGET_REGISTRY[id];
};

export const getWidgetsForRole = (
    role: string,
    ctx: WidgetValidationContext
): DashboardWidgetV2[] => {
    return Object.values(WIDGET_REGISTRY).filter(w => isWidgetVisible(w, ctx));
};

export default WIDGET_REGISTRY;
