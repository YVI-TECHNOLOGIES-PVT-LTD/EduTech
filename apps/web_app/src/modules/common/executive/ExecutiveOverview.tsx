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
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-wider">Executive Command Center</h1>
                    <p className="text-xs text-muted-foreground mt-1">
                        Cross-module KPIs aggregated from existing dashboard services
                    </p>
                </div>
                <button
                    type="button"
                    onClick={refetch}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold"
                >
                    Refresh
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
