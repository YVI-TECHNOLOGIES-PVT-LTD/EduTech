import React from 'react';
import { BarChart3, Download, TrendingUp, PieChart, FileText } from 'lucide-react';
import { MetricCard } from '@/shared/components/metric-card/MetricCard';
import { Button } from '@/components/ui/button';
import { APP_CONFIG } from '@/config/app';

export const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Reports & Operational Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Exportable analytics for admission conversions, fee collections, and student enrollment
            demographics
          </p>
        </div>

        <Button className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold">
          <Download size={14} className="mr-1.5" />
          Export All Stage-1 Reports (CSV/Excel)
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          title="Lead to Application Rate"
          value="62.5%"
          icon={TrendingUp}
          trend={{ value: '+4.1%', isPositive: true }}
          iconColor="bg-blue-50 text-blue-600"
        />
        <MetricCard
          title="Application to Enrollment Rate"
          value="42.6%"
          icon={PieChart}
          trend={{ value: '+2.8%', isPositive: true }}
          iconColor="bg-emerald-50 text-emerald-600"
        />
        <MetricCard
          title="Total Fee Collection"
          value={`${APP_CONFIG.currency.symbol}4,85,000`}
          icon={FileText}
          trend={{ value: '+18%', isPositive: true }}
          iconColor="bg-indigo-50 text-indigo-600"
        />
      </div>

      {/* Reports Summary Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Available Stage-1 Report Templates
        </h3>
        <div className="space-y-3">
          {[
            {
              title: 'Inbound Lead Conversion Summary Report',
              format: 'CSV, Excel, PDF',
              updated: 'Today',
            },
            {
              title: 'Admission Application Lifecycle & Assessment Report',
              format: 'CSV, Excel, PDF',
              updated: 'Today',
            },
            {
              title: 'Fee Collection & Receipt Register',
              format: 'CSV, Excel, PDF',
              updated: 'Today',
            },
            {
              title: 'Stage-1 Enrolled Student Master Directory',
              format: 'CSV, Excel, PDF',
              updated: 'Today',
            },
          ].map((rep, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40"
            >
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {rep.title}
                </span>
                <p className="text-[11px] text-slate-400">
                  Formats: {rep.format} • Updated: {rep.updated}
                </p>
              </div>
              <Button variant="outline" size="sm" className="text-xs font-semibold">
                <Download size={14} className="mr-1" />
                Download Report
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
