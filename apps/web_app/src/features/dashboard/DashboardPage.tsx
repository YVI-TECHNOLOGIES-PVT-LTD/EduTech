import React from 'react';
import { useGetDashboardSummaryQuery } from '@/shared/api/dashboard.api';
import { DashboardKpiGrid } from './components/DashboardKpiGrid';
import { AdmissionFunnelChart } from './components/AdmissionFunnelChart';
import { QuickActionsBar } from './components/QuickActionsBar';
import { PendingTasksWidget } from './components/PendingTasksWidget';
import { RecentActivitiesFeed } from './components/RecentActivitiesFeed';
import { PageLoader } from '@/shared/loading/PageLoader';

export const DashboardPage: React.FC = () => {
  const { data: summary, isLoading } = useGetDashboardSummaryQuery();

  if (isLoading) {
    return <PageLoader message="Loading Enterprise Dashboard metrics..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Executive Admin Dashboard
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Stage-1 Core Operations Overview & Conversion Lifecycle Analytics
        </p>
      </div>

      {/* KPI Cards */}
      <DashboardKpiGrid kpis={summary?.kpis} isLoading={isLoading} />

      {/* Quick Actions Shortcuts */}
      <QuickActionsBar />

      {/* Main Grid: Funnel Chart & Tasks */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AdmissionFunnelChart funnel={summary?.funnel} />
        </div>
        <div>
          <PendingTasksWidget tasks={summary?.pendingTasks} />
        </div>
      </div>

      {/* Audit Activity Feed */}
      <RecentActivitiesFeed activities={summary?.recentActivities} />
    </div>
  );
};

export default DashboardPage;
