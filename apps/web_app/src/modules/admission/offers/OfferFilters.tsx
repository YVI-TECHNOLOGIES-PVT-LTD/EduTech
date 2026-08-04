import type { OfferStatus } from '../utils/offer.mapper';

interface OfferFiltersProps {
    status: string;
    onStatusChange: (status: string) => void;
}

const OPTIONS: { value: string; label: string }[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'SENT', label: 'Sent' },
    { value: 'ACCEPTED', label: 'Accepted' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'EXPIRED', label: 'Expired' },
    { value: 'DEFERRED', label: 'Deferred' },
];

export function OfferFilters({ status, onStatusChange }: OfferFiltersProps) {
    return (
        <div className="flex flex-wrap gap-2">
            {OPTIONS.map(opt => (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => onStatusChange(opt.value as OfferStatus | 'all')}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase border transition-all ${
                        status === opt.value
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-rose-200'
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

export default OfferFilters;
