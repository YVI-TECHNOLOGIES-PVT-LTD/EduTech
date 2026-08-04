import React from 'react';
import { Merge } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import type { DocumentItem } from './DocumentViewer';

interface DocumentMergeProps {
    documents: DocumentItem[];
    onMerge?: (docs: DocumentItem[]) => void | Promise<void>;
}

export function DocumentMerge({ documents, onMerge }: DocumentMergeProps) {
    if (documents.length < 2) return null;

    return (
        <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs"
            onClick={() => onMerge?.(documents)}
        >
            <Merge className="w-3.5 h-3.5" />
            Merge {documents.length} Documents
        </Button>
    );
}
