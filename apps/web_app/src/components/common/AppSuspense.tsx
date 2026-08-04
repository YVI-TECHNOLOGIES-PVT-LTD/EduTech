import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

interface AppSuspenseProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const AppSuspense = ({ children, fallback }: AppSuspenseProps) => {
    const defaultFallback = (
        <div className="h-[60vh] flex flex-col items-center justify-center animate-in fade-in duration-300">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-sm font-semibold text-gray-500">Loading module views...</p>
        </div>
    );

    return (
        <Suspense fallback={fallback || defaultFallback}>
            {children}
        </Suspense>
    );
};
export default AppSuspense;
