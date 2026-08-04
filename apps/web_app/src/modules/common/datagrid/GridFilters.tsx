import React from 'react';
import { SlidersHorizontal } from 'lucide-react';

interface GridFiltersProps {
    groupBy: string;
    onGroupByChange: (group: string) => void;
    options: { value: string; label: string }[];
}

export function GridFilters({ groupBy, onGroupByChange, options }: GridFiltersProps) {
    return (
        <div className="flex items-center gap-1.5 text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground font-bold uppercase text-[10px]">Group By</span>
            <select
                value={groupBy}
                onChange={e => onGroupByChange(e.target.value)}
                className="bg-background border border-border rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none cursor-pointer"
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
