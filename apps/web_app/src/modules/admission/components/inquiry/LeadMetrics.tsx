import type { LeadMetrics } from '../../types/admission.types';

interface LeadMetricsProps {
    metrics: any;
    variant?: 'counselor' | 'reception';
}

export function LeadMetricsPanel({ metrics = {}, variant = 'counselor' }: LeadMetricsProps) {
    const counselorCards = [
        { label: 'Assigned Leads', value: metrics?.assigned ?? metrics?.totalLeads ?? 0 },
        { label: 'Unassigned', value: metrics?.unassigned ?? 0 },
        { label: "Today's Calls", value: metrics?.todayFollowups ?? metrics?.totalFollowups ?? 0 },
        { label: 'Overdue', value: metrics?.overdueFollowups ?? 0 },
        { label: 'Converted', value: metrics?.converted ?? 0 },
        { label: 'Applications', value: metrics?.applicationsSubmitted ?? metrics?.totalInquiries ?? 0 },
        { label: 'Conversion %', value: `${metrics?.conversionRate ?? 0}%` },
    ];

    const receptionCards = [
        { label: "Today's Walk-ins", value: metrics?.walkInsToday ?? metrics?.totalInquiries ?? 0 },
        { label: "Today's Visitors", value: metrics?.todayVisitors ?? metrics?.totalVisitors ?? 0 },
        { label: 'Pending Follow-ups', value: metrics?.todayFollowups ?? metrics?.totalFollowups ?? 0 },
        { label: 'Assigned Counselors', value: metrics?.assigned ?? 0 },
        { label: "Today's Applications", value: metrics?.applicationsSubmitted ?? 0 },
        { label: 'Conversion %', value: `${metrics?.conversionRate ?? 0}%` },
        { label: 'Avg Response (hrs)', value: metrics?.avgResponseHours ?? 0 },
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
