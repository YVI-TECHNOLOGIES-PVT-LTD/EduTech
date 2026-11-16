import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({
    title = "No data found",
    description = "There are no items to display at this time.",
    icon: Icon = Inbox,
    action
}: {
    title?: string;
    description?: string;
    icon?: React.ComponentType<any>;
    action?: React.ReactNode;
}) => (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-card rounded-2xl border border-dashed border-border/80 max-w-lg mx-auto my-4 animate-fade-in">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 border border-indigo-200/80 dark:border-indigo-800 shadow-sm">
            <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-base font-extrabold text-foreground leading-tight">{title}</h3>
        <p className="text-xs font-medium text-muted-foreground leading-relaxed mt-1.5 max-w-xs">{description}</p>
        {action && <div className="mt-5">{action}</div>}
    </div>
);

