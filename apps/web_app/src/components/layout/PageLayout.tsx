import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'full' | 'narrow';
  children: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  variant = 'default',
  className,
  children,
  ...props
}) => {
  const widthClasses = {
    default: 'max-w-7xl mx-auto',
    full: 'w-full',
    narrow: 'max-w-4xl mx-auto',
  };

  return (
    <div
      className={cn(
        'p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 w-full animate-in fade-in duration-300',
        widthClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  badge,
  actions,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-card p-6 rounded-3xl border border-slate-100 dark:border-border shadow-xs',
        className,
      )}
    >
      <div className="space-y-1 max-w-3xl">
        {badge && <div className="mb-1">{badge}</div>}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-border">
          {actions}
        </div>
      )}
    </div>
  );
};

export interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={cn('flex items-center justify-between gap-4 mb-4', className)}>
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export interface PageErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const PageErrorState: React.FC<PageErrorStateProps> = ({
  title = 'Failed to load page data',
  message = 'An unexpected error occurred while communicating with the server.',
  onRetry,
}) => {
  return (
    <div className="p-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-3xl text-red-800 dark:text-red-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <h4 className="text-sm font-bold">{title}</h4>
          <p className="text-xs text-red-600 dark:text-red-400">{message}</p>
        </div>
      </div>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="h-9 px-4 text-xs font-bold rounded-xl border-red-300 text-red-700 hover:bg-red-100 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Retry
        </Button>
      )}
    </div>
  );
};

export { EmptyState };
