import React, { useMemo } from 'react';
import { PenTool, Calendar, ShieldCheck } from 'lucide-react';
import KPICards from '../../components/widgets/KPICards';
import { ActionQueueWidget } from '../../components/widgets/DashboardWidgets';
import { useExamQueue } from '../../hooks/useExamQueue';
import { useExamEvaluation } from '../../hooks/useExamEvaluation';
import { useAuth } from '../../../../context/AuthContext';

export function ExamCellDashboard() {
    const { user, hasPermission, hasRole } = useAuth();
    const permCtx = { roles: user?.roles ?? [], hasPermission, hasRole };
    const { queue, isLoading, refetch } = useExamQueue();

    const pendingCount = queue.filter(q => !q.hasResults).length;
    const evaluatedCount = queue.filter(q => q.hasResults).length;

    const examKPIs = [
        { title: 'In Queue', value: queue.length, description: 'Awaiting evaluation', icon: Calendar, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
        { title: 'Pending Marks', value: pendingCount, description: 'Not yet published', icon: PenTool, color: 'text-amber-600 bg-amber-50 border-amber-100' },
        { title: 'Evaluated', value: evaluatedCount, description: 'Results on file', icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    ];

    const firstAppId = queue[0]?.applicationId;
    const { summary } = useExamEvaluation(firstAppId, permCtx);

    const actionItems = useMemo(
        () =>
            queue.slice(0, 6).map(item => ({
                id: item.applicationId,
                title: item.hasResults ? `Review result — ${item.studentName}` : `Grade exam — ${item.studentName}`,
                description: item.grade ?? item.applicationId.slice(0, 8),
                status: item.hasResults ? ('pending' as const) : ('urgent' as const),
                time: item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : '—',
            })),
        [queue],
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                    Exam Cell Admissions Portal
                </h2>
                <button type="button" onClick={() => refetch()} className="text-[10px] font-bold text-indigo-600 uppercase">
                    Refresh
                </button>
            </div>

            <KPICards cards={examKPIs} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-card border border-gray-150 dark:border-border/60 p-6 rounded-2xl shadow-sm space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">
                            Entrance Exam Grading Board
                        </h3>
                        {isLoading ? (
                            <p className="text-xs text-gray-400 animate-pulse">Loading…</p>
                        ) : queue.length === 0 ? (
                            <p className="text-xs text-gray-400 py-6 text-center">No applications in exam queue.</p>
                        ) : (
                            <div className="divide-y divide-gray-100 text-xs">
                                {queue.slice(0, 8).map(item => (
                                    <div key={item.applicationId} className="py-3 flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-gray-100">{item.studentName}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">
                                                {item.applicationId.slice(0, 8)} · {item.grade ?? '—'}
                                            </p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                            item.hasResults ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                        }`}>
                                            {item.hasResults ? 'EVALUATED' : 'PENDING'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {summary && (
                            <p className="text-[10px] text-gray-400 pt-2 border-t">
                                Sample summary: {summary.passed} passed · {summary.failed} failed · {summary.pending} pending
                            </p>
                        )}
                    </div>
                </div>
                <div className="space-y-6">
                    <ActionQueueWidget items={actionItems} />
                </div>
            </div>
        </div>
    );
}

export default ExamCellDashboard;
