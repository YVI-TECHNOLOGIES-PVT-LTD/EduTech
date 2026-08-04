/**
 * DashboardWidgetRegistry
 * 
 * Every dashboard widget self-registers here.
 * Dashboards consume this registry to render configuration-driven layouts
 * instead of hardcoded component trees.
 * 
 * As new ERP modules are added (Library, Hostel, HR, Finance etc.),
 * they simply add their widget entry here — no dashboard page changes needed.
 */

export type WidgetSize = 'sm' | 'md' | 'lg' | 'full';
export type WidgetCategory = 'analytics' | 'activity' | 'calendar' | 'alerts' | 'quick-actions' | 'info';

export interface DashboardWidget {
    /** Unique identifier — used for layout persistence */
    id: string;
    /** Display name */
    title: string;
    /** Short description of what the widget shows */
    description: string;
    /** Widget display size hint */
    defaultSize: WidgetSize;
    /** Category for grouping in widget picker */
    category: WidgetCategory;
    /** Which roles can see this widget */
    allowedRoles: string[];
    /** Optional feature flag — widget is hidden if flag is disabled */
    featureFlag?: string;
    /** Module that owns this widget */
    module: string;
    /** Icon name (Lucide) */
    icon: string;
    /** Whether the widget is enabled by default in new dashboard layouts */
    defaultEnabled: boolean;
}

