import type { EnrollmentHistoryEntry } from '../utils/enrollment.mapper';

interface EnrollmentTimelineProps {
    entries: EnrollmentHistoryEntry[];
}

export function EnrollmentTimeline({ entries }: EnrollmentTimelineProps) {
    if (entries.length === 0) {
        return <p className="text-xs text-gray-400 py-4 text-center">No enrollment timeline events.</p>;
    }

    return (
        <div className="space-y-3">
            {entries.map(entry => (
                <div key={entry.id} className="flex gap-3">
                    <div className="w-1.5 rounded-full bg-indigo-200 shrink-0" />
                    <div className="pb-3">
                        <p className="text-xs font-bold text-gray-800">{entry.action.replace(/_/g, ' ')}</p>
                        {entry.remarks && <p className="text-[10px] text-gray-500 mt-0.5">{entry.remarks}</p>}
                        <p className="text-[10px] text-gray-400 mt-1">{new Date(entry.timestamp).toLocaleString()}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default EnrollmentTimeline;
