import type { InterviewQueueItem } from '../utils/interview.mapper';
import { Button } from '../../../components/ui/button';

interface InterviewQueueProps {
    items: InterviewQueueItem[];
    isLoading?: boolean;
    onSelect: (applicationId: string) => void;
}

export function InterviewQueue({ items, isLoading, onSelect }: InterviewQueueProps) {
    if (isLoading) {
        return <p className="text-xs text-gray-400 animate-pulse py-8 text-center">Loading interview queue…</p>;
    }
    if (items.length === 0) {
        return <p className="text-xs text-gray-400 py-8 text-center">No applications in interview queue.</p>;
    }

    return (
        <div className="divide-y divide-gray-50">
            {items.map(item => (
                <div key={item.applicationId} className="flex justify-between items-center py-3.5 gap-4">
                    <div>
                        <p className="text-xs font-black text-gray-900">{item.studentName}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                            {item.program ?? '—'} ·{' '}
                            {item.isEvaluated ? 'Evaluated' : item.hasInterview ? 'Scheduled' : 'Awaiting panel'}
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

export default InterviewQueue;
