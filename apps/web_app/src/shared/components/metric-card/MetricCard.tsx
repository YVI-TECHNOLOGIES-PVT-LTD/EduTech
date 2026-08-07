import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
    label?: string;
  };
  subtitle?: string;
  className?: string;
  iconColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  className,
  iconColor = 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
}) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {Icon && (
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', iconColor)}>
            <Icon size={20} />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {value}
        </span>
        {trend && (
          <div
            className={cn(
              'flex items-center text-xs font-bold',
              trend.isPositive ? 'text-emerald-600' : 'text-rose-600',
            )}
          >
            {trend.isPositive ? (
              <TrendingUp size={14} className="mr-1" />
            ) : (
              <TrendingDown size={14} className="mr-1" />
            )}
            <span>{trend.value}</span>
          </div>
        )}
      </div>

      {(subtitle || trend?.label) && (
        <p className="mt-1 text-xs text-slate-400">{subtitle || trend?.label}</p>
      )}
    </div>
  );
};
