import React from 'react';
import { Upload, Eye, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { DocumentItem } from './DocumentViewer';

interface DocumentTimelineProps {
    document: DocumentItem;
}

export function DocumentTimeline({ document }: DocumentTimelineProps) {
    const events = [
        { action: 'Uploaded', icon: Upload, time: document.uploadedAt, actor: document.uploadedBy || 'System' },
        { action: 'Viewed', icon: Eye, time: new Date().toISOString(), actor: 'Current User' },
    ];

    return (
        <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Audit Timeline</h4>
            {events.map((e, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                    <e.icon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="font-bold">{e.action}</span>
                    <span className="text-muted-foreground">
                        {e.actor} · {formatDistanceToNow(new Date(e.time), { addSuffix: true })}
                    </span>
                </div>
            ))}
        </div>
    );
}
