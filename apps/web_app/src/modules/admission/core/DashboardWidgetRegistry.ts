import React from 'react';
import { FileText, Clock, Users, AlertTriangle, TrendingUp } from 'lucide-react';

export interface DashboardWidget {
    id: string;
    title: string;
    description: string;
    type: 'kpi' | 'alert' | 'chart' | 'activity';
    permission?: string;
    order: number;
}

export const DASHBOARD_WIDGET_REGISTRY: Record<string, DashboardWidget> = {
    TOTAL_APPLICATIONS: {
        id: 'TOTAL_APPLICATIONS',
        title: 'Applications Received',
        description: 'Total cumulative candidate applications logged in ERP.',
        type: 'kpi',
        order: 1,
    },
    IN_PROGRESS: {
        id: 'IN_PROGRESS',
        title: 'Active In Progress',
        description: 'Applications active in workflow processing queues.',
        type: 'kpi',
        order: 2,
    },
    ENROLLED: {
        id: 'ENROLLED',
        title: 'Enrolled Students',
        description: 'Candidates fully provisioned to SIS Student Master.',
        type: 'kpi',
        order: 3,
    },
    SLA_BREACHED: {
        id: 'SLA_BREACHED',
        title: 'SLA Breaches',
        description: 'Admissions overdue and exceeding target hours.',
        type: 'alert',
        order: 4,
    },
    CONVERSION_FUNNEL: {
        id: 'CONVERSION_FUNNEL',
        title: 'Conversion Pipeline',
        description: 'Drop-off analytics stage by stage.',
        type: 'chart',
        order: 5,
    },
    ACTIVITY_LOG: {
        id: 'ACTIVITY_LOG',
        title: 'Audit Feed',
        description: 'Sequential transition events.',
        type: 'activity',
        order: 6,
    },
};

export const REGISTERED_WIDGET_LIST = Object.values(DASHBOARD_WIDGET_REGISTRY).sort((a, b) => a.order - b.order);
