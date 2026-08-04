import React from 'react';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';
import type { ApprovalItem } from '../types';

interface ApprovalSummaryProps {
    items: ApprovalItem[];
}

export function ApprovalSummary({ items }: ApprovalSummaryProps) {
    const pending = items.filter(i => i.status === 'pending' || i.status === 'review').length;
    const approved = items.filter(i => i.status === 'approved').length;
    const rejected = items.filter(i => i.status === 'rejected').length;

    const stats = [
        { label: 'Pending', value: pending, icon: Clock, color: 'text-amber-600' },
        { label: 'Approved', value: approved, icon: CheckCircle2, color: 'text-emerald-600' },
        { label: 'Rejected', value: rejected, icon: XCircle, color: 'text-red-600' },
    ];

    return (
        <div className="grid grid-cols-3 gap-4">
            {stats.map(s => (
                <div key={s.label} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                    <div>
                        <p className="text-2xl font-black">{s.value}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {s.label}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
