import type { PaymentAuditEntry } from '../utils/finance.mapper';
import { LeadTimeline } from '../components/inquiry/LeadTimeline';

interface PaymentAuditProps {
    entries: PaymentAuditEntry[];
}

export function PaymentAudit({ entries }: PaymentAuditProps) {
    if (!entries.length) {
        return <p className="text-xs text-gray-400">No finance audit trail recorded yet.</p>;
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

export default PaymentAudit;
