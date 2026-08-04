import type { OfferRecord } from '../utils/offer.mapper';

interface OfferDetailsProps {
    record: OfferRecord | null;
}

export function OfferDetails({ record }: OfferDetailsProps) {
    if (!record) return null;

    const rows = [
        { label: 'Candidate', value: record.candidate },
        { label: 'Application', value: record.applicationNo },
        { label: 'Program', value: record.program },
        { label: 'Offer Number', value: record.offerNumber ?? '—' },
        { label: 'Status', value: record.status },
        { label: 'Issue Date', value: record.issueDate ?? '—' },
        { label: 'Expiry Date', value: record.expiryDate ?? '—' },
        { label: 'Parent Email', value: record.parentEmail ?? '—' },
        { label: 'Merit Rank', value: record.meritRank !== undefined ? String(record.meritRank) : '—' },
        { label: 'Seat Confirmed', value: record.seatConfirmed ? 'Yes' : 'No' },
        { label: 'Scholarship', value: record.scholarship ?? '—' },
        { label: 'Priority', value: record.priority ?? '—' },
    ];

    return (
        <div className="bg-white dark:bg-card border rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-black uppercase text-gray-400">Offer Details</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {rows.map(row => (
                    <div key={row.label} className="flex justify-between gap-2 py-1 border-b border-gray-50">
                        <dt className="text-gray-400 font-bold">{row.label}</dt>
                        <dd className="font-medium text-gray-900 text-right">{row.value}</dd>
                    </div>
                ))}
            </dl>
            {record.remarks && (
                <p className="text-[10px] text-gray-500 italic pt-2 border-t">{record.remarks}</p>
            )}
        </div>
    );
}

export default OfferDetails;
