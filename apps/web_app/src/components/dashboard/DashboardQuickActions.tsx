import React from 'react';
import { LucideIcon, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface QuickActionItem {
  title: string;
  description?: string;
  icon: LucideIcon;
  to?: string;
  onClick?: () => void;
  badge?: string;
  iconColor?: string;
  iconBg?: string;
}

export interface DashboardQuickActionsProps {
  actions: QuickActionItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export const DashboardQuickActions: React.FC<DashboardQuickActionsProps> = ({
  actions,
  columns = 3,
  className,
}) => {
  const colClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[columns];

  return (
    <div className={cn('grid gap-4', colClass, className)}>
      {actions.map((action, idx) => {
        const Icon = action.icon;
        const content = (
          <div className="flex items-start justify-between gap-3 w-full">
            <div className="flex items-start gap-3.5">
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105',
                  action.iconBg || 'bg-primary/10',
                  action.iconColor || 'text-primary',
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    {action.title}
                  </h4>
                  {action.badge && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
                      {action.badge}
                    </span>
                  )}
                </div>
                {action.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {action.description}
                  </p>
                )}
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
          </div>
        );

        const cardClasses =
          'group relative p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 flex items-center';

        if (action.to) {
          return (
            <Link key={idx} to={action.to} className={cardClasses}>
              {content}
            </Link>
          );
        }

        return (
          <button
            key={idx}
            type="button"
            onClick={action.onClick}
            className={cn(cardClasses, 'text-left w-full')}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
};
