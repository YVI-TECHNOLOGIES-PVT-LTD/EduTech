import { DocumentViewer as LegacyDocumentViewer } from '../components/DocumentViewer';
import type { VerificationDocument } from '../utils/documentVerification.mapper';

interface DocumentPreviewProps {
    document: VerificationDocument | null;
    onVerify?: (status: 'approved' | 'rejected', remark: string) => void;
    showControls?: boolean;
}

/** Reuses existing admission DocumentViewer — zoom, PDF/image, download */
export function DocumentPreview({ document, onVerify, showControls = true }: DocumentPreviewProps) {
    if (!document?.fileUrl) {
        return (
            <div className="h-[500px] flex items-center justify-center border border-dashed rounded-2xl text-sm text-gray-400">
                Select a document with an uploaded file to preview.
            </div>
        );
    }

    return (
        <LegacyDocumentViewer
            fileUrl={document.fileUrl}
            fileName={document.name}
            onVerify={onVerify}
            showControls={showControls}
        />
    );
}

export default DocumentPreview;
