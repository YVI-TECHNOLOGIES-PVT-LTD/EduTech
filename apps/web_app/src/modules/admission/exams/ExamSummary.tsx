import type { ExamEvaluationSummary } from '../utils/exam.mapper';

interface ExamSummaryProps {
    summary: ExamEvaluationSummary | null;
}

export function ExamSummary({ summary }: ExamSummaryProps) {
    if (!summary) return null;

    const items = [
        { label: 'Total', value: summary.total },
        { label: 'Published', value: summary.published, color: 'text-indigo-600' },
        { label: 'Pending', value: summary.pending, color: 'text-amber-600' },
        { label: 'Passed', value: summary.passed, color: 'text-emerald-600' },
        { label: 'Failed', value: summary.failed, color: 'text-rose-600' },
        { label: 'Absent', value: summary.absent, color: 'text-gray-600' },
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

export default ExamSummary;
