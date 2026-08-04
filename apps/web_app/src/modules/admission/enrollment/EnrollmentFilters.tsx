import type { EnrollmentPhase } from '../utils/enrollment.mapper';

interface EnrollmentFiltersProps {
    status: string;
    onStatusChange: (status: string) => void;
}

const OPTIONS: { value: string; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'awaiting_confirmation', label: 'Awaiting Confirm' },
    { value: 'ready_to_enroll', label: 'Ready' },
    { value: 'enrolled', label: 'Enrolled' },
    { value: 'failed', label: 'Failed' },
];

export function EnrollmentFilters({ status, onStatusChange }: EnrollmentFiltersProps) {
    return (
        <div className="flex flex-wrap gap-2">
            {OPTIONS.map(opt => (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => onStatusChange(opt.value as EnrollmentPhase | 'all')}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase border transition-all ${
                        status === opt.value
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-200'
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

export default EnrollmentFilters;
