import React from 'react';
import { DocumentPreview } from './DocumentPreview';
import { DocumentTimeline } from './DocumentTimeline';
import { DocumentHistory } from './DocumentHistory';
import { DocumentDownload } from './DocumentDownload';

export interface DocumentItem {
    id: string;
    name: string;
    url: string;
    type: string;
    uploadedAt: string;
    uploadedBy?: string;
    version?: number;
}

interface DocumentViewerProps {
    documents: DocumentItem[];
    onDownload?: (doc: DocumentItem) => void;
    onBulkDownload?: (docs: DocumentItem[]) => void;
}

export function DocumentViewer({ documents, onDownload, onBulkDownload }: DocumentViewerProps) {
    const [selected, setSelected] = React.useState<DocumentItem | null>(documents[0] ?? null);

    return (
        <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-2">
                {documents.map(doc => (
                    <button
                        key={doc.id}
                        type="button"
                        onClick={() => setSelected(doc)}
                        className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition-colors ${
                            selected?.id === doc.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/30'
                        }`}
                    >
                        {doc.name}
                        <span className="block text-[10px] text-muted-foreground font-normal mt-0.5">
                            v{doc.version ?? 1} · {doc.type}
                        </span>
                    </button>
                ))}
                {onBulkDownload && documents.length > 1 && (
                    <DocumentDownload
                        label="Download All"
                        onDownload={() => onBulkDownload(documents)}
                    />
                )}
            </div>
            <div className="lg:col-span-2 space-y-4">
                {selected && (
                    <>
                        <DocumentPreview document={selected} />
                        <div className="flex gap-2">
                            <DocumentDownload
                                label="Download"
                                onDownload={() => (onDownload ? onDownload(selected) : window.open(selected.url, '_blank'))}
                            />
                        </div>
                        <DocumentTimeline document={selected} />
                        <DocumentHistory documentId={selected.id} />
                    </>
                )}
            </div>
        </div>
    );
}
