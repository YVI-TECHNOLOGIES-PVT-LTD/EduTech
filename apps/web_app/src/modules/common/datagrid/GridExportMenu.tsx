import React from 'react';
import { Download, FileSpreadsheet, FileJson, Printer } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuItem,
} from '../../../components/ui/dropdown-menu';
import { exportToCSV } from '../../../utils/export';
import type { GridColumn } from '../hooks/useGridState';

interface GridExportMenuProps<T> {
    title: string;
    data: T[];
    columns: GridColumn<T>[];
}

function downloadBlob(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function GridExportMenu<T>({ title, data, columns }: GridExportMenuProps<T>) {
    const baseName = title.toLowerCase().replace(/\s+/g, '_');

    const exportCSV = () => {
        const rows = data.map(row => {
            const obj: Record<string, unknown> = {};
            columns.forEach(c => {
                obj[c.key] = (row as Record<string, unknown>)[c.key];
            });
            return obj;
        });
        exportToCSV(rows, columns.map(c => c.key), `${baseName}.csv`);
    };

    const exportJSON = () => {
        const exportable = data.map(row => {
            const obj: Record<string, unknown> = {};
            columns.forEach(c => {
                obj[c.key] = (row as Record<string, unknown>)[c.key];
            });
            return obj;
        });
        downloadBlob(JSON.stringify(exportable, null, 2), `${baseName}.json`, 'application/json');
    };

    const exportExcel = () => exportCSV();

    const printGrid = () => {
        const html = `
            <html><head><title>${title}</title>
            <style>table{border-collapse:collapse;width:100%;font-family:sans-serif;font-size:12px}
            th,td{border:1px solid #ddd;padding:8px;text-align:left}
            th{background:#f5f5f5;font-weight:bold}</style></head><body>
            <h2>${title}</h2><table><thead><tr>
            ${columns.map(c => `<th>${c.header}</th>`).join('')}
            </tr></thead><tbody>
            ${data.map(row => `<tr>${columns.map(c => `<td>${(row as Record<string, unknown>)[c.key] ?? ''}</td>`).join('')}</tr>`).join('')}
            </tbody></table></body></html>`;
        const win = window.open('', '_blank');
        if (win) {
            win.document.write(html);
            win.document.close();
            win.print();
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 rounded-xl text-xs gap-2">
                    <Download className="w-3.5 h-3.5" />
                    Export
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl w-40">
                <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground">
                    Format
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={exportCSV} className="text-xs gap-2 cursor-pointer">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    CSV / Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportJSON} className="text-xs gap-2 cursor-pointer">
                    <FileJson className="w-4 h-4 text-amber-500" />
                    JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={printGrid} className="text-xs gap-2 cursor-pointer">
                    <Printer className="w-4 h-4 text-blue-500" />
                    Print / PDF
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
