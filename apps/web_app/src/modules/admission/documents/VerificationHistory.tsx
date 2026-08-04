import type { VerificationHistoryEntry } from '../utils/documentVerification.mapper';
import { LeadTimeline } from '../components/inquiry/LeadTimeline';

interface VerificationHistoryProps {
    entries: VerificationHistoryEntry[];
}

export function VerificationHistory({ entries }: VerificationHistoryProps) {
    if (!entries.length) {
        return <p className="text-xs text-gray-400">No verification history yet.</p>;
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

export default VerificationHistory;
