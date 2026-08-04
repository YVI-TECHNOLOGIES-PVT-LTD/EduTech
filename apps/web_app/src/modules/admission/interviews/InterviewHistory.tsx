import type { InterviewHistoryEntry } from '../utils/interview.mapper';
import { LeadTimeline } from '../components/inquiry/LeadTimeline';

interface InterviewHistoryProps {
    entries: InterviewHistoryEntry[];
}

export function InterviewHistory({ entries }: InterviewHistoryProps) {
    if (!entries.length) {
        return <p className="text-xs text-gray-400">No interview history recorded yet.</p>;
    }
    return (
        <LeadTimeline
            entries={entries.map(e => ({
                id: e.id,
                action: e.action,
                timestamp: e.timestamp,
                actor: e.actor,
                remarks: e.remarks,
            }))}
            compact
        />
    );
}

export default InterviewHistory;
