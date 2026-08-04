import React from 'react';
import { Check, X, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TimelineEntry {
    id: string;
    action: string;
    actor: string;
    timestamp: string;
    status: 'approved' | 'rejected' | 'pending' | 'review';
    comment?: string;
}

interface ApprovalTimelineProps {
    entries: TimelineEntry[];
}

const STATUS_ICON = {
    approved: Check,
    rejected: X,
    pending: Clock,
    review: Clock,
};

const STATUS_COLOR = {
    approved: 'text-emerald-500 bg-emerald-50',
    rejected: 'text-red-500 bg-red-50',
    pending: 'text-amber-500 bg-amber-50',
    review: 'text-blue-500 bg-blue-50',
};

export function ApprovalTimeline({ entries }: ApprovalTimelineProps) {
    return (
        <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-border">
            {entries.map(entry => {
                const Icon = STATUS_ICON[entry.status];
                return (
                    <div key={entry.id} className="relative">
                        <div
                            className={`absolute -left-6 w-6 h-6 rounded-full flex items-center justify-center ${STATUS_COLOR[entry.status]}`}
                        >
                            <Icon className="w-3 h-3" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-bold">{entry.action}</p>
                            <p className="text-xs text-muted-foreground">
                                {entry.actor} ·{' '}
                                {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                            </p>
                            {entry.comment && (
                                <p className="text-xs text-muted-foreground italic">{entry.comment}</p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
