import React, { useState } from 'react';
import { Search as SearchIcon, X, SlidersHorizontal, Command } from 'lucide-react';

interface SearchProps {
    onSearch: (query: string, filters: any) => void;
    placeholder?: string;
}

export function Search({ onSearch, placeholder = "Quick search applicant name or code..." }: SearchProps) {
    const [query, setQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [stageFilter, setStageFilter] = useState('ALL');

    const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        onSearch(val, { stage: stageFilter });
    };

    const handleStageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setStageFilter(val);
        onSearch(query, { stage: val });
    };

    const clearSearch = () => {
        setQuery('');
        onSearch('', { stage: stageFilter });
    };

    return (
        <div className="space-y-2">
            <div className="relative flex items-center">
                <SearchIcon className="absolute left-3 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    value={query}
                    onChange={handleQueryChange}
                    placeholder={placeholder}
                    className="w-full pl-9 pr-20 py-2.5 bg-gray-50 border border-gray-200 text-xs rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-gray-700"
                />
                
                <div className="absolute right-2 flex items-center gap-1">
                    {query && (
                        <button onClick={clearSearch} className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-1.5 rounded-lg border text-gray-400 hover:text-indigo-600 transition-colors ${
                            showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-200'
                        }`}
                    >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                    </button>
                    <span className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                        <Command className="w-2.5 h-2.5" /> K
                    </span>
                </div>
            </div>

            {showFilters && (
                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between gap-4 animate-fadeIn">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Filters:</span>
                    <div className="flex-1 flex gap-2">
                        <select
                            value={stageFilter}
                            onChange={handleStageChange}
                            className="flex-1 py-1 px-2 bg-white border border-gray-200 rounded-lg text-[11px] font-medium text-gray-700 focus:outline-none"
                        >
                            <option value="ALL">All Stages</option>
                            <option value="NEW">New</option>
                            <option value="UNDER_REVIEW">Under Review</option>
                            <option value="DOCUMENT_CHECK">Document Check</option>
                            <option value="ENTRANCE_EXAM">Entrance Exam</option>
                            <option value="INTERVIEW">Interview</option>
                            <option value="MERIT_LIST">Merit List</option>
                            <option value="OFFER_SENT">Offer Sent</option>
                            <option value="FEES_PENDING">Fees Pending</option>
                            <option value="ENROLLED">Enrolled</option>
                        </select>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Search;
