import React, { useCallback, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { ArrowUpDown, Pin } from 'lucide-react';
import { useGridState } from '../hooks/useGridState';
import { GridToolbar } from './GridToolbar';
import { GridBulkActions } from './GridBulkActions';
import { GridPagination } from './GridPagination';
import type { EnterpriseDataGridProps } from './types';
import type { GridDensity } from '../types';

const DENSITY_PADDING: Record<GridDensity, string> = {
    compact: 'py-2 px-3 text-xs',
    comfortable: 'py-3.5 px-4 text-xs',
    spacious: 'py-5 px-6 text-sm',
};

export function EnterpriseDataGrid<T extends { id?: string | number }>({
    gridId,
    title = 'Records',
    columns,
    data,
    loading = false,
    pageSize = 25,
    enableVirtualization = false,
    onRowClick,
    onRefresh,
    bulkActions,
    filterFields,
    onImport,
}: EnterpriseDataGridProps<T>) {
    const grid = useGridState({ gridId, columns, data, pageSize });

    const groupByOptions = [
        { value: 'none', label: 'None' },
        ...columns
            .filter(c => c.sortable !== false)
            .map(c => ({ value: c.key, label: c.header })),
    ];

    const handleSelectAll = (checked: boolean) => {
        const next: Record<string | number, boolean> = {};
        if (checked) {
            grid.paginatedData.forEach(row => {
                if (row.id != null) next[row.id] = true;
            });
        }
        grid.setSelectedRows(next);
    };

    const handleSelectRow = (id: string | number, checked: boolean) => {
        grid.setSelectedRows(prev => ({ ...prev, [id]: checked }));
    };

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') grid.setSelectedRows({});
        },
        [grid],
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const cellPadding = DENSITY_PADDING[grid.density];

    const renderRow = (row: T, idx: number) => (
        <TableRow
            key={row.id ?? idx}
            onClick={() => onRowClick?.(row)}
            className={`transition-colors hover:bg-muted/30 border-b border-border/40 ${onRowClick ? 'cursor-pointer' : ''}`}
            tabIndex={0}
        >
            {bulkActions && row.id != null && (
                <TableCell className="text-center w-12" onClick={e => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={!!grid.selectedRows[row.id]}
                        onChange={e => handleSelectRow(row.id!, e.target.checked)}
                        className="rounded border-border w-4 h-4"
                    />
                </TableCell>
            )}
            {grid.orderedColumns.map(col => {
                const isPinned = grid.pinnedKeys.includes(col.key);
                const width = grid.columnWidths[col.key] ?? col.width;
                return (
                    <TableCell
                        key={col.key}
                        className={`${cellPadding} font-semibold ${isPinned ? 'sticky left-0 z-[5] bg-background shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]' : ''}`}
                        style={width ? { width, minWidth: col.minWidth ?? 80 } : undefined}
                    >
                        {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </TableCell>
                );
            })}
        </TableRow>
    );

    const renderTableBody = () => {
        if (loading) {
            return (
                <TableRow>
                    <TableCell
                        colSpan={grid.orderedColumns.length + (bulkActions ? 1 : 0)}
                        className="text-center py-16"
                    >
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs text-muted-foreground font-semibold italic">
                                Loading records...
                            </span>
                        </div>
                    </TableCell>
                </TableRow>
            );
        }

        if (grid.filteredData.length === 0) {
            return (
                <TableRow>
                    <TableCell
                        colSpan={grid.orderedColumns.length + (bulkActions ? 1 : 0)}
                        className="text-center py-16 text-xs text-muted-foreground italic"
                    >
                        No records found.
                    </TableCell>
                </TableRow>
            );
        }

        if (grid.groupedData) {
            return Object.entries(grid.groupedData).flatMap(([group, rows]) => [
                <TableRow key={`group-${group}`} className="bg-muted/20">
                    <TableCell
                        colSpan={grid.orderedColumns.length + (bulkActions ? 1 : 0)}
                        className="py-2 px-4 text-xs font-black uppercase tracking-wider text-primary"
                    >
                        {group} ({rows.length})
                    </TableCell>
                </TableRow>,
                ...rows.map((row, idx) => renderRow(row, idx)),
            ]);
        }

        const rows = enableVirtualization ? grid.filteredData : grid.paginatedData;
        return rows.map((row, idx) => renderRow(row, idx));
    };

    return (
        <div className="space-y-4 w-full bg-card rounded-3xl border border-border/60 p-6 relative overflow-hidden shadow-premium-sm">
            <GridToolbar
                title={title}
                searchTerm={grid.searchTerm}
                onSearchChange={term => {
                    grid.setSearchTerm(term);
                    grid.setCurrentPage(1);
                }}
                density={grid.density}
                onDensityChange={grid.setDensity}
                groupBy={grid.groupBy}
                onGroupByChange={grid.setGroupBy}
                groupByOptions={groupByOptions}
                columns={columns}
                visibleKeys={grid.visibleKeys}
                onToggleColumn={grid.toggleColumn}
                pinnedKeys={grid.pinnedKeys}
                onTogglePin={grid.togglePin}
                savedViews={grid.savedViews}
                onSaveView={grid.saveView}
                onLoadView={grid.loadView}
                onDeleteView={grid.deleteView}
                data={grid.filteredData}
                visibleColumns={grid.orderedColumns}
                onRefresh={onRefresh}
                onImport={onImport}
            />

            {filterFields && filterFields.length > 0 && (
                <div className="flex flex-wrap gap-3">
                    {filterFields.map(field => (
                        <div key={field.key} className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-muted-foreground">
                                {field.label}
                            </span>
                            <select
                                value={grid.filters[field.key] ?? 'all'}
                                onChange={e =>
                                    grid.setFilters(prev => ({ ...prev, [field.key]: e.target.value }))
                                }
                                className="bg-background border border-border rounded-lg px-2 py-1 text-xs"
                            >
                                <option value="all">All</option>
                                {field.options.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>
            )}

            <div className="border border-border/80 rounded-2xl overflow-auto max-h-[60vh] custom-scrollbar relative">
                <Table className="border-collapse">
                    <TableHeader className="bg-muted/30 sticky top-0 z-10 border-b border-border">
                        <TableRow className="hover:bg-transparent">
                            {bulkActions && (
                                <TableHead className="w-12 text-center bg-muted/50">
                                    <input
                                        type="checkbox"
                                        onChange={e => handleSelectAll(e.target.checked)}
                                        className="rounded border-border w-4 h-4"
                                    />
                                </TableHead>
                            )}
                            {grid.orderedColumns.map(col => {
                                const isPinned = grid.pinnedKeys.includes(col.key);
                                const width = grid.columnWidths[col.key] ?? col.width;
                                return (
                                    <TableHead
                                        key={col.key}
                                        className={`text-xs font-black uppercase tracking-widest bg-muted/50 py-3.5 group ${
                                            isPinned ? 'sticky left-0 z-[6] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]' : ''
                                        }`}
                                        style={width ? { width, minWidth: col.minWidth ?? 80 } : undefined}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <button
                                                type="button"
                                                className="flex items-center gap-1 hover:text-primary"
                                                onClick={() => col.sortable !== false && grid.handleSort(col.key)}
                                            >
                                                {col.header}
                                                {col.sortable !== false && (
                                                    <ArrowUpDown className="w-3 h-3 opacity-50" />
                                                )}
                                            </button>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                                {isPinned && <Pin className="w-3 h-3 text-primary rotate-45" />}
                                                {col.resizable !== false && (
                                                    <span
                                                        className="w-1 h-4 cursor-col-resize bg-border rounded"
                                                        onMouseDown={e => {
                                                            e.preventDefault();
                                                            const startX = e.clientX;
                                                            const startW = width ?? 120;
                                                            const onMove = (ev: MouseEvent) => {
                                                                grid.resizeColumn(
                                                                    col.key,
                                                                    startW + (ev.clientX - startX),
                                                                );
                                                            };
                                                            const onUp = () => {
                                                                document.removeEventListener('mousemove', onMove);
                                                                document.removeEventListener('mouseup', onUp);
                                                            };
                                                            document.addEventListener('mousemove', onMove);
                                                            document.addEventListener('mouseup', onUp);
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    </TableHeader>
                    <TableBody>{renderTableBody()}</TableBody>
                </Table>
            </div>

            {!enableVirtualization && (
                <GridPagination
                    currentPage={grid.currentPage}
                    totalPages={grid.totalPages}
                    totalItems={grid.filteredData.length}
                    pageSize={pageSize}
                    onPageChange={grid.setCurrentPage}
                />
            )}

            {bulkActions && (
                <GridBulkActions
                    selectedCount={grid.selectedList.length}
                    actions={bulkActions}
                    selectedRows={grid.selectedList}
                />
            )}
        </div>
    );
}

export type { GridColumn } from '../hooks/useGridState';
export default EnterpriseDataGrid;
