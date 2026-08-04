import React from 'react';
import { AlertCircle } from 'lucide-react';
import { RetryButton } from './RetryButton';

interface ErrorStateProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    retryLoading?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
    title = 'Connection Interrupted',
    message = 'We encountered an error retrieving your analytics data. Please check your connection and try again.',
    onRetry,
    retryLoading = false
}) => {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-red-500/5 border border-red-500/10 rounded-3xl min-h-[250px] animate-in fade-in duration-300">
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 mb-4 border border-red-200">
                <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-gray-900 mb-1.5 uppercase tracking-wide">{title}</h3>
            <p className="text-xs text-muted-foreground max-w-sm mb-6 font-medium leading-relaxed">{message}</p>
            {onRetry && (
                <RetryButton onClick={onRetry} loading={retryLoading} />
            )}
        </div>
    );
};

export default ErrorState;
