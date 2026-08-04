import React, { useMemo } from 'react';
import { ShieldCheck, AlertCircle, FileSignature } from 'lucide-react';
import KPICards from '../../components/widgets/KPICards';
import ExecutiveAnalytics from '../../components/analytics/ExecutiveAnalytics';
import { ActionQueueWidget } from '../../components/widgets/DashboardWidgets';
import { useOfferQueue } from '../../hooks/useOfferQueue';
import { useVerificationQueue } from '../../hooks/useVerificationQueue';
import { mapApplicationsToActionItems, mapOfferApprovalQueue } from '../../utils/admissionIntegration.mapper';

export function PrincipalDashboard() {
    const { applications, queue: offerQueue, isLoading: offerLoading } = useOfferQueue();
    const { summaries: verificationSummaries } = useVerificationQueue();

    const approvalQueue = useMemo(() => mapOfferApprovalQueue(applications), [applications]);

    const actionItems = useMemo(
        () =>
            mapApplicationsToActionItems(
                applications.filter(a => ['recommended', 'approved'].includes(a.status)),
                app => `Approve offer — ${app.student_name}`,
            ),
        [applications],
    );

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                Principal Admission Executive Workspace
            </h2>

            <ExecutiveAnalytics />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 bg-white dark:bg-card border border-gray-150 dark:border-border/60 p-6 rounded-2xl shadow-sm space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">
                        Offers & Final Approvals Queue ({offerQueue.length})
                    </h3>
                    {offerLoading ? (
                        <p className="text-xs text-gray-400 animate-pulse">Loading…</p>
                    ) : approvalQueue.length === 0 ? (
                        <p className="text-xs text-gray-400 py-6 text-center">No applications in offer queue.</p>
                    ) : (
                        <div className="divide-y divide-gray-100 text-xs">
                            {approvalQueue.map(item => (
                                <div key={item.applicationId} className="py-3 flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <p className="font-bold text-gray-900 dark:text-gray-100">{item.name}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">{item.code} • {item.grade}</p>
                                    </div>
                                    <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-[9px] font-black uppercase tracking-wider">
                                        {item.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <ActionQueueWidget items={actionItems} />
                    {verificationSummaries.length > 0 && (
                        <p className="text-[10px] text-gray-400 font-bold uppercase">
                            {verificationSummaries.length} applications awaiting document verification
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PrincipalDashboard;
