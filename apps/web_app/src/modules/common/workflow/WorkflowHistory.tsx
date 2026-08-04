import React from 'react';
import { formatDistanceToNow } from 'date-fns';

interface HistoryEntry {
    step: string;
    timestamp: string;
    status: string;
}

interface WorkflowHistoryProps {
    entries: HistoryEntry[];
}

export function WorkflowHistory({ entries }: WorkflowHistoryProps) {
    return (
        <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">History</h4>
            {entries.map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="font-bold">{e.step}</span>
                    <span className="text-muted-foreground">
                        · {formatDistanceToNow(new Date(e.timestamp), { addSuffix: true })}
                    </span>
                </div>
            ))}
        </div>
    );
}
