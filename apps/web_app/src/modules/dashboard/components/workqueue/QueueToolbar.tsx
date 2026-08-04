import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

interface QueueToolbarProps {
    search: string;
    onSearchChange: (val: string) => void;
    sortBy: string;
    onSortByChange: (val: string) => void;
}

export const QueueToolbar: React.FC<QueueToolbarProps> = ({
    search,
    onSearchChange,
    sortBy,
    onSortByChange
}) => {
    return (
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pb-3 border-b border-border/40">
            <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Filter queue tasks..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-white dark:bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                <select
                    value={sortBy}
                    onChange={(e) => onSortByChange(e.target.value)}
                    className="py-1.5 px-3 rounded-xl border border-border bg-white dark:bg-card text-xs text-muted-foreground focus:outline-none"
                >
                    <option value="due_asc">Sort: Due Date (Earliest)</option>
                    <option value="due_desc">Sort: Due Date (Latest)</option>
                    <option value="priority_desc">Sort: Priority (High to Low)</option>
                    <option value="created_desc">Sort: Date Logged</option>
                </select>
            </div>
        </div>
    );
};

export default QueueToolbar;
