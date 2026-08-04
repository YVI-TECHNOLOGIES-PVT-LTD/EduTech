import React from 'react';

interface LoadingSkeletonProps {
    type?: 'kpi' | 'chart' | 'list';
    count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
    type = 'kpi',
    count = 3
}) => {
    const renderKPI = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="p-6 bg-white border border-gray-100 rounded-3xl shadow-premium-sm animate-pulse space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-200" />
                    <div className="space-y-2">
                        <div className="h-3 w-20 bg-gray-200 rounded" />
                        <div className="h-6 w-32 bg-gray-200 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );

    const renderChart = () => (
        <div className="w-full p-6 bg-white border border-gray-100 rounded-3xl shadow-premium-sm animate-pulse space-y-4 min-h-[300px]">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <div className="h-4 w-40 bg-gray-200 rounded" />
                    <div className="h-3 w-60 bg-gray-200 rounded" />
                </div>
                <div className="h-8 w-24 bg-gray-200 rounded-lg" />
            </div>
            <div className="flex-1 bg-gray-100 rounded-2xl min-h-[200px]" />
        </div>
    );

    const renderList = () => (
        <div className="w-full p-6 bg-white border border-gray-100 rounded-3xl shadow-premium-sm animate-pulse space-y-4">
            <div className="h-4 w-48 bg-gray-200 rounded mb-6" />
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 rounded-full bg-gray-200" />
                        <div className="space-y-1.5 flex-1">
                            <div className="h-3 w-1/3 bg-gray-200 rounded" />
                            <div className="h-2 w-1/2 bg-gray-200 rounded" />
                        </div>
                    </div>
                    <div className="h-6 w-16 bg-gray-200 rounded-full" />
                </div>
            ))}
        </div>
    );

    if (type === 'chart') return renderChart();
    if (type === 'list') return renderList();
    return renderKPI();
};

export default LoadingSkeleton;
