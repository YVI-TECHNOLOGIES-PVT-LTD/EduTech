import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DashboardSectionProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
}) => {
  return (
    <section className={cn('space-y-4', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-0.5">
            {title && (
              <div className="flex items-center gap-2">
                {Icon && <Icon className="w-4 h-4 text-primary" />}
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                  {title}
                </h2>
              </div>
            )}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
};
