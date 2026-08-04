import type { ExamQueueItem } from '../utils/exam.mapper';
import { Button } from '../../../components/ui/button';

interface ExamQueueProps {
    items: ExamQueueItem[];
    isLoading?: boolean;
    onSelect: (applicationId: string) => void;
}

export function ExamQueue({ items, isLoading, onSelect }: ExamQueueProps) {
    if (isLoading) {
        return <p className="text-xs text-gray-400 animate-pulse py-8 text-center">Loading exam queue…</p>;
    }
    if (items.length === 0) {
        return <p className="text-xs text-gray-400 py-8 text-center">No applications in exam evaluation queue.</p>;
    }

    return (
        <div className="divide-y divide-gray-50">
            {items.map(item => (
                <div key={item.applicationId} className="flex justify-between items-center py-3.5 gap-4">
                    <div>
                        <p className="text-xs font-black text-gray-900">{item.studentName}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                            {item.grade ?? '—'} · {item.hasResults ? `${item.resultsCount} result(s)` : 'Awaiting evaluation'}
                        </p>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => onSelect(item.applicationId)}
                        className="bg-gray-900 text-white text-xs font-bold shrink-0"
                    >
                        Evaluate
                    </Button>
                </div>
            ))}
        </div>
    );
}

export default ExamQueue;
