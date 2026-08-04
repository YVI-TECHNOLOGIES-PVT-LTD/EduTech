import { Search } from 'lucide-react';

interface VerificationFiltersProps {
    query: string;
    onQueryChange: (q: string) => void;
    statusFilter: string;
    onStatusFilterChange: (s: string) => void;
}

const STATUS_OPTIONS = [
    { value: 'all', label: 'All statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'verified', label: 'Verified' },
    { value: 'correction', label: 'Correction' },
    { value: 'missing', label: 'Missing' },
];

export function VerificationFilters({
    query,
    onQueryChange,
    statusFilter,
    onStatusFilterChange,
}: VerificationFiltersProps) {
    return (
        <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    value={query}
                    onChange={e => onQueryChange(e.target.value)}
                    placeholder="Search documents…"
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                />
            </div>
            <select
                value={statusFilter}
                onChange={e => onStatusFilterChange(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
            >
                {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
}

export default VerificationFilters;
