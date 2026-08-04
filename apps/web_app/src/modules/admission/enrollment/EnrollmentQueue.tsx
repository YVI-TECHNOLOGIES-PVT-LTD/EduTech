import type { EnrollmentQueueItem } from '../utils/enrollment.mapper';
import { Button } from '../../../components/ui/button';

interface EnrollmentQueueProps {
    items: EnrollmentQueueItem[];
    isLoading?: boolean;
    onSelect: (applicationId: string) => void;
}

const PHASE_LABEL: Record<string, string> = {
    awaiting_confirmation: 'Awaiting Confirm',
    ready_to_enroll: 'Ready to Enroll',
    enrolled: 'Enrolled',
    failed: 'Failed',
};

export function EnrollmentQueue({ items, isLoading, onSelect }: EnrollmentQueueProps) {
    if (isLoading) {
        return <p className="text-xs text-gray-400 animate-pulse py-8 text-center">Loading enrollment queue…</p>;
    }
    if (items.length === 0) {
        return <p className="text-xs text-gray-400 py-8 text-center">No applications in enrollment queue.</p>;
    }

    return (
        <div className="divide-y divide-gray-50">
            {items.map(item => (
                <div key={item.applicationId} className="flex justify-between items-center py-3.5 gap-4">
                    <div>
                        <p className="text-xs font-black text-gray-900">{item.studentName}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                            {item.program ?? '—'} · {PHASE_LABEL[item.phase] ?? item.status}
                            {item.admissionNumber ? ` · ${item.admissionNumber}` : ''}
                        </p>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => onSelect(item.applicationId)}
                        className="bg-indigo-600 text-white text-xs font-bold shrink-0"
                    >
                        Open
                    </Button>
                </div>
            ))}
        </div>
    );
}

export default EnrollmentQueue;
