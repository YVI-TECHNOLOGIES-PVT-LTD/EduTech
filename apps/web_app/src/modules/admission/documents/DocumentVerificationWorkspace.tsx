import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { AdmissionPermissions } from '../core/AdmissionPermissions';
import { useVerificationQueue } from '../hooks/useVerificationQueue';
import { useDocumentVerification } from '../hooks/useDocumentVerification';
import type { VerificationDocument } from '../utils/documentVerification.mapper';
import { DocumentGrid } from './DocumentGrid';
import { DocumentPreview } from './DocumentPreview';
import { VerificationToolbar } from './VerificationToolbar';
import { VerificationFilters } from './VerificationFilters';
import { VerificationSummary } from './VerificationSummary';
import { VerificationHistory } from './VerificationHistory';
import { Button } from '../../../components/ui/button';
import { ROUTES } from '../../../constants/routes';

export function DocumentVerificationWorkspace() {
    const navigate = useNavigate();
    const { user, hasPermission, hasRole } = useAuth();
    const permCtx = { roles: user?.roles ?? [], hasPermission, hasRole };

    const [queueSearch, setQueueSearch] = useState('');
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
    const [selectedDoc, setSelectedDoc] = useState<VerificationDocument | null>(null);
    const [docQuery, setDocQuery] = useState('');
    const [docStatusFilter, setDocStatusFilter] = useState('all');
    const [previewDoc, setPreviewDoc] = useState<VerificationDocument | null>(null);
    const [reuploadReason, setReuploadReason] = useState('');
    const [showReupload, setShowReupload] = useState(false);

    const canAccess =
        AdmissionPermissions.canVerifyDocuments(permCtx) ||
        AdmissionPermissions.canReviewApplications(permCtx);

    const { applications, summaries, isLoading: queueLoading, refetch: refetchQueue } = useVerificationQueue(queueSearch);

    const {
        application,
        summary,
        history,
        isLoading: docLoading,
        error,
        isSubmitting,
        refetch,
        permissions,
        runVerification,
        filterDocuments,
    } = useDocumentVerification(selectedAppId ?? undefined, permCtx);

    const filteredDocs = filterDocuments(docQuery, docStatusFilter);
    const completeEnabled = summary ? summary.missingCount === 0 && summary.pendingCount > 0 : false;

    const handleReupload = async () => {
        if (!selectedDoc) return;
        await runVerification('request_reupload', { document: selectedDoc, remark: reuploadReason });
        setShowReupload(false);
        setReuploadReason('');
    };

    if (!canAccess) {
        return (
            <div className="py-16 text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                <p className="text-sm font-bold text-gray-700">You do not have permission to access document verification.</p>
            </div>
        );
    }

    if (!selectedAppId) {
        return (
            <div className="space-y-6 pb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Document Verification Center</h1>
                    <p className="text-sm text-gray-500 mt-1">Operational workspace — live queue via Admission Engine</p>
                </div>

                <div className="relative max-w-md">
                    <input
                        type="text"
                        value={queueSearch}
                        onChange={e => setQueueSearch(e.target.value)}
                        placeholder="Search queue…"
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs"
                    />
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black text-gray-900">Verification Pending Queue</h2>
                        <Button variant="ghost" size="sm" onClick={() => refetchQueue()} className="gap-1 text-xs">
                            <RefreshCw className="w-3.5 h-3.5" /> Refresh
                        </Button>
                    </div>
                    {queueLoading ? (
                        <p className="text-xs text-gray-400 animate-pulse">Loading queue…</p>
                    ) : applications.length === 0 ? (
                        <p className="text-xs text-gray-400 py-8 text-center">No applications pending document verification.</p>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {summaries.map(item => (
                                <div key={item.applicationId} className="flex justify-between items-center py-3.5 gap-4">
                                    <div>
                                        <p className="text-xs font-black text-gray-900">{item.studentName}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                            {item.grade ?? '—'} · {item.pendingCount} pending · {item.missingCount} missing
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            setSelectedAppId(item.applicationId);
                                            setSelectedDoc(null);
                                            setPreviewDoc(null);
                                        }}
                                        className="bg-gray-900 text-white text-xs font-bold shrink-0"
                                    >
                                        Verify Documents
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-6">
            <div className="flex items-center gap-4 flex-wrap">
                <button
                    type="button"
                    onClick={() => {
                        setSelectedAppId(null);
                        setPreviewDoc(null);
                        refetchQueue();
                    }}
                    className="p-2 hover:bg-gray-100 rounded-xl"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-black text-gray-900 truncate">
                        {application?.student_name ?? 'Document Verification'}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {application?.grade_applied_for ?? ''} · Status: {application?.status ?? '—'}
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(ROUTES.ADMISSION.DETAILS(selectedAppId))}
                    className="text-xs"
                >
                    Applicant 360
                </Button>
            </div>

            {error ? (
                <div className="py-8 text-center space-y-3">
                    <p className="text-sm text-rose-600">Failed to load application.</p>
                    <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
                </div>
            ) : docLoading ? (
                <div className="py-16 text-center text-sm text-gray-400 animate-pulse">Loading documents…</div>
            ) : (
                <>
                    <VerificationSummary summary={summary} />

                    <VerificationToolbar
                        canVerify={permissions.canVerify}
                        canReject={permissions.canReject}
                        isSubmitting={isSubmitting}
                        completeEnabled={completeEnabled}
                        onApproveAll={() => runVerification('approve_all')}
                        onComplete={() => runVerification('complete_verification')}
                        onRejectAll={() => runVerification('reject_all')}
                        onRefresh={() => refetch()}
                    />

                    <VerificationFilters
                        query={docQuery}
                        onQueryChange={setDocQuery}
                        statusFilter={docStatusFilter}
                        onStatusFilterChange={setDocStatusFilter}
                    />

                    <div className="grid lg:grid-cols-2 gap-6">
                        <DocumentGrid
                            documents={filteredDocs}
                            selectedId={selectedDoc?.id}
                            onSelect={doc => {
                                setSelectedDoc(doc);
                                setPreviewDoc(doc);
                            }}
                            onPreview={setPreviewDoc}
                            onVerify={doc => runVerification('verify_document', { document: doc })}
                            onReject={doc => runVerification('reject_document', { document: doc, remark: 'Rejected' })}
                            onRequestReupload={doc => {
                                setSelectedDoc(doc);
                                setShowReupload(true);
                            }}
                            canVerify={permissions.canVerify}
                            disabled={isSubmitting}
                        />

                        <div className="space-y-4">
                            <DocumentPreview
                                document={previewDoc}
                                showControls={!permissions.canVerify}
                            />
                            <div className="bg-white border rounded-2xl p-4 space-y-3">
                                <h3 className="text-xs font-black uppercase text-gray-400">Verification History</h3>
                                <VerificationHistory entries={history} />
                            </div>
                        </div>
                    </div>

                    {showReupload && selectedDoc && (
                        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6">
                            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
                                <h3 className="text-sm font-black">Request Re-upload — {selectedDoc.name}</h3>
                                <textarea
                                    value={reuploadReason}
                                    onChange={e => setReuploadReason(e.target.value)}
                                    placeholder="Reason for re-upload…"
                                    className="w-full border rounded-xl p-3 text-xs min-h-[80px]"
                                />
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" onClick={() => setShowReupload(false)}>Cancel</Button>
                                    <Button
                                        onClick={handleReupload}
                                        disabled={isSubmitting || !reuploadReason.trim()}
                                        className="bg-orange-600 text-white"
                                    >
                                        Send Request
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default DocumentVerificationWorkspace;