export const DASHBOARD_WIDGET_REGISTRY: DashboardWidget[] = [
    // ── Attendance ────────────────────────────────────────────────────────────
    {
        id: 'attendance-summary',
        title: 'Attendance Summary',
        description: 'Today\'s class-wise attendance percentage at a glance.',
        defaultSize: 'md',
        category: 'analytics',
        allowedRoles: ['ADMIN', 'HEAD_OF_INSTITUTE', 'FACULTY'],
        module: 'attendance',
        icon: 'CalendarCheck',
        defaultEnabled: true,
    },
    {
        id: 'student-attendance-percent',
        title: 'My Attendance',
        description: 'Personal attendance percentage with trend indicator.',
        defaultSize: 'sm',
        category: 'info',
        allowedRoles: ['STUDENT'],
        module: 'attendance',
        icon: 'Activity',
        defaultEnabled: true,
    },

    // ── Admissions ────────────────────────────────────────────────────────────
    {
        id: 'admission-pipeline',
        title: 'Admission Pipeline',
        description: 'Lead → Application → Review → Offer → Enrolled funnel.',
        defaultSize: 'lg',
        category: 'analytics',
        allowedRoles: ['ADMIN', 'HEAD_OF_INSTITUTE'],
        module: 'admission',
        icon: 'UserPlus',
        defaultEnabled: true,
    },
    {
        id: 'admission-officer-queue',
        title: 'Review Queue',
        description: 'Pending applications awaiting your review.',
        defaultSize: 'md',
        category: 'activity',
        allowedRoles: ['ADMIN'],
        module: 'admission',
        icon: 'ClipboardList',
        defaultEnabled: true,
    },

    // ── Finance & Fees ────────────────────────────────────────────────────────
    {
        id: 'fee-collection-today',
        title: 'Fee Collection Today',
        description: 'Total fees collected today vs target.',
        defaultSize: 'sm',
        category: 'analytics',
        allowedRoles: ['ADMIN', 'HEAD_OF_INSTITUTE'],
        module: 'fees',
        icon: 'DollarSign',
        defaultEnabled: true,
    },
    {
        id: 'fee-defaulters',
        title: 'Fee Defaulters',
        description: 'Students with overdue fee payments.',
        defaultSize: 'md',
        category: 'alerts',
        allowedRoles: ['ADMIN'],
        module: 'fees',
        icon: 'AlertCircle',
        defaultEnabled: true,
    },
    {
        id: 'student-fee-due',
        title: 'My Fee Status',
        description: 'Personal outstanding fee amount and due date.',
        defaultSize: 'sm',
        category: 'alerts',
        allowedRoles: ['STUDENT', 'PARENT'],
        module: 'fees',
        icon: 'Wallet',
        defaultEnabled: true,
    },

    // ── Examinations ─────────────────────────────────────────────────────────
    {
        id: 'upcoming-exams-admin',
        title: 'Upcoming Exams',
        description: 'Exam schedule across all classes for the next 30 days.',
        defaultSize: 'md',
        category: 'calendar',
        allowedRoles: ['ADMIN', 'EXAM_CELL_ADMIN'],
        module: 'exam',
        icon: 'GraduationCap',
        defaultEnabled: true,
    },
    {
        id: 'student-upcoming-exams',
        title: 'My Upcoming Exams',
        description: 'Personal exam schedule with countdown.',
        defaultSize: 'sm',
        category: 'calendar',
        allowedRoles: ['STUDENT'],
        module: 'exam',
        icon: 'GraduationCap',
        defaultEnabled: true,
    },

    // ── Announcements ─────────────────────────────────────────────────────────
    {
        id: 'announcements-feed',
        title: 'Announcements',
        description: 'Latest school announcements and circulars.',
        defaultSize: 'md',
        category: 'activity',
        allowedRoles: ['ADMIN', 'HEAD_OF_INSTITUTE', 'FACULTY', 'STUDENT', 'PARENT'],
        module: 'announcements',
        icon: 'Bell',
        defaultEnabled: true,
    },

    // ── Transport ─────────────────────────────────────────────────────────────
    {
        id: 'transport-live-trips',
        title: 'Live Trips',
        description: 'Active bus trips with GPS status.',
        defaultSize: 'lg',
        category: 'info',
        allowedRoles: ['ADMIN', 'TRANSPORT_ADMIN'],
        featureFlag: 'biometric_sync',
        module: 'transport',
        icon: 'Bus',
        defaultEnabled: true,
    },
    {
        id: 'student-transport-info',
        title: 'My Bus Info',
        description: 'Route, stop, pickup and drop timings.',
        defaultSize: 'sm',
        category: 'info',
        allowedRoles: ['STUDENT', 'PARENT'],
        module: 'transport',
        icon: 'MapPin',
        defaultEnabled: true,
    },

    // ── Quick Actions ─────────────────────────────────────────────────────────
    {
        id: 'admin-quick-actions',
        title: 'Quick Actions',
        description: 'Frequently used admin operations.',
        defaultSize: 'md',
        category: 'quick-actions',
        allowedRoles: ['ADMIN', 'HEAD_OF_INSTITUTE'],
        module: 'core',
        icon: 'Zap',
        defaultEnabled: true,
    },
    {
        id: 'student-quick-actions',
        title: 'Quick Actions',
        description: 'Fast access to student self-service features.',
        defaultSize: 'md',
        category: 'quick-actions',
        allowedRoles: ['STUDENT'],
        module: 'core',
        icon: 'Zap',
        defaultEnabled: true,
    },

    // ── Calendar ──────────────────────────────────────────────────────────────
    {
        id: 'academic-calendar',
        title: 'Academic Calendar',
        description: 'Holidays, exam weeks, and events for this academic year.',
        defaultSize: 'lg',
        category: 'calendar',
        allowedRoles: ['ADMIN', 'FACULTY', 'STUDENT', 'PARENT'],
        module: 'core',
        icon: 'Calendar',
        defaultEnabled: false,
    },

    // ── Performance ───────────────────────────────────────────────────────────
    {
        id: 'student-performance-chart',
        title: 'My Performance',
        description: 'Exam marks trend chart across subjects.',
        defaultSize: 'lg',
        category: 'analytics',
        allowedRoles: ['STUDENT', 'PARENT'],
        module: 'exam',
        icon: 'TrendingUp',
        defaultEnabled: true,
    },

    // ── Library ───────────────────────────────────────────────────────────────
    {
        id: 'student-library-books',
        title: 'Library Books',
        description: 'Books currently issued and due dates.',
        defaultSize: 'sm',
        category: 'info',
        allowedRoles: ['STUDENT'],
        featureFlag: 'student_sis_foundation',
        module: 'library',
        icon: 'Library',
        defaultEnabled: false,
    },
];

/**
 * Get widgets available for a specific role.
 */
export const getWidgetsForRole = (role: string): DashboardWidget[] => {
    return DASHBOARD_WIDGET_REGISTRY.filter(w => w.allowedRoles.includes(role));
};

/**
 * Get default-enabled widgets for a specific role.
 */
export const getDefaultWidgetsForRole = (role: string): DashboardWidget[] => {
    return getWidgetsForRole(role).filter(w => w.defaultEnabled);
};
