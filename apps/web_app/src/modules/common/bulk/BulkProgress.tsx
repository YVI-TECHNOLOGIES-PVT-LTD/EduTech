import React from 'react';
import { Progress } from '../../../components/ui/progress';

interface BulkProgressProps {
    total: number;
    completed: number;
    label?: string;
}

export function BulkProgress({ total, completed, label = 'Processing bulk operation' }: BulkProgressProps) {
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
        <div className="space-y-3 p-6 bg-card border border-border rounded-2xl">
            <div className="flex items-center justify-between text-xs font-bold">
                <span>{label}</span>
                <span className="text-muted-foreground">
                    {completed} / {total}
                </span>
            </div>
            <Progress value={pct} className="h-2" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{pct}% complete</p>
        </div>
    );
}
