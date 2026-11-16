import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface DashboardEmptyStateProps {
  title?: string;
  message?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  compact?: boolean;
}

export const DashboardEmptyState: React.FC<DashboardEmptyStateProps> = ({
  title = 'No Data Available',
  message = 'There is currently no data or activity to display for this section.',
  icon: Icon = Inbox,
  action,
  className,
  compact = false,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-xl p-6 text-muted-foreground',
        compact ? 'py-6 px-4' : 'py-10 px-6',
        className,
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mb-3 text-muted-foreground/80">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-bold text-foreground">{title}</h4>
      {message && (
        <p className="text-xs text-muted-foreground max-w-sm mt-1 leading-relaxed">{message}</p>
      )}
      {action && (
        <Button
          variant="outline"
          size="sm"
          onClick={action.onClick}
          className="mt-4 rounded-xl text-xs font-semibold"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};
