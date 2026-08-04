import React from 'react';
import { Input } from '../../../../components/ui/input';
import { Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

interface SearchToolbarProps {
    searchText: string;
    onSearchChange: (text: string) => void;
    sortBy: string;
    onSortByChange: (sort: string) => void;
    sortOrder: 'asc' | 'desc';
    onSortOrderChange: (order: 'asc' | 'desc') => void;
}

export const SearchToolbar: React.FC<SearchToolbarProps> = ({
    searchText,
    onSearchChange,
    sortBy,
    onSortByChange,
    sortOrder,
    onSortOrderChange
}) => {
    return (
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-card p-4 rounded-2xl border border-gray-100 shadow-premium-sm">
            <div className="relative flex-grow w-full">
                <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-400" />
                <Input
                    type="text"
                    placeholder="Search by keywords, tags, or question descriptions..."
                    value={searchText}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10 h-10 rounded-xl border-gray-200 text-xs font-bold bg-white"
                />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-between sm:justify-start">
                <div className="flex items-center gap-1">
                    <ArrowUpDown className="w-4 h-4 text-gray-400" />
                    <select
                        value={sortBy}
                        onChange={(e) => onSortByChange(e.target.value)}
                        className="h-10 border border-gray-200 rounded-xl text-xs font-bold bg-white text-gray-700 px-3 cursor-pointer outline-none"
                    >
                        <option value="created_at">Date Created</option>
                        <option value="points">Marks</option>
                        <option value="difficulty">Difficulty</option>
                        <option value="version">Version</option>
                    </select>
                </div>

                <button
                    onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="h-10 px-3 border border-gray-200 rounded-xl text-xs font-black text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1.5 transition-all bg-white"
                >
                    Order: <span className="text-primary uppercase">{sortOrder}</span>
                </button>
            </div>
        </div>
    );
};
export default SearchToolbar;
