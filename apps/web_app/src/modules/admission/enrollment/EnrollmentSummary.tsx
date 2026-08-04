import type { EnrollmentSummaryStats } from '../utils/enrollment.mapper';

interface EnrollmentSummaryProps {
    summary: EnrollmentSummaryStats | null;
}

export function EnrollmentSummary({ summary }: EnrollmentSummaryProps) {
    if (!summary) return null;

    const tiles = [
        { label: 'Awaiting Confirm', value: summary.awaitingConfirmation, color: 'text-amber-600' },
        { label: 'Ready to Enroll', value: summary.readyToEnroll, color: 'text-indigo-600' },
        { label: 'Enrolled', value: summary.enrolled, color: 'text-emerald-600' },
        { label: 'Failed', value: summary.failed, color: 'text-rose-600' },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {tiles.map(t => (
                <div key={t.label} className="bg-white dark:bg-card border rounded-2xl p-4">
                    <p className="text-[10px] font-black uppercase text-gray-400">{t.label}</p>
                    <p className={`text-2xl font-black mt-1 ${t.color}`}>{t.value}</p>
                </div>
            ))}
        </div>
    );
}

export default EnrollmentSummary;
