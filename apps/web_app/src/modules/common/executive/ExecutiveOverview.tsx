import React from 'react';
import { DashboardProvider } from '../../dashboard/core/DashboardProvider';
import { useDashboard } from '../../dashboard/hooks/useDashboard';
import { ExecutiveKPIs } from './ExecutiveKPIs';
import { ExecutiveCards } from './ExecutiveCards';
import { ExecutiveCharts } from './ExecutiveCharts';
import { ExecutiveAlerts } from './ExecutiveAlerts';
import { ExecutiveForecast } from './ExecutiveForecast';

function ExecutiveContent() {
    const { loading, kpis, charts, notifications, refetch } = useDashboard();

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider border border-indigo-200/80 dark:border-indigo-800">
                        Executive Operations
                    </div>
                    <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Executive Command Center</h1>
                    <p className="text-xs text-muted-foreground">
                        Cross-module KPIs aggregated from existing dashboard services
                    </p>
                </div>
                <button
                    type="button"
                    onClick={refetch}
                    className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                    Refresh Data
                </button>
            </div>
            <ExecutiveKPIs kpis={kpis} loading={loading} />
            <ExecutiveCards kpis={kpis} loading={loading} />
            <div className="grid lg:grid-cols-2 gap-6">
                <ExecutiveCharts charts={charts} loading={loading} />
                <ExecutiveAlerts notifications={notifications} loading={loading} />
            </div>
            <ExecutiveForecast kpis={kpis} />
        </div>
    );
}

export function ExecutiveOverview() {
    return (
        <DashboardProvider>
            <ExecutiveContent />
        </DashboardProvider>
    );
}

export default ExecutiveOverview;
