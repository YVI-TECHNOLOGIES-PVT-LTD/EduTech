import React from 'react';

export const QueueLoading: React.FC = () => {
    return (
        <div className="space-y-3 w-full">
            {[1, 2, 3].map(i => (
                <div key={i} className="p-4 bg-white dark:bg-card border border-border/40 rounded-2xl animate-pulse space-y-3">
                    <div className="flex justify-between items-center">
                        <div className="h-4 w-1/3 bg-gray-100 dark:bg-card-hover rounded"></div>
                        <div className="h-4 w-16 bg-gray-100 dark:bg-card-hover rounded-full"></div>
                    </div>
                    <div className="h-3 w-2/3 bg-gray-100 dark:bg-card-hover rounded"></div>
                    <div className="flex justify-between items-center pt-2">
                        <div className="h-3 w-24 bg-gray-100 dark:bg-card-hover rounded"></div>
                        <div className="h-5 w-16 bg-gray-100 dark:bg-card-hover rounded-lg"></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default QueueLoading;
