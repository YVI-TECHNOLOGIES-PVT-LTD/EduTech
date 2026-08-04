import React from 'react';
import { Bookmark, Trash2 } from 'lucide-react';
import type { ReportConfig } from './ReportBuilder';

interface SavedReportsProps {
    reports: ReportConfig[];
    onLoad: (report: ReportConfig) => void;
    onDelete: (id: string) => void;
}

export function SavedReports({ reports, onLoad, onDelete }: SavedReportsProps) {
    if (reports.length === 0) return null;

    return (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-xs font-black uppercase tracking-wider">Saved Reports</h3>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {reports.map(report => (
                    <div
                        key={report.id}
                        className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border border-border/50"
                    >
                        <button
                            type="button"
                            onClick={() => onLoad(report)}
                            className="text-xs font-bold text-left hover:text-primary"
                        >
                            {report.name}
                            <span className="block text-[10px] text-muted-foreground font-normal mt-0.5">
                                {report.module} · {report.columns.length} columns
                            </span>
                        </button>
                        <button type="button" onClick={() => onDelete(report.id)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
