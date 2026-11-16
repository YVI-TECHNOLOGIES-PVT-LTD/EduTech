import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export type KpiColorVariant =
  'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral';

export interface DashboardKpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: KpiColorVariant;
  trend?: {
    value: string | number;
    label?: string;
    direction?: 'up' | 'down' | 'neutral';
    isPositive?: boolean;
  };
  loading?: boolean;
  className?: string;
  onClick?: () => void;
}

const variantStyles: Record<
  KpiColorVariant,
  {
    iconBg: string;
    iconColor: string;
    accentBorder: string;
  }
> = {
  primary: {
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/60',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    accentBorder: 'hover:border-indigo-200 dark:hover:border-indigo-800',
  },
  success: {
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    accentBorder: 'hover:border-emerald-200 dark:hover:border-emerald-800',
  },
  warning: {
    iconBg: 'bg-amber-50 dark:bg-amber-950/60',
    iconColor: 'text-amber-600 dark:text-amber-400',
    accentBorder: 'hover:border-amber-200 dark:hover:border-amber-800',
  },
  danger: {
    iconBg: 'bg-rose-50 dark:bg-rose-950/60',
    iconColor: 'text-rose-600 dark:text-rose-400',
    accentBorder: 'hover:border-rose-200 dark:hover:border-rose-800',
  },
  info: {
    iconBg: 'bg-sky-50 dark:bg-sky-950/60',
    iconColor: 'text-sky-600 dark:text-sky-400',
    accentBorder: 'hover:border-sky-200 dark:hover:border-sky-800',
  },
  purple: {
    iconBg: 'bg-purple-50 dark:bg-purple-950/60',
    iconColor: 'text-purple-600 dark:text-purple-400',
    accentBorder: 'hover:border-purple-200 dark:hover:border-purple-800',
  },
  neutral: {
    iconBg: 'bg-slate-100 dark:bg-slate-800',
    iconColor: 'text-slate-600 dark:text-slate-400',
    accentBorder: 'hover:border-slate-300 dark:hover:border-slate-700',
  },
};

export const DashboardKpiCard: React.FC<DashboardKpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'primary',
  trend,
  loading = false,
  className,
  onClick,
}) => {
  const currentVariant = variantStyles[variant];

  if (loading) {
    return (
      <div
        className={cn(
          'p-5 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col justify-between h-full min-h-[120px]',
          className,
        )}
      >
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
        <div className="mt-3 space-y-1.5">
          <Skeleton className="h-8 w-20 rounded" />
          <Skeleton className="h-3 w-32 rounded" />
        </div>
      </div>
    );
  }

  const isInteractive = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-card border border-border/80 p-5 shadow-sm transition-all duration-200 flex flex-col justify-between',
        currentVariant.accentBorder,
        isInteractive && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider line-clamp-1">
          {title}
        </span>
        {Icon && (
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105',
              currentVariant.iconBg,
              currentVariant.iconColor,
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {value}
          </span>
          {trend && (
            <div
              className={cn(
                'flex items-center text-xs font-semibold px-2 py-0.5 rounded-full',
                trend.direction === 'up' || trend.isPositive === true
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                  : trend.direction === 'down' || trend.isPositive === false
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
              )}
            >
              {trend.direction === 'up' || trend.isPositive === true ? (
                <TrendingUp className="w-3.5 h-3.5 mr-1" />
              ) : trend.direction === 'down' || trend.isPositive === false ? (
                <TrendingDown className="w-3.5 h-3.5 mr-1" />
              ) : (
                <Minus className="w-3.5 h-3.5 mr-1" />
              )}
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        {(subtitle || trend?.label) && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
            {subtitle || trend?.label}
          </p>
        )}
      </div>
    </div>
  );
};
