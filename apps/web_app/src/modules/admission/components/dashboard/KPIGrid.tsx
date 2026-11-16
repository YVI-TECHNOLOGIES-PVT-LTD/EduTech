import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import {
  PhoneCall,
  Users,
  FileText,
  CheckCircle2,
  Receipt,
  GraduationCap,
} from 'lucide-react';
import { KPICard } from './KPICard';

export interface KPIMetricsData {
  totalInquiries: number;
  activeLeads: number;
  totalApplications: number;
  applicationsSubmitted: number;
  feesCollected: number;
  admissionsEnrolled: number;
  currency?: string;
  inquiriesTrend?: number;
  applicationsTrend?: number;
}

export interface KPIGridProps {
  data: KPIMetricsData;
  isLoading?: boolean;
  onCardClick?: (metricKey: string) => void;
}

export const KPIGrid: React.FC<KPIGridProps> = ({
  data,
  isLoading = false,
  onCardClick,
}) => {
  const { t } = useLanguage();
  const currencySymbol = data.currency || '₹';

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `${currencySymbol}${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (amount >= 100000) {
      return `${currencySymbol}${(amount / 100000).toFixed(2)} L`;
    }
    if (amount >= 1000) {
      return `${currencySymbol}${(amount / 1000).toFixed(1)}k`;
    }
    return `${currencySymbol}${amount.toLocaleString()}`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* 1. Total Inquiries */}
      <KPICard
        title={t('dashboard.frontOffice.kpis.totalInquiries', 'Total Inquiries')}
        value={data.totalInquiries.toLocaleString()}
        icon={PhoneCall}
        iconColor="text-indigo-600 dark:text-indigo-400"
        iconBg="bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/60"
        trend={
          data.inquiriesTrend !== undefined
            ? {
                value: data.inquiriesTrend,
                isPositive: data.inquiriesTrend >= 0,
                periodText: t('dashboard.frontOffice.kpis.comparisonPeriod', 'vs prior period'),
              }
            : undefined
        }
        subtitle="All inquiry leads"
        isLoading={isLoading}
        onClick={() => onCardClick?.('inquiries')}
      />

      {/* 2. Active Leads */}
      <KPICard
        title={t('dashboard.frontOffice.kpis.activeLeads', 'Active Leads')}
        value={data.activeLeads.toLocaleString()}
        icon={Users}
        iconColor="text-cyan-600 dark:text-cyan-400"
        iconBg="bg-cyan-50 dark:bg-cyan-950/40 border-cyan-100 dark:border-cyan-900/60"
        badgeText="Pipeline"
        badgeVariant="info"
        subtitle="Inquiry & Qualified"
        isLoading={isLoading}
        onClick={() => onCardClick?.('leads')}
      />

      {/* 3. Total Applications */}
      <KPICard
        title={t('dashboard.frontOffice.kpis.totalApplications', 'Total Applications')}
        value={data.totalApplications.toLocaleString()}
        icon={FileText}
        iconColor="text-blue-600 dark:text-blue-400"
        iconBg="bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/60"
        trend={
          data.applicationsTrend !== undefined
            ? {
                value: data.applicationsTrend,
                isPositive: data.applicationsTrend >= 0,
                periodText: t('dashboard.frontOffice.kpis.comparisonPeriod', 'vs prior period'),
              }
            : undefined
        }
        subtitle="All candidate files"
        isLoading={isLoading}
        onClick={() => onCardClick?.('applications')}
      />

      {/* 4. Submitted & In Review */}
      <KPICard
        title={t('dashboard.frontOffice.kpis.applicationsSubmitted', 'Submitted & In Review')}
        value={data.applicationsSubmitted.toLocaleString()}
        icon={CheckCircle2}
        iconColor="text-amber-600 dark:text-amber-400"
        iconBg="bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/60"
        badgeText="In Review"
        badgeVariant="warning"
        subtitle="Action pending"
        isLoading={isLoading}
        onClick={() => onCardClick?.('submitted')}
      />

      {/* 5. Fees Collected */}
      <KPICard
        title={t('dashboard.frontOffice.kpis.feesCollected', 'Fees Collected')}
        value={formatCurrency(data.feesCollected)}
        icon={Receipt}
        iconColor="text-emerald-600 dark:text-emerald-400"
        iconBg="bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/60"
        badgeText="Realized"
        badgeVariant="success"
        subtitle="Total fee receipts"
        isLoading={isLoading}
        onClick={() => onCardClick?.('fees')}
      />

      {/* 6. Admitted / Enrolled Students */}
      <KPICard
        title={t('dashboard.frontOffice.kpis.admissionsEnrolled', 'Admitted / Enrolled')}
        value={data.admissionsEnrolled.toLocaleString()}
        icon={GraduationCap}
        iconColor="text-purple-600 dark:text-purple-400"
        iconBg="bg-purple-50 dark:bg-purple-950/40 border-purple-100 dark:border-purple-900/60"
        badgeText="Enrolled"
        badgeVariant="purple"
        subtitle="Confirmed students"
        isLoading={isLoading}
        onClick={() => onCardClick?.('enrolled')}
      />
    </div>
  );
};
