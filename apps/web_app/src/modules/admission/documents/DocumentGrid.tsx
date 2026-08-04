import type { VerificationDocument } from '../utils/documentVerification.mapper';
import { DocumentCard } from './DocumentCard';

interface DocumentGridProps {
    documents: VerificationDocument[];
    selectedId?: string;
    onSelect: (doc: VerificationDocument) => void;
    onPreview: (doc: VerificationDocument) => void;
    onVerify?: (doc: VerificationDocument) => void;
    onReject?: (doc: VerificationDocument) => void;
    onRequestReupload?: (doc: VerificationDocument) => void;
    canVerify?: boolean;
    disabled?: boolean;
}

export function DocumentGrid({
    documents,
    selectedId,
    onSelect,
    onPreview,
    onVerify,
    onReject,
    onRequestReupload,
    canVerify,
    disabled,
}: DocumentGridProps) {
    if (documents.length === 0) {
        return (
            <div className="py-12 text-center text-sm text-gray-400 border border-dashed rounded-2xl">
                No documents to display.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map(doc => (
                <DocumentCard
                    key={doc.id}
                    document={doc}
                    selected={selectedId === doc.id}
                    onSelect={() => onSelect(doc)}
                    onPreview={() => onPreview(doc)}
                    onVerify={onVerify ? () => onVerify(doc) : undefined}
                    onReject={onReject ? () => onReject(doc) : undefined}
                    onRequestReupload={onRequestReupload ? () => onRequestReupload(doc) : undefined}
                    canVerify={canVerify}
                    disabled={disabled}
                />
            ))}
        </div>
    );
}

export default DocumentGrid;
