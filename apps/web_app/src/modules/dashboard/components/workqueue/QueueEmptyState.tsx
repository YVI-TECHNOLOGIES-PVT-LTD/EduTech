import React from 'react';
import { ClipboardCheck } from 'lucide-react';

interface QueueEmptyStateProps {
    title?: string;
    description?: string;
}

export const QueueEmptyState: React.FC<QueueEmptyStateProps> = ({
    title = 'All Caught Up!',
    description = 'No outstanding tasks are pending in your queue.'
}) => {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-border/60 rounded-2xl bg-gray-50/30 dark:bg-card/10">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/10 flex items-center justify-center text-emerald-500 mb-3 border border-emerald-100 dark:border-emerald-900/20">
                <ClipboardCheck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                {title}
            </h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                {description}
            </p>
        </div>
    );
};

export default QueueEmptyState;
