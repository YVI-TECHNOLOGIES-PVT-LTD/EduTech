import type { PaymentHistoryEntry } from '../utils/finance.mapper';
import { PaymentTimeline } from './PaymentTimeline';

interface PaymentHistoryProps {
    entries: PaymentHistoryEntry[];
}

export function PaymentHistory({ entries }: PaymentHistoryProps) {
    return <PaymentTimeline entries={entries} />;
}

export default PaymentHistory;
