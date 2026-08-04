import type { InterviewEvaluationSummary } from '../utils/interview.mapper';

interface InterviewSummaryProps {
    summary: InterviewEvaluationSummary | null;
}

export function InterviewSummary({ summary }: InterviewSummaryProps) {
    if (!summary) return null;

    const items = [
        { label: 'Total', value: summary.total },
        { label: 'Scheduled', value: summary.scheduled, color: 'text-indigo-600' },
        { label: 'Pending', value: summary.pending, color: 'text-amber-600' },
        { label: 'Evaluated', value: summary.evaluated, color: 'text-emerald-600' },
        { label: 'Recommended', value: summary.recommended, color: 'text-emerald-600' },
        { label: 'Rejected', value: summary.rejected, color: 'text-rose-600' },
        { label: 'Absent', value: summary.absent, color: 'text-gray-600' },
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

export default InterviewSummary;
