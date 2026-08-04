import type { PaymentQueueItem } from '../utils/finance.mapper';
import { Button } from '../../../components/ui/button';

interface PaymentQueueProps {
    items: PaymentQueueItem[];
    isLoading?: boolean;
    onSelect: (applicationId: string) => void;
}

export function PaymentQueue({ items, isLoading, onSelect }: PaymentQueueProps) {
    if (isLoading) {
        return <p className="text-xs text-gray-400 animate-pulse py-8 text-center">Loading payment queue…</p>;
    }
    if (items.length === 0) {
        return <p className="text-xs text-gray-400 py-8 text-center">No applications in finance queue.</p>;
    }

    return (
        <div className="divide-y divide-gray-50">
            {items.map(item => (
                <div key={item.applicationId} className="flex justify-between items-center py-3.5 gap-4">
                    <div>
                        <p className="text-xs font-black text-gray-900">{item.studentName}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                            {item.program ?? '—'} · {item.paymentStatus}
                            {item.outstanding !== undefined ? ` · ₹${item.outstanding} due` : ''}
                        </p>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => onSelect(item.applicationId)}
                        className="bg-emerald-600 text-white text-xs font-bold shrink-0"
                    >
                        Open
                    </Button>
                </div>
            ))}
        </div>
    );
}

export default PaymentQueue;
