import React, { useMemo } from 'react';
import { PhoneCall } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { useLeadDashboard } from '../../hooks/useLeads';
import { useLeadSearch } from '../../hooks/useLeadSearch';
import { useFollowups, useCompleteFollowup } from '../../hooks/useFollowups';
import { LeadMetricsPanel } from '../../components/inquiry/LeadMetrics';
import { LeadCard } from '../../components/inquiry/LeadCard';
import { LeadPriorityBadge } from '../../components/inquiry/LeadPriorityBadge';
import { LeadStatusChip } from '../../components/inquiry/LeadStatusChip';
import { isAssigned } from '../../utils/lead.mapper';
import type { Lead } from '../../types/admission.types';

const FOLLOWUP_TABS = [
    { id: 'today' as const, label: "Today's Follow-ups" },
    { id: 'tomorrow' as const, label: 'Tomorrow' },
    { id: 'upcoming' as const, label: 'Upcoming' },
    { id: 'missed' as const, label: 'Missed' },
    { id: 'completed' as const, label: 'Completed' },
];

export function CounselorDashboard() {
    const { user } = useAuth();
    const counselorId = user?.id ?? '';
    const { leads, metrics, refetch } = useLeadDashboard();
    const { query, setQuery, results } = useLeadSearch(leads);
    const { buckets } = useFollowups();
    const completeFollowup = useCompleteFollowup();
    const [followupTab, setFollowupTab] = React.useState<typeof FOLLOWUP_TABS[number]['id']>('today');

    const myLeads = useMemo(() => {
        const pool = query ? results : leads;
        return pool.filter(
            l =>
                isAssigned(l) &&
                (l.assigned_counselor_id === counselorId ||
                    l.assigned_counselor === user?.full_name ||
                    !l.assigned_counselor_id),
        );
    }, [leads, results, query, counselorId, user?.full_name]);

    const unassignedLeads = useMemo(
        () => leads.filter(l => !isAssigned(l)),
        [leads],
    );

    const followupItems = buckets[followupTab];

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                Admissions Counselor Workspace
            </h2>

            <LeadMetricsPanel metrics={metrics} variant="counselor" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-card border border-gray-150 dark:border-border/60 p-6 rounded-2xl shadow-sm space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">
                            My Assigned Leads ({myLeads.length})
                        </h3>
                        <input
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search leads…"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                        />
                        <div className="space-y-3 max-h-[420px] overflow-y-auto">
                            {myLeads.length === 0 ? (
                                <p className="text-xs text-gray-400 py-4 text-center">No assigned leads.</p>
                            ) : (
                                myLeads.slice(0, 10).map(lead => {
                                    const scored = lead as Lead;
                                    return (
                                    <div
                                        key={lead.id}
                                        className="py-3 border-b border-gray-100 last:border-0 flex items-center justify-between gap-3"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-bold text-gray-900 dark:text-gray-100 text-xs">{lead.student_name}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                                                {lead.inquiry_number ?? lead.id.slice(0, 8)} · {lead.grade_applied_for ?? '—'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <LeadPriorityBadge tier={scored.priority} score={scored.score} />
                                            <LeadStatusChip status={lead.status} />
                                        </div>
                                    </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {unassignedLeads.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-xs font-black uppercase text-gray-500">Unassigned Queue ({unassignedLeads.length})</h3>
                            {unassignedLeads.slice(0, 3).map(lead => (
                                <LeadCard
                                    key={lead.id}
                                    lead={lead as Lead}
                                    showAssign
                                    counselorId={counselorId}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-card border border-gray-150 dark:border-border/60 p-5 rounded-2xl shadow-sm space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200 flex items-center gap-1">
                            <PhoneCall className="w-4 h-4 text-indigo-500" /> Follow-up Workspace
                        </h3>
                        <div className="flex flex-wrap gap-1">
                            {FOLLOWUP_TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setFollowupTab(tab.id)}
                                    className={`px-2 py-1 text-[9px] font-black uppercase rounded-lg ${
                                        followupTab === tab.id
                                            ? 'bg-indigo-100 text-indigo-700'
                                            : 'text-gray-400 hover:bg-gray-50'
                                    }`}
                                >
                                    {tab.label} ({buckets[tab.id].length})
                                </button>
                            ))}
                        </div>
                        <div className="divide-y divide-gray-100 text-xs max-h-[360px] overflow-y-auto">
                            {followupItems.length === 0 ? (
                                <p className="text-gray-400 py-4 text-center text-[10px]">No follow-ups in this bucket.</p>
                            ) : (
                                followupItems.map(f => (
                                    <div key={f.id} className="py-3 space-y-1">
                                        <div className="flex justify-between gap-2">
                                            <span className="font-bold text-gray-800">
                                                {f.scheduled_at ?? f.due_date
                                                    ? new Date(String(f.scheduled_at ?? f.due_date)).toLocaleString()
                                                    : '—'}
                                            </span>
                                            <span className="text-[9px] uppercase font-black text-gray-400">{f.status}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-600">{f.remarks ?? 'No remarks'}</p>
                                        <p className="text-[9px] text-gray-400">
                                            Staff: {f.assigned_to ?? f.assigned_staff ?? '—'}
                                        </p>
                                        {f.status !== 'completed' && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    completeFollowup.mutate(f.id);
                                                    refetch();
                                                }}
                                                className="text-[9px] font-black uppercase text-indigo-600 hover:underline"
                                            >
                                                Mark Complete
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CounselorDashboard;
