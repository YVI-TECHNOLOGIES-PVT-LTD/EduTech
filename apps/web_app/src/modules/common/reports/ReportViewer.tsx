import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';

interface ReportViewerProps {
    data: Record<string, unknown>[];
    columns: string[];
    availableColumns: { key: string; label: string }[];
}

export function ReportViewer({ data, columns, availableColumns }: ReportViewerProps) {
    const labelMap = Object.fromEntries(availableColumns.map(c => [c.key, c.label]));

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border">
                <h3 className="text-xs font-black uppercase tracking-wider">Report Preview</h3>
                <p className="text-[10px] text-muted-foreground mt-1">{data.length} rows</p>
            </div>
            <div className="overflow-auto max-h-80">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map(col => (
                                <TableHead key={col} className="text-[10px] font-black uppercase">
                                    {labelMap[col] || col}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.slice(0, 50).map((row, idx) => (
                            <TableRow key={idx}>
                                {columns.map(col => (
                                    <TableCell key={col} className="text-xs">
                                        {String(row[col] ?? '')}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
