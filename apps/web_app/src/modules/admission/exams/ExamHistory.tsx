import type { ExamHistoryEntry } from '../utils/exam.mapper';
import { LeadTimeline } from '../components/inquiry/LeadTimeline';

interface ExamHistoryProps {
    entries: ExamHistoryEntry[];
}

export function ExamHistory({ entries }: ExamHistoryProps) {
    if (!entries.length) {
        return <p className="text-xs text-gray-400">No exam history recorded yet.</p>;
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

export default ExamHistory;
