import type { OfferSummaryStats } from '../utils/offer.mapper';

interface OfferSummaryProps {
    summary: OfferSummaryStats | null;
}

export function OfferSummary({ summary }: OfferSummaryProps) {
    if (!summary) return null;

    const items = [
        { label: 'Total', value: summary.total },
        { label: 'Pending', value: summary.pending, color: 'text-amber-600' },
        { label: 'Sent', value: summary.sent, color: 'text-blue-600' },
        { label: 'Accepted', value: summary.accepted, color: 'text-emerald-600' },
        { label: 'Rejected', value: summary.rejected, color: 'text-rose-600' },
        { label: 'Expired', value: summary.expired, color: 'text-gray-600' },
        { label: 'Deferred', value: summary.deferred, color: 'text-purple-600' },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {items.map(item => (
                <div key={item.label} className="bg-white dark:bg-card border rounded-xl p-3">
                    <p className="text-[9px] font-black uppercase text-gray-400">{item.label}</p>
                    <p className={`text-xl font-black mt-1 ${item.color ?? 'text-gray-900 dark:text-gray-100'}`}>{item.value}</p>
                </div>
            ))}
        </div>
    );
}

export default OfferSummary;
