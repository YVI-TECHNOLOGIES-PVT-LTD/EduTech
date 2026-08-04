import type { VerificationDocument } from '../utils/documentVerification.mapper';
import { FileText, CheckCircle2, XCircle, Clock, AlertTriangle, Download, Eye } from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface DocumentCardProps {
    document: VerificationDocument;
    selected?: boolean;
    onSelect?: () => void;
    onPreview?: () => void;
    onVerify?: () => void;
    onReject?: () => void;
    onRequestReupload?: () => void;
    canVerify?: boolean;
    disabled?: boolean;
}

const STATUS_STYLE: Record<string, string> = {
    verified: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    pending: 'bg-amber-50 text-amber-700 border-amber-100',
    rejected: 'bg-rose-50 text-rose-700 border-rose-100',
    correction: 'bg-orange-50 text-orange-700 border-orange-100',
    missing: 'bg-gray-100 text-gray-600 border-gray-200',
};

export function DocumentCard({
    document,
    selected,
    onSelect,
    onPreview,
    onVerify,
    onReject,
    onRequestReupload,
    canVerify,
    disabled,
}: DocumentCardProps) {
    return (
        <div
            className={`rounded-2xl border p-4 space-y-3 transition-all ${
                selected ? 'border-indigo-400 bg-indigo-50/30' : 'border-gray-150 bg-white dark:bg-card'
            } ${disabled ? 'opacity-60' : ''}`}
        >
            <div className="flex items-start justify-between gap-2">
                <button type="button" onClick={onSelect} className="text-left flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                        <p className="text-xs font-black text-gray-900 dark:text-gray-100 truncate">{document.name}</p>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">{document.category}</p>
                </button>
                <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase shrink-0 ${STATUS_STYLE[document.status] ?? STATUS_STYLE.pending}`}>
                    {document.status}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                    <span className="text-gray-400 font-bold uppercase">Required</span>
                    <p className="font-medium">{document.required ? 'Yes' : 'No'}</p>
                </div>
                <div>
                    <span className="text-gray-400 font-bold uppercase">Uploaded</span>
                    <p className="font-medium">{document.uploaded ? 'Yes' : 'No'}</p>
                </div>
                {document.uploadedAt && (
                    <div className="col-span-2">
                        <span className="text-gray-400 font-bold uppercase">Uploaded</span>
                        <p className="font-medium">{new Date(document.uploadedAt).toLocaleString()}</p>
                    </div>
                )}
                {document.verifiedBy && (
                    <div className="col-span-2">
                        <span className="text-gray-400 font-bold uppercase">Verified by</span>
                        <p className="font-medium">{document.verifiedBy} · {document.verifiedAt ? new Date(document.verifiedAt).toLocaleDateString() : ''}</p>
                    </div>
                )}
                {document.remarks && (
                    <div className="col-span-2">
                        <span className="text-gray-400 font-bold uppercase">Remarks</span>
                        <p className="font-medium text-gray-600">{document.remarks}</p>
                    </div>
                )}
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-gray-100">
                {document.fileUrl && (
                    <>
                        <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1" onClick={onPreview}>
                            <Eye className="w-3 h-3" /> Preview
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1" asChild>
                            <a href={document.fileUrl} download target="_blank" rel="noreferrer">
                                <Download className="w-3 h-3" /> Download
                            </a>
                        </Button>
                    </>
                )}
                {canVerify && document.uploaded && document.status === 'pending' && (
                    <>
                        <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1 text-emerald-600" onClick={onVerify} disabled={disabled}>
                            <CheckCircle2 className="w-3 h-3" /> Verify
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1 text-orange-600" onClick={onRequestReupload} disabled={disabled}>
                            <Clock className="w-3 h-3" /> Re-upload
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1 text-rose-600" onClick={onReject} disabled={disabled}>
                            <XCircle className="w-3 h-3" /> Reject
                        </Button>
                    </>
                )}
                {document.status === 'missing' && (
                    <span className="text-[9px] text-rose-600 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Awaiting upload
                    </span>
                )}
            </div>
        </div>
    );
}

export default DocumentCard;
