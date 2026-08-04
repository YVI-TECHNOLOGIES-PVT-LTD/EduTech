import type { PaymentRecordStatus } from '../utils/finance.mapper';

interface PaymentFiltersProps {
    status: string;
    onStatusChange: (status: string) => void;
}

const OPTIONS: { value: string; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'SUBMITTED', label: 'Submitted' },
    { value: 'VERIFIED', label: 'Verified' },
    { value: 'FAILED', label: 'Failed' },
    { value: 'REJECTED', label: 'Rejected' },
];

export function PaymentFilters({ status, onStatusChange }: PaymentFiltersProps) {
    return (
        <div className="flex flex-wrap gap-2">
            {OPTIONS.map(opt => (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => onStatusChange(opt.value as PaymentRecordStatus | 'all')}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase border transition-all ${
                        status === opt.value
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-200'
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

export default PaymentFilters;
