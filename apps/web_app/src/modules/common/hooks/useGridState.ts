import React, { useState, useMemo, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { GridDensity, SavedGridView } from '../types';

export interface GridColumn<T = unknown> {
    key: string;
    header: string;
    render?: (row: T) => React.ReactNode;
    sortable?: boolean;
    resizable?: boolean;
    frozen?: boolean;
    width?: number;
    minWidth?: number;
}

interface UseGridStateOptions<T> {
    gridId: string;
    columns: GridColumn<T>[];
    data: T[];
    pageSize?: number;
}

export function useGridState<T extends { id?: string | number }>({
    gridId,
    columns,
    data,
    pageSize = 25,
}: UseGridStateOptions<T>) {
    const viewsKey = `erp_grid_views_${gridId}`;
    const [savedViews, setSavedViews] = useLocalStorage<SavedGridView[]>(viewsKey, []);

    const [density, setDensity] = useState<GridDensity>('comfortable');
    const [visibleKeys, setVisibleKeys] = useState<Set<string>>(
        () => new Set(columns.map(c => c.key)),
    );
    const [pinnedKeys, setPinnedKeys] = useState<string[]>(
        () => columns.filter(c => c.frozen).map(c => c.key),
    );
    const [columnOrder, setColumnOrder] = useState<string[]>(() => columns.map(c => c.key));
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
    const [groupBy, setGroupBy] = useState<string>('none');
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [selectedRows, setSelectedRows] = useState<Record<string | number, boolean>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    const orderedColumns = useMemo(() => {
        const pinned = columnOrder.filter(k => pinnedKeys.includes(k) && visibleKeys.has(k));
        const rest = columnOrder.filter(k => !pinnedKeys.includes(k) && visibleKeys.has(k));
        const keys = [...pinned, ...rest];
        return keys
            .map(k => columns.find(c => c.key === k))
            .filter(Boolean) as GridColumn<T>[];
    }, [columnOrder, pinnedKeys, visibleKeys, columns]);

    const filteredData = useMemo(() => {
        let rows = [...data];
        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            rows = rows.filter(row =>
                Object.values(row as object).some(v =>
                    String(v ?? '').toLowerCase().includes(q),
                ),
            );
        }
        Object.entries(filters).forEach(([key, val]) => {
            if (val && val !== 'all') {
                rows = rows.filter(row => String((row as Record<string, unknown>)[key] ?? '') === val);
            }
        });
        if (sortKey) {
            rows.sort((a, b) => {
                const av = (a as Record<string, unknown>)[sortKey];
                const bv = (b as Record<string, unknown>)[sortKey];
                const cmp = String(av ?? '').localeCompare(String(bv ?? ''), undefined, { numeric: true });
                return sortDir === 'asc' ? cmp : -cmp;
            });
        }
        return rows;
    }, [data, searchTerm, filters, sortKey, sortDir]);

    const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, currentPage, pageSize]);

    const groupedData = useMemo(() => {
        if (groupBy === 'none') return null;
        const groups: Record<string, T[]> = {};
        filteredData.forEach(row => {
            const key = String((row as Record<string, unknown>)[groupBy] ?? 'Other');
            if (!groups[key]) groups[key] = [];
            groups[key].push(row);
        });
        return groups;
    }, [filteredData, groupBy]);

    const selectedList = useMemo(
        () => data.filter(row => row.id != null && selectedRows[row.id]),
        [data, selectedRows],
    );

    const toggleColumn = useCallback((key: string) => {
        setVisibleKeys(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                if (next.size > 1) next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    }, []);

    const togglePin = useCallback((key: string) => {
        setPinnedKeys(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key],
        );
    }, []);

    const reorderColumn = useCallback((fromKey: string, toKey: string) => {
        setColumnOrder(prev => {
            const next = [...prev];
            const fromIdx = next.indexOf(fromKey);
            const toIdx = next.indexOf(toKey);
            if (fromIdx < 0 || toIdx < 0) return prev;
            next.splice(fromIdx, 1);
            next.splice(toIdx, 0, fromKey);
            return next;
        });
    }, []);

    const resizeColumn = useCallback((key: string, width: number) => {
        setColumnWidths(prev => ({ ...prev, [key]: Math.max(80, width) }));
    }, []);

    const handleSort = useCallback((key: string) => {
        setSortKey(prev => {
            if (prev === key) {
                setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
                return key;
            }
            setSortDir('asc');
            return key;
        });
    }, []);

    const saveView = useCallback(
        (name: string) => {
            const view: SavedGridView = {
                id: Date.now().toString(),
                name,
                module: gridId,
                visibleColumns: Array.from(visibleKeys),
                pinnedColumns: pinnedKeys,
                density,
                groupBy: groupBy !== 'none' ? groupBy : undefined,
                filters,
                createdAt: new Date().toISOString(),
            };
            setSavedViews(prev => [...prev, view]);
            return view;
        },
        [gridId, visibleKeys, pinnedKeys, density, groupBy, filters, setSavedViews],
    );

    const loadView = useCallback(
        (view: SavedGridView) => {
            setVisibleKeys(new Set(view.visibleColumns));
            setPinnedKeys(view.pinnedColumns);
            setDensity(view.density);
            setGroupBy(view.groupBy ?? 'none');
            if (view.filters) setFilters(view.filters);
        },
        [],
    );

    const deleteView = useCallback(
        (id: string) => setSavedViews(prev => prev.filter(v => v.id !== id)),
        [setSavedViews],
    );

    return {
        density,
        setDensity,
        visibleKeys,
        pinnedKeys,
        orderedColumns,
        columnWidths,
        groupBy,
        setGroupBy,
        searchTerm,
        setSearchTerm,
        filters,
        setFilters,
        selectedRows,
        setSelectedRows,
        selectedList,
        currentPage,
        setCurrentPage,
        totalPages,
        pageSize,
        filteredData,
        paginatedData,
        groupedData,
        sortKey,
        sortDir,
        savedViews,
        toggleColumn,
        togglePin,
        reorderColumn,
        resizeColumn,
        handleSort,
        saveView,
        loadView,
        deleteView,
    };
}
