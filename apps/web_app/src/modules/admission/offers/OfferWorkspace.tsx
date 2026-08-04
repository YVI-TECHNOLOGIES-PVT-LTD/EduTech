import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, RefreshCw, Search } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { AdmissionPermissions } from '../core/AdmissionPermissions';
import { useOfferQueue } from '../hooks/useOfferQueue';
import { useOfferWorkspace } from '../hooks/useOfferWorkspace';
import { OfferQueue } from './OfferQueue';
import { OfferCard } from './OfferCard';
import { OfferSummary } from './OfferSummary';
import { OfferPreview } from './OfferPreview';
import { OfferDetails } from './OfferDetails';
import { OfferToolbar } from './OfferToolbar';
import { OfferTimeline } from './OfferTimeline';
import { OfferHistory } from './OfferHistory';
import { OfferAudit } from './OfferAudit';
import { OfferFilters } from './OfferFilters';
import { ExportMenu } from '../../common/reports/ExportMenu';
import { offerRecordToExportRow } from '../utils/offer.mapper';
import { Button } from '../../../components/ui/button';
import { ROUTES } from '../../../constants/routes';

export function OfferWorkspace() {
    const navigate = useNavigate();
    const { user, hasPermission, hasRole } = useAuth();
    const permCtx = { roles: user?.roles ?? [], hasPermission, hasRole };

    const [queueSearch, setQueueSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

    const canAccess =
        AdmissionPermissions.canManageOffers(permCtx) ||
        AdmissionPermissions.canReviewApplications(permCtx) ||
        AdmissionPermissions.canAcceptOffer(permCtx);

    const { queue, isLoading: queueLoading, refetch: refetchQueue } = useOfferQueue(queueSearch, statusFilter);

    const {
        application,
        record,
        summary,
        history,
        audit,
        isLoading,
        error,
        isSubmitting,
        refetch,
        permissions,
        runOfferAction,
    } = useOfferWorkspace(selectedAppId ?? undefined, permCtx);

    const exportData = record ? [offerRecordToExportRow(record)] : [];

    if (!canAccess) {
        return (
            <div className="py-16 text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                <p className="text-sm font-bold text-gray-700">You do not have permission to access offer management.</p>
            </div>
        );
    }

    if (!selectedAppId) {
        return (
            <div className="space-y-6 pb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Offer Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Operational workspace — admission decisions via Admission Engine</p>
                </div>

                <OfferFilters status={statusFilter} onStatusChange={setStatusFilter} />

                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={queueSearch}
                        onChange={e => setQueueSearch(e.target.value)}
                        placeholder="Search offer queue…"
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs"
                    />
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black text-gray-900">Offer Queue</h2>
                        <Button variant="ghost" size="sm" onClick={() => refetchQueue()} className="gap-1 text-xs">
                            <RefreshCw className="w-3.5 h-3.5" /> Refresh
                        </Button>
                    </div>
                    <OfferQueue items={queue} isLoading={queueLoading} onSelect={id => setSelectedAppId(id)} />
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
                    <h1 className="text-2xl font-black text-gray-900 truncate">{application?.student_name ?? 'Offer Management'}</h1>
                    <p className="text-sm text-gray-500">{application?.grade_applied_for ?? ''} · {application?.status ?? ''}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.ADMISSION.DETAILS(selectedAppId))} className="text-xs">
                    Applicant 360
                </Button>
                <ExportMenu title="Offer Record" data={exportData} columns={Object.keys(exportData[0] ?? { Candidate: '' })} />
                <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1 text-xs">
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </Button>
            </div>

            {error ? (
                <div className="py-8 text-center">
                    <p className="text-sm text-rose-600 font-bold">Failed to load offer data.</p>
                    <Button size="sm" variant="outline" className="mt-3" onClick={() => refetch()}>Retry</Button>
                </div>
            ) : isLoading ? (
                <div className="py-16 text-center text-sm text-gray-400 animate-pulse">Loading offer data…</div>
            ) : (
                <>
                    <OfferSummary summary={summary} />

                    <div className="grid lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            {record && <OfferCard record={record} selected />}
                            <OfferPreview record={record} />
                            <OfferDetails record={record} />
                        </div>
                        <div className="space-y-4">
                            <OfferToolbar
                                record={record}
                                canGenerate={permissions.canGenerate}
                                canApprove={permissions.canApprove}
                                canPublish={permissions.canPublish}
                                canSend={permissions.canSend}
                                canAccept={permissions.canAccept}
                                canReject={permissions.canReject}
                                canWithdraw={permissions.canWithdraw}
                                isSubmitting={isSubmitting}
                                onAction={(action, payload) => runOfferAction(action, payload ?? {})}
                            />
                            <div className="bg-white border rounded-2xl p-4 space-y-3">
                                <h3 className="text-xs font-black uppercase text-gray-400">Offer Timeline</h3>
                                <OfferTimeline entries={history} />
                            </div>
                            <div className="bg-white border rounded-2xl p-4 space-y-3">
                                <h3 className="text-xs font-black uppercase text-gray-400">Offer Audit</h3>
                                <OfferAudit entries={audit} />
                            </div>
                            <OfferHistory entries={history} />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default OfferWorkspace;
