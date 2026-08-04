import React from 'react';
import { RefreshCw } from 'lucide-react';

interface RetryButtonProps {
    onClick: () => void;
    label?: string;
    loading?: boolean;
}

export const RetryButton: React.FC<RetryButtonProps> = ({
    onClick,
    label = 'Retry Load',
    loading = false
}) => {
    return (
        <button
            onClick={onClick}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-primary/95 transition-all shadow-sm disabled:opacity-50"
        >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {label}
        </button>
    );
};

export default RetryButton;
