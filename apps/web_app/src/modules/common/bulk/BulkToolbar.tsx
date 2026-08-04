import React from 'react';
import { Layers } from 'lucide-react';
import { BulkActionMenu } from './BulkActionMenu';
import type { BulkOperationConfig } from './bulkOperations.config';

interface BulkToolbarProps {
    selectedCount: number;
    operations: BulkOperationConfig[];
    onSelectOperation: (operation: BulkOperationConfig) => void;
    moduleLabel?: string;
}

export function BulkToolbar({
    selectedCount,
    operations,
    onSelectOperation,
    moduleLabel,
}: BulkToolbarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl">
            <Layers className="w-4 h-4 text-gray-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                {selectedCount} selected{moduleLabel ? ` · ${moduleLabel}` : ''}
            </span>
            <BulkActionMenu operations={operations} onSelect={onSelectOperation} />
        </div>
    );
}
