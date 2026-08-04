import React, { useMemo, useState, useEffect } from 'react';
import { ShieldCheck, Eye, RefreshCw, CheckCircle2, XCircle, AlertCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { admissionApi } from '../../../admission.api';
import { toast } from 'sonner';

interface DocumentWorkspaceProps {
    applications: any[];
    isLoading: boolean;
    refetch: () => void;
}

export function DocumentWorkspace({ applications, isLoading, refetch }: DocumentWorkspaceProps) {
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [remarks, setRemarks] = useState('');

    const documentApps = useMemo(() => {
        return applications.filter(a => ['submitted', 'under_review', 'docs_pending', 'document_verified'].includes(a.status));
    }, [applications]);

    const activeApp = useMemo(() => {
        return applications.find(a => a.id === selectedAppId) || null;
    }, [applications, selectedAppId]);

    const loadDocuments = async (appId: string) => {
        try {
            setLoadingDocs(true);
            const { data } = await admissionApi.listCrmDocuments(appId);
            setDocuments(data || []);
        } catch {
            toast.error('Failed to retrieve documents list');
        } finally {
            setLoadingDocs(false);
        }
    };

    useEffect(() => {
        if (selectedAppId) {
            loadDocuments(selectedAppId);
        } else {
            setDocuments([]);
        }
    }, [selectedAppId]);

    const handleVerifyDoc = async (docId: string) => {
        try {
            await admissionApi.verifyCrmDocument(docId, remarks || 'Verified');
            toast.success('Document verified successfully');
            setRemarks('');
            if (selectedAppId) loadDocuments(selectedAppId);
            refetch();
        } catch {
            toast.error('Verification failed');
        }
    };

    const handleRejectDoc = async (docId: string) => {
        if (!remarks) return toast.warning('Please enter rejection remarks first');
        try {
            await admissionApi.rejectCrmDocument(docId, remarks);
            toast.success('Document rejected');
            setRemarks('');
            if (selectedAppId) loadDocuments(selectedAppId);
            refetch();
        } catch {
            toast.error('Rejection failed');
        }
    };

    const handleCorrectionDoc = async (docId: string) => {
        if (!remarks) return toast.warning('Please enter correction request remarks');
        try {
            await admissionApi.requestCrmDocumentCorrection(docId, remarks);
            toast.success('Correction request dispatched');
            setRemarks('');
            if (selectedAppId) loadDocuments(selectedAppId);
            refetch();
        } catch {
            toast.error('Correction request failed');
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List of candidates awaiting doc verification */}
            <div className="bg-white dark:bg-card p-5 border rounded-2xl shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 flex items-center justify-between pb-2 border-b">
                    <span>Candidates Queue</span>
                    <span className="px-2 py-0.5 rounded bg-gray-150 text-[9px] font-black text-gray-700">
                        {documentApps.length}
                    </span>
                </h3>
                <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                    {isLoading ? (
                        <p className="text-xs text-gray-400 animate-pulse">Loading candidates list...</p>
                    ) : documentApps.length === 0 ? (
                        <p className="text-xs text-gray-400">No applications pending doc verification.</p>
                    ) : (
                        documentApps.map(app => {
                            const isSelected = selectedAppId === app.id;
                            return (
                                <div
                                    key={app.id}
                                    onClick={() => setSelectedAppId(app.id)}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                        isSelected
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-sm'
                                            : 'hover:bg-gray-50 border-gray-100 text-gray-700'
                                    }`}
                                >
                                    <p className="font-bold text-[11px] truncate">{app.student_name}</p>
                                    <div className="flex justify-between items-center text-[9px] text-gray-400 font-bold uppercase mt-1">
                                        <span>{app.id.slice(0, 8)} • {app.grade_applied_for}</span>
                                        <span className="text-indigo-600">{app.status}</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Document checklist reviews for selected candidate */}
            <div className="lg:col-span-2 bg-white dark:bg-card p-6 border rounded-2xl shadow-sm space-y-4">
                {activeApp ? (
                    <>
                        <div className="flex items-center justify-between pb-3 border-b">
                            <div>
                                <h3 className="text-sm font-black text-gray-900">{activeApp.student_name}</h3>
                                <p className="text-xs text-gray-400 font-bold uppercase mt-0.5">{activeApp.id} • {activeApp.grade_applied_for}</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => loadDocuments(activeApp.id)} className="h-8 gap-1">
                                <RefreshCw className="w-3.5 h-3.5" /> Refresh
                            </Button>
                        </div>

                        {loadingDocs ? (
                            <p className="text-xs text-gray-400 animate-pulse py-12 text-center">Loading candidate files...</p>
                        ) : documents.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed rounded-xl bg-gray-50/50">
                                <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-xs text-gray-400 font-bold">No documents uploaded for this application yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Verification Remarks / Feedback</label>
                                    <input
                                        type="text"
                                        value={remarks}
                                        onChange={e => setRemarks(e.target.value)}
                                        placeholder="Reason for rejection or verification notes..."
                                        className="w-full text-xs border rounded-lg p-2.5 h-9"
                                    />
                                </div>

                                <div className="space-y-3">
                                    {documents.map((doc, idx) => {
                                        let statusBadge = 'bg-gray-100 text-gray-500';
                                        if (doc.status === 'VERIFIED') statusBadge = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                                        else if (doc.status === 'REJECTED') statusBadge = 'bg-rose-50 text-rose-600 border-rose-100';
                                        else if (doc.status === 'CORRECTION_REQUIRED') statusBadge = 'bg-amber-50 text-amber-600 border-amber-100';

                                        return (
                                            <div key={idx} className="p-4 border rounded-xl flex items-start gap-4 hover:shadow-sm transition-all">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-50 border flex items-center justify-center shrink-0">
                                                    <FileText className="w-5 h-5 text-indigo-600" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-bold text-xs text-gray-800">{doc.document_type?.replace(/_/g, ' ').toUpperCase()}</span>
                                                        <span className={`text-[8px] font-black uppercase px-1.5 rounded border ${statusBadge}`}>{doc.status || 'PENDING'}</span>
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 truncate mt-0.5">File ID: {doc.id.slice(0, 12)}...</p>
                                                    
                                                    <div className="flex gap-2 mt-3 flex-wrap">
                                                        {doc.file_url && (
                                                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                                                <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1">
                                                                    <Eye className="w-3.5 h-3.5" /> View File
                                                                </Button>
                                                            </a>
                                                        )}
                                                        {doc.status !== 'VERIFIED' && (
                                                            <>
                                                                <Button size="sm" onClick={() => handleVerifyDoc(doc.id)} className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700">
                                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Verify
                                                                </Button>
                                                                <Button size="sm" variant="outline" onClick={() => handleCorrectionDoc(doc.id)} className="h-7 text-[10px] text-amber-600 hover:bg-amber-50 border-amber-200">
                                                                    Correction
                                                                </Button>
                                                                <Button size="sm" variant="destructive" onClick={() => handleRejectDoc(doc.id)} className="h-7 text-[10px]">
                                                                    <XCircle className="w-3.5 h-3.5" /> Reject
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="py-24 text-center border-2 border-dashed rounded-xl bg-gray-50/50">
                        <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-400 font-bold">Select a candidate from the left panel to begin document verification.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DocumentWorkspace;
