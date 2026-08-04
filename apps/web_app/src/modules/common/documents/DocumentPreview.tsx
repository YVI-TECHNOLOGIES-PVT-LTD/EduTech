import React from 'react';
import { FileText, Image, File } from 'lucide-react';
import type { DocumentItem } from './DocumentViewer';

interface DocumentPreviewProps {
    document: DocumentItem;
}

const ICON_MAP: Record<string, React.ElementType> = {
    pdf: FileText,
    image: Image,
    png: Image,
    jpg: Image,
};

export function DocumentPreview({ document }: DocumentPreviewProps) {
    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'image'].some(t =>
        document.type.toLowerCase().includes(t),
    );
    const isPdf = document.type.toLowerCase().includes('pdf');
    const Icon = ICON_MAP[document.type.toLowerCase()] || File;

    return (
        <div className="bg-muted/20 border border-border rounded-2xl overflow-hidden min-h-[300px] flex items-center justify-center">
            {isImage ? (
                <img src={document.url} alt={document.name} className="max-w-full max-h-[400px] object-contain" />
            ) : isPdf ? (
                <iframe src={document.url} title={document.name} className="w-full h-[400px] border-0" />
            ) : (
                <div className="text-center p-8">
                    <Icon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm font-bold">{document.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">Preview not available for this file type</p>
                </div>
            )}
        </div>
    );
}
