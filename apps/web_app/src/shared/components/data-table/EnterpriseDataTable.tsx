import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  HeaderGroup,
  Header,
  Row,
  Cell,
} from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Search,
  ArrowUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableLoader } from '@/shared/loading/TableLoader';
import { cn } from '@/lib/utils';

export interface EnterpriseDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  onExportCsv?: () => void;
  bulkActions?: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function EnterpriseDataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  searchPlaceholder = 'Search records...',
  onExportCsv,
  bulkActions,
  title,
  subtitle,
}: EnterpriseDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (isLoading) {
    return <TableLoader rows={6} columns={columns.length} />;
  }

  const selectedRowCount = Object.keys(rowSelection).length;

  return (
    <div className="w-full space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header Bar */}
      {(title || subtitle || onExportCsv || bulkActions) && (
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            {title && (
              <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                {title}
              </h3>
            )}
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>

          <div className="flex items-center space-x-2">
            {selectedRowCount > 0 && bulkActions}
            {onExportCsv && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExportCsv}
                className="flex items-center space-x-1.5 text-xs font-semibold"
              >
                <Download size={14} />
                <span>Export CSV</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Toolbar / Search */}
      <div className="flex items-center justify-between space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder={searchPlaceholder}
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          {table.getFilteredRowModel().rows.length} Total Records
        </div>
      </div>

      {/* Main Table */}
      <div className="relative overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead className="bg-slate-50 uppercase text-slate-500 font-semibold dark:bg-slate-800/80 dark:text-slate-400">
            {table.getHeaderGroups().map((headerGroup: HeaderGroup<TData>) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header: Header<TData, unknown>) => (
                  <th key={header.id} className="px-4 py-3 font-semibold">
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          'flex items-center space-x-1',
                          header.column.getCanSort() ? 'cursor-pointer select-none' : '',
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <ArrowUpDown className="ml-1 h-3 w-3 text-slate-400" />
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row: Row<TData>) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell: Cell<TData, unknown>) => (
                    <td key={cell.id} className="px-4 py-3.5 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="h-32 text-center text-slate-400 font-medium"
                >
                  No records found matching criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-1 py-1">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <span>Rows per page:</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="rounded border border-slate-300 bg-transparent px-2 py-1 text-xs dark:border-slate-700"
          >
            {[10, 20, 50, 100].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-xs text-slate-500 font-medium">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </span>

          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
