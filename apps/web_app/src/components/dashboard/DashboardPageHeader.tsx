import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DashboardPageHeaderProps {
  title: string;
  description?: string;
  badge?: {
    text: string;
    variant?: 'primary' | 'success' | 'warning' | 'info' | 'neutral' | 'purple';
    icon?: LucideIcon;
  };
  actions?: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}

const badgeVariants = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  success:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
  warning:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
  info: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800',
  purple:
    'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800',
  neutral: 'bg-muted text-muted-foreground border-border',
};

export const DashboardPageHeader: React.FC<DashboardPageHeaderProps> = ({
  title,
  description,
  badge,
  actions,
  icon: HeaderIcon,
  className,
}) => {
  const BadgeIcon = badge?.icon;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-7 text-white shadow-md border border-slate-800/80',
        className,
      )}
    >
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          {badge && (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-sm',
                  badgeVariants[badge.variant || 'primary'],
                )}
              >
                {BadgeIcon && <BadgeIcon className="w-3.5 h-3.5 shrink-0" />}
                <span>{badge.text}</span>
              </span>
            </div>
          )}
          <div className="flex items-center gap-3">
            {HeaderIcon && (
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm text-indigo-300 shrink-0">
                <HeaderIcon className="w-6 h-6" />
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {title}
            </h1>
          </div>
          {description && (
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 md:pt-0">{actions}</div>
        )}
      </div>
    </div>
  );
};
