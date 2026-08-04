import React from 'react';

interface QueuePriorityBadgeProps {
    priority: 'low' | 'medium' | 'high' | 'urgent';
}

export const QueuePriorityBadge: React.FC<QueuePriorityBadgeProps> = ({ priority }) => {
    const styles: Record<string, string> = {
        low: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-900/30',
        medium: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/30',
        high: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 border-orange-100 dark:border-orange-900/30',
        urgent: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 border-rose-100 dark:border-rose-900/30 font-black animate-pulse'
    };

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${styles[priority] || styles.low}`}>
            {priority}
        </span>
    );
};

export default QueuePriorityBadge;
