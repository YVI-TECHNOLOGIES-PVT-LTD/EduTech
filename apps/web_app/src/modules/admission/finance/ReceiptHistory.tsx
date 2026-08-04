import type { ReceiptRecord } from '../utils/finance.mapper';

interface ReceiptHistoryProps {
    receipts: ReceiptRecord[];
}

export function ReceiptHistory({ receipts }: ReceiptHistoryProps) {
    if (!receipts.length) {
        return <p className="text-xs text-gray-400">No receipt history yet.</p>;
    }
    return (
        <div className="divide-y divide-gray-50 text-xs">
            {receipts.map(r => (
                <div key={r.paymentId} className="py-2 flex justify-between">
                    <span className="font-bold">{r.receiptNumber ?? r.paymentId.slice(0, 8)}</span>
                    <span className="text-gray-400">{r.issuedAt ?? '—'}</span>
                </div>
            ))}
        </div>
    );
}

export default ReceiptHistory;
