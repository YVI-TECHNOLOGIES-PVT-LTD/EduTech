import {
    LayoutDashboard,
    Users,
    ListTodo,
    FolderCheck,
    CalendarDays,
    Trophy,
    Send,
    DollarSign,
    UserCheck,
    BarChart3,
    Settings,
    type LucideIcon,
} from 'lucide-react';

export interface WorkspaceItem {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    permission?: string;
    badgeKey?: string;
    order: number;
}

export const ADMISSION_WORKSPACES: Record<string, WorkspaceItem> = {
    DASHBOARD: {
        id: 'DASHBOARD',
        title: 'Dashboard Summary',
        description: 'Aggregate KPIs, SLA health, recent notifications, and operational charts.',
        icon: LayoutDashboard,
        order: 1,
    },
    APPLICATIONS: {
        id: 'APPLICATIONS',
        title: 'All Applications',
        description: 'Comprehensive list and Kanban CRM pipeline view of candidates.',
        icon: Users,
        permission: 'admission.review',
        order: 2,
    },
    QUEUES: {
        id: 'QUEUES',
        title: 'My Queue & Tasks',
        description: 'SLA priority queues, assignments, escalated cases, and pending tasks.',
        icon: ListTodo,
        permission: 'admission.review',
        order: 3,
    },
    DOCUMENTS: {
        id: 'DOCUMENTS',
        title: 'Documents Verification',
        description: 'Review and verify applicant transcripts, ID proofs, and certificates.',
        icon: FolderCheck,
        permission: 'admission.review',
        order: 4,
    },
    INTERVIEWS: {
        id: 'INTERVIEWS',
        title: 'Interview Center',
        description: 'Manage panel schedules, evaluate scorecards, and record ratings.',
        icon: CalendarDays,
        permission: 'admission.review',
        order: 5,
    },
    MERIT: {
        id: 'MERIT',
        title: 'Merit Selection',
        description: 'Generate, review, and compile academic merit lists for Principal signoff.',
        icon: Trophy,
        permission: 'admission.review',
        order: 6,
    },
    OFFERS: {
        id: 'OFFERS',
        title: 'Offer Management',
        description: 'Issue, tracking, generate, and process letter acceptances or withdrawals.',
        icon: Send,
        permission: 'admission.review',
        order: 7,
    },
    FINANCE: {
        id: 'FINANCE',
        title: 'Finance & Billing',
        description: 'Initialize billing structures, collect payments, and audit waivers/scholarships.',
        icon: DollarSign,
        permission: 'fees.structure.view',
        order: 8,
    },
    ENROLLMENT: {
        id: 'ENROLLMENT',
        title: 'SIS Enrollment Processing',
        description: 'Finalize details, assign sections/rolls, and provision to active ERP records.',
        icon: UserCheck,
        permission: 'admission.review',
        order: 9,
    },
    REPORTS: {
        id: 'REPORTS',
        title: 'Reports & Analytics',
        description: 'Funnel conversions, counselor workloads, and SLA compliance metrics.',
        icon: BarChart3,
        permission: 'admission.review',
        order: 10,
    },
    SETTINGS: {
        id: 'SETTINGS',
        title: 'Workspace Settings',
        description: 'Manage admission criteria configurations and template maps.',
        icon: Settings,
        permission: 'admission.review',
        order: 11,
    },
};

export const WORKSPACE_LIST = Object.values(ADMISSION_WORKSPACES).sort((a, b) => a.order - b.order);
