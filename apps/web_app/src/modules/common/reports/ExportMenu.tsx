import React from 'react';
import { Download, FileSpreadsheet, Printer } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '../../../components/ui/dropdown-menu';
import { exportToCSV } from '../../../utils/export';
import { PrintPreview } from './PrintPreview';

interface ExportMenuProps {
    title: string;
    data: Record<string, unknown>[];
    columns: string[];
}

export function ExportMenu({ title, data, columns }: ExportMenuProps) {
    const baseName = title.toLowerCase().replace(/\s+/g, '_');

    const exportCSV = () => exportToCSV(data, columns, `${baseName}.csv`);
    const exportExcel = () => exportCSV();

    const exportPDF = () => {
        PrintPreview.print({ title, data, columns });
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
                <DropdownMenuLabel className="text-[10px] font-black uppercase">Export</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={exportCSV} className="text-xs gap-2 cursor-pointer">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportExcel} className="text-xs gap-2 cursor-pointer">
                    <FileSpreadsheet className="w-4 h-4 text-blue-500" /> Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportPDF} className="text-xs gap-2 cursor-pointer">
                    <Printer className="w-4 h-4 text-amber-500" /> Print / PDF
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
