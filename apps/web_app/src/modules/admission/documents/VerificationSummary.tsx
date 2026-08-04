import type { VerificationApplicationSummary } from '../utils/documentVerification.mapper';

interface VerificationSummaryProps {
    summary: VerificationApplicationSummary | null;
}

export function VerificationSummary({ summary }: VerificationSummaryProps) {
    if (!summary) return null;

    const items = [
        { label: 'Total', value: summary.totalDocuments },
        { label: 'Verified', value: summary.verifiedCount, color: 'text-emerald-600' },
        { label: 'Pending', value: summary.pendingCount, color: 'text-amber-600' },
        { label: 'Missing', value: summary.missingCount, color: 'text-rose-600' },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {items.map(item => (
                <div key={item.label} className="bg-white dark:bg-card border rounded-xl p-3">
                    <p className="text-[9px] font-black uppercase text-gray-400">{item.label}</p>
                    <p className={`text-xl font-black mt-1 ${item.color ?? 'text-gray-900 dark:text-gray-100'}`}>{item.value}</p>
                </div>
            ))}
        </div>
    );
}

export default VerificationSummary;
