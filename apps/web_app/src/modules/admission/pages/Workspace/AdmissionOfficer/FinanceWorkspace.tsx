import React, { useMemo, useState } from 'react';
import { CreditCard, DollarSign, Users } from 'lucide-react';
import { Applicant360FeesPanel } from '../../../components/profile360/Applicant360FeesPanel';

interface FinanceWorkspaceProps {
    applications: any[];
    isLoading: boolean;
}

export function FinanceWorkspace({ applications, isLoading }: FinanceWorkspaceProps) {
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

    const financeApps = useMemo(() => {
        return applications.filter(a => [
            'offered',
            'approved',
            'fee_pending',
            'fee_verified',
            'payment_pending',
            'payment_submitted',
            'payment_verified',
            'payment_correction'
        ].includes(a.status));
    }, [applications]);

    const activeApp = useMemo(() => {
        return applications.find(a => a.id === selectedAppId) || null;
    }, [applications, selectedAppId]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Candidates List */}
            <div className="bg-white dark:bg-card p-5 border rounded-2xl shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 flex items-center justify-between pb-2 border-b">
                    <span>Finance Queue</span>
                    <span className="px-2 py-0.5 rounded bg-gray-150 text-[9px] font-black text-gray-700">
                        {financeApps.length}
                    </span>
                </h3>
                <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                    {isLoading ? (
                        <p className="text-xs text-gray-400 animate-pulse">Loading finance list...</p>
                    ) : financeApps.length === 0 ? (
                        <p className="text-xs text-gray-400">No applicants in finance stage.</p>
                    ) : (
                        financeApps.map(app => {
                            const isSelected = selectedAppId === app.id;
                            return (
                                <div
                                    key={app.id}
                                    onClick={() => setSelectedAppId(app.id)}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 ${
                                        isSelected
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-sm'
                                            : 'hover:bg-gray-50 border-gray-100 text-gray-700'
                                    }`}
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-[11px] truncate">{app.student_name}</p>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">{app.id.slice(0, 8).toUpperCase()} • {app.grade_applied_for}</p>
                                    </div>
                                    <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded shrink-0">{app.status}</span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Right Finance Details Panel */}
            <div className="lg:col-span-2 bg-white dark:bg-card p-6 border rounded-2xl shadow-sm min-h-[400px]">
                {activeApp ? (
                    <div className="space-y-4">
                        <div className="pb-3 border-b">
                            <h3 className="text-sm font-black text-gray-900">{activeApp.student_name}</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase mt-0.5">{activeApp.id} • {activeApp.grade_applied_for}</p>
                        </div>
                        <Applicant360FeesPanel applicationId={activeApp.id} readOnlyMode={false} />
                    </div>
                ) : (
                    <div className="py-24 text-center border-2 border-dashed rounded-xl bg-gray-50/50">
                        <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-2 animate-pulse" />
                        <p className="text-xs text-gray-400 font-bold">Select a candidate from the left panel to open the Finance Ledger and collect payments.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default FinanceWorkspace;
