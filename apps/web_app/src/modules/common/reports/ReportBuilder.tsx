import React, { useState } from 'react';
import { ReportFilters } from './ReportFilters';
import { ReportViewer } from './ReportViewer';
import { ChartBuilder } from './ChartBuilder';
import { ExportMenu } from './ExportMenu';
import { SavedReports } from './SavedReports';
import { useLocalStorage } from '../hooks/useLocalStorage';

export interface ReportConfig {
    id: string;
    name: string;
    module: string;
    columns: string[];
    filters: Record<string, string>;
    chartType?: 'bar' | 'line' | 'pie';
}

interface ReportBuilderProps {
    module: string;
    availableColumns: { key: string; label: string }[];
    data: Record<string, unknown>[];
    defaultName?: string;
}

export function ReportBuilder({
    module,
    availableColumns,
    data,
    defaultName = 'Custom Report',
}: ReportBuilderProps) {
    const [savedReports, setSavedReports] = useLocalStorage<ReportConfig[]>(`erp_reports_${module}`, []);
    const [name, setName] = useState(defaultName);
    const [selectedColumns, setSelectedColumns] = useState<string[]>(
        availableColumns.slice(0, 4).map(c => c.key),
    );
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');

    const filteredData = data.filter(row =>
        Object.entries(filters).every(([k, v]) => !v || v === 'all' || String(row[k]) === v),
    );

    const saveReport = () => {
        const report: ReportConfig = {
            id: Date.now().toString(),
            name,
            module,
            columns: selectedColumns,
            filters,
            chartType,
        };
        setSavedReports(prev => [...prev, report]);
    };

    const loadReport = (report: ReportConfig) => {
        setName(report.name);
        setSelectedColumns(report.columns);
        setFilters(report.filters);
        if (report.chartType) setChartType(report.chartType);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="text-lg font-black uppercase tracking-wider bg-transparent border-b border-border focus:outline-none focus:border-primary px-1"
                />
                <ExportMenu title={name} data={filteredData} columns={selectedColumns} />
            </div>

            <ReportFilters
                availableColumns={availableColumns}
                selectedColumns={selectedColumns}
                onColumnsChange={setSelectedColumns}
                filters={filters}
                onFiltersChange={setFilters}
            />

            <div className="grid lg:grid-cols-2 gap-6">
                <ReportViewer data={filteredData} columns={selectedColumns} availableColumns={availableColumns} />
                <ChartBuilder
                    data={filteredData}
                    columns={selectedColumns}
                    chartType={chartType}
                    onChartTypeChange={setChartType}
                />
            </div>

            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={saveReport}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold"
                >
                    Save Report
                </button>
            </div>

            <SavedReports reports={savedReports} onLoad={loadReport} onDelete={id => setSavedReports(prev => prev.filter(r => r.id !== id))} />
        </div>
    );
}
