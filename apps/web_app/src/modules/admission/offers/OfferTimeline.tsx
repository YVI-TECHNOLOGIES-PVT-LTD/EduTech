import type { OfferHistoryEntry } from '../utils/offer.mapper';
import { LeadTimeline } from '../components/inquiry/LeadTimeline';

interface OfferTimelineProps {
    entries: OfferHistoryEntry[];
}

export function OfferTimeline({ entries }: OfferTimelineProps) {
    if (!entries.length) {
        return <p className="text-xs text-gray-400">No offer timeline events yet.</p>;
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

export default OfferTimeline;
