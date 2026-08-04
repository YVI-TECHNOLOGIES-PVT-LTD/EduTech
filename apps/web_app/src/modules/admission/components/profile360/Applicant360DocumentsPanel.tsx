import React, { useRef, useState } from 'react';
import { Upload, Trash2, Download, CheckCircle, XCircle, FileText } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { admissionApi } from '../../admission.api';
import { useCrmDocuments } from '../../hooks/useCrmDocuments';
import { useAuth } from '../../../../context/AuthContext';
import { AdmissionPermissions } from '../../core/AdmissionPermissions';
import type { ApplicationProgressReport } from '../../hooks/useApplicationProgress';
import { formatSectionStatus } from '../../hooks/useApplicationProgress';

const DEFAULT_DOCUMENT_TYPES = [
    { code: 'birth_certificate', label: 'Birth Certificate' },
    { code: 'student_photo', label: 'Student Photograph' },
    { code: 'parent_aadhaar', label: 'Parent Aadhaar Card' },
    { code: 'academic_marksheet', label: 'Academic Mark Sheet' },
    { code: 'medical_certificate', label: 'Medical Certificate' },
    { code: 'transfer_certificate', label: 'Transfer Certificate' },
];

interface Applicant360DocumentsPanelProps {
    applicationId: string;
    progress?: ApplicationProgressReport | null;
    readOnlyMode?: boolean;
}

