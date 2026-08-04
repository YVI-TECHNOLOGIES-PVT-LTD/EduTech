import React from 'react';
import { ApprovalTimeline } from './ApprovalTimeline';

interface HistoryEntry {
    id: string;
    action: string;
    actor: string;
    timestamp: string;
    status: 'approved' | 'rejected' | 'pending' | 'review';
    comment?: string;
}

interface ApprovalHistoryProps {
    entries: HistoryEntry[];
    title?: string;
}

export function ApprovalHistory({ entries, title = 'Approval History' }: ApprovalHistoryProps) {
    return (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider">{title}</h3>
            <ApprovalTimeline entries={entries} />
        </div>
    );
}
