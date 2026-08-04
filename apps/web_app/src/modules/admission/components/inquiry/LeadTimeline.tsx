import type { LeadTimelineEntry } from '../../types/admission.types';

interface LeadTimelineProps {
    entries: LeadTimelineEntry[];
    compact?: boolean;
}

export function LeadTimeline({ entries, compact }: LeadTimelineProps) {
    if (!entries.length) {
        return <p className="text-[10px] text-gray-400 font-medium">No timeline events yet.</p>;
    }

    return (
        <div className={`space-y-${compact ? '2' : '3'}`}>
            {entries.map(entry => (
                <div key={entry.id} className="flex gap-3 text-xs">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-indigo-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-gray-900 dark:text-gray-100">{entry.action}</span>
                            <span className="text-[10px] text-gray-400 shrink-0">
                                {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''}
                            </span>
                        </div>
                        {entry.actor && (
                            <p className="text-[10px] text-gray-500">{entry.actor}</p>
                        )}
                        {entry.remarks && (
                            <p className="text-[10px] text-gray-400 mt-0.5">{entry.remarks}</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default LeadTimeline;
