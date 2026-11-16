import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface DashboardErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const DashboardErrorState: React.FC<DashboardErrorStateProps> = ({
  title = 'Failed to Load Content',
  message = 'An unexpected error occurred while loading this section.',
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 text-rose-700 dark:text-rose-400',
        className,
      )}
    >
      <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center mb-2.5 text-rose-600 dark:text-rose-400">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-bold">{title}</h4>
      <p className="text-xs text-rose-600/80 dark:text-rose-400/80 max-w-sm mt-1 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-3 gap-1.5 rounded-xl border-rose-200 hover:bg-rose-100 text-rose-700 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-900/50 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </Button>
      )}
    </div>
  );
};
