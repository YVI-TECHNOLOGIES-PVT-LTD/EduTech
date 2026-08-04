import type { MeritHistoryEntry } from '../utils/merit.mapper';
import { LeadTimeline } from '../components/inquiry/LeadTimeline';

interface MeritHistoryProps {
    entries: MeritHistoryEntry[];
}

export function MeritHistory({ entries }: MeritHistoryProps) {
    if (!entries.length) {
        return <p className="text-xs text-gray-400">No merit history recorded yet.</p>;
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

export default MeritHistory;
