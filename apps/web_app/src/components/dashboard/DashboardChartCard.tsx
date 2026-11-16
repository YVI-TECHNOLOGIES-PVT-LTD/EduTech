import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardEmptyState } from './DashboardEmptyState';
import { DashboardErrorState } from './DashboardErrorState';

export interface DashboardChartCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  className?: string;
  contentClassName?: string;
  minHeight?: number | string;
}

export const DashboardChartCard: React.FC<DashboardChartCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  children,
  loading = false,
  error = null,
  onRetry,
  isEmpty = false,
  emptyTitle = 'No Analytical Data',
  emptyMessage = 'No data points recorded for the current reporting window.',
  className,
  contentClassName,
  minHeight = 280,
}) => {
  return (
    <div
      className={cn(
        'rounded-2xl bg-card border border-border/80 p-5 sm:p-6 shadow-sm flex flex-col justify-between transition-all duration-200',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-primary shrink-0" />}
            <h3 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
              {title}
            </h3>
          </div>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      <div
        className={cn('w-full flex-1 flex flex-col justify-center', contentClassName)}
        style={{ minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight }}
      >
        {loading ? (
          <div className="w-full h-full flex flex-col justify-center gap-3 p-4">
            <Skeleton className="h-6 w-3/4 rounded" />
            <Skeleton className="h-44 w-full rounded-xl" />
            <div className="flex justify-between gap-2 pt-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ) : error ? (
          <DashboardErrorState message={error} onRetry={onRetry} />
        ) : isEmpty ? (
          <DashboardEmptyState title={emptyTitle} message={emptyMessage} />
        ) : (
          children
        )}
      </div>
    </div>
  );
};
