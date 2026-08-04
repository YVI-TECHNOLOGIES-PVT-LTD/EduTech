import React from 'react';
import { History } from 'lucide-react';

interface VersionEntry {
    version: number;
    uploadedAt: string;
    uploadedBy: string;
}

interface DocumentHistoryProps {
    documentId: string;
    versions?: VersionEntry[];
}

export function DocumentHistory({ documentId, versions }: DocumentHistoryProps) {
    const entries = versions ?? [{ version: 1, uploadedAt: new Date().toISOString(), uploadedBy: 'System' }];

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <History className="w-3.5 h-3.5 text-muted-foreground" />
                <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Version History
                </h4>
            </div>
            {entries.map(v => (
                <div key={`${documentId}-v${v.version}`} className="text-xs flex items-center gap-2 p-2 bg-muted/20 rounded-lg">
                    <span className="font-bold">v{v.version}</span>
                    <span className="text-muted-foreground">
                        {v.uploadedBy} · {new Date(v.uploadedAt).toLocaleDateString()}
                    </span>
                </div>
            ))}
        </div>
    );
}
