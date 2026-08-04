import React from 'react';
import { Check, X, Clock } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import type { ApprovalItem } from '../types';

interface ApprovalCardProps {
    item: ApprovalItem;
    onApprove: () => void;
    onReject: () => void;
    onClick?: () => void;
}

const PRIORITY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
    high: 'destructive',
    medium: 'default',
    low: 'secondary',
};

export function ApprovalCard({ item, onApprove, onReject, onClick }: ApprovalCardProps) {
    return (
        <div
            className="bg-card border border-border rounded-2xl p-5 space-y-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && onClick?.()}
        >
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="text-sm font-bold">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {item.submittedBy} · {new Date(item.submittedAt).toLocaleDateString()}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {item.priority && (
                        <Badge variant={PRIORITY_VARIANT[item.priority]} className="text-[10px] uppercase">
                            {item.priority}
                        </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px] uppercase">
                        {item.module}
                    </Badge>
                </div>
            </div>

            {item.metadata && Object.keys(item.metadata).length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {Object.entries(item.metadata).map(([k, v]) => (
                        <span key={k} className="text-[10px] bg-muted px-2 py-1 rounded-lg font-semibold">
                            {k}: {v}
                        </span>
                    ))}
                </div>
            )}

            <div className="flex items-center gap-2 pt-2 border-t border-border/50" onClick={e => e.stopPropagation()}>
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground capitalize flex-1">{item.status}</span>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={onReject}>
                    <X className="w-3 h-3" />
                    Reject
                </Button>
                <Button size="sm" className="h-8 text-xs gap-1" onClick={onApprove}>
                    <Check className="w-3 h-3" />
                    Approve
                </Button>
            </div>
        </div>
    );
}
