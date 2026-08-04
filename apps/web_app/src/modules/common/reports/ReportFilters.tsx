import React from 'react';
import { SlidersHorizontal } from 'lucide-react';

interface ReportFiltersProps {
    availableColumns: { key: string; label: string }[];
    selectedColumns: string[];
    onColumnsChange: (columns: string[]) => void;
    filters: Record<string, string>;
    onFiltersChange: (filters: Record<string, string>) => void;
}

export function ReportFilters({
    availableColumns,
    selectedColumns,
    onColumnsChange,
    filters,
    onFiltersChange,
}: ReportFiltersProps) {
    const toggleColumn = (key: string) => {
        onColumnsChange(
            selectedColumns.includes(key)
                ? selectedColumns.filter(c => c !== key)
                : [...selectedColumns, key],
        );
    };

    return (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-black uppercase tracking-wider">Report Filters</span>
            </div>
            <div className="flex flex-wrap gap-2">
                {availableColumns.map(col => (
                    <button
                        key={col.key}
                        type="button"
                        onClick={() => toggleColumn(col.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                            selectedColumns.includes(col.key)
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-muted/30 border-border text-muted-foreground'
                        }`}
                    >
                        {col.label}
                    </button>
                ))}
            </div>
            <div className="flex flex-wrap gap-3">
                {selectedColumns.slice(0, 3).map(key => (
                    <div key={key} className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">{key}</span>
                        <input
                            type="text"
                            value={filters[key] ?? ''}
                            onChange={e => onFiltersChange({ ...filters, [key]: e.target.value })}
                            placeholder="Filter value..."
                            className="px-2 py-1 border border-border rounded-lg text-xs w-32"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
