import React from 'react';
import { RefreshCw, ShieldAlert, Sparkles, Activity } from 'lucide-react';
import { DashboardProvider } from '../../dashboard/core/DashboardProvider';
import { useDashboard } from '../../dashboard/hooks/useDashboard';
import { ExecutiveKPIs } from './ExecutiveKPIs';
import { ExecutiveCards } from './ExecutiveCards';
import { ExecutiveCharts } from './ExecutiveCharts';
import { ExecutiveAlerts } from './ExecutiveAlerts';
import { ExecutiveForecast } from './ExecutiveForecast';
import { DashboardPageHeader, DashboardSection } from '@/components/dashboard';
import { Button } from '@/components/ui/button';

function ExecutiveContent() {
  const { loading, kpis, charts, notifications, refetch } = useDashboard();

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* 1. Page Header */}
      <DashboardPageHeader
        title="Executive Command Center"
        description="Unified institutional executive telemetry: cross-module performance metrics, operational health, and forecasting alerts."
        badge={{
          text: 'Executive Leadership',
          variant: 'purple',
          icon: ShieldAlert,
        }}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={loading}
            className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm gap-2 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </Button>
        }
      />

      {/* 2. Core KPIs */}
      <DashboardSection
        title="Executive KPIs"
        description="Strategic cross-departmental metrics across admissions, academics, and finances."
      >
        <ExecutiveKPIs kpis={kpis} loading={loading} />
      </DashboardSection>

      {/* 3. Executive Breakdown Cards */}
      <ExecutiveCards kpis={kpis} loading={loading} />

      {/* 4. Analytical Charts & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExecutiveCharts charts={charts} loading={loading} />
        <ExecutiveAlerts notifications={notifications} loading={loading} />
      </div>

      {/* 5. Forecast & Velocity */}
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
