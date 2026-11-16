/**
 * EduTrack ERP — Widget & Queue Types Definition
 * Core task-driven dashboard widget interfaces for Stage-1 and Stage-2 evolution.
 */

export interface WidgetQueueMetric {
  count: number;
  label: string;
  urgentCount?: number;
}

export interface DashboardWidget {
  id: string;
  title: string;
  description: string;
  category:
    'leads' | 'applications' | 'documents' | 'payments' | 'enrollment' | 'followups' | 'parent';
  actionRoute: string;
  actionLabel: string;
  permission?: string;
  permissions?: string[];
  featurePackage?: string;
  icon?: string;
  badgeColor?: 'blue' | 'amber' | 'emerald' | 'purple' | 'red' | 'indigo';
  defaultMetric?: WidgetQueueMetric;
}

export interface WidgetRegistry {
  workspaceWidgets: DashboardWidget[];
  parentWidgets: DashboardWidget[];
}
