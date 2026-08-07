declare module '@tanstack/react-table' {
  export type SortingState = { id: string; desc: boolean }[];
  export type ColumnFiltersState = { id: string; value: unknown }[];
  export type VisibilityState = Record<string, boolean>;

  export interface ColumnDef<TData, TValue = unknown> {
    id?: string;
    accessorKey?: keyof TData | string;
    header: any;
    cell?: any;
    enableSorting?: boolean;
  }

  export interface Header<TData, TValue> {
    id: string;
    isPlaceholder: boolean;
    column: {
      columnDef: ColumnDef<TData, TValue>;
      getCanSort: () => boolean;
      getToggleSortingHandler: () => (event: unknown) => void;
    };
    getContext: () => any;
  }

  export interface HeaderGroup<TData> {
    id: string;
    headers: Header<TData, unknown>[];
  }

  export interface Cell<TData, TValue> {
    id: string;
    column: {
      columnDef: ColumnDef<TData, TValue>;
    };
    getContext: () => any;
  }

  export interface Row<TData> {
    id: string;
    getIsSelected: () => boolean;
    getVisibleCells: () => Cell<TData, unknown>[];
  }

  export interface TableOptions<TData> {
    data: TData[];
    columns: ColumnDef<TData, any>[];
    state?: {
      sorting?: SortingState;
      columnFilters?: ColumnFiltersState;
      globalFilter?: string;
      columnVisibility?: VisibilityState;
      rowSelection?: Record<string, boolean>;
    };
    onSortingChange?: (updater: any) => void;
    onColumnFiltersChange?: (updater: any) => void;
    onGlobalFilterChange?: (updater: any) => void;
    onColumnVisibilityChange?: (updater: any) => void;
    onRowSelectionChange?: (updater: any) => void;
    getCoreRowModel?: any;
    getPaginationRowModel?: any;
    getSortedRowModel?: any;
    getFilteredRowModel?: any;
  }

  export interface Table<TData> {
    getHeaderGroups: () => HeaderGroup<TData>[];
    getRowModel: () => { rows: Row<TData>[] };
    getFilteredRowModel: () => { rows: Row<TData>[] };
    getState: () => {
      pagination: {
        pageIndex: number;
        pageSize: number;
      };
    };
    setPageSize: (pageSize: number) => void;
    setPageIndex: (pageIndex: number) => void;
    getPageCount: () => number;
    getCanPreviousPage: () => boolean;
    getCanNextPage: () => boolean;
    previousPage: () => void;
    nextPage: () => void;
  }

  export function useReactTable<TData>(options: TableOptions<TData>): Table<TData>;
  export function getCoreRowModel(): any;
  export function getPaginationRowModel(): any;
  export function getSortedRowModel(): any;
  export function getFilteredRowModel(): any;
  export function flexRender(component: any, props: any): any;
}
