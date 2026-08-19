import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  SlidersHorizontal,
  EyeOff,
  Check,
  FileSpreadsheet,
  FileJson,
  LayoutGrid,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '../ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore } from '../../store/settings.store';

export interface ColumnDefinition<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  title?: string;
  columns: ColumnDefinition<T>[];
  data: T[];
  loading?: boolean;
  bulkActions?: {
    label: string;
    onClick: (selectedRows: T[]) => void;
  }[];
}

export function DataTableFramework<T extends { id?: string | number }>({
  title = 'Data Export',
  columns,
  data,
  loading = false,
  bulkActions,
}: DataTableProps<T>) {
  const globalSettings = useSettingsStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Density local state overriding global preference if changed
  const [density, setDensity] = useState<'compact' | 'comfortable' | 'spacious'>(
    globalSettings.density || 'comfortable',
  );

  // Visible columns keys
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set(columns.map((c) => c.key)));

  // Selected rows
  const [selectedRows, setSelectedRows] = useState<Record<string | number, boolean>>({});
  const pageSize = 10;

  // Search filter
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((row) => {
      return Object.values(row).some((val) =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase()),
      );
    });
  }, [data, searchTerm]);

  // Filter columns
  const visibleColumns = useMemo(() => {
    return columns.filter((col) => visibleKeys.has(col.key));
  }, [columns, visibleKeys]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage]);

  const handleSelectAll = (checked: boolean) => {
    const next: Record<string | number, boolean> = {};
    if (checked) {
      paginatedData.forEach((row) => {
        if (row.id) next[row.id] = true;
      });
    }
    setSelectedRows(next);
  };

  const handleSelectRow = (id: string | number, checked: boolean) => {
    setSelectedRows((prev) => ({ ...prev, [id]: checked }));
  };

  const selectedList = useMemo(() => {
    return data.filter((row) => row.id && selectedRows[row.id]);
  }, [data, selectedRows]);

  const toggleColumn = (key: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key); // Don't allow hiding all columns
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Built-in Premium Export Utilities
  const exportCSV = () => {
    if (data.length === 0) return;
    const csvHeaders = visibleColumns.map((c) => c.header).join(',');
    const rows = data.map((row) =>
      visibleColumns
        .map((c) => {
          const val = (row as any)[c.key];
          const strVal = val === null || val === undefined ? '' : String(val);
          return `"${strVal.replace(/"/g, '""')}"`;
        })
        .join(','),
    );
    const blob = new Blob([[csvHeaders, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '_')}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    if (data.length === 0) return;
    const exportable = data.map((row) => {
      const obj: any = {};
      visibleColumns.forEach((c) => {
        obj[c.key] = (row as any)[c.key];
      });
      return obj;
    });
    const blob = new Blob([JSON.stringify(exportable, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '_')}_export.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Cell padding logic based on density state
  const cellPaddingClass = {
    compact: 'py-2 px-3 text-xs',
    comfortable: 'py-3.5 px-4 text-xs',
    spacious: 'py-5 px-6 text-sm',
  }[density];

  const isAllSelected =
    paginatedData.length > 0 && paginatedData.every((row) => row.id && selectedRows[row.id]);
  const isSomeSelected =
    paginatedData.some((row) => row.id && selectedRows[row.id]) && !isAllSelected;

  return (
    <div className="space-y-4 w-full bg-card text-card-foreground rounded-3xl border border-border/80 p-6 relative overflow-hidden shadow-premium-sm">
      {/* Header controls: Search, Columns visibility, density, exports */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-muted/40 border border-border text-xs font-semibold rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:bg-card transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* Density Selection Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-9 rounded-xl border-border gap-2"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Density
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl w-36">
              <DropdownMenuLabel className="text-[10px] font-black uppercase text-gray-400">
                Density Mode
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(['compact', 'comfortable', 'spacious'] as const).map((mode) => (
                <DropdownMenuCheckboxItem
                  key={mode}
                  checked={density === mode}
                  onCheckedChange={() => setDensity(mode)}
                  className="text-xs rounded-lg cursor-pointer capitalize font-semibold"
                >
                  {mode}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Columns Selector Checkbox Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-9 rounded-xl border-border gap-2"
              >
                <EyeOff className="w-3.5 h-3.5" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="rounded-xl w-48 max-h-72 overflow-y-auto custom-scrollbar"
            >
              <DropdownMenuLabel className="text-[10px] font-black uppercase text-gray-400">
                Toggle Columns
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.key}
                  checked={visibleKeys.has(col.key)}
                  onCheckedChange={() => toggleColumn(col.key)}
                  className="text-xs rounded-lg cursor-pointer font-semibold"
                >
                  {col.header}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-9 rounded-xl border-border gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl w-36">
              <DropdownMenuLabel className="text-[10px] font-black uppercase text-gray-400">
                Format
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={exportCSV}
                className="text-xs font-semibold rounded-lg gap-2 cursor-pointer py-2"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                CSV Spreadsheet
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={exportJSON}
                className="text-xs font-semibold rounded-lg gap-2 cursor-pointer py-2"
              >
                <FileJson className="w-4 h-4 text-amber-500" />
                JSON Format
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Grid Table with Sticky Header and Full Grid Borders */}
      <div className="border border-border/80 rounded-2xl overflow-hidden max-h-[60vh] overflow-y-auto custom-scrollbar relative">
        <Table className="border-collapse w-full">
          <TableHeader className="bg-card sticky top-0 z-10 border-b border-border shadow-sm">
            <TableRow className="hover:bg-transparent border-b border-border">
              {bulkActions && (
                <TableHead className="w-12 text-center bg-card border-r border-border/70 p-0">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false}
                      onCheckedChange={(checked) => handleSelectAll(checked === true)}
                      aria-label="Select all rows"
                    />
                  </div>
                </TableHead>
              )}
              <TableHead className="w-14 text-center text-xs font-black text-foreground uppercase tracking-widest bg-card py-3.5 border-r border-border/70 px-1">
                S.NO
              </TableHead>
              {visibleColumns.map((col, idx) => (
                <TableHead
                  key={col.key}
                  className={`text-xs font-black text-foreground uppercase tracking-widest bg-card py-3.5 px-4 ${idx < visibleColumns.length - 1 ? 'border-r border-border/70' : ''}`}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length + 1 + (bulkActions ? 1 : 0)}
                  className="text-center py-16 text-xs text-muted-foreground font-semibold italic"
                >
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span>Fetching data repository...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length + 1 + (bulkActions ? 1 : 0)}
                  className="text-center py-16 text-xs text-muted-foreground font-semibold italic"
                >
                  No records matching searches found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, idx) => {
                const isRowSelected = Boolean(row.id && selectedRows[row.id]);
                return (
                  <TableRow
                    key={row.id || idx}
                    data-state={isRowSelected ? 'selected' : undefined}
                    className={`transition-colors border-b border-border/50 ${
                      isRowSelected
                        ? 'bg-black text-white dark:bg-white dark:text-black hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-900'
                    }`}
                  >
                    {bulkActions && (
                      <TableCell
                        className="text-center p-0 border-r border-border/50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center">
                          {row.id ? (
                            <Checkbox
                              checked={!!selectedRows[row.id]}
                              onCheckedChange={(checked) =>
                                handleSelectRow(row.id!, checked === true)
                              }
                              aria-label={`Select row ${idx + 1}`}
                            />
                          ) : null}
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="text-center font-mono text-xs font-semibold text-muted-foreground border-r border-border/50 py-3 px-1">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </TableCell>
                    {visibleColumns.map((col, colIdx) => (
                      <TableCell
                        key={col.key}
                        className={`${cellPaddingClass} font-semibold text-gray-700 dark:text-gray-300 ${colIdx < visibleColumns.length - 1 ? 'border-r border-border/50' : ''}`}
                      >
                        {col.render ? col.render(row) : (row as any)[col.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs font-bold text-gray-500 gap-4 mt-2">
        <span>
          Showing {(currentPage - 1) * pageSize + 1} to{' '}
          {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} entries
        </span>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="rounded-xl w-9 h-9 border border-transparent hover:border-border hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="px-3 py-1.5 bg-muted/60 rounded-xl text-foreground border border-border font-bold">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="rounded-xl w-9 h-9 border border-transparent hover:border-border hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Floating Bulk Actions Panel */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <AnimatePresence>
          {selectedList.length > 0 && bulkActions && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="flex items-center gap-3 bg-black text-white dark:bg-white dark:text-black px-5 py-2.5 rounded-2xl shadow-xl shadow-premium-lg border border-border pointer-events-auto"
            >
              <span className="text-[10px] font-black uppercase tracking-widest text-inherit">
                {selectedList.length} Selected
              </span>
              <div className="h-4 w-[1px] bg-current opacity-30" />
              <div className="flex gap-1.5">
                {bulkActions.map((action) => (
                  <Button
                    key={action.label}
                    onClick={() => action.onClick(selectedList)}
                    size="sm"
                    variant="default"
                    className="h-8 py-1 px-3 text-xs bg-primary text-primary-foreground border-none hover:bg-primary/90"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
