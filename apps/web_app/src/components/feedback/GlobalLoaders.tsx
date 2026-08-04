import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingOverlay = ({ message = 'Loading ERP session...' }: { message?: string }) => {
    return (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-sm font-bold text-gray-700 font-sans tracking-wide">{message}</p>
            </div>
        </div>
    );
};

export const ButtonSpinner = ({ label = 'Saving...' }: { label?: string }) => {
    return (
        <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-current" />
            {label}
        </span>
    );
};

export const TableSkeleton = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => {
    return (
        <div className="w-full space-y-4 animate-pulse">
            <div className="h-10 bg-gray-100 rounded-lg w-full mb-6" />
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-4 py-2 border-b border-gray-100">
                    {Array.from({ length: cols }).map((_, j) => (
                        <div
                            key={j}
                            className={`h-6 bg-gray-100 rounded ${
                                j === 0 ? 'w-1/4' : j === 1 ? 'w-1/3' : 'w-1/6'
                            }`}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};

export const PageLoader = () => {
    return (
        <div className="h-[50vh] w-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
    );
};
