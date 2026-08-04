import React from 'react';

interface QueueFiltersProps {
    currentFilter: string;
    onFilterChange: (filter: string) => void;
    filters: { id: string; label: string; count: number }[];
}

export const QueueFilters: React.FC<QueueFiltersProps> = ({
    currentFilter,
    onFilterChange,
    filters
}) => {
    return (
        <div className="flex gap-2 pb-2 overflow-x-auto shrink-0 scrollbar-none">
            {filters.map(filter => (
                <button
                    key={filter.id}
                    onClick={() => onFilterChange(filter.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-black transition-all flex items-center gap-1.5 border whitespace-nowrap ${
                        currentFilter === filter.id
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-white dark:bg-card text-muted-foreground border-border hover:bg-gray-50'
                    }`}
                >
                    <span>{filter.label}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                        currentFilter === filter.id
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-100 dark:bg-card-hover text-muted-foreground'
                    }`}>
                        {filter.count}
                    </span>
                </button>
            ))}
        </div>
    );
};

export default QueueFilters;
