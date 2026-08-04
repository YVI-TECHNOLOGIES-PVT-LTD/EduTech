import React from 'react';
import { Inbox, LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    title?: string;
    message?: string;
    /** Optional Lucide icon to override the default Inbox icon */
    icon?: LucideIcon;
    /** Optional call-to-action rendered below the message */
    action?: React.ReactNode;
    /** Compact mode — smaller minimum height for inline use */
    compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    title = 'No Data Available',
    message = 'There are no active records in this reporting range.',
    icon: Icon = Inbox,
    action,
    compact = false
}) => {
    return (
        <div className={`flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 dark:bg-card/10 border border-dashed border-gray-200 dark:border-border/40 rounded-3xl animate-in fade-in duration-300 ${compact ? 'min-h-[120px] py-5' : 'min-h-[250px]'}`}>
            <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-card flex items-center justify-center text-gray-400 mb-4 border border-gray-200 dark:border-border/40">
                <Icon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-gray-900 dark:text-white mb-1.5 uppercase tracking-wide">{title}</h3>
            <p className="text-xs text-muted-foreground max-w-sm font-medium leading-relaxed">{message}</p>
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
};

export default EmptyState;
