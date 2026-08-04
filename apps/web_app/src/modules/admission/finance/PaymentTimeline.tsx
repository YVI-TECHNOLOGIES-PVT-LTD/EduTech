import type { PaymentHistoryEntry } from '../utils/finance.mapper';
import { LeadTimeline } from '../components/inquiry/LeadTimeline';

interface PaymentTimelineProps {
    entries: PaymentHistoryEntry[];
}

export function PaymentTimeline({ entries }: PaymentTimelineProps) {
    if (!entries.length) {
        return <p className="text-xs text-gray-400">No payment timeline events yet.</p>;
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

export default PaymentTimeline;
