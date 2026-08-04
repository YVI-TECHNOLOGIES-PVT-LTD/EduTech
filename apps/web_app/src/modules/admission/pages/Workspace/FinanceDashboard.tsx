import React, { useMemo } from 'react';
import { DollarSign, CreditCard, ShieldAlert, RefreshCw } from 'lucide-react';
import KPICards from '../../components/widgets/KPICards';
import { ActionQueueWidget } from '../../components/widgets/DashboardWidgets';
import { usePaymentQueue } from '../../hooks/usePaymentQueue';

export function FinanceDashboard() {
    const { queue, isLoading, refetch } = usePaymentQueue();

    const pendingCount = queue.filter(q => q.paymentStatus === 'PENDING' || q.paymentStatus === 'SUBMITTED').length;
    const verifiedCount = queue.filter(q => q.paymentStatus === 'VERIFIED' || q.paymentStatus === 'COMPLETED').length;
    const outstandingCount = queue.filter(q => (q.outstanding ?? 0) > 0).length;

    const financeKPIs = [
        { title: 'In Queue', value: queue.length, description: 'Finance applications', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
        { title: 'Pending Verification', value: pendingCount, description: 'Requires validation', icon: CreditCard, color: 'text-amber-600 bg-amber-50 border-amber-100' },
        { title: 'Outstanding', value: outstandingCount, description: 'Balance due', icon: ShieldAlert, color: 'text-rose-600 bg-rose-50 border-rose-100' },
        { title: 'Verified', value: verifiedCount, description: 'Completed payments', icon: DollarSign, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
    ];

    const actionItems = useMemo(
        () =>
            queue.slice(0, 6).map(item => ({
                id: item.applicationId,
                title: item.paymentStatus === 'SUBMITTED' ? `Verify payment — ${item.studentName}` : `Collect fee — ${item.studentName}`,
                description: item.outstanding !== undefined ? `₹${item.outstanding} outstanding` : item.program ?? item.applicationId.slice(0, 8),
                status: item.paymentStatus === 'SUBMITTED' ? ('urgent' as const) : ('pending' as const),
                time: item.hasPaymentActivity ? 'Active' : '—',
            })),
        [queue],
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                    Finance Admissions Desk Workspace
                </h2>
                <button type="button" onClick={() => refetch()} className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Refresh
                </button>
            </div>

            <KPICards cards={financeKPIs} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 bg-white dark:bg-card border border-gray-150 dark:border-border/60 p-6 rounded-2xl shadow-sm space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">
                        Pending Fee Payments Ledger
                    </h3>
                    {isLoading ? (
                        <p className="text-xs text-gray-400 animate-pulse">Loading…</p>
                    ) : queue.length === 0 ? (
                        <p className="text-xs text-gray-400 py-6 text-center">No applications in finance queue.</p>
                    ) : (
                        <div className="divide-y divide-gray-100 text-xs">
                            {queue.slice(0, 8).map(item => (
                                <div key={item.applicationId} className="py-3.5 flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <p className="font-bold text-gray-900 dark:text-gray-100">{item.studentName}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">
                                            {item.applicationId.slice(0, 8)} · {item.paymentStatus}
                                            {item.outstanding !== undefined ? ` · ₹${item.outstanding}` : ''}
                                        </p>
                                    </div>
                                    <span className="font-black text-gray-800 dark:text-gray-200">{item.amount !== undefined ? `₹${item.amount}` : '—'}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="space-y-6">
                    <ActionQueueWidget items={actionItems} />
                </div>
            </div>
        </div>
    );
}

export default FinanceDashboard;
