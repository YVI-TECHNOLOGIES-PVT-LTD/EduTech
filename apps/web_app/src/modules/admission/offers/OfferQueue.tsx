import type { OfferQueueItem } from '../utils/offer.mapper';
import { Button } from '../../../components/ui/button';

interface OfferQueueProps {
    items: OfferQueueItem[];
    isLoading?: boolean;
    onSelect: (applicationId: string) => void;
}

export function OfferQueue({ items, isLoading, onSelect }: OfferQueueProps) {
    if (isLoading) {
        return <p className="text-xs text-gray-400 animate-pulse py-8 text-center">Loading offer queue…</p>;
    }
    if (items.length === 0) {
        return <p className="text-xs text-gray-400 py-8 text-center">No applications in offer queue.</p>;
    }

    return (
        <div className="divide-y divide-gray-50">
            {items.map(item => (
                <div key={item.applicationId} className="flex justify-between items-center py-3.5 gap-4">
                    <div>
                        <p className="text-xs font-black text-gray-900">{item.studentName}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                            {item.program ?? '—'} · {item.hasOffer ? item.offerStatus : 'No offer yet'}
                            {item.offerNumber ? ` · ${item.offerNumber}` : ''}
                        </p>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => onSelect(item.applicationId)}
                        className="bg-rose-600 text-white text-xs font-bold shrink-0"
                    >
                        Manage
                    </Button>
                </div>
            ))}
        </div>
    );
}

export default OfferQueue;
