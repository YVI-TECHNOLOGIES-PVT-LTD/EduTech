import React from 'react';
import { ApprovalCard } from './ApprovalCard';
import { ApprovalFilters } from './ApprovalFilters';
import { ApprovalSummary } from './ApprovalSummary';
import type { ApprovalItem } from '../types';

interface ApprovalInboxProps {
    items: ApprovalItem[];
    loading?: boolean;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    onSelect?: (item: ApprovalItem) => void;
    moduleFilter?: string;
    onModuleFilterChange?: (module: string) => void;
}

export function ApprovalInbox({
    items,
    loading,
    onApprove,
    onReject,
    onSelect,
    moduleFilter = 'all',
    onModuleFilterChange,
}: ApprovalInboxProps) {
    const filtered =
        moduleFilter === 'all' ? items : items.filter(i => i.module === moduleFilter);

    const pending = filtered.filter(i => i.status === 'pending' || i.status === 'review');

    return (
        <div className="space-y-6">
            <ApprovalSummary items={items} />
            {onModuleFilterChange && (
                <ApprovalFilters value={moduleFilter} onChange={onModuleFilterChange} />
            )}
            {loading ? (
                <div className="text-center py-12 text-xs text-muted-foreground italic">Loading approvals...</div>
            ) : pending.length === 0 ? (
                <div className="text-center py-12 text-xs text-muted-foreground italic">No pending approvals</div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {pending.map(item => (
                        <ApprovalCard
                            key={item.id}
                            item={item}
                            onApprove={() => onApprove(item.id)}
                            onReject={() => onReject(item.id)}
                            onClick={() => onSelect?.(item)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
