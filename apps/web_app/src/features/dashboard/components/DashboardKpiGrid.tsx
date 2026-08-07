import React from 'react';
import { Target, FileText, UserCheck, ClipboardCheck, CreditCard, TrendingUp } from 'lucide-react';
import { MetricCard } from '@/shared/components/metric-card/MetricCard';
import { APP_CONFIG } from '@/config/app';

interface DashboardKpiGridProps {
  kpis?: {
    totalLeads: number;
    activeApplications: number;
    studentsEnrolled: number;
    pendingAssessments: number;
    feeCollectionTotal: number;
    conversionRate: number;
  };
  isLoading?: boolean;
}

export const DashboardKpiGrid: React.FC<DashboardKpiGridProps> = ({ kpis, isLoading }) => {
  const data = kpis || {
    totalLeads: 124,
    activeApplications: 48,
    studentsEnrolled: 32,
    pendingAssessments: 12,
    feeCollectionTotal: 485000,
    conversionRate: 25.8,
  };

  const formattedFee = `${APP_CONFIG.currency.symbol}${data.feeCollectionTotal.toLocaleString()}`;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <MetricCard
        title="Total Leads"
        value={data.totalLeads}
        icon={Target}
        trend={{ value: '+14%', isPositive: true, label: 'vs last month' }}
        iconColor="bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
      />
      <MetricCard
        title="Active Applications"
        value={data.activeApplications}
        icon={FileText}
        trend={{ value: '+8%', isPositive: true, label: 'vs last month' }}
        iconColor="bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
      />
      <MetricCard
        title="Enrolled Students"
        value={data.studentsEnrolled}
        icon={UserCheck}
        trend={{ value: '+22%', isPositive: true, label: 'Stage-1 complete' }}
        iconColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
      />
      <MetricCard
        title="Pending Assessments"
        value={data.pendingAssessments}
        icon={ClipboardCheck}
        subtitle="Requires action"
        iconColor="bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
      />
      <MetricCard
        title="Fee Collection"
        value={formattedFee}
        icon={CreditCard}
        trend={{ value: '+18%', isPositive: true }}
        iconColor="bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
      />
      <MetricCard
        title="Conversion Rate"
        value={`${data.conversionRate}%`}
        icon={TrendingUp}
        trend={{ value: '+3.2%', isPositive: true }}
        iconColor="bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400"
      />
    </div>
  );
};
