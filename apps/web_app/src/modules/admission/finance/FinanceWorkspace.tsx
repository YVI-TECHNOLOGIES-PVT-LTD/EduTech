import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, RefreshCw, Search } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { AdmissionPermissions } from '../core/AdmissionPermissions';
import { usePaymentQueue } from '../hooks/usePaymentQueue';
import { useFinanceWorkspace } from '../hooks/useFinanceWorkspace';
import { PaymentQueue } from './PaymentQueue';
import { PaymentCard } from './PaymentCard';
import { PaymentSummary } from './PaymentSummary';
import { PaymentTimeline } from './PaymentTimeline';
import { PaymentHistory } from './PaymentHistory';
import { PaymentAudit } from './PaymentAudit';
import { ReceiptViewer } from './ReceiptViewer';
import { ReceiptHistory } from './ReceiptHistory';
import { ScholarshipPanel } from './ScholarshipPanel';
import { WaiverPanel } from './WaiverPanel';
import { PaymentFilters } from './PaymentFilters';
import { PaymentToolbar } from './PaymentToolbar';
import { FeeStructurePanel } from './FeeStructurePanel';
import { ExportMenu } from '../../common/reports/ExportMenu';
import { paymentRecordToExportRow } from '../utils/finance.mapper';
import { Button } from '../../../components/ui/button';
import { ROUTES } from '../../../constants/routes';

export function FinanceWorkspace() {
    const navigate = useNavigate();
    const { user, hasPermission, hasRole } = useAuth();
    const permCtx = { roles: user?.roles ?? [], hasPermission, hasRole };

    const [queueSearch, setQueueSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

    const canAccess = AdmissionPermissions.canViewFinance(permCtx);

    const { queue, isLoading: queueLoading, refetch: refetchQueue } = usePaymentQueue(queueSearch, statusFilter);

    const {
        application,
        record,
        summary,
        history,
        audit,
        receipt,
        isLoading,
        error,
        isSubmitting,
        refetch,
        permissions,
        runFinanceAction,
    } = useFinanceWorkspace(selectedAppId ?? undefined, permCtx);

    const exportData = record ? [paymentRecordToExportRow(record)] : [];
    const receiptHistory = receipt ? [receipt] : [];

    if (!canAccess) {
        return (
            <div className="py-16 text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                <p className="text-sm font-bold text-gray-700">You do not have permission to access finance workspace.</p>
            </div>
        );
    }

    if (!selectedAppId) {
        return (
            <div className="space-y-6 pb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Admission Finance & Fee Collection</h1>
                    <p className="text-sm text-gray-500 mt-1">Operational workspace — payments via Admission Engine</p>
                </div>
                <PaymentFilters status={statusFilter} onStatusChange={setStatusFilter} />
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={queueSearch} onChange={e => setQueueSearch(e.target.value)} placeholder="Search finance queue…" className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs" />
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black text-gray-900">Payment Queue</h2>
                        <Button variant="ghost" size="sm" onClick={() => refetchQueue()} className="gap-1 text-xs">
                            <RefreshCw className="w-3.5 h-3.5" /> Refresh
                        </Button>
                    </div>
                    <PaymentQueue items={queue} isLoading={queueLoading} onSelect={id => setSelectedAppId(id)} />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-6">
            <div className="flex items-center gap-4 flex-wrap">
                <button type="button" onClick={() => { setSelectedAppId(null); refetchQueue(); }} className="p-2 hover:bg-gray-100 rounded-xl">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-black text-gray-900 truncate">{application?.student_name ?? 'Finance'}</h1>
                    <p className="text-sm text-gray-500">{application?.grade_applied_for ?? ''} · {application?.status ?? ''}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.ADMISSION.DETAILS(selectedAppId))} className="text-xs">
                    Applicant 360
                </Button>
                <ExportMenu title="Payment Record" data={exportData} columns={Object.keys(exportData[0] ?? { Candidate: '' })} />
                <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1 text-xs">
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </Button>
            </div>

            {error ? (
                <div className="py-8 text-center">
                    <p className="text-sm text-rose-600 font-bold">Failed to load finance data.</p>
                    <Button size="sm" variant="outline" className="mt-3" onClick={() => refetch()}>Retry</Button>
                </div>
            ) : isLoading ? (
                <div className="py-16 text-center text-sm text-gray-400 animate-pulse">Loading finance data…</div>
            ) : (
                <>
                    <PaymentSummary summary={summary} />
                    <div className="grid lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            {record && <PaymentCard record={record} selected />}
                            <ReceiptViewer
                                receipt={receipt}
                                isSubmitting={isSubmitting}
                                onRegenerate={() => runFinanceAction('regenerate_receipt', { paymentId: record?.paymentId })}
                            />
                            <ReceiptHistory receipts={receiptHistory} />
                        </div>
                        <div className="space-y-4">
                            <PaymentToolbar
                                record={record}
                                canCollect={permissions.canCollect}
                                canVerify={permissions.canVerify}
                                canApprove={permissions.canApprove}
                                canReject={permissions.canReject}
                                canReceipt={permissions.canReceipt}
                                isSubmitting={isSubmitting}
                                onAction={(action, payload) => runFinanceAction(action, payload ?? {})}
                            />
                            <FeeStructurePanel
                                canAssign={permissions.canCollect}
                                isSubmitting={isSubmitting}
                                onAction={(action, payload) => runFinanceAction(action, payload ?? {})}
                            />
                            <WaiverPanel canWaiver={permissions.canWaiver} isSubmitting={isSubmitting} onAction={(a, p) => runFinanceAction(a, p ?? {})} />
                            <ScholarshipPanel canVerify={permissions.canVerify} isSubmitting={isSubmitting} onAction={(a, p) => runFinanceAction(a, p ?? {})} />
                            <div className="bg-white border rounded-2xl p-4 space-y-3">
                                <h3 className="text-xs font-black uppercase text-gray-400">Payment Timeline</h3>
                                <PaymentTimeline entries={history} />
                            </div>
                            <div className="bg-white border rounded-2xl p-4 space-y-3">
                                <h3 className="text-xs font-black uppercase text-gray-400">Finance Audit</h3>
                                <PaymentAudit entries={audit} />
                            </div>
                            <PaymentHistory entries={history} />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default FinanceWorkspace;
