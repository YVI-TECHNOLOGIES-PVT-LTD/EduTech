import React from 'react';
import { Filter } from 'lucide-react';

const MODULES = [
    { value: 'all', label: 'All Modules' },
    { value: 'admissions', label: 'Admissions' },
    { value: 'finance', label: 'Finance' },
    { value: 'hr', label: 'HR' },
    { value: 'inventory', label: 'Inventory' },
    { value: 'library', label: 'Library' },
    { value: 'transport', label: 'Transport' },
];

interface ApprovalFiltersProps {
    value: string;
    onChange: (value: string) => void;
}

export function ApprovalFilters({ value, onChange }: ApprovalFiltersProps) {
    return (
        <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="bg-background border border-border rounded-xl px-3 py-2 text-xs font-bold"
            >
                {MODULES.map(m => (
                    <option key={m.value} value={m.value}>
                        {m.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
