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
    <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50/50 dark:bg-muted/10 rounded-3xl border border-dashed border-border/80 max-w-lg mx-auto my-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-2xl bg-primary/5 dark:bg-primary/10 flex items-center justify-center text-primary mb-5 shadow-premium-sm">
            <Icon className="w-7 h-7" />
        </div>
        <h3 className="text-base font-black text-gray-900 leading-tight">{title}</h3>
        <p className="text-xs font-semibold text-muted-foreground leading-relaxed mt-2 max-w-xs">{description}</p>
        {action && <div className="mt-6">{action}</div>}
    </div>
);

