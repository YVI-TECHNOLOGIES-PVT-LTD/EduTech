export interface DashboardTrend {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    percentage?: number;
    label?: string;
}

export interface DashboardMetric {
    id: string;
    label: string;
    value: string | number;
    trend?: DashboardTrend;
    subtext?: string;
    format?: 'currency' | 'number' | 'percentage' | 'text';
}

export interface DashboardCard extends DashboardMetric {
    icon?: string;
    color?: string;
}

export interface DashboardActivity {
    id: string;
    title: string;
    description: string;
    timestamp: string;
    category?: string;
    user?: {
        name: string;
        avatarUrl?: string;
    };
    metadata?: Record<string, any>;
}

export interface DashboardTask {
    id: string;
    title: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'waiting' | 'escalated';
    dueDate?: string;
    assignedTo?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    description?: string;
    entityId?: string;
    entityType?: string;
}

export interface DashboardChartDataPoint {
    name: string;
    [key: string]: string | number;
}

export interface DashboardChart {
    id: string;
    type: 'bar' | 'line' | 'area' | 'pie' | 'radar';
    title: string;
    subtitle?: string;
    data: DashboardChartDataPoint[];
    series: {
        key: string;
        label: string;
        color?: string;
    }[];
}

export interface DashboardNotification {
    id: string;
    title: string;
    message: string;
    read: boolean;
    timestamp: string;
    type: 'info' | 'warning' | 'error' | 'success';
}

export interface DashboardFilter {
    campusId?: string;
    academicYearId?: string;
    departmentId?: string;
    branchId?: string;
    dateRange?: {
        start: string;
        end: string;
    };
    status?: string;
    classId?: string;
    sectionId?: string;
}

export interface DashboardInsight {
    id: string;
    title: string;
    summary: string;
    type: 'positive' | 'negative' | 'neutral';
    score?: number;
}

export interface DashboardAlert {
    id: string;
    severity: 'info' | 'warning' | 'error';
    message: string;
    dismissible: boolean;
}

export interface DashboardWidgetPermission {
    permission: string;
    action?: string;
}

export interface DashboardRefreshConfig {
    intervalMs: number;
    enabled: boolean;
}

export interface DashboardQueryConfig {
    staleTimeMs: number;
    cacheTimeMs: number;
    retryCount: number;
}

export interface DashboardWidget {
    id: string;
    title: string;
    description?: string;
    type: 'kpi' | 'chart' | 'activity' | 'task' | 'notification' | 'alert' | 'custom';
    component: string;
    refreshConfig?: DashboardRefreshConfig;
    permissionConfig?: DashboardWidgetPermission;
}

export interface DashboardLayout {
    columns: number;
    rows: {
        id: string;
        height?: string;
        widgets: {
            widgetId: string;
            span: number;
        }[];
    }[];
}

export interface RoleDashboard {
    role: string;
    layouts: DashboardLayout;
    widgets: string[];
    refreshConfig: DashboardRefreshConfig;
}
