import type { MeritEvaluationSummary } from '../utils/merit.mapper';

interface MeritSummaryProps {
    summary: MeritEvaluationSummary | null;
}

export function MeritSummary({ summary }: MeritSummaryProps) {
    if (!summary) return null;

    const items = [
        { label: 'Total', value: summary.total },
        { label: 'Selected', value: summary.selected, color: 'text-emerald-600' },
        { label: 'Waitlisted', value: summary.waitlisted, color: 'text-amber-600' },
        { label: 'Reserved', value: summary.reserved, color: 'text-indigo-600' },
        { label: 'Rejected', value: summary.rejected, color: 'text-rose-600' },
        { label: 'Pending', value: summary.pending, color: 'text-gray-600' },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {items.map(item => (
                <div key={item.label} className="bg-white dark:bg-card border rounded-xl p-3">
                    <p className="text-[9px] font-black uppercase text-gray-400">{item.label}</p>
                    <p className={`text-xl font-black mt-1 ${item.color ?? 'text-gray-900 dark:text-gray-100'}`}>{item.value}</p>
                </div>
            ))}
        </div>
    );
}

export default MeritSummary;
