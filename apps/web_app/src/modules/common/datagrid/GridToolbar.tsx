import React from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { GridSavedViews } from './GridSavedViews';
import { GridFilters } from './GridFilters';
import { GridColumnManager } from './GridColumnManager';
import { GridExportMenu } from './GridExportMenu';
import { GridImportButton } from './GridImportButton';
import type { GridColumn } from '../hooks/useGridState';
import type { GridDensity, SavedGridView } from '../types';

interface GridToolbarProps<T> {
    title?: string;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    density: GridDensity;
    onDensityChange: (density: GridDensity) => void;
    groupBy: string;
    onGroupByChange: (group: string) => void;
    groupByOptions: { value: string; label: string }[];
    columns: GridColumn<T>[];
    visibleKeys: Set<string>;
    onToggleColumn: (key: string) => void;
    pinnedKeys: string[];
    onTogglePin: (key: string) => void;
    savedViews: SavedGridView[];
    onSaveView: (name: string) => void;
    onLoadView: (view: SavedGridView) => void;
    onDeleteView: (id: string) => void;
    data: T[];
    visibleColumns: GridColumn<T>[];
    onRefresh?: () => void;
    onImport?: (file: File) => void | Promise<void>;
}

export function GridToolbar<T>({
    title = 'Records',
    searchTerm,
    onSearchChange,
    density,
    onDensityChange,
    groupBy,
    onGroupByChange,
    groupByOptions,
    columns,
    visibleKeys,
    onToggleColumn,
    pinnedKeys,
    onTogglePin,
    savedViews,
    onSaveView,
    onLoadView,
    onDeleteView,
    data,
    visibleColumns,
    onRefresh,
    onImport,
}: GridToolbarProps<T>) {
    return (
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
                <GridSavedViews
                    views={savedViews}
                    onSave={onSaveView}
                    onLoad={onLoadView}
                    onDelete={onDeleteView}
                />
                <GridFilters
                    groupBy={groupBy}
                    onGroupByChange={onGroupByChange}
                    options={groupByOptions}
                />
            </div>

            <div className="relative w-full lg:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search records..."
                    value={searchTerm}
                    onChange={e => onSearchChange(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-border text-xs font-semibold rounded-xl focus:outline-none focus:border-primary"
                />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                <GridColumnManager
                    columns={columns}
                    visibleKeys={visibleKeys}
                    pinnedKeys={pinnedKeys}
                    density={density}
                    onToggleColumn={onToggleColumn}
                    onTogglePin={onTogglePin}
                    onDensityChange={onDensityChange}
                />
                <GridExportMenu title={title} data={data} columns={visibleColumns} />
                {onImport && <GridImportButton onImport={onImport} />}
                {onRefresh && (
                    <Button variant="outline" size="sm" onClick={onRefresh} className="h-9 rounded-xl text-xs gap-2">
                        <RefreshCw className="w-3.5 h-3.5" />
                        Refresh
                    </Button>
                )}
            </div>
        </div>
    );
}