export function Applicant360DocumentsPanel({ applicationId, progress, readOnlyMode = false }: Applicant360DocumentsPanelProps) {
    const { user, hasPermission, hasRole } = useAuth();
    const fileRef = useRef<HTMLInputElement>(null);
    const [selectedType, setSelectedType] = useState(DEFAULT_DOCUMENT_TYPES[0].code);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectTarget, setRejectTarget] = useState<string | null>(null);

    const {
        documents,
        isLoading,
        uploadDocument,
        deleteDocument,
        verifyDocument,
        rejectDocument,
        isUploading,
        isVerifying,
    } = useCrmDocuments(applicationId);

    const permCtx = { roles: user?.roles ?? [], hasPermission, hasRole };
    const canUpload =
        AdmissionPermissions.isCounselor(permCtx) ||
        hasPermission('admission.document.upload') ||
        AdmissionPermissions.canViewOwnApplications(permCtx);
    const canVerify =
        !readOnlyMode &&
        (AdmissionPermissions.canReviewApplications(permCtx) ||
        hasPermission('admission.document.verify'));

    const documentTypeOptions = progress?.documentItems?.length
        ? progress.documentItems.map(item => ({ code: item.code, label: item.name }))
        : DEFAULT_DOCUMENT_TYPES;

    const checklistItems = progress?.documentItems?.length
        ? progress.documentItems
        : DEFAULT_DOCUMENT_TYPES.map(t => ({
              code: t.code,
              name: t.label,
              mandatory: ['birth_certificate', 'student_photo', 'parent_aadhaar'].includes(t.code),
              uploaded: false,
              verified: false,
              status: 'MISSING',
              documentId: undefined as string | undefined,
          }));

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await uploadDocument({ file, documentTypeCode: selectedType });
        if (fileRef.current) fileRef.current.value = '';
    };

    const handleDownload = async (documentId: string) => {
        const res = await admissionApi.getCrmDocumentDownloadUrl(documentId);
        const url = (res.data as { download_url?: string; url?: string })?.download_url
            ?? (res.data as { url?: string })?.url;
        if (url) window.open(url, '_blank');
    };

    const statusBadge = (status: string, verified: boolean) => {
        if (verified || status === 'VERIFIED') {
            return <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600">Verified</span>;
        }
        if (status === 'REJECTED') {
            return <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-50 text-rose-600">Rejected</span>;
        }
        if (status === 'PENDING_VERIFICATION' || status === 'UPLOADED') {
            return <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-600">Pending</span>;
        }
        return <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">Missing</span>;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-500" /> Document Management
                </h3>
                {progress && (
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                        {progress.sections.documents.completed} / {progress.sections.documents.total} verified
                    </span>
                )}
            </div>

            {canUpload && (
                <div className="flex flex-wrap items-end gap-2 p-4 border rounded-xl bg-gray-50/50">
                    <div className="flex-1 min-w-[140px]">
                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Document type</label>
                        <select
                            value={selectedType}
                            onChange={e => setSelectedType(e.target.value)}
                            className="w-full text-xs border rounded-lg px-2 py-1.5 bg-white"
                        >
                            {documentTypeOptions.map(t => (
                                <option key={t.code} value={t.code}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                    <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                    <Button
                        size="sm"
                        className="gap-1 text-xs"
                        disabled={isUploading}
                        onClick={() => fileRef.current?.click()}
                    >
                        <Upload className="w-3.5 h-3.5" /> Upload
                    </Button>
                </div>
            )}

            {isLoading ? (
                <p className="text-xs text-gray-400 animate-pulse">Loading documents…</p>
            ) : (
                <div className="space-y-2">
                    {checklistItems.map(item => {
                        const doc = documents.find(d => item.documentId && d.id === item.documentId)
                            ?? documents.find(d => d.original_filename?.toLowerCase().includes(item.code.toLowerCase().replace(/_/g, ' ')));
                        const docId = item.documentId ?? doc?.id;

                        return (
                            <div key={item.code} className="flex items-center justify-between gap-2 p-3 border rounded-xl text-xs">
                                <div className="min-w-0">
                                    <p className="font-bold text-gray-800 dark:text-gray-200 truncate">
                                        {item.name}
                                        {item.mandatory && <span className="text-rose-500 ml-1">*</span>}
                                    </p>
                                    {doc?.original_filename && (
                                        <p className="text-[10px] text-gray-400 truncate">{doc.original_filename}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    {statusBadge(item.status, item.verified)}
                                    {docId && (
                                        <>
                                            <button type="button" onClick={() => handleDownload(docId)} className="p-1 text-gray-400 hover:text-indigo-600" title="Download">
                                                <Download className="w-3.5 h-3.5" />
                                            </button>
                                            {canVerify && item.status !== 'VERIFIED' && (
                                                <button type="button" onClick={() => verifyDocument({ documentId: docId })} disabled={isVerifying} className="p-1 text-gray-400 hover:text-emerald-600" title="Verify">
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            {canVerify && (
                                                <button type="button" onClick={() => setRejectTarget(docId)} className="p-1 text-gray-400 hover:text-rose-600" title="Reject">
                                                    <XCircle className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            {canUpload && (
                                                <button type="button" onClick={() => deleteDocument(docId)} className="p-1 text-gray-400 hover:text-rose-600" title="Delete">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {rejectTarget && (
                <div className="p-4 border border-rose-200 rounded-xl bg-rose-50 space-y-2">
                    <p className="text-xs font-bold text-rose-700">Rejection reason</p>
                    <input
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        className="w-full text-xs border rounded-lg px-2 py-1.5"
                        placeholder="Enter reason for rejection"
                    />
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="destructive"
                            className="text-xs"
                            onClick={async () => {
                                await rejectDocument({ documentId: rejectTarget, reason: rejectReason || 'Rejected' });
                                setRejectTarget(null);
                                setRejectReason('');
                            }}
                        >
                            Confirm Reject
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => setRejectTarget(null)}>
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {progress && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    {(['interview', 'exam', 'fees', 'verification'] as const).map(key => (
                        <div key={key} className="p-2 bg-gray-50 rounded-lg">
                            <p className="text-[9px] font-bold text-gray-400 uppercase">{progress.sections[key].label}</p>
                            <p className="text-xs font-black text-gray-700">{formatSectionStatus(progress.sections[key].status)}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Applicant360DocumentsPanel;
