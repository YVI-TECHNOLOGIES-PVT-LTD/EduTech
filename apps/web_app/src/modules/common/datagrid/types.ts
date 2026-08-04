import type { GridColumn } from '../hooks/useGridState';
import type { GridDensity } from '../types';

export type { GridColumn, GridDensity };

export interface EnterpriseDataGridProps<T extends { id?: string | number }> {
    gridId: string;
    title?: string;
    columns: GridColumn<T>[];
    data: T[];
    loading?: boolean;
    pageSize?: number;
    enableVirtualization?: boolean;
    enableInfiniteScroll?: boolean;
    onRowClick?: (row: T) => void;
    onRefresh?: () => void;
    bulkActions?: {
        label: string;
        onClick: (selectedRows: T[]) => void | Promise<void>;
    }[];
    filterFields?: { key: string; label: string; options: { value: string; label: string }[] }[];
    onImport?: (file: File) => void | Promise<void>;
}
