import type { OfferAuditEntry } from '../utils/offer.mapper';
import { LeadTimeline } from '../components/inquiry/LeadTimeline';

interface OfferAuditProps {
    entries: OfferAuditEntry[];
}

export function OfferAudit({ entries }: OfferAuditProps) {
    if (!entries.length) {
        return <p className="text-xs text-gray-400">No offer audit trail recorded yet.</p>;
    }

    return (
        <div className="space-y-3">
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
        </div>
    );
}

export default OfferAudit;
