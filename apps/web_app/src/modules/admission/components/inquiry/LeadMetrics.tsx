import type { LeadMetrics } from '../../types/admission.types';

interface LeadMetricsProps {
    metrics: LeadMetrics;
    variant?: 'counselor' | 'reception';
}

export function LeadMetricsPanel({ metrics, variant = 'counselor' }: LeadMetricsProps) {
    const counselorCards = [
        { label: 'Assigned Leads', value: metrics.assigned },
        { label: 'Unassigned', value: metrics.unassigned },
        { label: "Today's Calls", value: metrics.todayFollowups },
        { label: 'Overdue', value: metrics.overdueFollowups },
        { label: 'Converted', value: metrics.converted },
        { label: 'Applications', value: metrics.applicationsSubmitted },
        { label: 'Conversion %', value: `${metrics.conversionRate}%` },
    ];

    const receptionCards = [
        { label: "Today's Walk-ins", value: metrics.walkInsToday },
        { label: "Today's Visitors", value: metrics.todayVisitors },
        { label: 'Pending Follow-ups', value: metrics.todayFollowups },
        { label: 'Assigned Counselors', value: metrics.assigned },
        { label: "Today's Applications", value: metrics.applicationsSubmitted },
        { label: 'Conversion %', value: `${metrics.conversionRate}%` },
        { label: 'Avg Response (hrs)', value: metrics.avgResponseHours },
    ];

    const cards = variant === 'reception' ? receptionCards : counselorCards;

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {cards.map(card => (
                <div
                    key={card.label}
                    className="bg-white dark:bg-card border border-gray-150 dark:border-border/60 rounded-xl p-3 shadow-sm"
                >
                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider">{card.label}</p>
                    <p className="text-lg font-black text-gray-900 dark:text-gray-100 mt-1">{card.value}</p>
                </div>
            ))}
        </div>
    );
}

export default LeadMetricsPanel;
