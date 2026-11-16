import React from 'react';
import { BellOff } from 'lucide-react';

interface NotificationEmptyStateProps {
  title?: string;
  description?: string;
}

export const NotificationEmptyState: React.FC<NotificationEmptyStateProps> = ({
  title = 'No notifications',
  description = "You're all caught up! New alerts and updates will appear here.",
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center select-none animate-fade-in">
      <div className="w-12 h-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mb-3 shadow-xs border border-border/50">
        <BellOff className="w-6 h-6 stroke-[1.5]" />
      </div>
      <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-[240px] leading-relaxed">
        {description}
      </p>
    </div>
  );
};
